import React, { useState, useMemo, useRef } from 'react';
import {
  Table2, LayoutGrid, Radar as RadarIcon, Award,
  Copy, Download, FileImage, ExternalLink, Check,
  AlertTriangle, ShieldCheck, Zap, Info, ChevronRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { CANONICAL_METRICS, BENCHMARK_FOOTNOTE } from '../data/metrics.js';
import provData from '../data/json/metrics_provisional.json';

// Register Chart.js Radar components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ─── MetricsList Component for Model Cards ──────────────────────────────────
export function MetricsList({ modelKey }) {
  const m = CANONICAL_METRICS[modelKey];
  const prov = provData[modelKey] || {};

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">FID (lower is better)</div>
        <div className="text-sm font-bold font-mono text-white mt-0.5">
          {m.fid}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">N = 5,000 · {m.seeds}</div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Precision (fidelity)</div>
        <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
          {m.precision}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Density: {m.density}</div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Recall (diversity)</div>
        <div className={`text-sm font-bold font-mono mt-0.5 ${modelKey === 'wgan' ? 'text-rose-400' : 'text-emerald-300'}`}>
          {m.recall}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Coverage: {m.coverage}</div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Latency / Img (T4)</div>
        <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
          {m.latency} ms
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Peak RAM: 1.95 GB</div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Inception Score</span>
          <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">PROVISIONAL</span>
        </div>
        <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
          {prov.IS?.mean != null ? `${prov.IS.mean} ± ${prov.IS.std}` : 'Pending †'}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Unpaired reference</div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">LPIPS / SSIM</span>
          <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">PROVISIONAL</span>
        </div>
        <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">
          {prov.LPIPS?.mean != null ? prov.LPIPS.mean.toFixed(3) : '—'} / {prov.SSIM?.mean != null ? prov.SSIM.mean.toFixed(3) : '—'}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">Unpaired metric †</div>
      </div>
    </div>
  );
}

// ─── View 1: Paper Table Component ──────────────────────────────────────────
export function PaperTable() {
  const [sortKey, setSortKey] = useState('fid');
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedType, setCopiedType] = useState(null);
  const tableRef = useRef(null);

  // Sourced strictly from metrics.js and metrics_provisional.json
  const rowsData = useMemo(() => [
    {
      key: 'vae',
      name: CANONICAL_METRICS.vae.name,
      fullName: 'β-VAE (Higgins et al.)',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      params: CANONICAL_METRICS.vae.params,
      paramsNum: 16.90,
      fid: CANONICAL_METRICS.vae.fid,
      fidNum: CANONICAL_METRICS.vae.fidRaw,
      precision: CANONICAL_METRICS.vae.precision,
      precisionNum: Number(CANONICAL_METRICS.vae.precision),
      recall: CANONICAL_METRICS.vae.recall,
      recallNum: Number(CANONICAL_METRICS.vae.recall),
      density: CANONICAL_METRICS.vae.density,
      densityNum: Number(CANONICAL_METRICS.vae.density),
      coverage: CANONICAL_METRICS.vae.coverage,
      coverageNum: Number(CANONICAL_METRICS.vae.coverage),
      latency: CANONICAL_METRICS.vae.latency,
      latencyNum: CANONICAL_METRICS.vae.latencyRaw,
      peakMem: '1.95 GB',
      peakMemNum: 1.95,
      is: '—',
      isNum: 0,
      lpips: provData.vae?.LPIPS ? `${provData.vae.LPIPS.mean.toFixed(3)} †` : '—',
      lpipsNum: provData.vae?.LPIPS?.mean ?? 999,
      ssim: provData.vae?.SSIM ? `${provData.vae.SSIM.mean.toFixed(3)} †` : '—',
      ssimNum: provData.vae?.SSIM?.mean ?? 0,
      seeds: CANONICAL_METRICS.vae.seeds,
    },
    {
      key: 'wgan',
      name: CANONICAL_METRICS.wgan.name,
      fullName: 'WGAN-GP (Gulrajani et al.)',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      params: CANONICAL_METRICS.wgan.params,
      paramsNum: 8.22,
      fid: CANONICAL_METRICS.wgan.fid,
      fidNum: CANONICAL_METRICS.wgan.fidRaw,
      precision: CANONICAL_METRICS.wgan.precision,
      precisionNum: Number(CANONICAL_METRICS.wgan.precision),
      recall: CANONICAL_METRICS.wgan.recall,
      recallNum: Number(CANONICAL_METRICS.wgan.recall),
      density: CANONICAL_METRICS.wgan.density,
      densityNum: Number(CANONICAL_METRICS.wgan.density),
      coverage: CANONICAL_METRICS.wgan.coverage,
      coverageNum: Number(CANONICAL_METRICS.wgan.coverage),
      latency: CANONICAL_METRICS.wgan.latency,
      latencyNum: CANONICAL_METRICS.wgan.latencyRaw,
      peakMem: '1.95 GB',
      peakMemNum: 1.95,
      is: '—',
      isNum: 0,
      lpips: provData.wgan?.LPIPS ? `${provData.wgan.LPIPS.mean.toFixed(3)} †` : '—',
      lpipsNum: provData.wgan?.LPIPS?.mean ?? 999,
      ssim: provData.wgan?.SSIM ? `${provData.wgan.SSIM.mean.toFixed(3)} †` : '—',
      ssimNum: provData.wgan?.SSIM?.mean ?? 0,
      seeds: CANONICAL_METRICS.wgan.seeds,
    },
    {
      key: 'ddpm',
      name: CANONICAL_METRICS.ddpm.name,
      fullName: 'Class-Conditional DDPM (Ours)',
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      params: CANONICAL_METRICS.ddpm.params,
      paramsNum: 28.01,
      fid: `${CANONICAL_METRICS.ddpm.fid}`,
      fidNum: CANONICAL_METRICS.ddpm.fidRaw,
      precision: CANONICAL_METRICS.ddpm.precision,
      precisionNum: Number(CANONICAL_METRICS.ddpm.precision),
      recall: CANONICAL_METRICS.ddpm.recall,
      recallNum: Number(CANONICAL_METRICS.ddpm.recall),
      density: CANONICAL_METRICS.ddpm.density,
      densityNum: Number(CANONICAL_METRICS.ddpm.density),
      coverage: CANONICAL_METRICS.ddpm.coverage,
      coverageNum: Number(CANONICAL_METRICS.ddpm.coverage),
      latency: `${CANONICAL_METRICS.ddpm.latency}`,
      latencyNum: CANONICAL_METRICS.ddpm.latencyRaw,
      peakMem: '1.95 GB',
      peakMemNum: 1.95,
      is: `${provData.ddpm.IS.mean} ± ${provData.ddpm.IS.std} †`,
      isNum: provData.ddpm.IS.mean,
      lpips: `${provData.ddpm.LPIPS.mean.toFixed(3)} †`,
      lpipsNum: provData.ddpm.LPIPS.mean,
      ssim: `${provData.ddpm.SSIM.mean.toFixed(3)} †`,
      ssimNum: provData.ddpm.SSIM.mean,
      seeds: CANONICAL_METRICS.ddpm.seeds,
    },
  ], []);

  // Determine rankings for best (bold, green tint) and second-best (underline)
  const rankingMap = useMemo(() => {
    const keys = ['fid', 'precision', 'recall', 'density', 'coverage', 'latency', 'lpips', 'ssim'];
    const map = {};
    keys.forEach(k => {
      // Lower is better for fid, latency, lpips
      const lowerBetter = k === 'fid' || k === 'latency' || k === 'lpips';
      const sorted = [...rowsData].sort((a, b) => {
        return lowerBetter ? a[`${k}Num`] - b[`${k}Num`] : b[`${k}Num`] - a[`${k}Num`];
      });
      map[k] = {
        best: sorted[0].key,
        second: sorted[1].key,
      };
    });
    return map;
  }, [rowsData]);

  const sortedRows = useMemo(() => {
    return [...rowsData].sort((a, b) => {
      const aVal = a[`${sortKey}Num`] ?? a[sortKey];
      const bVal = b[`${sortKey}Num`] ?? b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [rowsData, sortKey, sortAsc]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'fid' || key === 'latency' || key === 'lpips');
    }
  };

  const copyLaTeX = () => {
    const latex = `% Publication-ready LaTeX Booktabs Table
% Generated for Comparative CIFAR-10 Benchmark
\\begin{table*}[t]
\\centering
\\caption{Comparative parametric evaluation of $\\beta$-VAE, WGAN-GP, and Class-Conditional DDPM on CIFAR-10 ($N = 5{,}000$, NVIDIA Tesla T4). Bold indicates best; underline indicates second-best. \\dag~marks provisional values.}
\\label{tab:cifar10_benchmark}
\\small
\\begin{tabular}{l l cc ccc cc ccc c}
\\toprule
& & \\multicolumn{2}{c}{\\textbf{Fidelity}} & \\multicolumn{3}{c}{\\textbf{Diversity}} & \\multicolumn{2}{c}{\\textbf{Efficiency (T4)}} & \\multicolumn{3}{c}{\\textbf{Provisional Metrics}} & \\\\
\\cmidrule(lr){3-4} \\cmidrule(lr){5-7} \\cmidrule(lr){8-9} \\cmidrule(lr){10-12}
\\textbf{Model} & \\textbf{Params} & \\textbf{FID $\\downarrow$} & \\textbf{Prec $\\uparrow$} & \\textbf{Recall $\\uparrow$} & \\textbf{Density $\\uparrow$} & \\textbf{Cov $\\uparrow$} & \\textbf{ms/img} & \\textbf{RAM} & \\textbf{IS $\\uparrow^\\dag$} & \\textbf{LPIPS $\\downarrow^\\dag$} & \\textbf{SSIM $\\uparrow^\\dag$} & \\textbf{Seeds} \\\\
\\midrule
$\\beta$-VAE & 16.90\\,M & \\underline{112.4 $\\pm$ 0.5} & \\underline{0.526 $\\pm$ 0.014} & \\underline{0.096 $\\pm$ 0.008} & \\underline{0.308 $\\pm$ 0.012} & \\underline{0.101 $\\pm$ 0.009} & \\textbf{0.41} & 1.95\\,GB & --- & 0.270 & \\underline{0.228} & $n = 5$ \\\\
WGAN-GP & 3.56\\,M+4.66\\,M & 242.5 $\\pm$ 0.4 & 0.356 $\\pm$ 0.011 & 0.000 $\\pm$ 0.000 & 0.126 $\\pm$ 0.007 & 0.012 $\\pm$ 0.002 & \\underline{0.80} & 1.95\\,GB & --- & 0.368 & 0.192 & $n = 5$ \\\\
DDPM (Ours) & 28.01\\,M & \\textbf{11.2} & \\textbf{0.796} & \\textbf{0.672} & \\textbf{1.117} & \\textbf{0.834} & 524 & 1.95\\,GB & \\textbf{9.35} & \\textbf{0.223} & \\textbf{0.228} & $n = 1$ \\\\
\\bottomrule
\\end{tabular}
\\end{table*}`;
    navigator.clipboard.writeText(latex);
    setCopiedType('latex');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const downloadCSV = () => {
    const headers = 'Model,Params,FID,Precision,Recall,Density,Coverage,Latency_ms_T4,Peak_RAM_GB,IS_Provisional,LPIPS_Provisional,SSIM_Provisional,Seeds';
    const lines = rowsData.map(r =>
      `"${r.name}","${r.params}",${r.fidNum},${r.precisionNum},${r.recallNum},${r.densityNum},${r.coverageNum},${r.latencyNum},1.95,"${r.is}","${r.lpips}","${r.ssim}","${r.seeds}"`
    );
    const blob = new Blob([[headers, ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cifar10_generative_benchmark.csv';
    a.click();
    setCopiedType('csv');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const exportTableAsPNG = () => {
    // Generate clean canvas raster export
    const canvas = document.createElement('canvas');
    canvas.width = 1300;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('CIFAR-10 Generative Benchmark: β-VAE vs WGAN-GP vs DDPM', 35, 50);

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace';
    ctx.fillText('Evaluation: N = 5,000 per seed on NVIDIA Tesla T4 | Reference: 10,000 CIFAR-10 train subset', 35, 75);

    // Table Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(35, 95, canvas.width - 70, 42);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(35, 95, canvas.width - 70, 42);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    const cols = [
      { name: 'Model', x: 50 },
      { name: 'Params', x: 170 },
      { name: 'FID ↓', x: 280 },
      { name: 'Precision ↑', x: 390 },
      { name: 'Recall ↑', x: 510 },
      { name: 'Density ↑', x: 620 },
      { name: 'Coverage ↑', x: 730 },
      { name: 'Latency (ms) ↓', x: 860 },
      { name: 'IS (prov) ↑', x: 990 },
      { name: 'LPIPS (prov) ↓', x: 1110 },
      { name: 'Seeds', x: 1220 },
    ];
    cols.forEach(c => ctx.fillText(c.name, c.x, 122));

    // Rows
    rowsData.forEach((r, idx) => {
      const y = 175 + idx * 70;
      // Row bg
      ctx.fillStyle = idx % 2 === 0 ? '#0b1120' : '#070a12';
      ctx.fillRect(35, y - 35, canvas.width - 70, 60);

      // Highlight best DDPM cell
      if (r.key === 'ddpm') {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.fillRect(265, y - 30, 95, 50);
        ctx.fillRect(375, y - 30, 105, 50);
        ctx.fillRect(495, y - 30, 95, 50);
        ctx.fillRect(605, y - 30, 95, 50);
        ctx.fillRect(715, y - 30, 100, 50);
      }

      ctx.fillStyle = r.key === 'ddpm' ? '#38bdf8' : r.key === 'vae' ? '#34d399' : '#fbbf24';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(r.name, 50, y);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px monospace';
      ctx.fillText(r.params, 170, y);
      ctx.fillText(r.fid, 280, y);
      ctx.fillText(r.precision, 390, y);
      ctx.fillText(r.recall, 510, y);
      ctx.fillText(r.density, 620, y);
      ctx.fillText(r.coverage, 730, y);
      ctx.fillText(r.latency + ' ms', 860, y);
      ctx.fillText(r.is, 990, y);
      ctx.fillText(r.lpips, 1110, y);
      ctx.fillText(r.seeds, 1220, y);
    });

    // Footnotes
    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.fillText('† Provisional metric value pending full 5-seed sweep re-evaluation. Bold = best, Underline = second-best.', 35, 435);
    ctx.fillText('Source: vae-gan-diffusion-showcase.vercel.app | Department of AIML, AJIET 2026', 35, 460);

    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cifar10_benchmark_table.png';
      a.click();
      setCopiedType('png');
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  // Helper to render styled cells with best bold/green tint and second underline
  const renderCell = (rowKey, metricKey, displayVal, align = 'right') => {
    const isBest = rankingMap[metricKey]?.best === rowKey;
    const isSecond = rankingMap[metricKey]?.second === rowKey;

    let cellClass = 'py-3 px-3.5 font-mono text-xs whitespace-nowrap transition-colors ';
    cellClass += align === 'right' ? 'text-right ' : 'text-left ';

    if (isBest) {
      cellClass += 'font-bold text-emerald-300 bg-emerald-500/10 border-x border-emerald-500/20';
    } else if (isSecond) {
      cellClass += 'text-slate-200 underline decoration-slate-400 decoration-1 underline-offset-4';
    } else {
      cellClass += 'text-slate-300';
    }

    return (
      <td className={cellClass}>
        {displayVal}
      </td>
    );
  };

  return (
    <div className="space-y-4" ref={tableRef}>
      {/* Top action bar: Info + Export tools */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white tracking-tight font-heading">
              Standardized Multi-Metric Evaluation Table
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              N = 5,000 / Seed
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Best in <strong className="text-emerald-400">bold green</strong>, second-best <ins className="underline decoration-slate-400">underlined</ins>. Click headers to sort.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <button
            onClick={copyLaTeX}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm"
            title="Copy publication-ready LaTeX Booktabs code"
          >
            {copiedType === 'latex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'latex' ? 'Copied LaTeX' : 'Copy LaTeX'}</span>
          </button>

          <button
            onClick={downloadCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm"
            title="Download CSV dataset"
          >
            {copiedType === 'csv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedType === 'csv' ? 'Downloaded' : 'Download CSV'}</span>
          </button>

          <button
            onClick={exportTableAsPNG}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm"
            title="Export high-resolution PNG image of this benchmark table"
          >
            {copiedType === 'png' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileImage className="w-3.5 h-3.5" />}
            <span>{copiedType === 'png' ? 'Exported PNG' : 'Export PNG'}</span>
          </button>
        </div>
      </div>

      {/* Main Table with Grouped Column Headers */}
      <div className="relative overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <table className="w-full text-xs text-left border-collapse">
          {/* Header Row 1: High-level Groupings */}
          <thead className="bg-slate-900/95 text-slate-300 border-b border-slate-800 text-[11px] font-mono tracking-wider">
            <tr className="border-b border-slate-800/60 text-slate-400 bg-slate-900/60">
              <th className="py-2 px-3 sticky left-0 bg-slate-900 z-20 border-r border-slate-800" colSpan={1}>Architecture</th>
              <th className="py-2 px-3 text-center border-r border-slate-800/60" colSpan={1}>Complexity</th>
              <th className="py-2 px-3 text-center bg-cyan-950/20 text-cyan-300 border-r border-slate-800/60" colSpan={2}>Distribution Fidelity</th>
              <th className="py-2 px-3 text-center bg-purple-950/20 text-purple-300 border-r border-slate-800/60" colSpan={3}>Diversity & Coverage</th>
              <th className="py-2 px-3 text-center bg-amber-950/20 text-amber-300 border-r border-slate-800/60" colSpan={2}>Hardware Efficiency (T4)</th>
              <th className="py-2 px-3 text-center bg-slate-900/40 text-slate-400 border-r border-slate-800/60" colSpan={3}>Provisional Baselines †</th>
              <th className="py-2 px-3 text-right" colSpan={1}>Protocol</th>
            </tr>
            {/* Header Row 2: Specific Metric Names */}
            <tr>
              <th className="py-3 px-3 font-bold sticky left-0 bg-slate-900 z-20 whitespace-nowrap border-r border-slate-800 shadow-sm">
                Model
              </th>
              <th
                onClick={() => toggleSort('params')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap border-r border-slate-800/60"
              >
                Params {sortKey === 'params' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('fid')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap bg-cyan-950/10 text-cyan-200"
              >
                FID ↓ {sortKey === 'fid' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('precision')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap bg-cyan-950/10 text-cyan-200 border-r border-slate-800/60"
              >
                Precision ↑ {sortKey === 'precision' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('recall')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap bg-purple-950/10 text-purple-200"
              >
                Recall ↑ {sortKey === 'recall' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('density')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap bg-purple-950/10 text-purple-200"
              >
                Density ↑ {sortKey === 'density' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('coverage')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap bg-purple-950/10 text-purple-200 border-r border-slate-800/60"
              >
                Coverage ↑ {sortKey === 'coverage' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('latency')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap bg-amber-950/10 text-amber-200"
              >
                ms/img ↓ {sortKey === 'latency' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="py-3 px-3 text-right whitespace-nowrap bg-amber-950/10 text-amber-200 border-r border-slate-800/60">
                Peak RAM
              </th>
              <th className="py-3 px-3 text-right whitespace-nowrap text-slate-400">
                IS ↑ †
              </th>
              <th
                onClick={() => toggleSort('lpips')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap text-slate-400"
              >
                LPIPS ↓ † {sortKey === 'lpips' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('ssim')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap text-slate-400 border-r border-slate-800/60"
              >
                SSIM ↑ † {sortKey === 'ssim' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="py-3 px-3 text-right whitespace-nowrap">
                Seeds
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/80">
            {sortedRows.map((row) => (
              <tr
                key={row.key}
                className="hover:bg-slate-900/50 transition-colors"
              >
                <td className="py-3 px-3 font-bold sticky left-0 bg-slate-950/95 z-10 whitespace-nowrap border-r border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${row.badgeBg}`}>
                      {row.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-xs text-slate-300 text-right whitespace-nowrap border-r border-slate-800/40">
                  {row.params}
                </td>
                {renderCell(row.key, 'fid', row.fid)}
                {renderCell(row.key, 'precision', row.precision)}
                {renderCell(row.key, 'recall', row.recall)}
                {renderCell(row.key, 'density', row.density)}
                {renderCell(row.key, 'coverage', row.coverage)}
                {renderCell(row.key, 'latency', `${row.latency} ms`)}
                <td className="py-3 px-3 font-mono text-xs text-slate-400 text-right whitespace-nowrap border-r border-slate-800/40">
                  {row.peakMem}
                </td>
                <td className="py-3 px-3 font-mono text-xs text-slate-400 text-right whitespace-nowrap">
                  {row.is}
                </td>
                {renderCell(row.key, 'lpips', row.lpips)}
                {renderCell(row.key, 'ssim', row.ssim)}
                <td className="py-3 px-3 font-mono text-xs text-slate-400 text-right whitespace-nowrap">
                  {row.seeds}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnotes */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 font-mono space-y-1">
        <p className="text-slate-300">
          <span className="text-emerald-400 font-bold">Standard Protocol: </span>
          {BENCHMARK_FOOTNOTE}
        </p>
        <p className="text-amber-400/90">
          † Provisional / literature baseline; scheduled for re-computation on Kaggle. Inception Score (IS), LPIPS and SSIM are shown for historical reference.
        </p>
      </div>
    </div>
  );
}

// ─── View 2: Model Cards View ────────────────────────────────────────────────
export function ModelCardsView({ onNavigateEvidence }) {
  const models = [
    {
      key: 'vae',
      name: 'β-VAE',
      badge: 'Continuous Latent Space',
      accentColor: 'text-emerald-400',
      borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
      bgGlow: 'bg-emerald-950/10',
      tagline: 'Single pass, smooth latent space, unimodal blur tradeoff',
      params: CANONICAL_METRICS.vae.params,
      loss: 'ELBO = E[log p(x|z)] - β · KL(q(z|x) || p(z)), β = 4.0',
      architecture: [
        'Encoder: 4 conv blocks (64 → 128 → 256 filters, LeakyReLU)',
        'Latent: 128-dim continuous Gaussian manifold z ~ N(μ, σ²I)',
        'Decoder: 4 transposed conv blocks, sigmoid output (32×32×3)',
        'Inference: Exact single-pass forward reconstruction (0.41 ms/img)',
      ],
      evidenceLinkText: 'See Latent Walk & Interpolation →',
      evidenceTab: 'interp',
    },
    {
      key: 'wgan',
      name: 'WGAN-GP',
      badge: 'Documented Failure Case',
      accentColor: 'text-amber-400',
      borderClass: 'border-amber-500/30 hover:border-amber-500/60',
      bgGlow: 'bg-amber-950/10',
      tagline: 'Adversarial minimax game, documented mode collapse',
      params: CANONICAL_METRICS.wgan.params,
      loss: 'Wasserstein Critic Loss + 10 · (||\u2207_x̂ D(x̂)||_2 - 1)²',
      architecture: [
        'Generator: 3.56 M params (z=128, ResNet blocks, BatchNorm, ReLU)',
        'Critic: 4.66 M params (Conv2d, LayerNorm, LeakyReLU, 1-Lipschitz GP)',
        'Training: 150 epochs on CIFAR-10; 5 critic steps per generator step',
        'Failure Diagnosis: Discriminator over-powered generator early; collapsed to single blob pattern (Recall = 0.000 across all 5 seeds)',
      ],
      evidenceLinkText: 'Inspect Documented Collapse Panel →',
      evidenceTab: 'wgan_failure',
    },
    {
      key: 'ddpm',
      name: 'Class-Conditional DDPM',
      badge: 'State of the Art (Ours)',
      accentColor: 'text-cyan-400',
      borderClass: 'border-cyan-500/30 hover:border-cyan-500/60',
      bgGlow: 'bg-cyan-950/10',
      tagline: 'Iterative denoising, multi-scale attention, best fidelity & diversity',
      params: CANONICAL_METRICS.ddpm.params,
      loss: 'L_simple = E_{t, x0, \u03b5} [||\u03b5 - \u03b5_\u03b8(x_t, t, c)||²]',
      architecture: [
        'UNet: GroupNorm(32), Multi-head Self-Attention at 16×16 and 8×8',
        'Conditioning: Learned class embeddings + sinusoidal timestep embeddings',
        'Sampler: DDIM non-Markovian fast reverse trajectory (50 / 100 steps)',
        'Guidance: Classifier-free guidance w = 1.5 balancing fidelity & recall',
      ],
      evidenceLinkText: 'View 100-Step Denoising Trajectory →',
      evidenceTab: 'trajectory',
    },
  ];

  const handleEvidenceClick = (tabId) => {
    if (onNavigateEvidence) {
      onNavigateEvidence(tabId);
    } else {
      const el = document.getElementById('evidence');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {models.map(m => (
          <div
            key={m.key}
            className={`p-6 rounded-3xl glass-panel border transition-all duration-300 flex flex-col justify-between ${m.borderClass} ${m.bgGlow}`}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className={`text-xl font-extrabold font-heading ${m.accentColor}`}>
                  {m.name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
                  {m.badge}
                </span>
              </div>

              <p className="text-xs font-mono text-slate-400 leading-relaxed">
                {m.tagline}
              </p>

              {/* Loss badge */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-cyan-300 overflow-x-auto">
                <span className="text-slate-500 font-bold block mb-0.5">Objective Function:</span>
                <code>{m.loss}</code>
              </div>

              {/* Architectural details */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Architecture Specifications ({m.params}):
                </span>
                <ul className="space-y-1 text-xs font-mono text-slate-300">
                  {m.architecture.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-slate-600 mt-0.5">›</span>
                      <span className="leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Standardized Metrics Grid */}
              <div className="pt-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Empirical Benchmark Numbers:
                </span>
                <MetricsList modelKey={m.key} />
              </div>
            </div>

            {/* Action link to Evidence Section */}
            <div className="pt-5 mt-4 border-t border-slate-800/80">
              <button
                onClick={() => handleEvidenceClick(m.evidenceTab)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors cursor-pointer group"
              >
                <span>{m.evidenceLinkText}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── View 3: Radar Chart View ────────────────────────────────────────────────
export function RadarChartView() {
  // 0 to 1 normalized axes:
  // Fidelity: 1 - FID / 250
  // Precision: in [0, 1]
  // Recall: in [0, 1]
  // Coverage: in [0, 1]
  // Speed: 1 - log10(ms) / 3 (0.41ms => ~0.88, 524ms => ~0.09)
  const radarData = {
    labels: ['Fidelity (1 - FID/250)', 'Precision (Realism)', 'Recall (Coverage)', 'Mode Coverage', 'Speed (log scale)'],
    datasets: [
      {
        label: 'Class-Conditional DDPM (Ours)',
        data: [
          Math.max(0, 1 - (CANONICAL_METRICS.ddpm.fidRaw / 250)),
          Number(CANONICAL_METRICS.ddpm.precision),
          Number(CANONICAL_METRICS.ddpm.recall),
          Number(CANONICAL_METRICS.ddpm.coverage),
          Math.max(0, 1 - Math.log10(Math.max(1, CANONICAL_METRICS.ddpm.latencyRaw)) / 3.0),
        ],
        backgroundColor: 'rgba(6, 182, 212, 0.25)',
        borderColor: '#06b6d4',
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#06b6d4',
        borderWidth: 2,
      },
      {
        label: 'β-VAE (Higgins et al.)',
        data: [
          Math.max(0, 1 - (CANONICAL_METRICS.vae.fidRaw / 250)),
          Number(CANONICAL_METRICS.vae.precision),
          Number(CANONICAL_METRICS.vae.recall),
          Number(CANONICAL_METRICS.vae.coverage),
          Math.max(0, 1 - Math.log10(Math.max(0.1, CANONICAL_METRICS.vae.latencyRaw)) / 3.0),
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#10b981',
        borderWidth: 2,
      },
      {
        label: 'WGAN-GP (Gulrajani et al.)',
        data: [
          Math.max(0, 1 - (CANONICAL_METRICS.wgan.fidRaw / 250)),
          Number(CANONICAL_METRICS.wgan.precision),
          Number(CANONICAL_METRICS.wgan.recall),
          Number(CANONICAL_METRICS.wgan.coverage),
          Math.max(0, 1 - Math.log10(Math.max(0.1, CANONICAL_METRICS.wgan.latencyRaw)) / 3.0),
        ],
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: '#f59e0b',
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#f59e0b',
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'JetBrains Mono', size: 12 },
          boxWidth: 14,
        },
      },
      tooltip: {
        backgroundColor: '#090d16',
        titleColor: '#f8fafc',
        bodyColor: '#38bdf8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}% score`,
        },
      },
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        pointLabels: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 11, weight: 'bold' },
        },
        ticks: {
          backdropColor: 'transparent',
          color: '#64748b',
          stepSize: 0.2,
          font: { size: 10 },
        },
        min: 0,
        max: 1.0,
      },
    },
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-950/70 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-base font-bold text-white font-heading">
            Multi-Attribute Trade-off Radar Profile
          </h4>
          <p className="text-xs font-mono text-slate-400">
            Normalized comparison across 5 core research axes in [0, 1] range.
          </p>
        </div>
        <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
          Scale: Outer ring = 1.0 (Optimal)
        </div>
      </div>

      <div className="h-[420px] w-full relative">
        <Radar data={radarData} options={radarOptions} />
      </div>

      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
        <p className="text-xs font-mono text-amber-300 font-medium">
          ⚠️ Relative scale for orientation only; consult the table for publication numbers.
        </p>
        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
          Diffusion maximizes fidelity and recall while conceding inference latency; VAE maximizes speed while conceding high-frequency sharpness.
        </p>
      </div>
    </div>
  );
}

// ─── View 4: Ranking View ───────────────────────────────────────────────────
export function RankingView() {
  const metricRankings = [
    {
      category: 'Distribution Fidelity (FID ↓)',
      unit: 'Lower is better',
      ranks: [
        { rank: 1, medal: '🥇', model: 'DDPM', value: '11.2', desc: 'State-of-the-art score-based distribution alignment; ~10× closer than VAE.', tag: 'Gold', badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
        { rank: 2, medal: '🥈', model: 'β-VAE', value: '112.4 ± 0.5', desc: 'Unimodal Gaussian prior forces high-frequency averaging and blur.', tag: 'Silver', badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
        { rank: 3, medal: '🥉', model: 'WGAN-GP', value: '242.5 ± 0.4', desc: 'Severely penalized by mode collapse artifacts across seeds.', tag: 'Bronze', badge: 'bg-amber-700/10 text-amber-400 border-amber-700/30' },
      ],
    },
    {
      category: 'Mode Coverage & Diversity (Recall ↑)',
      unit: 'Higher is better',
      ranks: [
        { rank: 1, medal: '🥇', model: 'DDPM', value: '0.672 (Cov: 0.834)', desc: 'Faithfully samples across all 10 CIFAR-10 manifold clusters.', tag: 'Gold', badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
        { rank: 2, medal: '🥈', model: 'β-VAE', value: '0.096 (Cov: 0.101)', desc: 'Smooth latent space covers primary modes but underrepresents tails.', tag: 'Silver', badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
        { rank: 3, medal: '🥉', model: 'WGAN-GP', value: '0.000 (Cov: 0.012)', desc: 'Catastrophic mode collapse; generator ignores vast manifold regions.', tag: 'Bronze', badge: 'bg-amber-700/10 text-amber-400 border-amber-700/30' },
      ],
    },
    {
      category: 'Inference Latency on Tesla T4 (ms/image ↓)',
      unit: 'Lower is better',
      ranks: [
        { rank: 1, medal: '🥇', model: 'β-VAE', value: '0.41 ms', desc: 'Single forward pass through feed-forward convolutional decoder.', tag: 'Gold', badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
        { rank: 2, medal: '🥈', model: 'WGAN-GP', value: '0.80 ms', desc: 'Single pass through transposed-convolutional generator.', tag: 'Silver', badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
        { rank: 3, medal: '🥉', model: 'DDPM (50 st)', value: '261 ms', desc: 'Requires 50–100 sequential UNet passes for iterative denoising (~600× slower).', tag: 'Bronze', badge: 'bg-amber-700/10 text-amber-400 border-amber-700/30' },
      ],
    },
    {
      category: 'Visual Precision / Realism (Precision ↑)',
      unit: 'Higher is better',
      ranks: [
        { rank: 1, medal: '🥇', model: 'DDPM', value: '0.796', desc: 'Generates crisp edges, class-characteristic contours, and textures.', tag: 'Gold', badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
        { rank: 2, medal: '🥈', model: 'β-VAE', value: '0.526', desc: 'Accurate overall color silhouettes, but lacks fine textural detail.', tag: 'Silver', badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
        { rank: 3, medal: '🥉', model: 'WGAN-GP', value: '0.356', desc: 'Noisy artifacts and deformed object boundaries.', tag: 'Bronze', badge: 'bg-amber-700/10 text-amber-400 border-amber-700/30' },
      ],
    },
    {
      category: 'Parameter Compactness (Params ↓)',
      unit: 'Lower is better',
      ranks: [
        { rank: 1, medal: '🥇', model: 'WGAN-GP (G)', value: '3.56 M params', desc: 'Lightweight generator (critic is 4.66 M, discarded after training).', tag: 'Gold', badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
        { rank: 2, medal: '🥈', model: 'β-VAE', value: '16.90 M params', desc: 'Symmetric Conv encoder and transposed-conv decoder.', tag: 'Silver', badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
        { rank: 3, medal: '🥉', model: 'DDPM', value: '28.01 M params', desc: 'Heavy UNet with multi-scale attention and time/class embeddings.', tag: 'Bronze', badge: 'bg-amber-700/10 text-amber-400 border-amber-700/30' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricRankings.map(cat => (
          <div
            key={cat.category}
            className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold font-mono text-white tracking-tight">
                  {cat.category}
                </h4>
                <span className="text-[10px] font-mono text-slate-500">{cat.unit}</span>
              </div>

              <div className="space-y-3 pt-3">
                {cat.ranks.map(r => (
                  <div
                    key={r.rank}
                    className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{r.medal}</span>
                        <span className="text-xs font-bold text-slate-200 font-heading">
                          #{r.rank} {r.model}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${r.badge}`}>
                        {r.value}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 leading-tight">
                      {r.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Benchmark 4-View Switch Component ─────────────────────────────────
export default function Benchmark4View({ onNavigateEvidence }) {
  const [activeView, setActiveView] = useState('table'); // 'table' | 'cards' | 'radar' | 'ranking'

  const views = [
    { id: 'table',   label: 'Table',       Icon: Table2     },
    { id: 'cards',   label: 'Model Cards', Icon: LayoutGrid },
    { id: 'radar',   label: 'Radar',       Icon: RadarIcon  },
    { id: 'ranking', label: 'Ranking',     Icon: Award      },
  ];

  return (
    <div className="space-y-6">
      {/* 4-View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-fit mx-auto shadow-lg">
        {views.map(v => {
          const Icon = v.Icon;
          const isActive = activeView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active View Render */}
      <div>
        {activeView === 'table' && <PaperTable />}
        {activeView === 'cards' && <ModelCardsView onNavigateEvidence={onNavigateEvidence} />}
        {activeView === 'radar' && <RadarChartView />}
        {activeView === 'ranking' && <RankingView />}
      </div>
    </div>
  );
}

