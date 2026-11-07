import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowDown, ArrowUp, AlertTriangle, Copy, Download,
  Check, ChevronDown, ChevronUp, Info, ExternalLink
} from 'lucide-react';
import KaTeXView from './KaTeXView.jsx';
import {
  METRIC_CONFIG,
  formatScorecardValue,
  formatValueWithStd,
  normalizeDirectionAware,
  computeComparisonRail,
  computeHeroVerdict,
  computeFidRank,
} from '../utils/scorecardHelpers.js';

const MODEL_CONFIGS = {
  vae: {
    key: 'vae',
    name: 'β-VAE',
    role: 'BASELINE LATENT MODEL',
    colorHex: '#34D399',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/30 hover:border-emerald-500/60',
    accentBg: 'bg-emerald-950/20',
    chipClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    architecture: 'Conv-64/128/256 encoder, 128-dim Gaussian manifold, transposed-conv decoder',
    lossLatex: '\\mathcal{L} = \\mathbb{E}\\left[\\|x - \\hat{x}\\|^2\\right] + \\beta \\cdot \\mathbb{KL}\\left(q(z|x) \\,\\|\\, \\mathcal{N}(0, I)\\right)',
  },
  wgan: {
    key: 'wgan',
    name: 'WGAN-GP',
    role: 'DOCUMENTED MODE-COLLAPSE FAILURE',
    colorHex: '#FBBF24',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/30 hover:border-amber-500/60',
    accentBg: 'bg-amber-950/20',
    chipClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    architecture: '3.56 M Generator (ResNet) + 4.66 M Critic (1-Lipschitz GP, λ = 10)',
    lossLatex: '\\mathcal{L}_D = \\mathbb{E}[D(G(z))] - \\mathbb{E}[D(x)] + \\lambda \\cdot \\mathbb{E}\\left[(\\|\\nabla_{\\hat{x}} D(\\hat{x})\\|_2 - 1)^2\\right]',
  },
  ddpm: {
    key: 'ddpm',
    name: 'Class-Conditional DDPM',
    role: 'BEST FIDELITY',
    colorHex: '#60A5FA',
    accentText: 'text-blue-400',
    accentBorder: 'border-blue-500/30 hover:border-blue-500/60',
    accentBg: 'bg-blue-950/20',
    chipClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    architecture: 'Class-conditional U-Net, GroupNorm 32, cosine schedule, DDIM 100 steps, w = 1.5',
    lossLatex: '\\mathcal{L} = \\mathbb{E}_{t, x_0, \\epsilon}\\left[\\|\\epsilon - \\epsilon_\\theta(x_t, t, c)\\|^2\\right]',
  },
};

/**
 * Animated number hook that respects prefers-reduced-motion
 */
function useCountUp(targetVal, duration = 800) {
  const [val, setVal] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || hasAnimated || isNaN(targetVal) || targetVal === null) {
      setVal(targetVal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = 0;
          const end = targetVal;
          const startTime = performance.now();

          const update = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            // Ease out cubic
            const current = start + (end - start) * (1 - Math.pow(1 - progress, 3));
            setVal(current);
            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              setVal(end);
            }
          };

          requestAnimationFrame(update);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [targetVal, duration, hasAnimated]);

  return [val, ref];
}

/**
 * Comparison Rail component:
 * Shows a thin horizontal scale with dots for all three models.
 * Direction-aware: better is always to the right (100%).
 */
function ComparisonRail({ metricKey, currentModelKey, allRawMetrics }) {
  const models = ['vae', 'wgan', 'ddpm'];
  const rawMap = {
    vae: allRawMetrics.vae?.[metricKey],
    wgan: allRawMetrics.wgan?.[metricKey],
    ddpm: allRawMetrics.ddpm?.[metricKey],
  };

  const positions = useMemo(() => {
    return computeComparisonRail(metricKey, rawMap);
  }, [metricKey, rawMap]);

  return (
    <div className="w-full pt-1.5 pb-1">
      <div className="relative h-1.5 w-full rounded-full bg-slate-800/80 overflow-visible">
        {/* Rail track background gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-slate-800 via-slate-700/60 to-slate-600/80" />

        {/* 3 model dots */}
        {models.map(m => {
          const pos = positions[m];
          if (pos === null || pos === undefined) return null;
          const isCurrent = m === currentModelKey;
          const cfg = MODEL_CONFIGS[m];
          const valFormatted = formatScorecardValue(metricKey, rawMap[m], m);

          return (
            <div
              key={m}
              style={{ left: `${Math.min(96, Math.max(4, pos))}%` }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group/dot cursor-pointer z-10"
              title={`${cfg.name}: ${valFormatted}`}
            >
              {isCurrent ? (
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 shadow-md transition-transform duration-150 group-hover/dot:scale-125"
                  style={{ backgroundColor: cfg.colorHex }}
                />
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-500/80 border border-slate-900 group-hover/dot:bg-slate-300 transition-colors" />
              )}

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/dot:block z-30 pointer-events-none whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-200 shadow-xl">
                {cfg.name}: {valFormatted} {METRIC_CONFIG[metricKey]?.unit}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Metric Tile in 2-column layout
 */
function ScorecardTile({ metricKey, modelKey, allRawMetrics, allMetricsData }) {
  const cfg = METRIC_CONFIG[metricKey];
  const modelData = allMetricsData[modelKey];
  const rawMean = allRawMetrics[modelKey]?.[metricKey];
  const rawStd = allRawMetrics[modelKey]?.[`${metricKey}Std`];
  const nSeeds = allRawMetrics[modelKey]?.nSeeds;

  const { displayVal, stdText } = formatValueWithStd(metricKey, rawMean, rawStd, nSeeds, modelKey);
  const arrow = cfg.direction === 'higher' ? '↑' : '↓';

  return (
    <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center space-x-1">
            <span>{cfg.label}</span>
            <span className="text-slate-500 font-bold">{arrow}</span>
            {cfg.isProvisional && (
              <span className="text-amber-400 font-bold cursor-help" title={cfg.note || 'Provisional baseline'}>
                †
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-500 tabular-nums">{stdText}</span>
        </div>

        <div className="text-lg font-bold font-mono text-white tabular-nums tracking-tight mt-0.5">
          {displayVal}
          {cfg.unit && <span className="text-xs font-normal text-slate-400 ml-1">{cfg.unit}</span>}
        </div>
      </div>

      <ComparisonRail
        metricKey={metricKey}
        currentModelKey={modelKey}
        allRawMetrics={allRawMetrics}
      />
    </div>
  );
}

/**
 * Main ModelScorecard Component
 */
export default function ModelScorecard({
  modelKey,
  allRawMetrics,
  allMetricsData,
  onNavigateEvidence,
}) {
  const cardRef = useRef(null);
  const [showFormula, setShowFormula] = useState(false);
  const [copiedLatex, setCopiedLatex] = useState(false);
  const cfg = MODEL_CONFIGS[modelKey] || MODEL_CONFIGS.ddpm;

  // Real FID Map for rank and verdict computation
  const fidMap = useMemo(() => ({
    vae: allRawMetrics.vae?.fid,
    wgan: allRawMetrics.wgan?.fid,
    ddpm: allRawMetrics.ddpm?.fid,
  }), [allRawMetrics]);

  const fidRank = useMemo(() => computeFidRank(modelKey, fidMap), [modelKey, fidMap]);
  const heroVerdict = useMemo(() => computeHeroVerdict(modelKey, fidMap), [modelKey, fidMap]);

  // Animated FID numeral
  const rawFid = allRawMetrics[modelKey]?.fid;
  const [animatedFid, countUpRef] = useCountUp(rawFid, 900);
  const formattedFidNumeral = (animatedFid !== null && !isNaN(animatedFid)) ? animatedFid.toFixed(1) : '—';

  // WGAN-GP Failure Callout condition (recall < 0.05)
  const recallVal = allRawMetrics[modelKey]?.recall ?? 0;
  const coverageVal = allRawMetrics[modelKey]?.coverage ?? 0;
  const isModeCollapsed = modelKey === 'wgan' && recallVal < 0.05;

  const copyLatexRow = () => {
    const m = allMetricsData[modelKey];
    const raw = allRawMetrics[modelKey];
    const fidFmt = raw.fidStd ? `${raw.fid.toFixed(1)} \\pm ${raw.fidStd.toFixed(1)}` : `${raw.fid.toFixed(1)}`;
    const precFmt = raw.precisionStd ? `${raw.precision.toFixed(3)} \\pm ${raw.precisionStd.toFixed(3)}` : `${raw.precision.toFixed(3)}`;
    const recFmt = raw.recallStd ? `${raw.recall.toFixed(3)} \\pm ${raw.recallStd.toFixed(3)}` : `${raw.recall.toFixed(3)}`;
    const latFmt = modelKey === 'ddpm' ? `${raw.latency.toFixed(1)}` : `${raw.latency.toFixed(2)}`;

    const row = `${cfg.name} & ${m.params} & ${fidFmt} & ${precFmt} & ${recFmt} & ${m.density} & ${m.coverage} & ${latFmt}\\,\\text{ms} & ${m.seeds} \\\\`;
    navigator.clipboard.writeText(row);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const downloadCardPNG = async () => {
    // Pure canvas drawing for reliable scorecard PNG export
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = cfg.colorHex;
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

    // Header
    ctx.fillStyle = cfg.colorHex;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(cfg.name, 40, 70);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${cfg.role} | ${allMetricsData[modelKey]?.params}`, 40, 100);

    // FID Hero
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText(`${rawFid.toFixed(1)} ↓`, 40, 180);

    ctx.fillStyle = cfg.colorHex;
    ctx.font = '14px monospace';
    ctx.fillText(heroVerdict, 40, 215);

    // Grid of metrics
    const keys = ['precision', 'recall', 'density', 'coverage', 'latency', 'lpips', 'ssim'];
    ctx.font = '14px monospace';
    keys.forEach((k, idx) => {
      const y = 280 + idx * 45;
      ctx.fillStyle = '#64748b';
      ctx.fillText(METRIC_CONFIG[k].label, 40, y);
      ctx.fillStyle = '#f1f5f9';
      const val = allRawMetrics[modelKey]?.[k];
      ctx.fillText(formatScorecardValue(k, val, modelKey), 260, y);
    });

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText(cfg.architecture, 40, 880);
    ctx.fillText('Source: vae-gan-diffusion-showcase.vercel.app', 40, 920);

    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${modelKey}_scorecard.png`;
      a.click();
    });
  };

  return (
    <div
      ref={cardRef}
      className={`p-6 rounded-3xl glass-panel border transition-all duration-300 flex flex-col justify-between shadow-2xl relative ${cfg.accentBorder} ${cfg.accentBg}`}
    >
      <div className="space-y-6">
        {/* Header: Model name, Role chip, Parameters, FID Rank */}
        <div className="space-y-2 border-b border-slate-800/80 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={`text-2xl font-extrabold font-heading ${cfg.accentText}`}>
              {cfg.name}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-cyan-300 shadow-sm">
              {fidRank}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${cfg.chipClass}`}>
              {cfg.role}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {allMetricsData[modelKey]?.params}
            </span>
          </div>
        </div>

        {/* Hero Metric Row: FID 48px numeral + Whisker bar + Computed Verdict */}
        <div ref={countUpRef} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <span>Fréchet Inception Distance</span>
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <span className="text-xs font-mono text-slate-500">
              {allRawMetrics[modelKey]?.fidStd
                ? `± ${allRawMetrics[modelKey].fidStd.toFixed(1)}`
                : '(n = 1)'}
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-5xl font-extrabold font-mono text-white tabular-nums tracking-tight">
              {formattedFidNumeral}
            </span>
            <span className="text-sm font-mono text-slate-400">
              FID ↓
            </span>
          </div>

          {/* Thin whisker error bar representation */}
          <div className="w-full h-1 rounded-full bg-slate-800 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: cfg.colorHex,
                width: `${Math.min(100, Math.max(5, (1 - (rawFid / 260)) * 100))}%`,
              }}
            />
          </div>

          <p className="text-xs font-mono text-slate-300 pt-1 leading-snug">
            <span className="text-cyan-400 font-bold">Empirical Verdict: </span>
            {heroVerdict}
          </p>
        </div>

        {/* Failure Callout on WGAN-GP */}
        {isModeCollapsed && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border-2 border-rose-500/80 text-xs font-mono text-rose-200 space-y-1 shadow-lg animate-pulse">
            <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Documented Failure Case: Mode Collapse</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Mode collapse: recall {recallVal.toFixed(3)}, coverage {coverageVal.toFixed(3)}. Generator produces collapsed artifact blobs across random seeds.
            </p>
          </div>
        )}

        {/* Group 1: FIDELITY */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Fidelity (Lower FID, Higher Precision)
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <ScorecardTile metricKey="fid" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
            <ScorecardTile metricKey="precision" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
          </div>
        </div>

        {/* Group 2: DIVERSITY */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Diversity (Recall, Density, Coverage)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <ScorecardTile metricKey="recall" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
            <ScorecardTile metricKey="density" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
            <ScorecardTile metricKey="coverage" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
          </div>
        </div>

        {/* Group 3: PERCEPTUAL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Perceptual & Baselines †
            </span>
            <span className="text-[9px] font-mono text-amber-400">† Provisional</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ScorecardTile metricKey="is" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
            <ScorecardTile metricKey="lpips" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
            <ScorecardTile metricKey="ssim" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
          </div>
        </div>

        {/* Group 4: EFFICIENCY */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Hardware Efficiency (Tesla T4)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <ScorecardTile metricKey="latency" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
            <ScorecardTile metricKey="peakMem" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
            <ScorecardTile metricKey="params" modelKey={modelKey} allRawMetrics={allRawMetrics} allMetricsData={allMetricsData} />
          </div>
        </div>
      </div>

      {/* Footer: Architecture & KaTeX Loss Formulation */}
      <div className="pt-6 mt-6 border-t border-slate-800/80 space-y-4">
        <div className="text-xs font-mono text-slate-400 leading-relaxed">
          <span className="text-slate-500 font-bold block mb-0.5">Architecture:</span>
          {cfg.architecture}
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Mathematical Objective:
            </span>
            <button
              onClick={() => setShowFormula(!showFormula)}
              className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
            >
              <span>{showFormula ? 'Collapse' : 'Expand'}</span>
              {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="overflow-x-auto py-1 text-slate-200">
            <KaTeXView math={cfg.lossLatex} displayMode={true} className="text-sm font-mono" />
          </div>
        </div>

        {/* Small Action Row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={copyLatexRow}
            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
            title="Copy LaTeX tabular row for paper"
          >
            {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLatex ? 'Copied LaTeX' : 'Copy metrics (LaTeX row)'}</span>
          </button>

          <button
            onClick={downloadCardPNG}
            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
            title="Download scorecard image"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download card PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
