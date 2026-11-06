import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers, Cpu, Sliders, BarChart3, Binary, ArrowRight,
  ExternalLink, CheckCircle2, AlertOctagon, HelpCircle, ChevronRight
} from 'lucide-react';

const RESEARCH_QUESTIONS = [
  {
    id: 'rq1',
    code: 'RQ1',
    title: 'Which generative model gives the best fidelity?',
    answer: 'Class-conditional DDPM achieves an FID of 11.16, outperforming β-VAE (112.37) by 10× and WGAN-GP (242.47). Generated samples accurately capture high-frequency CIFAR-10 edges and textures.',
    metric: 'DDPM FID 11.16 vs VAE 112.37 vs GAN 242.47',
    targetId: 'findings',
    tagColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/60',
  },
  {
    id: 'rq2',
    code: 'RQ2',
    title: 'Which model covers the true distribution (diversity)?',
    answer: 'DDPM achieves Recall of 0.672 and Coverage of 0.834. In contrast, WGAN-GP completely collapses to mode collapse (Recall 0.000, Coverage 0.012), proving that discriminator loss fails to penalise dropped modes.',
    metric: 'DDPM Recall 0.672 vs WGAN 0.000 (Mode Collapse)',
    targetId: 'debugging',
    tagColor: 'text-rose-400 border-rose-500/40 bg-rose-950/60',
  },
  {
    id: 'rq3',
    code: 'RQ3',
    title: 'What does generative quality cost in compute?',
    answer: 'Quality comes at an exponential inference cost. DDPM requires 524 ms/image on a Tesla T4 (100 steps) compared to 0.41 ms for β-VAE and 0.80 ms for WGAN-GP — a ~1,000× latency tradeoff.',
    metric: '524 ms vs 0.41 ms vs 0.80 ms (1,000× compute)',
    targetId: 'findings',
    tagColor: 'text-amber-400 border-amber-500/40 bg-amber-950/60',
  },
  {
    id: 'rq4',
    code: 'RQ4',
    title: 'How do sampling steps and guidance change output?',
    answer: 'Guidance w=1.5 and 50 DDIM steps sits at the knee of the Pareto frontier. Increasing steps beyond 100 yields marginal FID gains (<0.3) while doubling latency. CFG w > 2.0 artificially boosts precision while hurting recall.',
    metric: 'Pareto knee: 50 DDIM steps, w = 1.5',
    targetId: 'findings',
    tagColor: 'text-purple-400 border-purple-500/40 bg-purple-950/60',
  },
  {
    id: 'rq5',
    code: 'RQ5',
    title: 'Does synthetic data actually help a downstream classifier?',
    answer: 'Synthetic augmentation boosts ResNet-18 accuracy by +4.38% (p = 0.030) in low-data regimes (500 real samples/class). However, when full real data (5,000/class) is present, synthetic images provide no statistically significant gain (+0.54%, p = 0.13).',
    metric: 'Low-data: +4.38% (p=0.030) | Full data: +0.54% (p=0.13)',
    targetId: 'downstream',
    tagColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60',
  },
];

const PROTOCOL_STEPS = [
  {
    phase: '01. Reference Dataset',
    name: 'CIFAR-10 (32×32)',
    desc: '50k train split, 10 balanced classes. Fixed 10,000-image reference subset for Fréchet embeddings.',
    badge: 'Standardized Input',
  },
  {
    phase: '02. Architectures',
    name: '3 Model Families',
    desc: 'β-VAE (16.9M, latent 128) · WGAN-GP (3.56M G / 4.66M D) · DDPM (28.0M UNet, GroupNorm32).',
    badge: 'Identical Capacity Range',
  },
  {
    phase: '03. Sweeps & Seeds',
    name: 'Controlled Variation',
    desc: '5 evaluation seeds [42, 123, 256, 512, 999]. Parameter grid: DDIM steps 10–200, guidance w 0.0–4.0.',
    badge: '5-Seed Protocol',
  },
  {
    phase: '04. Multi-Metric Eval',
    name: '5 Formal Metrics',
    desc: 'FID vs 10k CIFAR-10, Precision & Recall (k=5), Density & Coverage (Naeem et al.), Inference Latency.',
    badge: 'Holistic Characterisation',
  },
  {
    phase: '05. Downstream Utility',
    name: 'ResNet-18 Classifier',
    desc: 'Train ResNet-18 under 6 regimes (real-only 500/1k/50k vs real + synthetic 5k). Paired t-tests & p-values.',
    badge: 'Empirical Proof',
  },
];

export default function ResearchDesignSection() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="design" className="py-24 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">

        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Methodology & Evaluation Protocol</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Research Design & Experimental Protocol
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            This project is not a demo gallery. It is a controlled parametric study comparing three fundamentally distinct generative paradigms under an identical, reproducible evaluation harness.
          </p>
        </div>

        {/* Interactive SVG / Visual Protocol Flow */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>End-to-End Experimental Pipeline</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Zero Cherry-Picking · Fixed Evaluation Reference
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {PROTOCOL_STEPS.map((step, idx) => (
              <div
                key={step.phase}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between space-y-3 relative group hover:border-cyan-500/50 transition-all shadow-md"
              >
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    {step.phase}
                  </div>
                  <div className="text-sm font-bold text-white">{step.name}</div>
                  <p className="text-xs text-slate-400 leading-snug">{step.desc}</p>
                </div>
                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {step.badge}
                  </span>
                </div>

                {idx < PROTOCOL_STEPS.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-slate-600">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>⚠ Formal Note: FID computed with N = 5,000 generated images vs 10,000-image CIFAR-10 reference. NOT comparable to published 50k-sample literature.</span>
            <span className="text-cyan-400 font-bold">Hardware: NVIDIA Tesla T4</span>
          </div>
        </div>

        {/* 5 Research Questions Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-xl font-bold text-white">5 Core Research Questions (RQ1–RQ5)</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Each question was tested empirically against null hypotheses. Click any card to inspect the experimental data.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
              Evaluated with 5 Seeds
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESEARCH_QUESTIONS.map((rq) => (
              <div
                key={rq.id}
                onClick={() => scrollTo(rq.targetId)}
                className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-cyan-500/50 cursor-pointer flex flex-col justify-between space-y-4 group transition-all shadow-lg hover:shadow-cyan-500/5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-mono font-bold ${rq.tagColor}`}>
                      {rq.code}
                    </span>
                    <span className="flex items-center space-x-1 text-xs font-mono text-slate-400 group-hover:text-cyan-300 transition-colors">
                      <span>See evidence</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                    {rq.title}
                  </h4>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {rq.answer}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <span className="truncate">{rq.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}