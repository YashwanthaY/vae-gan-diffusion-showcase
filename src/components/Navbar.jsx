import React from 'react';
import { Cpu, ExternalLink, Github, Layers, Sparkles, Zap } from 'lucide-react';
import { RESEARCH_PROJECT } from '../data/researchData';

export default function Navbar({ activeModel, setActiveModel }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand logo & title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollTo('hero')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-extrabold text-lg tracking-tight text-white">
                SYNTHESIS<span className="text-cyan-400">3D</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded-full">
                CIFAR-10 ML Study
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              by <span className="text-slate-200 font-semibold">{RESEARCH_PROJECT.author}</span>
            </p>
          </div>
        </div>

        {/* Section Quick Links */}
        <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-300">
          <button onClick={() => scrollTo('live-api')} className="hover:text-cyan-400 transition-colors flex items-center space-x-1 text-cyan-300 font-semibold">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Try Live API</span>
          </button>
          <button onClick={() => scrollTo('models')} className="hover:text-cyan-400 transition-colors">
            Models Benchmark
          </button>
          <button onClick={() => scrollTo('domain-gap')} className="hover:text-cyan-400 transition-colors">
            Domain Gap Utility
          </button>
          <button onClick={() => scrollTo('debugging')} className="hover:text-cyan-400 transition-colors flex items-center space-x-1">
            <span>Debugging Post-Mortems</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-purple-900/60 text-purple-300 rounded border border-purple-700/50">6 Cases</span>
          </button>
          <button onClick={() => scrollTo('playground')} className="hover:text-cyan-400 transition-colors">
            DDIM Simulator
          </button>
          <button onClick={() => scrollTo('statistical')} className="hover:text-cyan-400 transition-colors">
            Statistical Proofs
          </button>
        </nav>

        {/* External Badges & Model Selector Toggle */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveModel('vae')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                activeModel === 'vae'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              β-VAE
            </button>
            <button
              onClick={() => setActiveModel('gan')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                activeModel === 'gan'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WGAN-GP
            </button>
            <button
              onClick={() => setActiveModel('ddpm')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                activeModel === 'ddpm'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DDPM
            </button>
          </div>

          <a
            href={RESEARCH_PROJECT.huggingFaceUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 transition-all"
          >
            <span>HF Hub</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

      </div>
    </header>
  );
}
