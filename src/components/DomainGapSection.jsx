import React, { useState } from 'react';
import { Activity, AlertTriangle, HelpCircle, Layers } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { DOMAIN_GAP_DATA } from '../data/researchData';
import DownstreamAccuracy from './DownstreamAccuracy';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DomainGapSection() {
  const [activeTsneTab, setActiveTsneTab] = useState('corrected');

  // Accuracy Line Chart
  const lineChartData = {
    labels: ['0% (Real)', '25% Synth', '50% Synth', '75% Synth', '100% Synth'],
    datasets: [
      {
        label: 'ResNet-18 Downstream Accuracy (%) [Preliminary 5k run]',
        data: DOMAIN_GAP_DATA.multiSeedResults.map((r) => r.accuracyMean),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        pointBackgroundColor: '#00f3ff',
        pointBorderColor: '#ffffff',
        pointRadius: 6,
        tension: 0.2,
        fill: true
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 12 } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#34d399',
        borderColor: '#10b981',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        min: 70,
        max: 85,
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

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

        {/* Multi-Seed Preliminary Downstream Classifier Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Chart & Note */}
          <div className="lg:col-span-7 p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-white">
                  Synthetic Mixture vs Accuracy (5k Low-Data Experiment)
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  3 evaluation seeds per mixture on held-out CIFAR-10 test set (mean ± std)
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 text-cyan-300 border border-slate-800">
                Low-Data 5k Subset
              </span>
            </div>

            <div className="h-64 w-full">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
              <div className="font-bold text-cyan-300">
                Downstream Utility Benchmark Note:
              </div>
              <p className="leading-relaxed text-slate-300">
                Synthetic images supplement limited real data (+4.38% gain in low-data setting: 76.76% &rarr; 81.14%, p=0.030), but cannot fully replace full 50,000-image real datasets (+0.54% gain on full data is within noise, p=0.13).
              </p>
            </div>
          </div>

          {/* Right Data Table */}
          <div className="lg:col-span-5 p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="font-heading font-bold text-base text-white flex items-center justify-between">
              <span>Preliminary Evaluation Table</span>
              <span className="text-xs font-mono text-slate-400">ResNet-18 (5k subset)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-2">Synthetic %</th>
                    <th className="py-2.5 px-2">Accuracy (Mean ± Std)</th>
                    <th className="py-2.5 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DOMAIN_GAP_DATA.multiSeedResults.map((row, idx) => (
                    <tr key={idx} className={row.ratioNumeric === 100 ? 'bg-slate-900/60 font-bold' : ''}>
                      <td className="py-3 px-2 text-slate-200">{row.syntheticRatio}</td>
                      <td className="py-3 px-2 text-cyan-300">{row.accuracyMean.toFixed(2)}% ± {row.std.toFixed(2)}%</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {row.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
              Full-data evaluation results will populate dynamically above when execution finishes.
            </div>
          </div>

        </div>

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
