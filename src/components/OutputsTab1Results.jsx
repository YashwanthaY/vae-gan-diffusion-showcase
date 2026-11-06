import React, { useState, useMemo, useRef } from 'react';
import { AlertTriangle, Copy, Download, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import useJsonData from '../hooks/useJsonData.js';
import { MODEL_METRICS, FID_DISCLAIMER } from '../data/researchData.js';
import { CIFAR10_CLASSES } from '../config.js';

// ─── Provisional badge ────────────────────────────────────────────────────────
function ProvBadge() {
  return (
    <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-600/50 text-amber-300 text-[9px] font-bold font-mono align-middle">
      PROV
    </span>
  );
}

// ─── "pending" / "—" cell display ─────────────────────────────────────────────
function Cell({ v, prov = false, bold = false }) {
  const display = v === null || v === undefined ? (
    <span className="text-slate-600 italic">pending</span>
  ) : (
    <span className={bold ? 'font-bold text-cyan-300' : 'text-slate-200'}>
      {typeof v === 'number' ? v.toFixed(3) : v}
      {prov && <ProvBadge />}
    </span>
  );
  return <td className="py-2.5 px-3 whitespace-nowrap">{display}</td>;
}

// ─── This-run table ───────────────────────────────────────────────────────────
function RunTable({ lastRun }) {
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

  const csvStr = () => {
    const header = 'Model,Class,Seed,Steps,NFE,Guidance,Mode,Latency,img/s,Diversity';
    const body = rows.map(r =>
      [r.model, r.class, r.seed, r.steps, r.nfe, r.guidance, r.mode, r.latency, r.ips, r.diversity].join(',')
    );
    return [header, ...body].join('\n');
  };

  const latexStr = () => {
    const body = rows.map(r =>
      `  ${r.model} & ${r.class} & ${r.seed} & ${r.steps} & ${r.nfe} & ${r.guidance} & ${r.mode} & ${r.latency} & ${r.ips} & ${r.diversity} \\\\`
    );
    return [
      '\\begin{tabular}{llllllllll}',
      '\\hline',
      '  Model & Class & Seed & Steps & NFE & CFG & Mode & Latency & img/s & Diversity \\\\',
      '\\hline',
      ...body,
      '\\hline',
      '\\end{tabular}'
    ].join('\n');
  };

  const downloadRunJson = () => {
    const blob = new Blob([JSON.stringify(effectiveRun, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'run.json'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs font-mono text-left">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
            <tr>
              {['Model','Class','Seed','Steps','NFE / Passes','CFG w','Mode','Latency','img/s','Pixel Diversity'].map(h => (
                <th key={h} className="py-2.5 px-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.map(r => (
              <tr key={r.model} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-2.5 px-3 font-bold text-slate-100">{r.model}</td>
                <td className="py-2.5 px-3 text-slate-300">{r.class}</td>
                <td className="py-2.5 px-3 text-slate-300">{r.seed}</td>
                <td className="py-2.5 px-3 text-slate-300">{r.steps}</td>
                <td className="py-2.5 px-3 text-slate-300">{r.nfe}</td>
                <td className="py-2.5 px-3 text-slate-300">{r.guidance}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.mode === 'gpu' ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300' :
                    r.mode === 'cpu' ? 'bg-amber-950 border border-amber-500/50 text-amber-300' :
                    'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}>
                    {r.mode.toUpperCase()}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300">{r.latency}</td>
                <td className="py-2.5 px-3 text-slate-300">{r.ips}</td>
                <td className="py-2.5 px-3 text-cyan-300">{r.diversity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-500 font-mono">
        ⚐ Pixel diversity = mean pairwise L2 distance over 16 tiles in [0,1] space (visualisation / diagnostic, not a quality metric).
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigator.clipboard.writeText(csvStr())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer">
          <Copy className="w-3.5 h-3.5" /><span>Copy CSV</span>
        </button>
        <button onClick={() => navigator.clipboard.writeText(latexStr())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer">
          <Copy className="w-3.5 h-3.5" /><span>Copy LaTeX</span>
        </button>
        <button onClick={downloadRunJson}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer">
          <Download className="w-3.5 h-3.5" /><span>Download run.json</span>
        </button>
      </div>
    </div>
  );
}

// ─── Benchmark table ──────────────────────────────────────────────────────────
const SORT_DEFAULT = { key: 'fid', dir: 1 };

function BenchmarkTable() {
  const { data: prdc }   = useJsonData('/data/json/prdc.json');
  const { data: speed }  = useJsonData('/data/json/speed.json');
  const { data: minfo }  = useJsonData('/data/json/models_info.json');
  const { data: mprov }  = useJsonData('/data/json/metrics_provisional.json');

  const [sort, setSort] = useState(SORT_DEFAULT);

  const models = useMemo(() => {
    const mk = (key, name, params, paramsDisplay) => {
      const p = prdc?.[key];
      const sp = speed;
      const prov = mprov?.[key];
      return {
        key, name, params, paramsDisplay,
        fid:       p?.fid?.mean          ?? null,
        fidStd:    p?.fid?.std           ?? null,
        precision: p?.precision?.mean    ?? null,
        recall:    p?.recall?.mean       ?? null,
        density:   p?.density?.mean      ?? null,
        coverage:  p?.coverage?.mean     ?? null,
        IS:        prov?.IS?.mean        ?? null,   ISProv: true,
        LPIPS:     prov?.LPIPS?.mean     ?? null,   LPIPSProv: true,
        SSIM:      prov?.SSIM?.mean      ?? null,   SSIMProv: true,
        SSIMNote:  'computed between unpaired generated and real images: a weak quality indicator',
        msPerImg:  key === 'vae'  ? (sp?.vae_ms_per_img  ?? null)
                 : key === 'wgan' ? (sp?.wgan_ms_per_img ?? null)
                 :                  (sp?.ddpm100_ms_per_img ?? null),
        nfe: key === 'ddpm' ? 100 : 1,
        nSeeds: p?.fid?.per_seed?.length ?? p?.n_seeds ?? 5,
      };
    };

    const rows = [
      mk('vae',  'β-VAE',   minfo?.vae_total ?? 16901123, minfo?.vae_display ?? '16.9 M'),
      mk('wgan', 'WGAN-GP', (minfo?.wgan_generator ?? 3557123) + (minfo?.wgan_critic ?? 4656641), minfo?.wgan_display ?? '3.56 M (G) / 4.66 M (critic)'),
      mk('ddpm', 'DDPM',    minfo?.ddpm_total ?? 28011139, minfo?.ddpm_display ?? '28.0 M'),
    ];

    return [...rows].sort((a, b) => (sort.dir) * ((a[sort.key] ?? Infinity) - (b[sort.key] ?? Infinity)));
  }, [prdc, speed, minfo, mprov, sort]);

  const fidValues = models.map(m => m.fid).filter(Boolean);
  const bestFid = fidValues.length ? Math.min(...fidValues) : null;

  const mkSort = k => setSort(s => ({ key: k, dir: s.key === k ? -s.dir : 1 }));

  const fmtMean = (m, std, nSeeds) => {
    if (m === null) return null;
    const stdLabel = std !== null && std !== undefined ? ` ± ${Number(std).toFixed(std < 0.1 ? 4 : 2)}` : ' (1 seed)';
    return `${Number(m).toFixed(2)}${stdLabel}`;
  };

  const latexBenchmark = () => {
    const rows = models.map(m =>
      `  ${m.name} & ${m.paramsDisplay || m.params.toLocaleString()} & ${fmtMean(m.fid, m.fidStd) ?? 'pending'} & ${m.precision?.toFixed(3) ?? 'pending'} & ${m.recall?.toFixed(3) ?? 'pending'} \\\\`
    );
    return ['\\begin{tabular}{lllll}', '\\hline', 'Model & Params & FID & Precision & Recall \\\\', '\\hline', ...rows, '\\hline', '\\end{tabular}'].join('\n');
  };

  const csvBenchmark = () => {
    const h = 'Model,Params,FID,FID_std,Precision,Recall,Density,Coverage,IS,LPIPS,SSIM,ms_per_img,NFE';
    const b = models.map(m =>
      [m.name, `"${m.paramsDisplay || m.params}"`, m.fid ?? '', m.fidStd ?? '', m.precision ?? '', m.recall ?? '', m.density ?? '', m.coverage ?? '', m.IS ?? '', m.LPIPS ?? '', m.SSIM ?? '', m.msPerImg ?? '', m.nfe].join(',')
    );
    return [h, ...b].join('\n');
  };

  const SortBtn = ({ k }) => (
    <button onClick={() => mkSort(k)} className="ml-1 text-slate-500 hover:text-slate-300 transition-colors" aria-label={`Sort by ${k}`}>
      <ArrowUpDown className="w-3 h-3 inline" />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs font-mono text-left">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Model</th>
              <th className="py-2.5 px-3">Parameters</th>
              <th className="py-2.5 px-3">FID ↓ <SortBtn k="fid" /></th>
              <th className="py-2.5 px-3">Precision ↑ <SortBtn k="precision" /></th>
              <th className="py-2.5 px-3">Recall ↑ <SortBtn k="recall" /></th>
              <th className="py-2.5 px-3">Density ↑ <SortBtn k="density" /></th>
              <th className="py-2.5 px-3">Coverage ↑ <SortBtn k="coverage" /></th>
              <th className="py-2.5 px-3">IS ↑</th>
              <th className="py-2.5 px-3">LPIPS ↓</th>
              <th className="py-2.5 px-3">SSIM (unpaired)</th>
              <th className="py-2.5 px-3">ms/img (T4)</th>
              <th className="py-2.5 px-3">NFE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {models.map(m => {
              const isBestFid = bestFid !== null && m.fid === bestFid;
              return (
                <tr key={m.key} className={`hover:bg-slate-900/40 transition-colors ${m.key === 'wgan' ? 'opacity-85' : ''}`}>
                  <td className="py-2.5 px-3 font-bold text-slate-100">{m.name}</td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{m.paramsDisplay || m.params.toLocaleString()}</td>
                  <Cell v={fmtMean(m.fid, m.fidStd, m.nSeeds)} bold={isBestFid} />
                  <Cell v={m.precision !== null ? Number(m.precision).toFixed(3) : null} />
                  <Cell v={m.recall !== null ? Number(m.recall).toFixed(3) : null} />
                  <Cell v={m.density !== null ? Number(m.density).toFixed(3) : null} />
                  <Cell v={m.coverage !== null ? Number(m.coverage).toFixed(3) : null} />
                  <Cell v={m.IS !== null ? Number(m.IS).toFixed(2) : null} prov />
                  <Cell v={m.LPIPS !== null ? Number(m.LPIPS).toFixed(3) : null} prov />
                  <td className="py-2.5 px-3">
                    {m.SSIM !== null
                      ? <><span className="text-slate-200">{Number(m.SSIM).toFixed(4)}</span><ProvBadge /></>
                      : <span className="text-slate-600 italic">pending</span>
                    }
                  </td>
                  <Cell v={m.msPerImg !== null ? `${Number(m.msPerImg).toFixed(2)} ms` : null} />
                  <td className="py-2.5 px-3 text-slate-300">{m.nfe}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-500 font-mono max-w-3xl">
        ⚐ {FID_DISCLAIMER} · one trained checkpoint per model; 5 evaluation seeds (DDPM: 1 seed evaluated, N=5,000, 100 steps, w=1.5); free-tier Tesla T4.
        IS / LPIPS / SSIM are PROVISIONAL. SSIM is computed between unpaired generated and real images: a weak quality indicator.
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigator.clipboard.writeText(latexBenchmark())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all cursor-pointer">
          <Copy className="w-3.5 h-3.5" /><span>Copy LaTeX</span>
        </button>
        <button onClick={() => {
          const blob = new Blob([csvBenchmark()], { type: 'text/csv' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = 'benchmark.csv'; a.click();
        }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all cursor-pointer">
          <Download className="w-3.5 h-3.5" /><span>Download CSV</span>
        </button>
      </div>
    </div>
  );
}

// ─── Published context (collapsible) ─────────────────────────────────────────
function PublishedContext() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <span className="flex items-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Published context (N = 50,000 — NOT directly comparable)</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-4 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-2">
          <p className="text-amber-300 font-bold">These are published values from cited papers at N = 50,000. They use a different sample count and real-image set than this study and are NOT directly comparable.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2">Model</th><th className="py-2 px-2">Published FID</th>
                  <th className="py-2 px-2">N</th><th className="py-2 px-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                <tr><td className="py-1.5 px-2">DDPM (unconditional, cosine schedule)</td><td className="py-1.5 px-2">3.17</td><td className="py-1.5 px-2">50,000</td><td className="py-1.5 px-2">Ho et al. (2020) DDPM</td></tr>
                <tr><td className="py-1.5 px-2">WGAN-GP</td><td className="py-1.5 px-2">36.4</td><td className="py-1.5 px-2">50,000</td><td className="py-1.5 px-2">Gulrajani et al. (2017)</td></tr>
                <tr><td className="py-1.5 px-2">β-VAE</td><td className="py-1.5 px-2">~60–80</td><td className="py-1.5 px-2">50,000</td><td className="py-1.5 px-2">Higgins et al. (2017), CIFAR-10 variant</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function OutputsTab1Results({ lastRun }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white font-heading">This Run</h4>
        <RunTable lastRun={lastRun} />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white font-heading">Benchmark Table (measured data)</h4>
        <BenchmarkTable />
      </div>

      <PublishedContext />
    </div>
  );
}