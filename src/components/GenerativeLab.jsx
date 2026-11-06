import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RefreshCw, Zap, Key, X, Download, ExternalLink,
  Cpu, Cloud, Image as ImageIcon, Shuffle, Maximize2, ChevronDown, CheckCircle2
} from 'lucide-react';
import { GRID, DEFAULTS, CIFAR10_CLASSES, resolvePromptToClass } from '../config.js';
import { generateStudio, getCachedStudioResponse } from '../services/gradioClient.js';
import { MODEL_METRICS, FID_DISCLAIMER } from '../data/researchData.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MODE_BADGE = {
  gpu:    { label: 'GPU',    cls: 'bg-emerald-950 border-emerald-500/60 text-emerald-300', Icon: Zap },
  cpu:    { label: 'CPU',    cls: 'bg-amber-950  border-amber-500/60  text-amber-300',   Icon: Cpu },
  cached: { label: 'CACHED', cls: 'bg-slate-900  border-slate-600     text-slate-300',   Icon: Cloud },
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
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      <span>{cfg.label}</span>
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-800" />
      <div className="aspect-square rounded-xl bg-slate-800/70 w-full" />
      <div className="h-3 w-36 rounded bg-slate-800" />
    </div>
  );
}

function downloadImage(src, filename) {
  const a = document.createElement('a');
  a.href = formatImageSrc(src);
  a.download = filename;
  a.click();
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, label, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        key="lb"
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative max-w-lg w-full"
          initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute -top-3 -right-3 p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white z-10 cursor-pointer">
            <X className="w-4 h-4" />
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
  vae:  { label: 'β-VAE',    color: 'emerald', border: 'border-emerald-500/40', tag: 'glass-card-vae',  fid: MODEL_METRICS.vae.fid.formatted  },
  wgan: { label: 'WGAN-GP',  color: 'amber',   border: 'border-amber-500/40',  tag: 'glass-card-gan',  fid: MODEL_METRICS.wgan.fid.formatted },
  ddpm: { label: 'DDPM',     color: 'cyan',    border: 'border-cyan-500/40',   tag: 'glass-card-ddpm', fid: MODEL_METRICS.ddpm.fid.formatted },
};

function ModelGridCard({ modelKey, runData, isLoading }) {
  const [lightbox, setLightbox] = useState(false);
  const cfg = MODEL_CFG[modelKey];
  const data = runData?.per_model?.[modelKey];

  return (
    <div className={`p-5 rounded-3xl ${cfg.tag} border ${cfg.border} flex flex-col space-y-3.5 shadow-xl`}>
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className={`font-bold text-${cfg.color}-300`}>{cfg.label}</span>
        <span className={`px-2 py-0.5 rounded bg-slate-950/80 text-${cfg.color}-300 border ${cfg.border} text-[10px]`}>
          FID {cfg.fid} <span className="text-slate-500">(benchmark)</span>
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <SkeletonGrid />
      ) : data?.grid_png_b64 ? (
        <>
          <div
            className="aspect-square rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 cursor-zoom-in relative group"
            onClick={() => setLightbox(true)}
          >
            <img
              src={formatImageSrc(data.grid_png_b64)}
              alt={`${cfg.label} 4×4 grid`}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{GRID.n} images · {data.seconds?.toFixed(3) ?? '?'}s · passes {modelKey === 'ddpm' ? (runData.cfg > 0 ? runData.steps * 2 : runData.steps) : 1}</span>
            <button
              onClick={() => downloadImage(data.grid_png_b64, `${modelKey}_grid_seed${runData.seed}.png`)}
              className={`flex items-center space-x-1 text-${cfg.color}-400 hover:text-${cfg.color}-200 transition-colors cursor-pointer`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>
          </div>
        </>
      ) : (
        <div className="aspect-square rounded-2xl bg-slate-900/50 border border-dashed border-slate-700 flex items-center justify-center">
          <div className="text-center space-y-1">
            <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading reference...</p>
          </div>
        </div>
      )}

      {lightbox && data?.grid_png_b64 && (
        <Lightbox
          src={data.grid_png_b64}
          label={`${cfg.label} · seed ${runData?.seed} · ${runData?.steps} steps · CFG ${runData?.cfg}`}
          onClose={() => setLightbox(false)}
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

  const randomiseSeed = () => setSeed(Math.floor(Math.random() * 100000));

  // Automatically load initial reference samples on mount so the studio is never empty
  useEffect(() => {
    if (!runResult) {
      getCachedStudioResponse({ cls_name: 'dog', seed: 42, steps: 50, cfg: 1.5 }).then((initialData) => {
        setRunResult(initialData);
      });
    }
  }, [runResult, setRunResult]);

  // Keyword prompt → class auto-update
  const promptResolved = resolvePromptToClass(prompt);
  const effectiveClassIdx = promptResolved !== null ? promptResolved : selectedClassIdx;
  const cls = CIFAR10_CLASSES[effectiveClassIdx];

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    const result = await generateStudio({
      cls_name: cls.name,
      prompt,
      steps,
      cfg,
      seed,
      enhance,
      models: ['vae', 'wgan', 'ddpm'],
      hfToken: hfToken.trim() || null,
    });

    clearInterval(timerRef.current);
    setIsLoading(false);
    setRunResult(result);
  }, [cls, prompt, steps, cfg, seed, enhance, hfToken, setRunResult]);

  const mode = runResult?.mode ?? 'cached';

  return (
    <section id="live-api" className="py-24 relative bg-slate-950 border-t border-slate-900">
      <div id="generative-lab" className="sr-only" />
      {/* Ambient glow */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">

        {/* ── Section header ── */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-md">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Verification · Live Lab</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Don't Trust the Table? Generate Samples Yourself.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Run all three models side-by-side via Hugging Face ZeroGPU (or inspect verified offline reference samples).
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-1">
            <a
              href="https://huggingface.co/spaces/Yashwantha123/vae-gan-diffusion-demo"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open HF Space Backend</span>
            </a>
            <span className="inline-flex items-center px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              Evaluated setting: 100 steps, w = 1.5
            </span>
          </div>
        </div>

        {/* ── DDPM prompt note ── */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-800/40 text-xs font-mono text-slate-300 space-y-1 shadow-md">
          <span className="text-cyan-300 font-bold">ℹ Prompt note: </span>
          The DDPM is conditioned on the class label (10 classes); the prompt box only does keyword-to-class matching.
          The keyword <span className="text-cyan-400">"{prompt || 'e.g. fluffy dog'}"</span>{' '}
          {promptResolved !== null
            ? <>matched class <span className="text-emerald-300 font-bold">{CIFAR10_CLASSES[promptResolved].label}</span>.</>
            : 'did not match a class — using the target class selector below.'}
        </div>

        {/* ── Controls card ── */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-bold text-white">Live Lab Generation Controls</h3>
            <button
              onClick={() => { setShowToken(v => !v); }}
              className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{showToken ? 'Hide Token' : 'HF Token (optional for private quota)'}</span>
            </button>
          </div>

          {showToken && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Hugging Face token (<code className="text-cyan-400">hf_...</code>):</span>
                <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center space-x-1">
                  <span>Get Token</span><ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password" value={hfToken} onChange={e => setHfToken(e.target.value)}
                placeholder="hf_..." aria-label="HF Token"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-mono focus:border-cyan-500 outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Class select */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 font-bold">Target Class:</label>
              <div className="relative">
                <select
                  value={effectiveClassIdx}
                  onChange={e => { setSelectedClassIdx(Number(e.target.value)); setPrompt(''); }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-cyan-500 outline-none appearance-none pr-8 cursor-pointer"
                  aria-label="CIFAR-10 class"
                >
                  {CIFAR10_CLASSES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 font-bold">Keyword Prompt (class matcher):</label>
              <input
                type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. cute puppy or white cat"
                aria-label="Prompt"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Seed */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 font-bold">Evaluation Seed:</label>
              <div className="flex space-x-2">
                <input
                  type="number" value={seed} onChange={e => setSeed(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-cyan-500 outline-none"
                  aria-label="Random seed"
                />
                <button
                  onClick={randomiseSeed}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  title="Randomise seed" aria-label="Randomise seed"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span className="font-bold">DDIM Steps:</span>
                <span className="text-cyan-400 font-bold">{steps}</span>
              </div>
              <input
                type="range" min="10" max="250" step="5" value={steps}
                onChange={e => setSteps(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                aria-label="DDIM steps"
              />
            </div>

            {/* CFG */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span className="font-bold">Guidance Scale (w):</span>
                <span className="text-cyan-400 font-bold">{cfg.toFixed(1)}</span>
              </div>
              <input
                type="range" min="0" max="5" step="0.5" value={cfg}
                onChange={e => setCfg(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                aria-label="CFG scale"
              />
            </div>

            {/* SR checkbox */}
            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-start space-x-2.5 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox" checked={enhance} onChange={e => setEnhance(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  aria-label="Super resolution (DDPM only)"
                />
                <span>
                  Super-Resolution (DDPM only)
                  <br />
                  <span className="text-slate-500 text-[10px]">visual upscaling demo, not in metric</span>
                </span>
              </label>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            id="generate-btn"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Generating via ZeroGPU ({elapsed}s)…</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Generate All 3 Models (4×4 Grids)</span>
              </>
            )}
          </button>

          {/* Progress bar */}
          {isLoading && (
            <div className="space-y-1">
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(98, (elapsed / 60) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-mono text-right">
                ZeroGPU dynamic lease active · Auto-fallback to CACHED reference at 60s
              </p>
            </div>
          )}
        </div>

        {/* ── Mode badge + status ── */}
        {runResult && (
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-slate-400">
            <span>Active Sample: seed {runResult.seed} · {runResult.steps} steps · w = {runResult.cfg} · class = {runResult.class}</span>
            <ModeBadge mode={mode} />
          </div>
        )}

        {/* ── Three grid cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['vae', 'wgan', 'ddpm'].map(k => (
            <ModelGridCard key={k} modelKey={k} runData={runResult} isLoading={isLoading} />
          ))}
        </div>

        {/* FID disclaimer */}
        <p className="text-[11px] text-slate-500 font-mono text-center max-w-2xl mx-auto">
          ⚠ {FID_DISCLAIMER}
        </p>

      </div>
    </section>
  );
}