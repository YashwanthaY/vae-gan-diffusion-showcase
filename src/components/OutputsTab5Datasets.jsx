import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, X, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { generateStudio } from '../services/gradioClient.js';
import { GRID, TILE, CIFAR10_CLASSES } from '../config.js';

/**
 * Slice a tile_sheet_png_b64 (128×128, 4×4 tiles of 32×32) into 16 exact 32×32 PNGs.
 * Returns an array of 16 data-URL strings (image/png, no resampling).
 */
export async function sliceTileSheet(b64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const tiles = [];
      const canvas = document.createElement('canvas');
      canvas.width  = TILE;
      canvas.height = TILE;
      const ctx = canvas.getContext('2d');
      for (let i = 0; i < GRID.n; i++) {
        const tx = (i % GRID.cols) * TILE;
        const ty = Math.floor(i / GRID.rows) * TILE;
        ctx.clearRect(0, 0, TILE, TILE);
        ctx.drawImage(img, tx, ty, TILE, TILE, 0, 0, TILE, TILE);
        tiles.push(canvas.toDataURL('image/png'));
      }
      resolve(tiles);
    };
    img.src = `data:image/png;base64,${b64}`;
  });
}

async function buildZip(batches, classNames, steps, cfg, seed) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const imgFolder = zip.folder('images');
  const labelRows = ['filename,class_index,class_name'];
  let totalCount = 0;

  for (const batch of batches) {
    const { tiles, classIdx, batchSeed, batchIdx } = batch;
    const cls = CIFAR10_CLASSES[classIdx];
    const clsFolder = imgFolder.folder(cls.name);
    for (let i = 0; i < tiles.length; i++) {
      const dataUrl = tiles[i];
      const b64 = dataUrl.split(',')[1];
      const fname = `${batchSeed}_b${batchIdx}_${i}.png`;
      clsFolder.file(fname, b64, { base64: true });
      labelRows.push(`images/${cls.name}/${fname},${classIdx},${cls.label}`);
      totalCount++;
    }
  }

  zip.file('labels.csv', labelRows.join('\n'));
  zip.file('metadata.json', JSON.stringify({
    checkpoint: 'Yashwantha123/vae-gan-diffusion-demo',
    model: 'Class-Conditional DDPM (CIFAR-10 train split)',
    ddim_steps: steps, guidance_scale: cfg, seeds_used: [...new Set(batches.map(b => b.batchSeed))],
    per_batch_mode: batches.map(b => b.mode),
    date: new Date().toISOString(),
    protocol_note: 'FID uses N=5,000 samples vs a 10,000-image CIFAR-10 training subset, so it is NOT comparable to published 50,000-sample FIDs; CIFAR-10 only; free-tier Tesla T4',
    generated_by: 'DDPM trained on CIFAR-10 train split',
    total_images: totalCount,
  }, null, 2));

  zip.file('README.txt', `
PyTorch ImageFolder snippet
===========================
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

transform = transforms.Compose([
    transforms.Resize(32),
    transforms.ToTensor(),
    transforms.Normalize((0.5,0.5,0.5),(0.5,0.5,0.5))
])
dataset = datasets.ImageFolder('images/', transform=transform)
loader  = DataLoader(dataset, batch_size=64, shuffle=True)
# class_to_idx: ${JSON.stringify(Object.fromEntries(CIFAR10_CLASSES.map(c => [c.name, c.id])))}

NOTE: Synthetic images helped a ResNet-18 only when real data was scarce (see Downstream evaluation).
Do NOT claim this dataset is "as good as real data".
`.trim());

  return zip;
}

export default function OutputsTab5Datasets({ studioSliders }) {
  const [selectedClasses, setSelectedClasses] = useState([5]); // dog
  const [imagesPerClass, setImagesPerClass] = useState(16);
  const [buildSteps, setBuildSteps] = useState(studioSliders?.steps ?? 50);
  const [buildCfg,   setBuildCfg]   = useState(studioSliders?.cfg   ?? 1.5);
  const [buildSeed,  setBuildSeed]  = useState(studioSliders?.seed  ?? 42);
  const [hfToken, setHfToken]       = useState('');

  const [building,  setBuilding]    = useState(false);
  const [paused,    setPaused]      = useState(false);
  const [progress,  setProgress]    = useState(null);  // { done, total, batches, tiles }
  const [previewTiles, setPreviewTiles] = useState([]);
  const [error,     setError]       = useState(null);
  const [zipReady,  setZipReady]    = useState(null);
  const cancelRef   = useRef(false);
  const pauseRef    = useRef(false);

  const totalBatches = useMemo(() => selectedClasses.length * Math.ceil(imagesPerClass / GRID.n), [selectedClasses, imagesPerClass]);

  const toggleClass = useCallback(id => {
    setSelectedClasses(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleBuild = useCallback(async () => {
    setBuilding(true);
    setPaused(false);
    setError(null);
    setZipReady(null);
    setPreviewTiles([]);
    cancelRef.current = false;
    pauseRef.current  = false;

    const batches = [];
    const batchesPerClass = Math.ceil(imagesPerClass / GRID.n);
    const total = selectedClasses.length * batchesPerClass;
    let done = 0;

    for (const clsIdx of selectedClasses) {
      for (let b = 0; b < batchesPerClass; b++) {
        if (cancelRef.current) break;
        // Respect pause
        while (pauseRef.current && !cancelRef.current) await new Promise(r => setTimeout(r, 200));
        if (cancelRef.current) break;

        const cls = CIFAR10_CLASSES[clsIdx];
        const bSeed = buildSeed + b;
        const result = await generateStudio({
          cls_name: cls.name, prompt: '', steps: buildSteps, cfg: buildCfg,
          seed: bSeed, enhance: false, models: ['ddpm'],
          hfToken: hfToken.trim() || null,
        });

        const tileSheet = result?.per_model?.ddpm?.tile_sheet_png_b64;
        const tiles = tileSheet ? await sliceTileSheet(tileSheet) : [];
        batches.push({ tiles, classIdx: clsIdx, batchSeed: bSeed, batchIdx: b, mode: result?.mode ?? 'error' });

        done++;
        setProgress({ done, total, tiles: batches.flatMap(bt => bt.tiles).length });
        setPreviewTiles(prev => [...prev, ...tiles.slice(0, 1)]); // show first tile of each batch
      }
      if (cancelRef.current) break;
    }

    if (!cancelRef.current && batches.length) {
      try {
        const zip = await buildZip(batches, selectedClasses.map(i => CIFAR10_CLASSES[i].name), buildSteps, buildCfg, buildSeed);
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        setZipReady(blob);
      } catch (err) {
        setError('ZIP build failed: ' + err.message);
      }
    }

    setBuilding(false);
  }, [selectedClasses, imagesPerClass, buildSteps, buildCfg, buildSeed, hfToken]);

  const downloadZip = () => {
    if (!zipReady) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipReady);
    a.download = `synthetic_ddpm_${CIFAR10_CLASSES[selectedClasses[0]]?.name ?? 'batch'}_${new Date().toISOString().slice(0,10)}.zip`;
    a.click();
  };

  const counts = {};
  CIFAR10_CLASSES.forEach(c => {
    const batchCount = Math.ceil(imagesPerClass / GRID.n);
    const actualImages = Math.min(imagesPerClass, batchCount * GRID.n);
    if (selectedClasses.includes(c.id)) counts[c.name] = actualImages;
  });

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs font-mono text-amber-200 flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          Synthetic images helped a ResNet-18 only when real data was scarce (see Downstream).
          <strong className="ml-1">Do not claim this dataset is "as good as real data".</strong>
        </span>
      </div>

      {/* Controls */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-5">
        <h4 className="text-sm font-bold text-white">Dataset Builder — DDPM (CIFAR-10)</h4>

        {/* Class selector (toggle buttons) */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300">Classes:</label>
          <div className="flex flex-wrap gap-2">
            {CIFAR10_CLASSES.map(c => (
              <button
                key={c.id}
                onClick={() => toggleClass(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                  selectedClasses.includes(c.id)
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Config row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Images/class (×16):</label>
            <select value={imagesPerClass} onChange={e => setImagesPerClass(Number(e.target.value))}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono">
              {[16, 32, 48, 64, 80, 96, 112, 128, 144, 160].map(n => (
                <option key={n} value={n}>{n} images</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Steps:</label>
            <input type="number" value={buildSteps} onChange={e => setBuildSteps(Number(e.target.value))}
              min="10" max="250" step="5"
              className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">CFG w:</label>
            <input type="number" value={buildCfg} onChange={e => setBuildCfg(Number(e.target.value))}
              min="0" max="5" step="0.5"
              className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Seed:</label>
            <input type="number" value={buildSeed} onChange={e => setBuildSeed(Number(e.target.value))}
              className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono" />
          </div>
        </div>

        <input type="password" value={hfToken} onChange={e => setHfToken(e.target.value)}
          placeholder="HF Token (optional, hf_...)"
          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 text-xs font-mono focus:border-cyan-500 outline-none" />

        {/* Count summary */}
        {selectedClasses.length > 0 && (
          <div className="text-xs font-mono text-slate-400">
            Planned: {Object.entries(counts).map(([cls, n]) => `${cls} ×${n}`).join(', ')}
            {' '}= <span className="text-cyan-300 font-bold">{Object.values(counts).reduce((s, n) => s + n, 0)} total images</span>
            {' '}in {totalBatches} API call{totalBatches !== 1 ? 's' : ''}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleBuild}
            disabled={building || selectedClasses.length === 0}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono transition-all"
          >
            <Play className="w-4 h-4 fill-current" /><span>Build Dataset</span>
          </button>
          {building && (
            <>
              <button onClick={() => { pauseRef.current = !pauseRef.current; setPaused(pauseRef.current); }}
                className="flex items-center space-x-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300 hover:border-amber-500/40 transition-all">
                <Pause className="w-4 h-4" /><span>{paused ? 'Resume' : 'Pause'}</span>
              </button>
              <button onClick={() => { cancelRef.current = true; setBuilding(false); }}
                className="flex items-center space-x-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-red-300 hover:border-red-500/40 transition-all">
                <X className="w-4 h-4" /><span>Cancel</span>
              </button>
            </>
          )}
          {zipReady && (
            <button onClick={downloadZip}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-mono hover:bg-emerald-500/30 transition-all">
              <Download className="w-4 h-4" /><span>Download ZIP</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Batch {progress.done} / {progress.total} · {progress.tiles} PNGs generated</span>
            <span>{paused ? '⏸ Paused' : building ? '⚙ Building…' : '✓ Done'}</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-600/40 text-xs font-mono text-red-300">{error}</div>
      )}

      {zipReady && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Dataset ready: {progress?.tiles ?? '?'} images · labels.csv rows = {progress?.tiles ?? '?'} · metadata.json + README.txt included</span>
        </div>
      )}

      {/* Preview grid */}
      {previewTiles.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-mono text-slate-400 font-bold">Preview (first tile per batch):</h5>
          <div className="flex flex-wrap gap-2">
            {previewTiles.slice(0, 32).map((src, i) => (
              <img key={i} src={src} alt={`preview ${i}`}
                className="w-16 h-16 rounded border border-slate-700 bg-slate-950"
                style={{ imageRendering: 'pixelated' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


