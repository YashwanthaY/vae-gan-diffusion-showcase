import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import useJsonData from '../hooks/useJsonData.js';

const METRICS = ['fid', 'precision', 'recall', 'density', 'coverage'];
const METRIC_LABELS = { fid: 'FID ↓', precision: 'Precision ↑', recall: 'Recall ↑', density: 'Density ↑', coverage: 'Coverage ↑' };
const METRIC_LOW_IS_GOOD = { fid: true, precision: false, recall: false, density: false, coverage: false };

// ─── Colour scale: blue-white-red (perceptual) ────────────────────────────────
function metricColor(val, min, max, lowIsGood) {
  if (val === null || val === undefined) return 'rgba(30,41,59,1)';
  let t = (val - min) / (max - min || 1);
  if (lowIsGood) t = 1 - t; // invert: low=green
  // green(good) → yellow → red(bad)
  const r = Math.round(t < 0.5 ? t * 2 * 255 : 255);
  const g = Math.round(t < 0.5 ? 255 : (1 - t) * 2 * 255);
  return `rgba(${r},${g},0,0.65)`;
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function HeatmapGrid({ heatmap, metric, sliderSteps, sliderCfg }) {
  if (!heatmap?.cells?.length) {
    return (
      <div className="p-6 rounded-xl bg-slate-900/50 border border-dashed border-slate-700 text-center text-xs font-mono text-slate-500">
        pending: run Kaggle stage 'heat'
      </div>
    );
  }

  const cells = heatmap.cells;
  const stepValues = [...new Set(cells.map(c => c.steps))].sort((a,b) => a - b);
  const wValues    = [...new Set(cells.map(c => c.w))].sort((a,b) => a - b);

  const vals = cells.map(c => c[metric]).filter(v => v !== null && v !== undefined);
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  const getCell = (s, w) => cells.find(c => c.steps === s && c.w === w);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="text-xs font-mono mx-auto">
          <thead>
            <tr>
              <th className="px-3 py-2 text-slate-500 text-left">steps \ w</th>
              {wValues.map(w => (
                <th key={w} className="px-3 py-2 text-slate-400 text-center">{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stepValues.map(s => (
              <tr key={s}>
                <td className="px-3 py-2 text-slate-400 font-bold">{s}</td>
                {wValues.map(w => {
                  const cell = getCell(s, w);
                  const val  = cell?.[metric];
                  const isActive = Math.abs(s - sliderSteps) < 5 && Math.abs(w - sliderCfg) < 0.3;
                  return (
                    <td
                      key={w}
                      title={`steps=${s}, w=${w}, ${METRIC_LABELS[metric]}=${val?.toFixed(3) ?? 'N/A'}`}
                      className={`px-3 py-2 text-center rounded transition-all ${isActive ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950' : ''}`}
                      style={{ backgroundColor: val !== undefined ? metricColor(val, min, max, METRIC_LOW_IS_GOOD[metric]) : undefined }}
                    >
                      {val !== undefined ? val.toFixed(3) : <span className="text-slate-600">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
        <span>Better</span>
        <div className="flex-1 h-2 rounded" style={{ background: 'linear-gradient(to right, rgba(0,255,0,0.6), rgba(255,255,0,0.6), rgba(255,0,0,0.6))' }} />
        <span>Worse</span>
      </div>
      {heatmap.note && <p className="text-[10px] text-slate-500 font-mono">{heatmap.note}</p>}
    </div>
  );
}

// ─── Variation Map (canvas) ───────────────────────────────────────────────────
function VariationMap({ lastRun }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const tileSheet = lastRun?.per_model?.ddpm?.tile_sheet_png_b64;
    if (!tileSheet || !canvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const TILE = 32, N = 16, COLS = 4;
      const ROWS = Math.ceil(N / COLS);

      // Extract 16 tiles
      const offscreen = document.createElement('canvas');
      offscreen.width = img.width; offscreen.height = img.height;
      const ctx0 = offscreen.getContext('2d');
      ctx0.drawImage(img, 0, 0);

      const tiles = [];
      for (let i = 0; i < N; i++) {
        const tx = (i % COLS) * TILE;
        const ty = Math.floor(i / COLS) * TILE;
        const d = ctx0.getImageData(tx, ty, TILE, TILE).data; // Uint8ClampedArray
        tiles.push(d);
      }

      // Per-pixel std across tiles
      const canvas = canvasRef.current;
      canvas.width  = TILE * 2 + 8;
      canvas.height = TILE;
      const ctx = canvas.getContext('2d');

      // Mean image
      const meanImg = ctx.createImageData(TILE, TILE);
      for (let j = 0; j < TILE * TILE * 4; j++) {
        meanImg.data[j] = tiles.reduce((s, t) => s + t[j], 0) / N;
      }
      ctx.putImageData(meanImg, 0, 0);

      // Std image (per channel, mapped to brightness)
      const stdImg = ctx.createImageData(TILE, TILE);
      for (let px = 0; px < TILE * TILE; px++) {
        let sumStd = 0;
        for (let ch = 0; ch < 3; ch++) {
          const j = px * 4 + ch;
          const mean = meanImg.data[j];
          const variance = tiles.reduce((s, t) => s + (t[j] - mean) ** 2, 0) / N;
          sumStd += Math.sqrt(variance);
        }
        const brightness = Math.min(255, (sumStd / 3) * 4); // scale up
        // Perceptual: map brightness to cyan heatmap
        stdImg.data[px * 4 + 0] = 0;
        stdImg.data[px * 4 + 1] = brightness;
        stdImg.data[px * 4 + 2] = brightness;
        stdImg.data[px * 4 + 3] = 255;
      }
      ctx.putImageData(stdImg, TILE + 8, 0);

      // Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '6px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Mean', TILE / 2, TILE - 2);
      ctx.fillText('Std (per-pixel)', TILE + 8 + TILE / 2, TILE - 2);
    };
    img.src = `data:image/png;base64,${tileSheet}`;
  }, [lastRun]);

  const tileSheet = lastRun?.per_model?.ddpm?.tile_sheet_png_b64;

  return (
    <div className="space-y-3">
      <h5 className="text-sm font-bold text-white">Variation Map (DDPM)</h5>
      {tileSheet ? (
        <>
          <canvas ref={canvasRef} className="rounded-xl border border-slate-800 bg-slate-950" style={{ imageRendering: 'pixelated', maxWidth: '100%' }} />
          <p className="text-[10px] text-slate-500 font-mono">
            ⚐ Visualisation / diagnostic only, not a quality metric. Per-pixel standard deviation across 16 DDPM tiles from the last generation.
          </p>
        </>
      ) : (
        <div className="p-5 rounded-xl bg-slate-900/50 border border-dashed border-slate-700 text-xs font-mono text-slate-500 text-center">
          Generate with DDPM to see the variation map.
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function OutputsTab3Heatmaps({ lastRun, studioSliders }) {
  const [metric, setMetric] = useState('fid');
  const { data: heatmap } = useJsonData('/data/json/heatmap_grid.json');

  const steps = studioSliders?.steps ?? 50;
  const cfg   = studioSliders?.cfg   ?? 1.5;

  return (
    <div className="space-y-8">
      {/* (a) Heatmap grid */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-white">Parameter Impact Heatmap (DDPM)</h4>
          <div className="flex flex-wrap gap-1.5">
            {METRICS.map(m => (
              <button
                key={m} onClick={() => setMetric(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${metric === m ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                {METRIC_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 font-mono">
          Cell outlined in cyan = current slider position (steps={steps}, w={cfg}). Values from heatmap_grid.json.
        </p>
        <HeatmapGrid heatmap={heatmap?._pending ? null : heatmap} metric={metric} sliderSteps={steps} sliderCfg={cfg} />
      </div>

      {/* (b) Variation map */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800">
        <VariationMap lastRun={lastRun} />
      </div>
    </div>
  );
}
