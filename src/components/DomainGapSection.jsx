import React, { useState } from 'react';
import { Activity, AlertTriangle, HelpCircle, Layers } from 'lucide-react';
import { DOMAIN_GAP_DATA } from '../data/researchData';
import DownstreamAccuracy from './DownstreamAccuracy';

export default function DomainGapSection() {
  const [activeTsneTab, setActiveTsneTab] = useState('corrected');

  return (
    <section id="domain-gap" className="py-20 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span>Downstream Utility Evaluation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Domain-Gap Analysis: Downstream Classifier Utility
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Training a ResNet-18 classifier on varying proportions of real vs. DDPM-generated synthetic images to evaluate feature representation quality beyond pixel statistics.
          </p>
        </div>

        {/* Dynamic Full-Data Downstream Accuracy Slot */}
        <DownstreamAccuracy />

        {/* Schedule Bug Diagnosis */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  Schedule Bug Post-Mortem & Diagnosis
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
                FID alone failed to catch a critical cumulative alpha schedule bug — downstream accuracy testing revealed it instantly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-rose-950 text-rose-400 border border-rose-800">
                  Pre-Fix DDPM (Cosine Schedule Bug)
                </span>
                <span className="text-xs font-mono text-rose-400 font-bold">Accuracy: 21.86%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {DOMAIN_GAP_DATA.preVsPostFix.beforeFixDescription}
              </p>
              <div className="flex justify-between text-xs font-mono pt-2 border-t border-rose-900/50">
                <span className="text-slate-400">FID Score: 11.70 (Unstable)</span>
                <span className="text-rose-400 font-bold">Downstream Acc: 21.86% (Collapsed)</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Post-Fix DDPM (Closed-Form Schedule)
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">Closed-Form Alpha</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Replaced cumulative chain multiplication with a direct closed-form formula for alpha_bar(t), resolving numerical underflow at t=999.
              </p>
              <div className="flex justify-between text-xs font-mono pt-2 border-t border-emerald-900/50">
                <span className="text-slate-400">FID Score: 11.32 ± 0.14</span>
                <span className="text-emerald-400 font-bold">Status: Fixed</span>
              </div>
            </div>
          </div>

          {/* t-SNE Feature Map Viewer */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h4 className="font-heading font-bold text-lg text-white">
                t-SNE Feature Space Overlay (Real vs Synthetic)
              </h4>

              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveTsneTab('corrected')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTsneTab === 'corrected'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Post-Fix: Feature Space Overlap
                </button>
                <button
                  onClick={() => setActiveTsneTab('pre-fix')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTsneTab === 'pre-fix'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pre-Fix: Separate Clusters (Domain Gap)
                </button>
                <button
                  onClick={() => setActiveTsneTab('per-class')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTsneTab === 'per-class'
                      ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Per-Class Breakdown
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex justify-center">
              {activeTsneTab === 'corrected' && (
                <img
                  src="/assets/tsne_corrected_500step.png"
                  alt="t-SNE corrected real vs synthetic feature space"
                  className="w-full h-auto object-contain max-h-[480px] rounded-xl"
                  loading="lazy"
                />
              )}
              {activeTsneTab === 'pre-fix' && (
                <img
                  src="/assets/tsne_domain_gap.png"
                  alt="t-SNE pre-fix domain gap separate clustering"
                  className="w-full h-auto object-contain max-h-[480px] rounded-xl"
                  loading="lazy"
                />
              )}
              {activeTsneTab === 'per-class' && (
                <img
                  src="/assets/tsne_perclass.png"
                  alt="t-SNE per-class breakdown"
                  className="w-full h-auto object-contain max-h-[480px] rounded-xl"
                  loading="lazy"
                />
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
