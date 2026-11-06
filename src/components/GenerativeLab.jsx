import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RefreshCw, Zap, Key, X, Download, ExternalLink,
  Cpu, Cloud, Image as ImageIcon, Shuffle, Maximize2, ChevronDown
} from 'lucide-react';
import { GRID, DEFAULTS, CIFAR10_CLASSES, resolvePromptToClass } from '../config.js';
import { generateStudio, getCachedStudioResponse } from '../services/gradioClient.js';
import { FID_DISCLAIMER } from '../data/results.js';
import TileGrid from './TileGrid.jsx';
import { assemble16Tiles } from '../utils/tileAssembler.js';
import { computeAllTileMetrics } from '../utils/imageMetrics.js';
import OutputAnalysisPanel from './OutputAnalysisPanel.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MODE_BADGE = {
  gpu:    { label: 'GPU',    cls: 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300', Icon: Zap },
  cpu:    { label: 'CPU',    cls: 'bg-amber-950/90  border-amber-500/60  text-amber-300',   Icon: Cpu },
  cached: { label: 'CACHED', cls: 'bg-slate-900     border-slate-700     text-slate-300',   Icon: Cloud },
};

export function formatImageSrc(val) {
  if (!val) return '';
  if (val.startsWith('data:') || val.startsWith('/') || val.startsWith('http')) {
    return val;
  }
  return `data:image/png;base64,${val}`;
}

function ModeBadge({ mode }) {
  const cfg = MODE_BADGE[mode] ?? MODE_BADGE.cached;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
}

function Lightbox({ src, label, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={formatImageSrc(src)}
            alt={label}
            className="w-full rounded-2xl border border-slate-700 shadow-2xl"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="text-center mt-3 text-xs font-mono text-slate-300">{label}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Single model grid card ───────────────────────────────────────────────────
const MODEL_CFG = {
  vae:  { label: 'β-VAE',    color: 'emerald', border: 'border-emerald-500/40', tag: 'glass-card-vae',  arch: '16.90 M params' },
  wgan: { label: 'WGAN-GP',  color: 'amber',   border: 'border-amber-500/40',  tag: 'glass-card-gan',  arch: '3.56 M G / 4.66 M D' },
  ddpm: { label: 'DDPM',     color: 'cyan',    border: 'border-cyan-500/40',   tag: 'glass-card-ddpm', arch: '28.01 M UNet' },
};

function ModelGridCard({ modelKey, runData, isLoading, tiles = [] }) {
  const [lightboxTile, setLightboxTile] = useState(null);
  const cfg = MODEL_CFG[modelKey];
  const data = runData?.per_model?.[modelKey];

  return (
    <div className={`p-5 rounded-3xl ${cfg.tag} border ${cfg.border} flex flex-col space-y-4 shadow-xl`}>
      {/* Header: Architecture facts only, NO metrics */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className={`font-bold text-sm text-${cfg.color}-300`}>{cfg.label}</span>
        <span className="px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800 text-[11px]">
          {cfg.arch}
        </span>
      </div>

      {/* Grid: 4x4, Square aspect ratio filling the card, at least 480px on desktop */}
      <div className="w-full aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative flex items-center justify-center">
        <TileGrid
          tiles={tiles}
          rows={4}
          cols={4}
          isLoading={isLoading}
          modelName={cfg.label}
          onTileClick={(tileSrc) => setLightboxTile(tileSrc)}
        />
      </div>

      {/* Grid footer specs */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
        <span>{GRID.n} images (4×4) · {data?.seconds?.toFixed(3) ?? '?'}s · passes {modelKey === 'ddpm' ? (runData?.cfg > 0 ? (runData?.steps ?? 50) * 2 : (runData?.steps ?? 50)) : 1}</span>
      </div>

      {lightboxTile && (
        <Lightbox
          src={lightboxTile}
          label={`${cfg.label} · seed ${runData?.seed ?? 42} · 32×32 pixel tile`}
          onClose={() => setLightboxTile(null)}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GenerativeLab({
  runResult: externalRunResult,
  setRunResult: setExternalRunResult,
  steps: externalSteps,
  setSteps: setExternalSteps,
  cfg: externalCfg,
  setCfg: setExternalCfg,
  seed: externalSeed,
  setSeed: setExternalSeed,
}) {
  // Studio controls
  const [selectedClassIdx, setSelectedClassIdx] = useState(5); // dog
  const [prompt, setPrompt]           = useState('');
  const [internalSteps, setInternalSteps] = useState(DEFAULTS.steps);
  const [internalCfg, setInternalCfg]     = useState(DEFAULTS.cfg);
  const [internalSeed, setInternalSeed]   = useState(42);
  const [enhance, setEnhance]         = useState(false);
  const [hfToken, setHfToken]         = useState('');
  const [showToken, setShowToken]     = useState(false);

  const steps = externalSteps !== undefined ? externalSteps : internalSteps;
  const setSteps = setExternalSteps || setInternalSteps;
  const cfg = externalCfg !== undefined ? externalCfg : internalCfg;
  const setCfg = setExternalCfg || setInternalCfg;
  const seed = externalSeed !== undefined ? externalSeed : internalSeed;
  const setSeed = setExternalSeed || setInternalSeed;

  // API state
  const [isLoading, setIsLoading]     = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [internalRunResult, setInternalRunResult] = useState(null);
  const runResult = externalRunResult !== undefined ? externalRunResult : internalRunResult;
  const setRunResult = setExternalRunResult || setInternalRunResult;
  const timerRef = useRef(null);

  // Discrete 4x4 tiles per model and real-time computer vision metrics
  const [modelTiles, setModelTiles] = useState({ vae: [], wgan: [], ddpm: [] });
  const [computedMetrics, setComputedMetrics] = useState({ vae: null, wgan: null, ddpm: null });
  const [runHistory, setRunHistory] = useState([]);

  const randomiseSeed = () => setSeed(Math.floor(Math.random() * 100000));

  // Automatically load initial reference samples on mount so the studio is never empty
  useEffect(() => {
    if (!runResult) {
      getCachedStudioResponse({ cls_name: 'dog', seed: 42, steps: 50, cfg: 1.5 }).then((initialData) => {
        setRunResult(initialData);
      });
    }
  }, [runResult, setRunResult]);

  // Whenever runResult updates, assemble 16 discrete tiles and compute image metrics
  useEffect(() => {
    if (!runResult) return;

    let isMounted = true;
    const processTiles = async () => {
      const clsName = runResult.class || 'dog';
      const curSeed = runResult.seed || 42;

      const [vaeTiles, wganTiles, ddpmTiles] = await Promise.all([
        assemble16Tiles({
          modelKey: 'vae',
          className: clsName,
          primarySource: runResult.per_model?.vae?.grid_png_b64,
          seed: curSeed,
        }),
        assemble16Tiles({
          modelKey: 'wgan',
          className: clsName,
          primarySource: runResult.per_model?.wgan?.grid_png_b64,
          seed: curSeed,
        }),
        assemble16Tiles({
          modelKey: 'ddpm',
          className: clsName,
          primarySource: runResult.per_model?.ddpm?.grid_png_b64,
          seed: curSeed,
        }),
      ]);

      if (!isMounted) return;
      setModelTiles({ vae: vaeTiles, wgan: wganTiles, ddpm: ddpmTiles });

      // Compute mathematical metrics across 16 tiles
      const [vaeM, wganM, ddpmM] = await Promise.all([
        computeAllTileMetrics(vaeTiles),
        computeAllTileMetrics(wganTiles),
        computeAllTileMetrics(ddpmTiles),
      ]);

      if (!isMounted) return;
      setComputedMetrics({ vae: vaeM, wgan: wganM, ddpm: ddpmM });

      setRunHistory((prev) => {
        const next = [
          {
            seed: curSeed,
            class: clsName,
            steps: runResult.steps,
            vae: vaeM,
            wgan: wganM,
            ddpm: ddpmM,
          },
          ...prev,
        ];
        return next.slice(0, 5); // Keep last 5 runs
      });
    };

    processTiles();
    return () => { isMounted = false; };
  }, [runResult]);

  // Keyword prompt → class auto-update
  const promptResolved = resolvePromptToClass(prompt);
  const effectiveClassIdx = promptResolved !== null ? promptResolved : selectedClassIdx;
  const cls = CIFAR10_CLASSES[effectiveClassIdx];

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    const result = await generateStudio({
      cls_name:   cls.name,
      prompt:     prompt,
      steps:      Number(steps),
      cfg:        Number(cfg),
      seed:       Number(seed),
      enhance:    Boolean(enhance),
      models:     ['vae', 'wgan', 'ddpm'],
      hfToken:    hfToken.trim() || null,
    });

    clearInterval(timerRef.current);
    setIsLoading(false);
    setRunResult(result);
  }, [cls, prompt, steps, cfg, seed, enhance, hfToken, setRunResult]);

  const mode = runResult?.mode ?? 'cached';

  return (
    <section id="live-lab" className="py-24 relative bg-slate-950 border-t border-slate-900">
      <div id="live-api" className="sr-only" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">

        {/* ── Section header ── */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Live Generation Studio</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Live Lab: Side-by-Side 4×4 Generation
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Generate 16 CIFAR-10 images simultaneously across β-VAE, WGAN-GP, and class-conditional DDPM with ZeroGPU acceleration.
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-1">
            <a
              href="https://huggingface.co/spaces/Yashwantha123/vae-gan-diffusion-demo"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <span>Hugging Face Space Backend</span>
            </a>
            <span className="inline-flex items-center px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400">
              Reference Benchmark: 100 DDIM steps, w = 1.5
            </span>
          </div>
        </div>

        {/* ── Controls panel ── */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-6">

          {/* Row 1: CIFAR-10 class chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200">
                Class Conditioner (DDPM):
              </label>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {cls.label} ({cls.name})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CIFAR10_CLASSES.map((c) => {
                const isSelected = effectiveClassIdx === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClassIdx(c.id); setPrompt(''); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
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

          {/* Row 2: Prompt + Seed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-mono text-slate-400">
                Natural-language prompt (auto-resolves to class):
              </label>
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. 'a cute dog playing outside', 'airplane in the sky'…"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Seed:</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={seed}
                  onChange={e => setSeed(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-cyan-500 outline-none"
                />
                <button
                  onClick={randomiseSeed}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Randomise Seed"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Diffusion Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            {/* Steps slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-slate-200">
                <span>DDIM Steps:</span>
                <span className="text-cyan-400 font-mono font-bold text-base">{steps}</span>
              </div>
              <input
                type="range" min="10" max="100" step="5" value={steps}
                onChange={e => setSteps(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                aria-label="DDIM steps"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>10 (Fastest)</span>
                <span>50 (Pareto Knee)</span>
                <span>100 (Max Fidelity)</span>
              </div>
            </div>

            {/* CFG slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-slate-200">
                <span>Guidance Scale (w):</span>
                <span className="text-cyan-400 font-mono font-bold text-base">{cfg.toFixed(1)}</span>
              </div>
              <input
                type="range" min="0" max="5" step="0.5" value={cfg}
                onChange={e => setCfg(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                aria-label="CFG scale"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>0.0 (Unconditional)</span>
                <span>1.5 (Standard)</span>
                <span>5.0 (High Precision)</span>
              </div>
            </div>

            {/* SR checkbox */}
            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-start space-x-2.5 text-xs font-mono text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox" checked={enhance} onChange={e => setEnhance(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  aria-label="Super resolution demo"
                />
                <span>
                  Super-Resolution Demo (DDPM only)
                  <br />
                  <span className="text-slate-500 text-[10px]">Visual upscaling preview, not in metric</span>
                </span>
              </label>
            </div>
          </div>

          {/* Generate button: Solid color, no neon glow */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            id="generate-btn"
            className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-extrabold text-base transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Generating via ZeroGPU ({elapsed}s)…</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Generate All 3 Models (4×4 Grids, 16 Images Each)</span>
              </>
            )}
          </button>

          {/* Progress bar */}
          {isLoading && (
            <div className="space-y-1">
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-400 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(98, (elapsed / 60) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-mono text-right">
                ZeroGPU dynamic lease active · Auto-fallback to CACHED reference at 60s
              </p>
            </div>
          )}
        </div>

        {/* ── Mode badge + status: Active sample ── */}
        {runResult && (
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-slate-300 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <span>
              <strong>Active sample:</strong> seed {runResult.seed} · steps {runResult.steps} · w = {runResult.cfg} · class = {runResult.class}
            </span>
            <ModeBadge mode={mode} />
          </div>
        )}

        {/* ── Three grid cards: 16 tiles each, square aspect ratio ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {['vae', 'wgan', 'ddpm'].map(k => (
            <ModelGridCard
              key={k}
              modelKey={k}
              runData={runResult}
              isLoading={isLoading}
              tiles={modelTiles[k]}
            />
          ))}
        </div>

        {/* ── Output Analysis Panel (Section C) ── */}
        <OutputAnalysisPanel
          runResult={runResult}
          modelTiles={modelTiles}
          computedMetrics={computedMetrics}
          runHistory={runHistory}
        />

        {/* Footnote */}
        <p className="text-[11px] text-slate-500 font-mono text-center max-w-2xl mx-auto">
          ⚐ {FID_DISCLAIMER}
        </p>

      </div>
    </section>
  );
}
