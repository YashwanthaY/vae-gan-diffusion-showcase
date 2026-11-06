import React from 'react';
import { Database, Download, Sparkles } from 'lucide-react';
import OutputsTab5Datasets from './OutputsTab5Datasets.jsx';

export default function SyntheticDataSection({ studioSliders }) {
  return (
    <section id="synthetic-data" className="py-24 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-md">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Empirical Data Generation Tool</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Synthetic Dataset Builder
          </h2>
          <p className="text-slate-400 text-sm font-mono leading-relaxed">
            Generate custom class-balanced synthetic CIFAR-10 training datasets in batches of 16, exported directly into PyTorch-ready ZIP archives.
          </p>
        </div>

        {/* Dataset Builder Component */}
        <OutputsTab5Datasets studioSliders={studioSliders} />
      </div>
    </section>
  );
}

