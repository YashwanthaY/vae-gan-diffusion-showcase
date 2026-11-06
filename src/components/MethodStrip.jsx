import React from 'react';
import { Layers, ArrowRight, Sliders, Database, Cpu, BarChart2, CheckCircle2 } from 'lucide-react';

const METHOD_STEPS = [
  {
    step: '01',
    title: 'Reference Split',
    detail: 'CIFAR-10 (32×32, 10 classes). Fixed 10 000-image training reference subset for Fréchet embeddings.',
  },
  {
    step: '02',
    title: '3 Architectures',
    detail: 'β-VAE (16.90 M), WGAN-GP (3.56 M G / 4.66 M D), and class-conditional DDPM (28.01 M UNet).',
  },
  {
    step: '03',
    title: 'Controlled Sweeps',
    detail: '5 evaluation seeds. Parameter grid across DDIM steps (10–200) and guidance scale w (0.0–4.0).',
  },
  {
    step: '04',
    title: '5 Formal Metrics',
    detail: 'FID vs 10k CIFAR-10, Precision & Recall (k=5), Density & Coverage, and inference latency on Tesla T4.',
  },
  {
    step: '05',
    title: 'Downstream Utility',
    detail: 'ResNet-18 classifier evaluation comparing real-only vs synthetic data regimes with paired t-tests.',
  },
];

export default function MethodStrip() {
  return (
    <div id="method" className="py-8 bg-slate-950/80 border-y border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-300">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-white">Evaluation Protocol & Method</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Standardized across all three generative paradigms</span>
          </div>
          <span className="text-[11px] text-slate-500">
            N = 5 000 generated images per model per seed · NVIDIA Tesla T4
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {METHOD_STEPS.map((m, idx) => (
            <div
              key={m.step}
              className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-1 relative group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
                <span className="font-bold">{m.step}</span>
                <span className="text-slate-400 text-[10px] uppercase">{m.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-snug font-sans">
                {m.detail}
              </p>
              {idx < METHOD_STEPS.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-700 pointer-events-none">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

