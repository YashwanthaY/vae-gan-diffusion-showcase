import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Sparkles, BarChart3, Layers, Globe, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ROADMAP_DATA } from '../data/researchData';

const icons = [Sparkles, BarChart3, Layers, Globe];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-20 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Compass className="w-3.5 h-3.5" />
            <span>Future Work & Research Directions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {ROADMAP_DATA.title}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            {ROADMAP_DATA.subtitle}
          </p>
        </div>

        {/* 2x2 Grid of Roadmap Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {ROADMAP_DATA.items.map((item, index) => {
            const Icon = icons[index % icons.length];

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between space-y-5 transition-all duration-300 hover:bg-slate-900/60 ${item.accentGlow}`}
              >
                <div className="space-y-4">
                  {/* Top Badge & Step Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`w-8 h-8 rounded-xl font-mono font-bold text-xs flex items-center justify-center border ${item.numberColor}`}>
                        #{String(item.id).padStart(2, '0')}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border ${item.badgeColor}`}>
                        {item.category}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60">
                      {item.tag}
                    </span>
                  </div>

                  {/* Title with Icon */}
                  <div className="flex items-start space-x-3 pt-1">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 text-slate-300">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-white tracking-tight leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Body Text */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {item.body}
                  </p>
                </div>

                {/* Footer status bar inside card */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center space-x-1.5 text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Scope Definition Finalized</span>
                  </span>
                  <span className="flex items-center space-x-1 text-cyan-400 font-semibold group cursor-pointer hover:underline">
                    <span>Roadmap Node</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
