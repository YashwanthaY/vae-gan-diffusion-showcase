import React from 'react';
import { ExternalLink, Github, Sparkles, BookOpen, Layers } from 'lucide-react';
import { RESEARCH_PROJECT } from '../data/researchData';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-slate-900">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="font-heading font-extrabold text-xl tracking-tight text-white">
                Generative Model Study
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800/60 font-bold">
                CIFAR-10 BENCHMARK
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Comparative Parametric Evaluation of β-VAE, WGAN-GP, and Class-Conditional DDPM
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5 font-bold">
              AJIET, Department of Computer Science & Engineering (AI & ML), 2026–27
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href={RESEARCH_PROJECT.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Github className="w-3.5 h-3.5 text-slate-300" />
              <span>GitHub Repo</span>
            </a>
            <a
              href={RESEARCH_PROJECT.huggingFaceUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>HF Space Models</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4">
          <p>
            Project Team: <span className="text-slate-300 font-bold">{RESEARCH_PROJECT.author}</span> · Final-Year Engineering Showcase
          </p>
          <p className="flex items-center space-x-1">
            <span>Free-tier Tesla T4 · React 18 · Vite · ZeroGPU · TailwindCSS · Chart.js</span>
          </p>
        </div>

      </div>
    </footer>
  );
}