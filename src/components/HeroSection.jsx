import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, Play, ExternalLink, HelpCircle,
  BarChart2, Zap, Database, CheckCircle2, ChevronRight, Layers, Sliders
} from 'lucide-react';
import ThreeCanvas from './ThreeCanvas';
import ExaminerTourModal from './ExaminerTourModal';

const HEADLINE_CARDS = [
  {
    category: 'QUALITY',
    metric: '11.2',
    label: 'DDPM FID',
    comparison: 'vs 112.4 (β-VAE) · 242.5 (WGAN-GP)',
    soWhat: 'Diffusion is ~10× closer to real CIFAR-10 data distribution.',
    target: 'findings',
    accentColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40 hover:border-cyan-400',
    bgGlow: 'bg-cyan-950/20',
  },
  {
    category: 'DIVERSITY',
    metric: '0.67',
    label: 'Recall',
    comparison: 'vs 0.10 (β-VAE) · 0.00 (WGAN-GP)',
    soWhat: 'WGAN-GP suffered complete mode collapse; FID alone hid the failure.',
    target: 'debugging',
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500/40 hover:border-rose-400',
    bgGlow: 'bg-rose-950/20',
  },
  {
    category: 'COST',
    metric: '524ms',
    label: 'Latency / Img',
    comparison: 'vs 0.41ms (β-VAE) · 0.80ms (WGAN-GP)',
    soWhat: 'Quality is bought with compute: DDPM demands ~1,000× more inference budget.',
    target: 'findings',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/40 hover:border-amber-400',
    bgGlow: 'bg-amber-950/20',
  },
  {
    category: 'UTILITY',
    metric: '+4.38%',
    label: 'ResNet-18 Gain',
    comparison: 'p = 0.030 (low-data) · +0.54% p = 0.13 (full)',
    soWhat: 'Synthetic images helped in data scarcity, but offered no gain with full real data.',
    target: 'downstream',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
    bgGlow: 'bg-emerald-950/20',
  },
];

const TOUR_STEPS = [
  { id: 'step-q', label: '1. The Question', icon: HelpCircle, target: 'hero', desc: 'Why benchmark 3 generative families?' },
  { id: 'step-m', label: '2. Research Design', icon: Sliders, target: 'design', desc: '5-metric protocol & parameter sweeps' },
  { id: 'step-e', label: '3. Findings & Evidence', icon: BarChart2, target: 'findings', desc: 'Pareto curves, benchmarks, & charts' },
  { id: 'step-t', label: '4. Try It Yourself', icon: Zap, target: 'live-api', desc: 'Generate live 4×4 grids via ZeroGPU' },
];

export default function HeroSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);

  // Auto-play the 20-second "how to read this site" step indicator (5 seconds per step)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % TOUR_STEPS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Listen to ?present=1 URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('present') === '1') {
        setTourOpen(true);
      }
    }
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen pt-24 pb-16 flex flex-col justify-center overflow-hidden bg-cyber-grid">
      {/* Glow aura backdrops */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-500/10 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12 relative z-10">

        {/* Top Headline Block */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Research Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Final-Year Comparative Parametric Research Study · CIFAR-10</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Which generative model should you trust to{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
              create training data?
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
            We evaluated a <strong>β-VAE</strong>, a <strong>WGAN-GP</strong>, and a <strong>class-conditional DDPM</strong> on CIFAR-10 under one standardized evaluation harness: 5 formal metrics, hyperparameter sweeps, 5 random seeds, statistical hypothesis testing, and downstream ResNet-18 classifier utility.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setTourOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm font-mono flex items-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Guided Tour (5-Min Examiner Mode)</span>
            </button>

            <button
              onClick={() => scrollTo('findings')}
              className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-white font-mono text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Explore Benchmark Findings</span>
            </button>

            <button
              onClick={() => scrollTo('live-api')}
              className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white font-mono text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Verify Live Lab</span>
            </button>
          </div>
        </div>

        {/* 4 Headline Number Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HEADLINE_CARDS.map((card) => (
            <div
              key={card.category}
              onClick={() => scrollTo(card.target)}
              className={`p-6 rounded-3xl glass-panel border ${card.borderColor} ${card.bgGlow} transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group shadow-xl hover:-translate-y-1`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-400 tracking-wider">{card.category}</span>
                  <span className="flex items-center space-x-1 text-slate-500 group-hover:text-cyan-300 transition-colors">
                    <span>see evidence</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Big 56-72px Numeral */}
                <div className={`text-5xl sm:text-6xl font-extrabold tracking-tight font-mono ${card.accentColor}`}>
                  {card.metric}
                </div>

                <div className="text-xs font-mono font-bold text-slate-200">
                  {card.label} <span className="text-slate-400 font-normal">({card.comparison})</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  <strong className="text-white">So what: </strong>
                  {card.soWhat}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 20-Second Auto-Playing "How to read this site" Strip */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-slate-400">
            <span className="font-bold text-slate-300">How to Read This Research Site:</span>
            <span>20-second walkthrough · Click any step to jump</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TOUR_STEPS.map((s, idx) => {
              const { icon: StepIcon } = s;
              const isCurrent = activeStep === idx;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveStep(idx);
                    scrollTo(s.target);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-slate-950 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-mono font-bold">{s.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Non-negotiable footnote banner */}
        <div className="text-center text-[11px] font-mono text-slate-500">
          ⚐ Standardized evaluation protocol: N = 5,000 images per model vs fixed 10,000-image CIFAR-10 reference split. Free-tier Tesla T4 GPU.
        </div>

      </div>

      {/* Presentation Tour Modal */}
      <ExaminerTourModal isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </section>
  );
}