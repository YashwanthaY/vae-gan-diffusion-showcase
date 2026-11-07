import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Play, Pause, X, Download, AlertTriangle, CheckCircle2, RotateCcw, Shuffle, Layers, BarChart2 } from 'lucide-react';
import { generateStudio } from '../services/gradioClient.js';
import { GRID, TILE, CIFAR10_CLASSES } from '../config.js';
import { assemble16Tiles } from '../utils/tileAssembler.js';
import TileGrid from './TileGrid.jsx';
import ViewModeSwitch from './ViewModeSwitch.jsx';
import useViewMode from '../hooks/useViewMode.js';
import { getImageDataFromUrl, pairwiseDiversity, laplacianVariance, colourfulness } from '../lib/imageStats.js';

/**
 * Robustly slice a 4x4 image (base64, data-URL, or local path) into 16 exact 32x32 PNGs.
 * Handles any dimensions (128x128, 552x552, etc.) and never hangs.
 */
export async function sliceTileSheet(rawInput) {
  return new Promise((resolve) => {
    if (!rawInput) {
      resolve([]);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const tiles = [];
        const canvas = document.createElement('canvas');
        canvas.width  = TILE;
        canvas.height = TILE;
        const ctx = canvas.getContext('2d');
        const cellW = img.naturalWidth / GRID.cols;
        const cellH = img.naturalHeight / GRID.rows;

        for (let i = 0; i < GRID.n; i++) {
          const col = i % GRID.cols;
          const row = Math.floor(i / GRID.cols);
          const sx = col * cellW;
          const sy = row * cellH;
          ctx.clearRect(0, 0, TILE, TILE);
          ctx.drawImage(img, sx, sy, cellW, cellH, 0, 0, TILE, TILE);
          tiles.push(canvas.toDataURL('image/png'));
        }
        resolve(tiles);
      } catch (e) {
        console.warn('Canvas slice error in sliceTileSheet:', e);
        resolve([]);
      }
    };
    img.onerror = (e) => {
      console.warn('Image load error in sliceTileSheet:', e);
      resolve([]);
    };

    if (rawInput.startsWith('data:') || rawInput.startsWith('/') || rawInput.startsWith('http')) {
      img.src = rawInput;
    } else {
      img.src = `data:image/png;base64,${rawInput}`;
    }
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
      if (b64) {
        const fname = `${batchSeed}_b${batchIdx}_${i}.png`;
        clsFolder.file(fname, b64, { base64: true });
        labelRows.push(`images/${cls.name}/${fname},${classIdx},${cls.label}`);
        totalCount++;
      }
    }
  }

  zip.file('labels.csv', labelRows.join('\n'));
  zip.file('metadata.json', JSON.stringify({
    checkpoint: 'Yashwantha123/vae-gan-diffusion-demo',
    model: 'Class-Conditional DDPM (CIFAR-10 train split)',
    ddim_steps: steps,
    guidance_scale: cfg,
    seeds_used: [...new Set(batches.map(b => b.batchSeed))],
    per_batch_mode: batches.map(b => b.mode),
    date: new Date().toISOString(),
    protocol_note: 'Standardized evaluation on CIFAR-10 32x32. Batch size 16 per grid. Free-tier Tesla T4 / ZeroGPU.',
    total_images: totalCount,
  }, null, 2));

  zip.file('README.txt', `PyTorch ImageFolder Dataset
============================
CIFAR-10 Synthetic Dataset generated via Class-Conditional DDPM.

from torchvision import datasets, transforms
from torch.utils.data import DataLoader

transform = transforms.Compose([
    transforms.Resize(32),
    transforms.ToTensor(),
    transforms.Normalize((0.5,0.5,0.5),(0.5,0.5,0.5))
])
dataset = datasets.ImageFolder('images/', transform=transform)
loader  = DataLoader(dataset, batch_size=64, shuffle=True)

ACADEMIC NOTE:
Synthetic images helped a ResNet-18 only when real data was scarce (+4.38 pts, p = 0.030);
when 5,000 real images/class were available, adding synthetic images yielded no significant gain (+0.54 pts, p = 0.13).
`.trim());

  return zip;
}

export default function OutputsTab5Datasets({ studioSliders }) {
  const [selectedClasses, setSelectedClasses] = useState([5]); // default: dog
  const [imagesPerClass, setImagesPerClass]   = useState(16);
  const [buildSteps, setBuildSteps]           = useState(studioSliders?.steps ?? 50);
  const [buildCfg,   setBuildCfg]             = useState(studioSliders?.cfg   ?? 1.5);
  const [buildSeed,  setBuildSeed]            = useState(studioSliders?.seed  ?? 42);
  const [hfToken, setHfToken]                 = useState('');

  const [building,  setBuilding]              = useState(false);
  const [paused,    setPaused]                = useState(false);
  const [progress,  setProgress]              = useState(null); // { done, total, currentClass, classCounts, tiles }
  const [lastBatchTiles, setLastBatchTiles]   = useState([]);
  const [error,     setError]                 = useState(null);
  const [zipReady,  setZipReady]              = useState(null);
  const [viewMode, setViewMode]               = useViewMode('images');
  const [batchStats, setBatchStats]           = useState(null);
  const cancelRef   = useRef(false);
  const pauseRef    = useRef(false);

  // Compute live analytical statistics on the latest generated batch
  useEffect(() => {
    if (!lastBatchTiles || lastBatchTiles.length === 0) return;
    let active = true;
    Promise.all(lastBatchTiles.map(t => getImageDataFromUrl(t)))
      .then(imgDataArr => {
        if (!active) return;
        const valid = imgDataArr.filter(Boolean);
        if (valid.length === 0) return;
        const diversity = pairwiseDiversity(valid);
        const variances = valid.map(v => laplacianVariance(v));
        const meanVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
        const colours = valid.map(v => colourfulness(v));
        const meanColour = colours.reduce((a, b) => a + b, 0) / colours.length;
        setBatchStats({
          diversity,
          meanVariance,
          meanColour,
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [lastBatchTiles]);

  const toggleClass = useCallback((id) => {
    setSelectedClasses(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const selectAllClasses = useCallback(() => {
    if (selectedClasses.length === 10) {
      setSelectedClasses([5]);
    } else {
      setSelectedClasses([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  }, [selectedClasses]);

  const handleBuild = useCallback(async () => {
    setBuilding(true);
    setPaused(false);
    setError(null);
    setZipReady(null);
    setLastBatchTiles([]);
    cancelRef.current = false;
    pauseRef.current  = false;

    const batches = [];
    const batchesPerClass = Math.ceil(imagesPerClass / GRID.n);
    const total = selectedClasses.length * batchesPerClass;
    let done = 0;
    const counts = {};
    selectedClasses.forEach(id => {
      counts[CIFAR10_CLASSES[id].name] = 0;
    });

    for (const clsIdx of selectedClasses) {
      const cls = CIFAR10_CLASSES[clsIdx];
      for (let b = 0; b < batchesPerClass; b++) {
        if (cancelRef.current) break;
        while (pauseRef.current && !cancelRef.current) {
          await new Promise(r => setTimeout(r, 200));
        }
        if (cancelRef.current) break;

        const bSeed = buildSeed + b;
        try {
          const result = await generateStudio({
            cls_name: cls.name,
            prompt: '',
            steps: buildSteps,
            cfg: buildCfg,
            seed: bSeed,
            enhance: false,
            models: ['ddpm'],
            hfToken: hfToken.trim() || null,
          });

          const tileSheet = result?.per_model?.ddpm?.tile_sheet_png_b64 || result?.per_model?.ddpm?.grid_png_b64;
          let tiles = tileSheet ? await sliceTileSheet(tileSheet) : [];
          if (tiles.length < 16) {
            tiles = await assemble16Tiles({
              modelKey: 'ddpm',
              className: cls.name,
              primarySource: tileSheet,
              seed: bSeed,
            });
          }
          batches.push({
            tiles,
            classIdx: clsIdx,
            batchSeed: bSeed,
            batchIdx: b,
            mode: result?.mode ?? 'cached',
          });

          done++;
          counts[cls.name] = (counts[cls.name] || 0) + tiles.length;
          setProgress({
            done,
            total,
            currentClass: cls.label,
            classCounts: { ...counts },
            tiles: batches.flatMap(bt => bt.tiles).length,
          });

          if (tiles.length > 0) {
            setLastBatchTiles(tiles);
          }
        } catch (err) {
          console.warn('[handleBuild] Batch error:', err);
        }
      }
      if (cancelRef.current) break;
    }

    if (!cancelRef.current && batches.length) {
      try {
        const zip = await buildZip(
          batches,
          selectedClasses.map(i => CIFAR10_CLASSES[i].name),
          buildSteps,
          buildCfg,
          buildSeed
        );
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        setZipReady(blob);
      } catch (err) {
        setError('ZIP packaging failed: ' + err.message);
      }
    }

    setBuilding(false);
  }, [selectedClasses, imagesPerClass, buildSteps, buildCfg, buildSeed, hfToken]);

  const downloadZip = () => {
    if (!zipReady) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipReady);
    const firstName = CIFAR10_CLASSES[selectedClasses[0]]?.name ?? 'cifar10';
    a.download = `synthetic_ddpm_${firstName}_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Required Empirical Note Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs font-mono text-cyan-200 flex items-start space-x-3 shadow-md">
        <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          Synthetic images helped a ResNet-18 only when real data was scarce (<strong>+4.38 pts</strong>, p = 0.030); when 5,000 real images/class were available, adding synthetic images yielded no significant gain (<strong>+0.54 pts</strong>, p = 0.13).
        </span>
      </div>

      {/* Two-Column Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
        {/* Left Column: Controls (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h4 className="text-base font-bold text-white font-heading">
                Synthetic Dataset Builder
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                Class-conditional DDPM · Batches of 16 (4×4) · Automatic GPU ➔ CPU ➔ CACHED fallback
              </p>
            </div>
            <button
              onClick={selectAllClasses}
              className="px-3 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              {selectedClasses.length === 10 ? 'Deselect All' : 'Select All 10 Classes'}
            </button>
          </div>

          {/* Class Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 font-semibold flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Classes ({selectedClasses.length}/10 selected):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CIFAR10_CLASSES.map(c => {
                const isSelected = selectedClasses.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleClass(c.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 font-bold shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Images Per Class (16 / 64 / 128 / 256) */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 font-semibold">
              Images per class:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[16, 64, 128, 256].map(n => (
                <button
                  key={n}
                  onClick={() => setImagesPerClass(n)}
                  className={`py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                    imagesPerClass === n
                      ? 'bg-slate-800 border border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {n} imgs
                </button>
              ))}
            </div>
          </div>

          {/* Diffusion Parameters (Steps & CFG) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Diffusion Steps:</span>
                <span className="text-cyan-300 font-bold">{buildSteps}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={buildSteps}
                onChange={e => setBuildSteps(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Guidance Scale (CFG w):</span>
                <span className="text-cyan-300 font-bold">{buildCfg.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="0.5"
                value={buildCfg}
                onChange={e => setBuildCfg(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Seed Input */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Random Seed:</label>
              <input
                type="number"
                value={buildSeed}
                onChange={e => setBuildSeed(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
              />
            </div>
            <button
              onClick={() => setBuildSeed(Math.floor(Math.random() * 100000))}
              className="mt-5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Randomise Seed"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleBuild}
              disabled={building || selectedClasses.length === 0}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{building ? 'Generating Dataset…' : 'Build Dataset'}</span>
            </button>

            {building && (
              <>
                <button
                  onClick={() => { pauseRef.current = !pauseRef.current; setPaused(pauseRef.current); }}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300 hover:border-amber-500/50 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>{paused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={() => { cancelRef.current = true; setBuilding(false); }}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-rose-300 hover:border-rose-500/50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {error && (
              <button
                onClick={handleBuild}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-xs font-mono text-rose-300 hover:bg-rose-900/50 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Generation</span>
              </button>
            )}

            {zipReady && (
              <button
                onClick={downloadZip}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download synthetic_dataset.zip</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live 4×4 Preview & Progress (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6">
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h5 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Latest Batch Analysis</span>
              </h5>
              <ViewModeSwitch mode={viewMode} setMode={setViewMode} />
            </div>

            {/* Display either 4x4 Images Preview or Analytical Graphs */}
            {viewMode === 'images' ? (
              <div className="w-full aspect-square max-w-[360px] mx-auto rounded-xl border border-slate-800 bg-slate-900/60 p-1 flex items-center justify-center overflow-hidden">
                {lastBatchTiles.length > 0 ? (
                  <TileGrid tiles={lastBatchTiles} rows={4} cols={4} isLoading={building && lastBatchTiles.length === 0} />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-mono text-slate-400">
                      Click "Build Dataset" to generate batches of 16 images in real time.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full aspect-square max-w-[360px] mx-auto rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col justify-between overflow-y-auto font-mono text-xs">
                {lastBatchTiles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-cyan-300">Live Batch CV Metrics</span>
                      <span className="text-[10px] text-slate-500">N=16 tiles (32×32)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-500">Pairwise L2 Diversity:</div>
                        <div className="text-cyan-400 font-bold text-sm">
                          {batchStats ? batchStats.diversity.toFixed(4) : '…'}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Higher = broader modes</div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-500">Laplacian Sharpness:</div>
                        <div className="text-emerald-400 font-bold text-sm">
                          {batchStats ? batchStats.meanVariance.toFixed(2) : '…'}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Edge energy / variance</div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2">
                        <div className="text-[10px] text-slate-500">Colorfulness (Hasler-Süsstrunk):</div>
                        <div className="text-amber-400 font-bold text-sm">
                          {batchStats ? batchStats.meanColour.toFixed(2) : '…'}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Combined chromatic saturation</div>
                      </div>
                    </div>

                    {/* Class balance breakdown */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] text-slate-400 font-bold">Class Allocation Distribution</div>
                      <div className="space-y-1">
                        {selectedClasses.map(id => {
                          const cls = CIFAR10_CLASSES[id];
                          const cur = progress?.classCounts?.[cls.name] || 0;
                          const pct = Math.min(100, Math.round((cur / imagesPerClass) * 100));
                          return (
                            <div key={id} className="space-y-0.5">
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{cls.name}</span>
                                <span>{cur} / {imagesPerClass} ({pct}%)</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-2 my-auto">
                    <BarChart2 className="w-8 h-8 text-cyan-400 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Generate a batch to inspect analytical CV metrics and class distributions.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress & Class Counters */}
          <div className="space-y-3 pt-2">
            {progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Batch {progress.done} of {progress.total} ({progress.currentClass})</span>
                  <span className="text-cyan-300 font-bold">{Math.round((progress.done / progress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Class Counters Strip */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 font-semibold">
                Class Progress Counters:
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                {selectedClasses.map(id => {
                  const cls = CIFAR10_CLASSES[id];
                  const currentCount = progress?.classCounts?.[cls.name] || 0;
                  return (
                    <span
                      key={id}
                      className={`px-2 py-0.5 rounded border ${
                        currentCount >= imagesPerClass
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cls.name}: {currentCount}/{imagesPerClass}
                    </span>
                  );
                })}
              </div>
            </div>

            {zipReady && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs font-mono text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  ZIP package ready with images/, labels.csv, metadata.json, and README.txt.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
