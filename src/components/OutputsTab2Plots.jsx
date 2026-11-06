import React, { useRef, useCallback } from 'react';
import { lazy, Suspense } from 'react';
import { Download } from 'lucide-react';
import useJsonData from '../hooks/useJsonData.js';
import { CANONICAL_METRICS } from '../data/metrics.js';
import { DOWNSTREAM_FINAL } from '../data/researchData.js';

// Lazy-load Chart.js wrapper
const LazyLine = lazy(() => import('react-chartjs-2').then(m => ({ default: m.Line })));
const LazyBar  = lazy(() => import('react-chartjs-2').then(m => ({ default: m.Bar  })));
const LazyScatter = lazy(() => import('react-chartjs-2').then(m => ({ default: m.Scatter })));

// Register Chart.js only once
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, LogarithmicScale,
  PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Accessible colour palette
const COLORS = {
  ddpm:   { line: '#22d3ee', bg: 'rgba(34,211,238,0.15)', point: '#22d3ee' },
  vae:    { line: '#34d399', bg: 'rgba(52,211,153,0.12)', point: '#34d399' },
  wgan:   { line: '#fbbf24', bg: 'rgba(251,191,36,0.12)', point: '#fbbf24' },
  prec:   { line: '#a78bfa', bg: 'rgba(167,139,250,0.12)', point: '#a78bfa' },
  recall: { line: '#fb7185', bg: 'rgba(251,113,133,0.12)', point: '#fb7185' },
};

const BASE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } } },
    tooltip: { backgroundColor: '#0f172a', titleColor: '#f8fafc', bodyColor: '#38bdf8', borderColor: '#334155', borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
};

// ── Export chart as PNG ──────────────────────────────────────────────────────
function ChartExportBtn({ chartRef, filename }) {
  return (
    <button
      onClick={() => {
        const url = chartRef.current?.toBase64Image?.('image/png', 3.0);
        if (!url) return;
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      }}
      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
    >
      <Download className="w-3 h-3" /><span>Export PNG</span>
    </button>
  );
}

// ── Pending/empty placeholder ────────────────────────────────────────────────
function PendingBox({ message }) {
  return (
    <div className="h-64 flex items-center justify-center rounded-xl bg-slate-900/50 border border-dashed border-slate-700">
      <p className="text-xs font-mono text-slate-500 text-center px-4">{message}</p>
    </div>
  );
}

function ChartCard({ title, caption, chartRef, children }) {
  return (
    <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-bold text-white">{title}</h5>
        {chartRef && <ChartExportBtn chartRef={chartRef} filename={`fig_${title.replace(/\s+/g, '_').toLowerCase()}.png`} />}
      </div>
      <div className="h-64">{children}</div>
      {caption && <p className="text-[10px] text-slate-500 font-mono">{caption}</p>}
    </div>
  );
}

// ── (a) FID vs DDIM steps ────────────────────────────────────────────────────
export function FidVsSteps({ sweeps }) {
  const ref = useRef(null);
  const pts = sweeps?.steps;
  if (!pts) return <PendingBox message="pending: run Kaggle stage 'steps'" />;

  const data = {
    labels: pts.map(p => p.steps),
    datasets: [{
      label: 'FID (DDPM, w=1.5)', data: pts.map(p => p.fid),
      borderColor: COLORS.ddpm.line, backgroundColor: COLORS.ddpm.bg,
      pointBackgroundColor: COLORS.ddpm.point, tension: 0.3, fill: true,
    }],
  };
  const opts = { ...BASE_OPTS, scales: { ...BASE_OPTS.scales, x: { ...BASE_OPTS.scales.x, title: { display: true, text: 'DDIM Steps', color: '#64748b' } }, y: { ...BASE_OPTS.scales.y, title: { display: true, text: 'FID ↓', color: '#64748b' } } } };

  return (
    <ChartCard title="FID vs DDIM Steps" caption={`Single seed, N=${sweeps.n ?? '2,000'}: compare points within this chart only.`} chartRef={ref}>
      <Suspense fallback={null}><LazyLine ref={ref} data={data} options={opts} /></Suspense>
    </ChartCard>
  );
}

// ── (b) FID / Precision / Recall vs guidance ─────────────────────────────────
export function MetricsVsGuidance({ sweeps }) {
  const ref = useRef(null);
  const pts = sweeps?.guidance;
  if (!pts) return <PendingBox message="pending: run Kaggle stage 'guid'" />;

  const data = {
    labels: pts.map(p => p.w),
    datasets: [
      { label: 'FID ↓', data: pts.map(p => p.fid), borderColor: COLORS.ddpm.line, backgroundColor: COLORS.ddpm.bg, tension: 0.3, fill: false, yAxisID: 'y' },
      { label: 'Precision ↑', data: pts.map(p => p.precision), borderColor: COLORS.prec.point, tension: 0.3, fill: false, yAxisID: 'y2' },
      { label: 'Recall ↑', data: pts.map(p => p.recall), borderColor: COLORS.recall.point, tension: 0.3, fill: false, yAxisID: 'y2' },
    ],
  };
  const opts = { ...BASE_OPTS, scales: { ...BASE_OPTS.scales,
    x: { ...BASE_OPTS.scales.x, title: { display: true, text: 'Guidance Scale (w)', color: '#64748b' } },
    y: { ...BASE_OPTS.scales.y, position: 'left', title: { display: true, text: 'FID ↓', color: '#64748b' } },
    y2: { position: 'right', ticks: { color: '#94a3b8' }, grid: { display: false }, title: { display: true, text: 'Precision / Recall ↑', color: '#64748b' } },
  }};

  return (
    <ChartCard title="FID, Precision & Recall vs Guidance Scale" caption={`Single seed, N=${sweeps.n ?? '2,000'}: compare points within this chart only.`} chartRef={ref}>
      <Suspense fallback={null}><LazyLine ref={ref} data={data} options={opts} /></Suspense>
    </ChartCard>
  );
}

// ── (c) Quality-vs-cost Pareto ───────────────────────────────────────────────
export function ParetoChart({ sweeps, speed, prdc, lastRun }) {
  const ref = useRef(null);
  const pts = sweeps?.steps;
  const ddpm100ms = speed?.ddpm100_ms_per_img;

  if (!pts || !ddpm100ms) return <PendingBox message="pending: run Kaggle stages 'steps' + 'grids'" />;

  const ddpmPts = pts.map(p => ({ x: (ddpm100ms * p.steps / 100), y: p.fid, label: `DDPM ${p.steps}s` }));
  const datasets = [
    { label: 'DDPM (varying steps)', data: ddpmPts.map(p => ({ x: p.x, y: p.y })), backgroundColor: COLORS.ddpm.point, pointRadius: 6 },
    { label: 'β-VAE', data: [{ x: speed?.vae_ms_per_img, y: prdc?.vae?.fid?.mean }], backgroundColor: COLORS.vae.point, pointRadius: 8, pointStyle: 'triangle' },
    { label: 'WGAN-GP (collapsed)', data: [{ x: speed?.wgan_ms_per_img, y: prdc?.wgan?.fid?.mean }], backgroundColor: COLORS.wgan.point, pointRadius: 8, pointStyle: 'triangle' },
  ].filter(d => d.data.every(p => p.x && p.y));

  if (lastRun?.per_model?.ddpm) {
    const nearestStep = pts.reduce((best, p) => Math.abs(p.steps - (lastRun.steps ?? 50)) < Math.abs(best.steps - (lastRun.steps ?? 50)) ? p : best, pts[0]);
    datasets.push({ label: 'Your run (nearest measured)', data: [{ x: ddpm100ms * nearestStep.steps / 100, y: nearestStep.fid }], backgroundColor: '#f43f5e', pointRadius: 10, pointStyle: 'star' });
  }

  const opts = { ...BASE_OPTS, scales: { ...BASE_OPTS.scales, x: { type: 'logarithmic', ticks: { color: '#94a3b8' }, title: { display: true, text: 'ms / image on T4 (log scale)', color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ...BASE_OPTS.scales.y, title: { display: true, text: 'FID ↓', color: '#64748b' } } } };

  return (
    <ChartCard title="Quality-vs-Cost Pareto" caption="ms/img for DDPM derived as speed.json ddpm100_ms_per_img × steps/100 (linear in steps). Your run marked at nearest measured configuration." chartRef={ref}>
      <Suspense fallback={null}><LazyScatter ref={ref} data={{ datasets }} options={opts} /></Suspense>
    </ChartCard>
  );
}

// ── (d) Precision-vs-Recall scatter with annotations ─────────────────────────
export function PrecRecallScatter({ prdc }) {
  const ref = useRef(null);
  if (!prdc?.vae?.precision?.mean) return <PendingBox message="pending: run Kaggle 'grids' pipeline" />;

  const models = [
    { key: 'vae', label: 'β-VAE', p: prdc.vae.precision, r: prdc.vae.recall, col: COLORS.vae.point },
    { key: 'wgan', label: 'WGAN-GP (mode collapse)', p: prdc.wgan.precision, r: prdc.wgan.recall, col: COLORS.wgan.point },
    { key: 'ddpm', label: 'DDPM', p: prdc.ddpm.precision, r: prdc.ddpm.recall, col: COLORS.ddpm.point },
  ];

  const datasets = models.map(m => ({
    label: m.label,
    data: [{ x: m.r.mean, y: m.p.mean }],
    backgroundColor: m.col,
    pointRadius: 10,
    pointStyle: m.key === 'wgan' ? 'triangle' : 'circle',
  }));

  const opts = { ...BASE_OPTS, scales: { x: { ...BASE_OPTS.scales.x, title: { display: true, text: 'Recall ↑', color: '#64748b' }, min: -0.05, max: 1 }, y: { ...BASE_OPTS.scales.y, title: { display: true, text: 'Precision ↑', color: '#64748b' }, min: 0, max: 1 } } };

  return (
    <ChartCard title="Precision vs Recall" caption="Error bars represent ±std across evaluation seeds. WGAN-GP recall ≈ 0.00 indicates mode collapse." chartRef={ref}>
      <Suspense fallback={null}><LazyScatter ref={ref} data={{ datasets }} options={opts} /></Suspense>
    </ChartCard>
  );
}

// ── (e) Per-seed FID strip plot ──────────────────────────────────────────────
export function PerSeedFid({ prdc }) {
  const ref = useRef(null);
  const ddpmSeeds = prdc?.ddpm?.fid?.per_seed || (prdc?.ddpm?.fid?.mean ? [prdc.ddpm.fid.mean] : null);
  const vaeSeeds  = prdc?.vae?.fid?.per_seed;
  const wganSeeds = prdc?.wgan?.fid?.per_seed;

  if (!vaeSeeds && !ddpmSeeds) return <PendingBox message="pending: per_seed FID values from prdc.json" />;

  const datasets = [
    ...(vaeSeeds ? [{
      label: `β-VAE FID (mean ${CANONICAL_METRICS.vae.fid})`,
      data: vaeSeeds.map((v, i) => ({ x: i + 1, y: v })),
      borderColor: COLORS.vae.line,
      backgroundColor: COLORS.vae.point,
      pointRadius: 7,
      showLine: false,
    }] : []),
    ...(wganSeeds ? [{
      label: `WGAN-GP FID (mean ${CANONICAL_METRICS.wgan.fid})`,
      data: wganSeeds.map((v, i) => ({ x: i + 1, y: v })),
      borderColor: COLORS.wgan.line,
      backgroundColor: COLORS.wgan.point,
      pointRadius: 7,
      showLine: false,
    }] : []),
    ...(ddpmSeeds ? [{
      label: `DDPM FID (${CANONICAL_METRICS.ddpm.fid}, evaluated seed 42)`,
      data: ddpmSeeds.map((v, i) => ({ x: i + 1, y: v })),
      borderColor: COLORS.ddpm.line,
      backgroundColor: COLORS.ddpm.point,
      pointRadius: 9,
      pointStyle: 'rectRot',
      showLine: false,
    }] : []),
  ];

  const opts = {
    ...BASE_OPTS,
    scales: {
      x: {
        ...BASE_OPTS.scales.x,
        type: 'linear',
        min: 0.5,
        max: 5.5,
        ticks: {
          stepSize: 1,
          callback: (val) => {
            const seedNames = { 1: 'Seed 42', 2: 'Seed 123', 3: 'Seed 256', 4: 'Seed 512', 5: 'Seed 999' };
            return seedNames[val] || '';
          },
          color: '#94a3b8',
        },
        title: { display: true, text: 'Evaluation Random Seed', color: '#64748b' },
      },
      y: { ...BASE_OPTS.scales.y, title: { display: true, text: 'FID ↓', color: '#64748b' } },
    },
  };

  return (
    <ChartCard
      title="Per-Seed FID Strip Plot"
      caption="Points show individual evaluation seeds (N=5,000 per seed). β-VAE and WGAN-GP across 5 seeds; DDPM evaluated at seed 42."
      chartRef={ref}
    >
      <Suspense fallback={null}><LazyScatter ref={ref} data={{ datasets }} options={opts} /></Suspense>
    </ChartCard>
  );
}

// ── (f) Downstream bar chart ──────────────────────────────────────────────────
export function DownstreamChart() {
  const ref = useRef(null);
  const { data: jsonData } = useJsonData('/results/downstream_v2.json');
  const results = jsonData?.results ?? DOWNSTREAM_FINAL.metrics;

  const ORDERED_KEYS = ['real_full_50k', 'real_full_plus_synth', 'real_1000pc_only', 'real_500pc_plus_synth', 'real_500pc_only', 'synthetic_only_500pc'];
  const LABELS_MAP = {
    real_full_50k: 'Real 50k',
    real_full_plus_synth: 'Real 50k + Synth 5k',
    real_1000pc_only: 'Real 1k/cls',
    real_500pc_plus_synth: '500 Real + Synth★',
    real_500pc_only: 'Real 500/cls',
    synthetic_only_500pc: 'Synth Only',
  };
  const BG_MAP = {
    real_full_50k: 'rgba(52,211,153,0.75)',
    real_full_plus_synth: 'rgba(52,211,153,0.5)',
    real_1000pc_only: 'rgba(167,139,250,0.75)',
    real_500pc_plus_synth: 'rgba(34,211,238,0.85)',
    real_500pc_only: 'rgba(148,163,184,0.5)',
    synthetic_only_500pc: 'rgba(148,163,184,0.35)',
  };

  const entries = ORDERED_KEYS.filter(k => results[k]);
  const data = {
    labels: entries.map(k => LABELS_MAP[k]),
    datasets: [{
      label: 'ResNet-18 Accuracy (%)',
      data: entries.map(k => results[k].mean),
      backgroundColor: entries.map(k => BG_MAP[k]),
      borderColor: entries.map(k => BG_MAP[k].replace('0.', '1')),
      borderWidth: 1.5, borderRadius: 6,
    }],
  };
  const opts = { ...BASE_OPTS, scales: { ...BASE_OPTS.scales, y: { ...BASE_OPTS.scales.y, min: 65, max: 100, title: { display: true, text: 'Test Accuracy (%)', color: '#64748b' } }, x: { ...BASE_OPTS.scales.x, title: { display: true, text: 'Training Condition', color: '#64748b' } } } };

  return (
    <ChartCard title="Downstream ResNet-18 Accuracy" caption="★ +4.38% gain in low-data setting (p=0.030). Full-data gain +0.54% is NOT significant (p=0.13). Never claim synthetic = real. 3 seeds, ResNet-18, CIFAR-10." chartRef={ref}>
      <Suspense fallback={null}><LazyBar ref={ref} data={data} options={opts} /></Suspense>
    </ChartCard>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function OutputsTab2Plots({ lastRun, studioSliders }) {
  const { data: sweeps } = useJsonData('/data/json/sweeps.json');
  const { data: speed }  = useJsonData('/data/json/speed.json');
  const { data: prdc }   = useJsonData('/data/json/prdc.json');

  return (
    <div className="space-y-6">
      <FidVsSteps sweeps={sweeps} />
      <MetricsVsGuidance sweeps={sweeps} />
      <ParetoChart sweeps={sweeps} speed={speed} prdc={prdc} lastRun={lastRun} />
      <PrecRecallScatter prdc={prdc} />
      <PerSeedFid prdc={prdc} />
      <DownstreamChart />
    </div>
  );
}
