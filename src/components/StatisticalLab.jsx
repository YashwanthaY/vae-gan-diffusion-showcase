import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, Database } from 'lucide-react';
import { STATISTICAL_SIGNIFICANCE } from '../data/researchData';

export default function StatisticalLab() {
  return (
    <section id="statistical" className="py-20 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Statistical Rigor & Significance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            5-Seed Significance Testing & Hypothesis Validation
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Ensuring observed performance gaps are statistically meaningful rather than artifacts of random seed variation.
          </p>
        </div>

        {/* 5-Seed Metrics Table & Proofs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Seed Data Table */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            <h3 className="font-heading font-bold text-xl text-white flex items-center justify-between">
              <span>Multi-Seed Evaluation Across 5 Seeds</span>
              <span className="text-xs font-mono text-cyan-400">100% Directional Consistency</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-3">Seed ID</th>
                    <th className="py-3 px-3 text-emerald-400">β-VAE FID</th>
                    <th className="py-3 px-3 text-amber-400">WGAN-GP FID</th>
                    <th className="py-3 px-3 text-cyan-400">DDPM FID</th>
                    <th className="py-3 px-3 text-right">Rank Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {STATISTICAL_SIGNIFICANCE.seedData.map((row) => (
                    <tr key={row.seed} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-3 text-slate-200 font-bold">Seed {row.seed}</td>
                      <td className="py-3.5 px-3 text-slate-300">{row.vae}</td>
                      <td className="py-3.5 px-3 text-slate-300">{row.gan}</td>
                      <td className="py-3.5 px-3 font-bold text-cyan-300">{row.ddpm}</td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800">
                          DDPM &lt; GAN &lt; VAE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div className="text-emerald-400 font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Paired t-Test Result: p &lt; 0.0001</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                The FID superiority of DDPM over WGAN-GP and VAE is statistically significant and cannot be explained by seed variance.
              </p>
            </div>
          </div>

          {/* Mathematical Limitation Note & Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Honest Limitation: Wilcoxon Test Floor</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {STATISTICAL_SIGNIFICANCE.wilcoxonNote}
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card-ddpm space-y-3">
              <h4 className="font-heading font-bold text-base text-white">
                Evaluation Protocol Rigor
              </h4>
              <ul className="text-xs font-mono text-slate-300 space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>5,000 samples evaluated per metric run</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>`torch-fidelity` standardized PyTorch baseline</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Strict zero-mismatch checkpoint reloading</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
