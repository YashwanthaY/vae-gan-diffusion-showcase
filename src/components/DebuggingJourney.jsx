import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ChevronDown, ChevronUp, Code, AlertOctagon, Terminal, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { DEBUGGING_POSTMORTEMS } from '../data/researchData';

export default function DebuggingJourney() {
  const [expandedId, setExpandedId] = useState(3); // Default expand case #3 (Cosine schedule bug)

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="debugging" className="py-20 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-purple-500/30 text-purple-400 text-xs font-mono">
            <Bug className="w-3.5 h-3.5" />
            <span>Post-Mortem Engineering Journey</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            6 Non-Obvious Debugging Post-Mortems
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Documenting the root causes, mathematical subtleties, silent evaluation corruptions, and exact code patches encountered during generative model development.
          </p>
        </div>

        {/* Post-Mortem Cards List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {DEBUGGING_POSTMORTEMS.map((caseStudy) => {
            const isExpanded = expandedId === caseStudy.id;

            return (
              <div
                key={caseStudy.id}
                className={`rounded-2xl border transition-all glass-panel ${
                  isExpanded
                    ? 'border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <button
                  onClick={() => toggleExpand(caseStudy.id)}
                  className="w-full p-5 flex items-center justify-between text-left space-x-4 focus:outline-none"
                >
                  <div className="flex items-center space-x-4">
                    <span className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 font-mono font-bold text-sm flex items-center justify-center border border-purple-800/60">
                      #{caseStudy.id}
                    </span>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                          {caseStudy.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border ${caseStudy.badgeColor}`}>
                          {caseStudy.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1">
                        Symptom: {caseStudy.symptom}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-slate-400 hidden sm:block">
                      {isExpanded ? 'Collapse' : 'Inspect Patch'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-purple-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-6 space-y-4 border-t border-slate-800/80 pt-4"
                    >
                      {/* Root Cause & Fix Explanation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                          <div className="font-bold text-amber-400 font-mono flex items-center space-x-1.5">
                            <AlertOctagon className="w-4 h-4" />
                            <span>Root Cause Analysis:</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {caseStudy.rootCause}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                          <div className="font-bold text-emerald-400 font-mono flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Resolution & Fix:</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {caseStudy.fix}
                          </p>
                        </div>
                      </div>

                      {/* Code Snippet Patch */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                          <span className="flex items-center space-x-1">
                            <Code className="w-3.5 h-3.5 text-purple-400" />
                            <span>Code Patch & Verification Protocol</span>
                          </span>
                          <span className="text-slate-500">Python / PyTorch</span>
                        </div>
                        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                          <code>{caseStudy.codeSnippet}</code>
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
