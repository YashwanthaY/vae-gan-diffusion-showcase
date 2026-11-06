import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import useJsonData from '../hooks/useJsonData.js';
import Benchmark4View, { PaperTable as PaperBenchmarkTable } from './Benchmark4View.jsx';
import {
  ParetoChart,
  PrecRecallScatter,
  PerSeedFid,
  FidVsSteps,
  MetricsVsGuidance,
  DownstreamChart,
} from './OutputsTab2Plots.jsx';

export { PaperBenchmarkTable };

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
export default function OutputsTab1Results({ lastRun, studioSliders, onNavigateEvidence }) {
  const { data: sweeps } = useJsonData('/data/json/sweeps.json');
  const { data: speed }  = useJsonData('/data/json/speed.json');
  const { data: prdc }   = useJsonData('/data/json/prdc.json');

  return (
    <div className="space-y-10">
      {/* 1. Main 4-View Switch: [Table] [Model cards] [Radar] [Ranking] */}
      <Benchmark4View onNavigateEvidence={onNavigateEvidence} />

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
