import React from 'react';
import { ExternalLink, Github, Heart, Layers, Sparkles } from 'lucide-react';
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
                SYNTHESIS<span className="text-cyan-400">3D</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Comparative Study of VAE, GAN, and Diffusion Models on CIFAR-10
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href={RESEARCH_PROJECT.kaggleUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-all flex items-center space-x-2"
            >
              <span>Kaggle Notebook</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </a>
            <a
              href={RESEARCH_PROJECT.huggingFaceUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-all flex items-center space-x-2"
            >
              <span>HuggingFace Hub</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4">
          <p>
            Authored by <span className="text-slate-300 font-bold">{RESEARCH_PROJECT.author}</span> · MIT License
          </p>
          <p className="flex items-center space-x-1">
            <span>Built with React, Three.js & Framer Motion</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
