import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ChevronRight, ExternalLink, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import ThreeCanvas from './ThreeCanvas';
import { RESEARCH_PROJECT, MODELS_DATA, DOWNSTREAM_FINAL, FID_DISCLAIMER } from '../data/researchData';
import { CANONICAL_METRICS, HEADLINE_NUMBERS } from '../data/metrics';

export default function HeroSection({ activeModel = 'ddpm', setActiveModel }) {
  const currentModelData = MODELS_DATA.find((m) => m.id === activeModel) || MODELS_DATA[2];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 75;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden bg-cyber-grid border-b border-slate-900">
      {/* Glow aura backdrops */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-500/10 rounded-full filter blur-[150px] pointer-events-none" />

      {/* ── Main Restored Hero Screen ── */}
      <section id="hero" className="relative min-h-screen pt-24 pb-12 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Headline & Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Research Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Generative AI Research & Downstream Domain-Gap Study (CIFAR-10)</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Comparative Parametric Study of <br />
              <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
                β-VAE, WGAN-GP & DDPM
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              A rigorous 5-seed comparative benchmark on CIFAR-10 image generation. Evaluating distribution fidelity (FID, IS, LPIPS, SSIM) alongside downstream classifier utility under standardized protocols.
            </p>

            {/* Interactive Model Selector Cards */}
            <div className="pt-2">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Select Generative Architecture Viewport:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {MODELS_DATA.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setActiveModel?.(model.id)}
                    className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden cursor-pointer ${
                      activeModel === model.id
                        ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-white" style={{ color: model.color }}>
                        {model.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        FID {model.fid}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {model.badge}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Headline Results Banner */}
            <div className="p-4 rounded-2xl glass-card-ddpm border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400 font-mono">Headline Generative Model</div>
                <div className="text-xl font-bold text-cyan-300 flex items-center space-x-2">
                  <span>DDPM FID = {CANONICAL_METRICS.ddpm.fid}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 font-semibold">
                    Best Quality
                  </span>
                </div>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <div className="text-xs text-slate-400 font-mono">Downstream Classifier Utility</div>
                <div className="text-sm font-semibold text-cyan-300">
                  500 real/class + 5k synth: {DOWNSTREAM_FINAL.metrics.real_500pc_plus_synth.mean}%
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  vs {DOWNSTREAM_FINAL.metrics.real_500pc_only.mean}% real-only baseline (+4.38% low-data benefit)
                </div>
              </div>
            </div>

            {/* FID Disclaimer */}
            <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{FID_DISCLAIMER}</span>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => scrollTo('live-lab')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Live Demo & Gallery</span>
              </button>
              <button
                onClick={() => scrollTo('benchmark')}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-sm transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Explore Benchmark Metrics</span>
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </button>
              <a
                href={RESEARCH_PROJECT.huggingFaceUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Open Hugging Face Space"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

          </motion.div>

          {/* Right Column: 3D Interactive WebGL Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 h-[480px] lg:h-[550px] relative rounded-3xl glass-panel border border-slate-800/80 p-2 overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Canvas header overlay */}
            <div className="absolute top-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentModelData.color }} />
              <span className="text-xs font-mono font-bold text-white">
                {currentModelData.name} 3D Latent Manifold
              </span>
            </div>

            <div className="absolute top-4 right-4 z-20 text-[10px] font-mono bg-slate-900/90 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800">
              Interactive Three.js Viewport
            </div>

            {/* 3D Canvas */}
            <div className="w-full h-full rounded-2xl overflow-hidden">
              <ThreeCanvas activeModel={activeModel} />
            </div>

            {/* Canvas bottom specs footer */}
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-950/85 backdrop-blur-md p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-400">FID Score: </span>
                <span className="font-bold text-white" style={{ color: currentModelData.color }}>
                  {currentModelData.fid}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Inception Score: </span>
                <span className="font-bold text-white">{currentModelData.is}</span>
              </div>
              <div>
                <span className="text-slate-400">Params: </span>
                <span className="text-cyan-300 font-bold">{currentModelData.parameters}</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── 4 Headline Numeral Cards directly below restored hero ── */}
      <section className="relative pb-16 pt-2 z-10 border-t border-slate-900/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HEADLINE_NUMBERS.map((card) => (
              <div
                key={card.category}
                onClick={() => scrollTo(card.target)}
                className={`p-5 rounded-2xl glass-panel border ${card.borderColor} transition-all duration-300 hover:-translate-y-1 group cursor-pointer shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400">
                    {card.category}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div className={`text-4xl lg:text-5xl font-black font-mono tracking-tight ${card.accentColor} mb-1 tabular-nums`}>
                  {card.metric}
                </div>
                <div className="text-xs font-mono font-bold text-slate-200 mb-2">
                  {card.label}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  {card.soWhat}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
