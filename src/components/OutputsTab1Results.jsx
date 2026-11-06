import React, { useState, useMemo } from 'react';
import { AlertTriangle, Copy, Download, BookOpen, ChevronDown, ChevronUp, ArrowUpDown, Check } from 'lucide-react';
import useJsonData from '../hooks/useJsonData.js';
import { CANONICAL_METRICS } from '../data/metrics.js';
import {
  ParetoChart,
  PrecRecallScatter,
  PerSeedFid,
  FidVsSteps,
  MetricsVsGuidance,
  DownstreamChart,
} from './OutputsTab2Plots.jsx';

// ─── Cell helper ─────────────────────────────────────────────────────────────
function TableCell({ value, bold = false, align = 'right' }) {
  const isMissing = value === null || value === undefined || value === '—';
  return (
    <td
      className={`py-3 px-4 font-mono text-xs tabular-nums whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {isMissing ? (
        <span
          className="text-slate-600 cursor-help"
          title="not measured in this sweep"
        >
          —
        </span>
      ) : (
        <span className={bold ? 'font-bold text-cyan-300' : 'text-slate-200'}>
          {value}
        </span>
      )}
    </td>
  );
}

// ─── Main Paper-Style Benchmark Table ─────────────────────────────────────────
export function PaperBenchmarkTable() {
  const [sortKey, setSortKey] = useState('fid');
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedType, setCopiedType] = useState(null);

  const rawRows = useMemo(() => [
    {
      key: 'vae',
      name: CANONICAL_METRICS.vae.name,
      color: 'text-emerald-400',
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
      latencyNum: Number(CANONICAL_METRICS.vae.latencyRaw),
      seeds: CANONICAL_METRICS.vae.seeds,
    },
    {
      key: 'wgan',
      name: CANONICAL_METRICS.wgan.name,
      color: 'text-amber-400',
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
      latencyNum: Number(CANONICAL_METRICS.wgan.latencyRaw),
      seeds: CANONICAL_METRICS.wgan.seeds,
    },
    {
      key: 'ddpm',
      name: CANONICAL_METRICS.ddpm.name,
      color: 'text-cyan-400',
      params: CANONICAL_METRICS.ddpm.params,
      paramsNum: 28.01,
      fid: CANONICAL_METRICS.ddpm.fid,
      fidNum: CANONICAL_METRICS.ddpm.fidRaw,
      precision: CANONICAL_METRICS.ddpm.precision,
      precisionNum: Number(CANONICAL_METRICS.ddpm.precision),
      recall: CANONICAL_METRICS.ddpm.recall,
      recallNum: Number(CANONICAL_METRICS.ddpm.recall),
      density: CANONICAL_METRICS.ddpm.density,
      densityNum: Number(CANONICAL_METRICS.ddpm.density),
      coverage: CANONICAL_METRICS.ddpm.coverage,
      coverageNum: Number(CANONICAL_METRICS.ddpm.coverage),
      latency: CANONICAL_METRICS.ddpm.latency,
      latencyNum: Number(CANONICAL_METRICS.ddpm.latencyRaw),
      seeds: CANONICAL_METRICS.ddpm.seeds,
      isBest: true,
    },
  ], []);

  const sortedRows = useMemo(() => {
    return [...rawRows].sort((a, b) => {
      const aVal = a[`${sortKey}Num`] ?? a[sortKey];
      const bVal = b[`${sortKey}Num`] ?? b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [rawRows, sortKey, sortAsc]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'fid' || key === 'latency'); // lower is better default
    }
  };

  const copyLaTeX = () => {
    const latex = `\\begin{table}[htbp]
\\centering
\\caption{Comparative evaluation on CIFAR-10 ($N = 5{,}000$, 10k real reference subset, NVIDIA Tesla T4).}
\\label{tab:cifar10_benchmark}
\\begin{tabular}{lcccccccc}
\\toprule
\\textbf{Model} & \\textbf{Params} & \\textbf{FID $\\downarrow$} & \\textbf{Precision $\\uparrow$} & \\textbf{Recall $\\uparrow$} & \\textbf{Density $\\uparrow$} & \\textbf{Coverage $\\uparrow$} & \\textbf{ms/image (T4)} & \\textbf{Seeds} \\\\
\\midrule
$\\beta$-VAE & ${CANONICAL_METRICS.vae.params} & ${CANONICAL_METRICS.vae.fid} & ${CANONICAL_METRICS.vae.precision} & ${CANONICAL_METRICS.vae.recall} & ${CANONICAL_METRICS.vae.density} & ${CANONICAL_METRICS.vae.coverage} & ${CANONICAL_METRICS.vae.latency} & ${CANONICAL_METRICS.vae.seeds} \\\\
WGAN-GP & ${CANONICAL_METRICS.wgan.params} & ${CANONICAL_METRICS.wgan.fid} & ${CANONICAL_METRICS.wgan.precision} & ${CANONICAL_METRICS.wgan.recall} & ${CANONICAL_METRICS.wgan.density} & ${CANONICAL_METRICS.wgan.coverage} & ${CANONICAL_METRICS.wgan.latency} & ${CANONICAL_METRICS.wgan.seeds} \\\\
DDPM (Ours) & ${CANONICAL_METRICS.ddpm.params} & \\textbf{${CANONICAL_METRICS.ddpm.fid}} & \\textbf{${CANONICAL_METRICS.ddpm.precision}} & \\textbf{${CANONICAL_METRICS.ddpm.recall}} & \\textbf{${CANONICAL_METRICS.ddpm.density}} & \\textbf{${CANONICAL_METRICS.ddpm.coverage}} & ${CANONICAL_METRICS.ddpm.latency} & ${CANONICAL_METRICS.ddpm.seeds} \\\\
\\bottomrule
\\end{tabular}
\\end{table}`;
    navigator.clipboard.writeText(latex);
    setCopiedType('latex');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const downloadCSV = () => {
    const headers = 'Model,Params,FID,Precision,Recall,Density,Coverage,Latency_ms_T4,Seeds';
    const lines = rawRows.map(r =>
      `"${r.name}","${r.params}",${r.fidNum},${r.precision},${r.recall},${r.density},${r.coverage},${r.latency},"${r.seeds}"`
    );
    const blob = new Blob([[headers, ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cifar10_generative_benchmark.csv';
    a.click();
    setCopiedType('csv');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const downloadBibTeX = () => {
    const bibtex = `@inproceedings{yashwantha2026generative,
  title={A Comparative Parametric Study of $\\beta$-VAE, WGAN-GP, and Class-Conditional DDPM on CIFAR-10},
  author={Yashwantha, Y.},
  booktitle={AJIET Department of Computer Science and Engineering (AI & ML) Research Project},
  year={2026},
  url={https://vae-gan-diffusion-showcase.vercel.app}
}`;
    const blob = new Blob([bibtex], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'citation.bib';
    a.click();
    setCopiedType('bib');
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Action buttons header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight font-heading">
            Comparative Benchmark on CIFAR-10
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Standardized evaluation protocol across 3 generative architectures.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={copyLaTeX}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm"
            title="Copy clean publication-ready booktabs LaTeX code"
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
            onClick={downloadBibTeX}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm"
            title="Download BibTeX academic citation"
          >
            {copiedType === 'bib' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <BookOpen className="w-3.5 h-3.5" />}
            <span>{copiedType === 'bib' ? 'Downloaded' : 'Download BibTeX'}</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="relative overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-xs text-left border-collapse">
          {/* Paper Table Header */}
          <thead className="bg-slate-900/95 text-slate-300 border-b border-slate-800 text-[11px] font-mono tracking-wider">
            <tr>
              <th className="py-3 px-4 font-bold sticky left-0 bg-slate-900 z-10 whitespace-nowrap shadow-sm">
                Model
              </th>
              <th
                onClick={() => toggleSort('params')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                Params {sortKey === 'params' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('fid')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                FID ↓ {sortKey === 'fid' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('precision')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                Precision ↑ {sortKey === 'precision' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('recall')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                Recall ↑ {sortKey === 'recall' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('density')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                Density ↑ {sortKey === 'density' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('coverage')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                Coverage ↑ {sortKey === 'coverage' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => toggleSort('latency')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                (Tesla T4, ms/image) {sortKey === 'latency' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 text-right whitespace-nowrap">
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
                <td className="py-3 px-4 font-bold sticky left-0 bg-slate-950/95 z-10 whitespace-nowrap border-r border-slate-800/60">
                  <span className={row.color}>{row.name}</span>
                </td>
                <TableCell value={row.params} align="right" />
                <TableCell value={row.fid} bold={row.isBest} align="right" />
                <TableCell value={row.precision} bold={row.isBest} align="right" />
                <TableCell value={row.recall} bold={row.isBest} align="right" />
                <TableCell value={row.density} bold={row.isBest} align="right" />
                <TableCell value={row.coverage} bold={row.isBest} align="right" />
                <TableCell value={row.latency} align="right" />
                <TableCell value={row.seeds} align="right" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clean Paper Footnote */}
      <div className="pt-1">
        <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
          Protocol: N = 5,000 generated vs 10,000 real CIFAR-10 test subset. Free-tier Tesla T4. Lower is better for FID; higher is better for P/R/D/C.
        </p>
      </div>
    </div>
  );
}

// ─── This Run Live Inspection Table ──────────────────────────────────────────
function ThisRunTable({ lastRun }) {
  const [isOpen, setIsOpen] = useState(false);

  const effectiveRun = lastRun || {
    seed: 42,
    steps: 50,
    cfg: 1.5,
    class: 'dog',
    mode: 'cached',
    per_model: {
      vae:  { seconds: 0.007, diversity: 0.1420 },
      wgan: { seconds: 0.013, diversity: 0.0042 },
      ddpm: { seconds: 0.261, diversity: 0.4185 },
    }
  };

  const rows = ['vae', 'wgan', 'ddpm'].map(k => {
    const d = effectiveRun?.per_model?.[k];
    const isDdpm = k === 'ddpm';
    const passes = isDdpm ? (effectiveRun.cfg > 0 ? (effectiveRun.steps * 2) : effectiveRun.steps) : 1;
    const steps = isDdpm ? effectiveRun.steps : '—';
    const guidance = isDdpm ? effectiveRun.cfg : '—';
    const latency = d?.seconds ?? null;
    const ips = latency && latency > 0 ? (16 / latency).toFixed(1) : '—';
    return {
      model:     { vae: 'β-VAE', wgan: 'WGAN-GP', ddpm: 'DDPM' }[k],
      class:     effectiveRun.class ?? 'dog',
      seed:      effectiveRun.seed  ?? 42,
      steps:     steps,
      nfe:       passes,
      guidance:  guidance,
      mode:      effectiveRun.mode  ?? 'cached',
      latency:   latency !== null ? `${latency.toFixed(3)}s` : '—',
      ips:       ips,
      diversity: d?.diversity != null ? d.diversity.toFixed(4) : '—',
    };
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold">Live Execution Diagnostic ({effectiveRun.mode.toUpperCase()})</span>
          <span className="text-slate-500 hidden sm:inline">· Class: {effectiveRun.class} · Seed: {effectiveRun.seed}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 border-t border-slate-800">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px]">
                <tr>
                  {['Model','Class','Seed','Steps','NFE','CFG w','Mode','Latency','img/s','Pixel Diversity'].map(h => (
                    <th key={h} className="py-2 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map(r => (
                  <tr key={r.model} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-bold text-slate-100">{r.model}</td>
                    <td className="py-2 px-3 text-slate-300">{r.class}</td>
                    <td className="py-2 px-3 text-slate-300">{r.seed}</td>
                    <td className="py-2 px-3 text-slate-300">{r.steps}</td>
                    <td className="py-2 px-3 text-slate-300">{r.nfe}</td>
                    <td className="py-2 px-3 text-slate-300">{r.guidance}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.mode === 'gpu' ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300' :
                        r.mode === 'cpu' ? 'bg-amber-950 border border-amber-500/50 text-amber-300' :
                        'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}>
                        {r.mode.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">{r.latency}</td>
                    <td className="py-2 px-3 text-slate-300">{r.ips}</td>
                    <td className="py-2 px-3 text-cyan-300">{r.diversity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Pixel diversity = mean pairwise L2 distance across 16 tiles in [0,1] space.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Published Context Collapsible ───────────────────────────────────────────
function PublishedContext() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/30">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <span className="flex items-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Published Literature Baseline Context (N = 50,000 — NOT directly comparable)</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="p-4 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-2 border-t border-slate-800">
          <p className="text-amber-300 font-bold">
            Published values from literature use N = 50,000 samples and the full 50,000 training set. They are not directly comparable to our N = 5,000 protocol.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2">Model</th>
                  <th className="py-2 px-2">Published FID</th>
                  <th className="py-2 px-2">N</th>
                  <th className="py-2 px-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                <tr>
                  <td className="py-1.5 px-2">DDPM (unconditional)</td>
                  <td className="py-1.5 px-2">3.17</td>
                  <td className="py-1.5 px-2">50,000</td>
                  <td className="py-1.5 px-2">Ho et al. (2020)</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2">WGAN-GP</td>
                  <td className="py-1.5 px-2">36.4</td>
                  <td className="py-1.5 px-2">50,000</td>
                  <td className="py-1.5 px-2">Gulrajani et al. (2017)</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2">β-VAE</td>
                  <td className="py-1.5 px-2">~60–80</td>
                  <td className="py-1.5 px-2">50,000</td>
                  <td className="py-1.5 px-2">Higgins et al. (2017)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Export: OutputsTab1Results ─────────────────────────────────────────
export default function OutputsTab1Results({ lastRun, studioSliders }) {
  const { data: sweeps } = useJsonData('/data/json/sweeps.json');
  const { data: speed }  = useJsonData('/data/json/speed.json');
  const { data: prdc }   = useJsonData('/data/json/prdc.json');

  return (
    <div className="space-y-10">
      {/* 1. Main Paper-Style Benchmark Table */}
      <PaperBenchmarkTable />

      {/* 2. Three-Chart Row (Quality vs Cost, Precision vs Recall, Per-Seed FID) */}
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-bold text-white font-heading">
          Primary Benchmark Plots
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ParetoChart sweeps={sweeps} speed={speed} prdc={prdc} lastRun={lastRun} />
          <PrecRecallScatter prdc={prdc} />
          <PerSeedFid prdc={prdc} />
        </div>
      </div>

      {/* 3. Parameter Sensitivity & Downstream Utility Row */}
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-bold text-white font-heading">
          Parameter Sensitivity & Downstream Classifier Utility
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FidVsSteps sweeps={sweeps} />
          <MetricsVsGuidance sweeps={sweeps} />
          <DownstreamChart />
        </div>
      </div>

      {/* 4. Diagnostic & Literature Collapsibles */}
      <div className="space-y-4 pt-2">
        <ThisRunTable lastRun={lastRun} />
        <PublishedContext />
      </div>
    </div>
  );
}
