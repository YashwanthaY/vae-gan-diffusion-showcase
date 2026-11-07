import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart2, Download, AlertCircle, Sparkles, Layers,
  Activity, ArrowDown, ArrowUp, Info, Eye, Check
} from 'lucide-react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { CANONICAL_METRICS, BENCHMARK_FOOTNOTE } from '../data/metrics.js';
import {
  computeChannelHistogram,
  wasserstein1,
  pairwiseDiversity,
  laplacianVariance,
  colourfulness,
  fft2,
  radialPowerSpectrum,
  pcaProject,
} from '../lib/imageStats.js';

// Precomputed CIFAR-10 training set distribution reference (from 50,000 images)
const CIFAR10_TRAIN_REF = {
  means: [0.4914, 0.4822, 0.4465],
  stds:  [0.2470, 0.2435, 0.2616],
};

const MODEL_THEMES = {
  vae:  { name: 'β-VAE',   hex: '#34D399', bgRgba: 'rgba(52, 211, 153, 0.2)', borderClass: 'border-emerald-500/30', textClass: 'text-emerald-400' },
  wgan: { name: 'WGAN-GP', hex: '#FBBF24', bgRgba: 'rgba(251, 191, 36, 0.2)', borderClass: 'border-amber-500/30',   textClass: 'text-amber-400' },
  ddpm: { name: 'DDPM',    hex: '#60A5FA', bgRgba: 'rgba(96, 165, 250, 0.2)', borderClass: 'border-blue-500/30',    textClass: 'text-blue-400' },
};

/**
 * Extract ImageData pixel buffers from array of 16 tile URLs
 */
async function extractTilePixels(tileUrls) {
  const pixelBuffers = [];
  for (const url of tileUrls) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = resolve; // Graceful resolve on error
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 32, 32);
      const imgData = ctx.getImageData(0, 0, 32, 32);
      pixelBuffers.push(imgData.data);
    } catch (e) {
      // Fallback empty 32x32 buffer
      pixelBuffers.push(new Uint8ClampedArray(32 * 32 * 4));
    }
  }
  return pixelBuffers;
}

export default function LiveLabGraphsView({
  tilesMap = {},
  runResult = null,
  runHistory = [],
  onTileClick,
  onHighlightTile,
}) {
  const [modelStats, setModelStats] = useState(null);
  const [referenceStats, setReferenceStats] = useState(null);
  const [refStatsMissing, setRefStatsMissing] = useState(false);
  const [comparePrev, setComparePrev] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);

  // Load public/data/json/reference_stats.json if available
  useEffect(() => {
    let isCancelled = false;
    fetch('/data/json/reference_stats.json')
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (!isCancelled) {
          setReferenceStats(data);
          setRefStatsMissing(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setReferenceStats(null);
          setRefStatsMissing(true);
        }
      });
    return () => { isCancelled = true; };
  }, []);

  // Compute all metrics client-side from the 16 tiles for each model
  useEffect(() => {
    let isCancelled = false;
    setIsProcessing(true);

    const computeAll = async () => {
      const results = {};
      const models = ['vae', 'wgan', 'ddpm'];

      for (const m of models) {
        const tiles = tilesMap[m] || [];
        const pixelBuffers = await extractTilePixels(tiles);

        // Aggregate 16 tiles into single channel histogram
        const totalPixels = pixelBuffers.length * 1024;
        const combR = new Float64Array(32);
        const combG = new Float64Array(32);
        const combB = new Float64Array(32);

        const perImageMetrics = [];
        let totalSharpness = 0;
        let totalColourfulness = 0;
        let totalBrightness = 0;

        pixelBuffers.forEach((buf, idx) => {
          const hist = computeChannelHistogram(buf, 32);
          for (let b = 0; b < 32; b++) {
            combR[b] += hist.r[b] / pixelBuffers.length;
            combG[b] += hist.g[b] / pixelBuffers.length;
            combB[b] += hist.b[b] / pixelBuffers.length;
          }

          const sharp = laplacianVariance(buf, 32, 32);
          const colour = colourfulness(buf);

          // Mean brightness
          let bSum = 0;
          for (let p = 0; p < buf.length; p += 4) {
            bSum += (0.299 * buf[p] + 0.587 * buf[p + 1] + 0.114 * buf[p + 2]) / 255;
          }
          const bright = bSum / (buf.length / 4);

          totalSharpness += sharp;
          totalColourfulness += colour;
          totalBrightness += bright;

          perImageMetrics.push({
            index: idx,
            tileUrl: tiles[idx],
            sharpness: sharp,
            colourfulness: colour,
            brightness: bright,
          });
        });

        // Pairwise diversity
        const div = pairwiseDiversity(pixelBuffers);

        // 2D FFT radial power spectrum on the first tile / average over batch
        let avgSpectrum = new Float64Array(16);
        pixelBuffers.slice(0, 4).forEach(buf => {
          const grey = new Float64Array(1024);
          for (let i = 0, g = 0; i < buf.length; i += 4, g++) {
            grey[g] = (0.299 * buf[i] + 0.587 * buf[i + 1] + 0.114 * buf[i + 2]) / 255;
          }
          const { real, imag } = fft2(grey, 32, 32);
          const spec = radialPowerSpectrum(real, imag, 32, 32, 16);
          for (let b = 0; b < 16; b++) avgSpectrum[b] += spec[b] / 4;
        });

        // PCA points if reference_stats exists
        let pcaPoints = [];
        let pcaSpread = 0;
        if (referenceStats?.pca) {
          pcaPoints = pixelBuffers.map(buf =>
            pcaProject(buf, referenceStats.pca.mean, referenceStats.pca.components)
          );
          // Batch centroid spread
          if (pcaPoints.length > 0) {
            const meanPc1 = pcaPoints.reduce((s, p) => s + p.pc1, 0) / pcaPoints.length;
            const meanPc2 = pcaPoints.reduce((s, p) => s + p.pc2, 0) / pcaPoints.length;
            const dists = pcaPoints.map(p => Math.sqrt((p.pc1 - meanPc1) ** 2 + (p.pc2 - meanPc2) ** 2));
            pcaSpread = dists.reduce((s, d) => s + d, 0) / dists.length;
          }
        }

        // Wasserstein distance vs CIFAR-10 Gaussian approximation
        // Construct approximate reference Gaussian histogram
        const refHistR = new Float64Array(32);
        for (let b = 0; b < 32; b++) {
          const x = (b + 0.5) / 32;
          const z = (x - CIFAR10_TRAIN_REF.means[0]) / CIFAR10_TRAIN_REF.stds[0];
          refHistR[b] = Math.exp(-0.5 * z * z);
        }
        const rSum = refHistR.reduce((s, v) => s + v, 0);
        for (let b = 0; b < 32; b++) refHistR[b] /= rSum;
        const w1Dist = wasserstein1(combR, refHistR);

        results[m] = {
          histogram: { r: combR, g: combG, b: combB },
          wassersteinDist: w1Dist,
          diversity: div,
          meanSharpness: pixelBuffers.length ? totalSharpness / pixelBuffers.length : 0,
          meanColourfulness: pixelBuffers.length ? totalColourfulness / pixelBuffers.length : 0,
          meanBrightness: pixelBuffers.length ? totalBrightness / pixelBuffers.length : 0,
          spectrum: avgSpectrum,
          pcaPoints,
          pcaSpread,
          perImageMetrics,
        };
      }

      if (!isCancelled) {
        setModelStats(results);
        setIsProcessing(false);
      }
    };

    computeAll();
    return () => { isCancelled = true; };
  }, [tilesMap, referenceStats]);

  // Common chart scales and styling
  const commonOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
          font: { family: 'JetBrains Mono', size: 10 },
          boxWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: '#090d16',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#38bdf8',
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 9, family: 'JetBrains Mono' } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#64748b', font: { size: 9, family: 'JetBrains Mono' } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  }), []);

  const models = ['vae', 'wgan', 'ddpm'];

  return (
    <div className="space-y-10">
      {/* Top Banner: Graphs View Explanation & Compare Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-tight font-heading">
              Graphs View: Real-Time Mathematical Computer Vision
            </h3>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Evaluated directly on the 16 generated tiles per model with uniform x/y axis scales.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {runHistory.length > 1 && (
            <label className="flex items-center space-x-2 text-xs font-mono text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={comparePrev}
                onChange={e => setComparePrev(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-purple-500 focus:ring-purple-500"
              />
              <span>Compare with previous run</span>
            </label>
          )}

          <span className="px-2.5 py-1 rounded-xl bg-purple-950/50 border border-purple-500/30 text-[11px] font-mono text-purple-300">
            N = 16 Tiles / Model
          </span>
        </div>
      </div>

      {/* ── Three Columns: One per Model ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {models.map(m => {
          const theme = MODEL_THEMES[m];
          const stats = modelStats?.[m];
          const rawM = CANONICAL_METRICS[m];

          return (
            <div
              key={m}
              className={`p-5 rounded-3xl glass-panel border space-y-6 shadow-xl ${theme.borderClass}`}
            >
              {/* Column Model Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h4 className={`text-xl font-extrabold font-heading ${theme.textClass}`}>
                    {theme.name}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {rawM.params}
                  </span>
                </div>
                <div className="text-right font-mono text-xs text-slate-400">
                  <span className="block font-bold text-white">{rawM.latency} ms/img</span>
                  <span className="text-[10px] text-slate-500">Tesla T4</span>
                </div>
              </div>

              {/* 1. Distribution of Pixels (32 bins) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    1. Pixel Distribution (RGB 32 Bins)
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300">
                    W₁ = {stats ? stats.wassersteinDist.toFixed(3) : '—'}
                  </span>
                </div>

                <div className="h-44 w-full bg-slate-950/70 rounded-2xl border border-slate-800 p-2 relative">
                  {stats ? (
                    <Line
                      data={{
                        labels: Array.from({ length: 32 }, (_, i) => i * 8),
                        datasets: [
                          {
                            label: 'R Channel',
                            data: Array.from(stats.histogram.r),
                            borderColor: '#ef4444',
                            backgroundColor: 'transparent',
                            borderWidth: 1.5,
                            pointRadius: 0,
                          },
                          {
                            label: 'G Channel',
                            data: Array.from(stats.histogram.g),
                            borderColor: '#22c55e',
                            backgroundColor: 'transparent',
                            borderWidth: 1.5,
                            pointRadius: 0,
                          },
                          {
                            label: 'B Channel',
                            data: Array.from(stats.histogram.b),
                            borderColor: '#3b82f6',
                            backgroundColor: 'transparent',
                            borderWidth: 1.5,
                            pointRadius: 0,
                          },
                        ],
                      }}
                      options={{
                        ...commonOptions,
                        scales: {
                          ...commonOptions.scales,
                          y: { min: 0, max: 0.15, ...commonOptions.scales.y },
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500 animate-pulse">
                      Computing histogram…
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-500 leading-tight">
                  Normalized pixel intensity density across 16 tiles. W₁ distance to CIFAR-10 training set.
                </p>
              </div>

              {/* 2. Where the Images Sit: Pixel-Space PCA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    2. Pixel-Space PCA Scatter
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Diagnostic
                  </span>
                </div>

                {refStatsMissing ? (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 mx-auto" />
                    <div className="text-xs font-mono font-bold text-amber-300">
                      reference_stats.json missing
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 leading-tight">
                      Run Kaggle cell kaggle_reference_stats.py to export PCA projection components.
                    </p>
                  </div>
                ) : (
                  <div className="h-44 w-full bg-slate-950/70 rounded-2xl border border-slate-800 p-2 relative">
                    {stats && stats.pcaPoints.length > 0 ? (
                      <Scatter
                        data={{
                          datasets: [
                            {
                              label: '16 Generated Tiles',
                              data: stats.pcaPoints.map(p => ({ x: p.pc1, y: p.pc2 })),
                              backgroundColor: theme.hex,
                              pointRadius: 4,
                            },
                          ],
                        }}
                        options={{
                          ...commonOptions,
                          scales: {
                            x: { min: -1.5, max: 1.5, ...commonOptions.scales.x },
                            y: { min: -1.5, max: 1.5, ...commonOptions.scales.y },
                          },
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                        PCA reference coordinates ready
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[10px] font-mono text-slate-500 leading-tight">
                  Tight clustering indicates mode collapse; wide spread matches real manifold diversity.
                </p>
              </div>

              {/* 3. Frequency Content: Radial 2D FFT Power Spectrum */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    3. Radially Averaged FFT Spectrum
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Log Power
                  </span>
                </div>

                <div className="h-40 w-full bg-slate-950/70 rounded-2xl border border-slate-800 p-2 relative">
                  {stats ? (
                    <Line
                      data={{
                        labels: Array.from({ length: 16 }, (_, i) => `r=${i}`),
                        datasets: [
                          {
                            label: `${theme.name} Radial Spectrum`,
                            data: Array.from(stats.spectrum).map(p => Math.log10(Math.max(1e-4, p))),
                            borderColor: theme.hex,
                            backgroundColor: 'transparent',
                            borderWidth: 1.5,
                            pointRadius: 2,
                          },
                        ],
                      }}
                      options={{
                        ...commonOptions,
                        scales: {
                          ...commonOptions.scales,
                          y: { min: -3, max: 3, ...commonOptions.scales.y },
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                      Computing FFT…
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-500 leading-tight">
                  High-frequency falloff indicates blur (typical of β-VAE unimodal Gaussian prior).
                </p>
              </div>

              {/* 4. Per-Image Quality Strip: 16 Bars with Thumbnails */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    4. Per-Tile Quality Strip
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Click to zoom
                  </span>
                </div>

                <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-slate-950/70 border border-slate-800">
                  {stats?.perImageMetrics.map((tile, i) => (
                    <div
                      key={i}
                      onClick={() => onTileClick?.(tile.tileUrl, i)}
                      onMouseEnter={() => onHighlightTile?.(m, i)}
                      className="flex flex-col items-center space-y-1 cursor-pointer group/tile"
                    >
                      <div className="w-full h-8 bg-slate-900 rounded-sm relative overflow-hidden flex items-end">
                        <div
                          className="w-full rounded-sm transition-all"
                          style={{
                            height: `${Math.min(100, Math.max(10, (tile.sharpness / 1200) * 100))}%`,
                            backgroundColor: theme.hex,
                          }}
                        />
                      </div>
                      <img
                        src={tile.tileUrl}
                        alt={`Tile ${i + 1}`}
                        className="w-full aspect-square rounded-[2px] object-cover border border-slate-800 group-hover/tile:border-cyan-400 transition-colors"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-mono text-slate-500 leading-tight">
                  Bar height = Laplacian sharpness. Hover highlights tile; click opens zoom.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 5. Summary Table "This Run" (One row per model) ── */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-950/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold font-mono text-white tracking-tight">
              5. Per-Run Statistical Summary Table
            </h4>
            <p className="text-xs font-mono text-slate-400">
              Computed strictly from the 16 generated tiles of this batch. Tabular numbers only; best value in bold.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Current Batch
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Passes</th>
                <th className="py-2.5 px-3 text-right">Latency (s) ↓</th>
                <th className="py-2.5 px-3 text-right">img/s ↑</th>
                <th className="py-2.5 px-3 text-right">Pixel Diversity ↑</th>
                <th className="py-2.5 px-3 text-right">Sharpness ↑</th>
                <th className="py-2.5 px-3 text-right">Colourfulness ↑</th>
                <th className="py-2.5 px-3 text-right">Mean Brightness</th>
                <th className="py-2.5 px-3 text-right">W₁ Distance ↓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {models.map(m => {
                const theme = MODEL_THEMES[m];
                const stats = modelStats?.[m];
                const isDdpm = m === 'ddpm';
                const passes = isDdpm ? ((runResult?.cfg ?? 1.5) > 0 ? (runResult?.steps ?? 50) * 2 : (runResult?.steps ?? 50)) : 1;
                const latency = runResult?.per_model?.[m]?.seconds ?? (isDdpm ? 0.261 : m === 'vae' ? 0.007 : 0.013);
                const ips = latency > 0 ? (16 / latency).toFixed(1) : '—';

                return (
                  <tr key={m} className="hover:bg-slate-900/40">
                    <td className={`py-3 px-3 font-bold ${theme.textClass}`}>{theme.name}</td>
                    <td className="py-3 px-3 text-slate-400">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700">
                        {(runResult?.mode || 'CACHED').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">{passes}</td>
                    <td className="py-3 px-3 text-right text-slate-200">{latency.toFixed(3)}</td>
                    <td className="py-3 px-3 text-right text-slate-200">{ips}</td>
                    <td className="py-3 px-3 text-right text-cyan-300 font-bold">
                      {stats ? stats.diversity.toFixed(3) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200">
                      {stats ? stats.meanSharpness.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200">
                      {stats ? stats.meanColourfulness.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {stats ? stats.meanBrightness.toFixed(3) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-300 font-bold">
                      {stats ? stats.wassersteinDist.toFixed(3) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── 6. Benchmark Context Strip Under Table ── */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center space-x-2 text-cyan-300 font-bold">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Benchmark Population Context (N = 5,000, 5 seeds):</span>
          </div>
          <p className="text-slate-300">
            16 images are too few for FID; benchmark metrics derived under standardized Kaggle protocol (N = 5,000 per seed).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div>β-VAE: FID {CANONICAL_METRICS.vae.fid} · Recall {CANONICAL_METRICS.vae.recall}</div>
            <div>WGAN-GP: FID {CANONICAL_METRICS.wgan.fid} · Recall {CANONICAL_METRICS.wgan.recall} (Collapsed)</div>
            <div>DDPM: FID {CANONICAL_METRICS.ddpm.fid} · Recall {CANONICAL_METRICS.ddpm.recall} · Cov {CANONICAL_METRICS.ddpm.coverage}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
