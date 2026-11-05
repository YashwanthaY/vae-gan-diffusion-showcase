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
  if (!lastRun) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-dashed border-slate-700 text-center text-xs font-mono text-slate-500">
        Click "Generate" above to populate this table.
      </div>
    );
  }

  const rows = ['vae', 'wgan', 'ddpm'].map(k => {
    const d = lastRun?.per_model?.[k];
    const nfe = k === 'ddpm' ? (lastRun.nfe ?? null) : 2;
    const latency = d?.seconds ?? null;
    const ips = latency ? (16 / latency).toFixed(2) : null;
    return {
      model:     { vae: 'β-VAE', wgan: 'WGAN-GP', ddpm: 'DDPM' }[k],
      class:     lastRun.class ?? '—',
      seed:      lastRun.seed  ?? '—',
      steps:     lastRun.steps ?? '—',
      nfe:       nfe ?? '—',
      guidance:  lastRun.cfg   ?? '—',
      mode:      lastRun.mode  ?? '—',
      latency:   latency !== null ? `${latency.toFixed(2)}s` : '—',
      ips:       ips ?? '—',
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
    const blob = new Blob([JSON.stringify(lastRun, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'run.json'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs font-mono text-left">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
            <tr>
              {['Model','Class','Seed','Steps','NFE','CFG w','Mode','Latency','img/s','Diversity'].map(h => (
                <th key={h} className="py-2.5 px-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.map(r => (
              <tr key={r.model} className="hover:bg-slate-900/40 transition-colors">
                {Object.values(r).map((v, i) => <td key={i} className="py-2.5 px-3 text-slate-200">{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-500 font-mono">
        ⚐ Pixel diversity = mean pairwise L2 distance over the 16 tiles, in [0,1] pixel space (visualisation/diagnostic, not a quality metric).
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigator.clipboard.writeText(csvStr())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all">
          <Copy className="w-3.5 h-3.5" /><span>Copy CSV</span>
        </button>
        <button onClick={() => navigator.clipboard.writeText(latexStr())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all">
          <Copy className="w-3.5 h-3.5" /><span>Copy LaTeX</span>
        </button>
        <button onClick={downloadRunJson}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all">
          <Download className="w-3.5 h-3.5" /><span>Download run.json</span>
        </button>
      </div>
    </div>
  );
}

// ─── Benchmark table ──────────────────────────────────────────────────────────
const SORT_DEFAULT = { key: 'fid', dir: 1 };

function BenchmarkTable() {
  const { data: prdc,   pending: prdcPending }  = useJsonData('/data/json/prdc.json');
  const { data: speed,  pending: speedPending }  = useJsonData('/data/json/speed.json');
  const { data: minfo,  pending: minfoPending }  = useJsonData('/data/json/models_info.json');
  const { data: mprov,  pending: mprovPending }  = useJsonData('/data/json/metrics_provisional.json');

  const [sort, setSort] = useState(SORT_DEFAULT);

  const models = useMemo(() => {
    const mk = (key, name, params) => {
      const p = prdc?.[key];
      const sp = speed;
      const prov = mprov?.[key];
      return {
        key, name, params,
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
        nfe: key === 'ddpm' ? 100 : 2,
        nSeeds: p?.fid?.per_seed?.length ?? 5,
      };
    };

    const rows = [
      mk('vae',  'β-VAE',   minfo?.vae_total          ?? 16901123),
      mk('wgan', 'WGAN-GP', `${minfo?.wgan_generator ?? 3557123}+${minfo?.wgan_critic ?? 4656641}`),
      mk('ddpm', 'DDPM',    minfo?.ddpm_total          ?? 28011139),
    ];

    return [...rows].sort((a, b) => (sort.dir) * ((a[sort.key] ?? Infinity) - (b[sort.key] ?? Infinity)));
  }, [prdc, speed, minfo, mprov, sort]);

  const fidValues = models.map(m => m.fid).filter(Boolean);
  const bestFid = fidValues.length ? Math.min(...fidValues) : null;

  const mkSort = k => setSort(s => ({ key: k, dir: s.key === k ? -s.dir : 1 }));

  const fmtMean = (m, std, nSeeds) => {
    if (m === null) return null;
    const stdLabel = std !== null ? ` ± ${Number(std).toFixed(std < 0.1 ? 4 : 2)}` : ' (1 seed)';
    return `${Number(m).toFixed(2)}${stdLabel}`;
  };

  const latexBenchmark = () => {
    const rows = models.map(m =>
      `  ${m.name} & ${m.params.toLocaleString()} & ${fmtMean(m.fid, m.fidStd) ?? 'pending'} & ${m.precision?.toFixed(3) ?? 'pending'} & ${m.recall?.toFixed(3) ?? 'pending'} \\\\`
    );
    return ['\\begin{tabular}{lllll}', '\\hline', 'Model & Params & FID & Precision & Recall \\\\', '\\hline', ...rows, '\\hline', '\\end{tabular}'].join('\n');
  };

  const csvBenchmark = () => {
    const h = 'Model,Params,FID,FID_std,Precision,Recall,Density,Coverage,IS,LPIPS,SSIM,ms_per_img,NFE';
    const b = models.map(m =>
      [m.name, m.params, m.fid ?? '', m.fidStd ?? '', m.precision ?? '', m.recall ?? '', m.density ?? '', m.coverage ?? '', m.IS ?? '', m.LPIPS ?? '', m.SSIM ?? '', m.msPerImg ?? '', m.nfe].join(',')
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
              <th className="py-2.5 px-3">Params</th>
              <th className="py-2.5 px-3 cursor-pointer">FID↓<SortBtn k="fid"/></th>
              <th className="py-2.5 px-3">Precision↑<SortBtn k="precision"/></th>
              <th className="py-2.5 px-3">Recall↑</th>
              <th className="py-2.5 px-3">Density↑</th>
              <th className="py-2.5 px-3">Coverage↑</th>
              <th className="py-2.5 px-3">IS↑ <ProvBadge /></th>
              <th className="py-2.5 px-3">LPIPS↓ <ProvBadge /></th>
              <th className="py-2.5 px-3">SSIM <ProvBadge /></th>
              <th className="py-2.5 px-3">ms/img (T4)</th>
              <th className="py-2.5 px-3">NFE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {models.map(m => {
              const isBestFid = bestFid !== null && m.fid === bestFid;
              return (
                <tr key={m.key} className={`hover:bg-slate-900/40 transition-colors ${m.key === 'wgan' ? 'opacity-75' : ''}`}>
                  <td className="py-2.5 px-3 font-bold text-slate-100">{m.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{typeof m.params === 'number' ? m.params.toLocaleString() : m.params}</td>
                  <Cell v={fmtMean(m.fid, m.fidStd, m.nSeeds)} bold={isBestFid} />
                  <Cell v={fmtMean(m.precision, null)} />
                  <Cell v={fmtMean(m.recall, null)} />
                  <Cell v={fmtMean(m.density, null)} />
                  <Cell v={fmtMean(m.coverage, null)} />
                  <Cell v={fmtMean(m.IS, null)} prov />
                  <Cell v={fmtMean(m.LPIPS, null)} prov />
                  <td className="py-2.5 px-3">
                    {m.SSIM !== null
                      ? <><span className="text-slate-200">{Number(m.SSIM).toFixed(4)}</span><ProvBadge /></>
                      : <span className="text-slate-600 italic">pending</span>
                    }
                  </td>
                  <Cell v={m.msPerImg !== null ? `${Number(m.msPerImg).toFixed(1)} ms` : null} />
                  <td className="py-2.5 px-3 text-slate-300">{m.nfe}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-500 font-mono max-w-3xl">
        ⚐ {FID_DISCLAIMER} · one trained checkpoint per model; {models[2]?.nSeeds ?? 5} evaluation seeds; N = 5,000 images per model per seed; free-tier Tesla T4.
        IS / LPIPS / SSIM are PROVISIONAL. SSIM is computed between unpaired generated and real images: a weak quality indicator.
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigator.clipboard.writeText(latexBenchmark())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all">
          <Copy className="w-3.5 h-3.5" /><span>Copy LaTeX</span>
        </button>
        <button onClick={() => {
          const blob = new Blob([csvBenchmark()], { type: 'text/csv' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = 'benchmark.csv'; a.click();
        }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all">
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
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors"
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
