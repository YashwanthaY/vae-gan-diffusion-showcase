import React from 'react';
import { ArrowRight, ChevronRight, Zap, BarChart2 } from 'lucide-react';
import { Model3DView } from './ThreeCanvas';
import { HEADLINE_NUMBERS } from '../data/metrics';

const THREE_MODELS = [
  {
    key: 'vae',
    name: 'β-VAE',
    colorHex: '#34d399',
    badgeClass: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    tagline: 'single pass, smooth latent space',
  },
  {
    key: 'gan',
    name: 'WGAN-GP',
    colorHex: '#fbbf24',
    badgeClass: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    tagline: 'adversarial, documented collapse',
  },
  {
    key: 'ddpm',
    name: 'DDPM',
    colorHex: '#60a5fa',
    badgeClass: 'text-blue-400 border-blue-500/40 bg-blue-950/40',
    tagline: 'iterative denoising, best fidelity',
  },
];

export default function HeroSection() {
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
    <section id="hero" className="relative pt-28 pb-16 bg-slate-950 border-b border-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12 relative z-10">
        
        {/* Top Header Text (Statements, No Questions) */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Comparative Study on CIFAR-10 (32×32)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Generative Model Study
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
            β-VAE, WGAN-GP and class-conditional DDPM on CIFAR-10: live generation, measured benchmarks, reproducible evidence.
          </p>

          {/* Action CTAs: Solid Colors, No Neon Glow */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => scrollTo('live-lab')}
              className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm font-sans flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Open Live Lab</span>
            </button>

            <button
              onClick={() => scrollTo('benchmark')}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm font-sans flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>View Benchmark</span>
            </button>
          </div>
        </div>

        {/* Three 3D Model Representations Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {THREE_MODELS.map((m) => (
            <div
              key={m.key}
              className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3 shadow-lg hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-base" style={{ color: m.colorHex }}>
                  {m.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${m.badgeClass}`}>
                  3D Representation
                </span>
              </div>

              {/* 3D WebGL Canvas */}
              <div className="rounded-2xl overflow-hidden bg-slate-950/60 border border-slate-900">
                <Model3DView modelKey={m.key} height={200} />
              </div>

              {/* Exactly ONE descriptive line per model */}
              <div className="pt-2 border-t border-slate-800/80 text-center">
                <p className="text-xs text-slate-300 font-mono">
                  {m.tagline}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Four Headline Number Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {HEADLINE_NUMBERS.map((card) => (
            <div
              key={card.category}
              onClick={() => scrollTo(card.target)}
              className={`p-5 rounded-2xl bg-slate-900/80 border ${card.borderColor} transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-md hover:bg-slate-900`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold tracking-wider">{card.category}</span>
                  <span className="flex items-center space-x-1 text-slate-500 group-hover:text-cyan-300 transition-colors">
                    <span>evidence</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className={`text-4xl font-extrabold font-mono tracking-tight ${card.accentColor}`}>
                  {card.metric}
                </div>

                <div className="text-xs font-mono text-slate-200">
                  {card.label} <span className="text-slate-400 font-normal">({card.comparison})</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
                {card.soWhat}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
