import React, { useMemo } from 'react';
import {
  METRIC_CONFIG,
  formatScorecardValue,
  normalizeDirectionAware,
} from '../utils/scorecardHelpers.js';

export default function MatrixView({ allRawMetrics, allMetricsData }) {
  const models = [
    { key: 'vae',  name: 'β-VAE',    color: '#34D399', textClass: 'text-emerald-400' },
    { key: 'wgan', name: 'WGAN-GP',  color: '#FBBF24', textClass: 'text-amber-400' },
    { key: 'ddpm', name: 'DDPM',     color: '#60A5FA', textClass: 'text-blue-400' },
  ];

  const groups = [
    {
      title: 'FIDELITY (Lower FID, Higher Precision)',
      keys: ['fid', 'precision'],
    },
    {
      title: 'DIVERSITY (Higher Recall, Density, Coverage)',
      keys: ['recall', 'density', 'coverage'],
    },
    {
      title: 'PERCEPTUAL QUALITY & BASELINES †',
      keys: ['is', 'lpips', 'ssim'],
    },
    {
      title: 'HARDWARE EFFICIENCY (Tesla T4)',
      keys: ['latency', 'peakMem', 'params'],
    },
  ];

  // Helper to determine best per metric
  const bestMap = useMemo(() => {
    const map = {};
    Object.keys(METRIC_CONFIG).forEach(k => {
      const vals = models.map(m => allRawMetrics[m.key]?.[k]);
      const valid = vals.filter(v => v !== null && v !== undefined && !isNaN(v));
      if (valid.length === 0) return;

      const isLower = METRIC_CONFIG[k].direction === 'lower';
      const bestVal = isLower ? Math.min(...valid) : Math.max(...valid);

      const bestModel = models.find(m => allRawMetrics[m.key]?.[k] === bestVal);
      if (bestModel) {
        map[k] = bestModel.key;
      }
    });
    return map;
  }, [allRawMetrics]);

  return (
    <div className="space-y-4">
      {/* Title & Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h4 className="text-sm font-bold font-mono text-white tracking-tight">
            Metric × Model Heat Matrix
          </h4>
          <p className="text-xs font-mono text-slate-400">
            Cell background intensity reflects direction-aware normalized score [0, 1]. Best value per row is outlined.
          </p>
        </div>

        {/* Color-blind safe legend */}
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span>Worst (0.0)</span>
          <div className="h-3 w-24 rounded bg-gradient-to-r from-slate-900 via-emerald-950/60 to-emerald-500/80 border border-slate-700" />
          <span>Best (1.0)</span>
        </div>
      </div>

      {/* Heat Matrix Table */}
      <div className="relative overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <table className="w-full text-xs text-left border-collapse font-mono">
          {/* Sticky Header */}
          <thead className="bg-slate-900/95 text-slate-300 border-b border-slate-800 text-[11px] sticky top-0 z-20">
            <tr>
              <th className="py-3.5 px-4 sticky left-0 bg-slate-900 z-30 border-r border-slate-800 whitespace-nowrap">
                Metric Specification
              </th>
              {models.map(m => (
                <th key={m.key} className={`py-3.5 px-4 text-center font-bold whitespace-nowrap ${m.textClass}`}>
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {groups.map(grp => (
              <React.Fragment key={grp.title}>
                {/* Group Header Row */}
                <tr className="bg-slate-900/40 text-slate-400 text-[10px] font-bold tracking-wider">
                  <td colSpan={4} className="py-2 px-4 uppercase bg-slate-900/80 border-y border-slate-800">
                    {grp.title}
                  </td>
                </tr>

                {grp.keys.map(k => {
                  const cfg = METRIC_CONFIG[k];
                  const allVals = models.map(m => allRawMetrics[m.key]?.[k]);
                  const arrow = cfg.direction === 'higher' ? '↑' : '↓';

                  return (
                    <tr key={k} className="hover:bg-slate-900/30 transition-colors">
                      {/* Metric Name */}
                      <td className="py-3 px-4 sticky left-0 bg-slate-950/95 z-10 border-r border-slate-800 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-200">{cfg.label}</span>
                          <span className="text-slate-500 font-bold">{arrow}</span>
                          {cfg.isProvisional && (
                            <span className="text-amber-400 font-bold cursor-help" title="Provisional baseline">
                              †
                            </span>
                          )}
                          {cfg.unit && <span className="text-[10px] text-slate-500">({cfg.unit})</span>}
                        </div>
                      </td>

                      {/* Model Value Cells */}
                      {models.map(m => {
                        const val = allRawMetrics[m.key]?.[k];
                        const norm = normalizeDirectionAware(k, val, allVals);
                        const isBest = bestMap[k] === m.key;
                        const formatted = formatScorecardValue(k, val, m.key);

                        // Heat map background intensity
                        const bgStyle = val !== null && !isNaN(val) ? {
                          backgroundColor: `rgba(16, 185, 129, ${Math.max(0.04, norm * 0.45)})`,
                        } : {};

                        return (
                          <td
                            key={m.key}
                            style={bgStyle}
                            className={`py-3 px-4 text-center tabular-nums transition-all ${
                              isBest
                                ? 'font-extrabold text-emerald-300 ring-2 ring-emerald-400/80 ring-inset bg-emerald-500/20'
                                : 'text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-center space-x-1">
                              <span>{formatted}</span>
                              {isBest && <span className="text-[10px] text-emerald-400 font-bold">★</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnotes */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
        <p>
          <strong className="text-emerald-400 font-bold">★ Outlined cell:</strong> Best performing generative model in standardized 5-seed protocol.
        </p>
        <p className="text-amber-400/90">
          † Provisional baseline. SSIM between unpaired generated and real images is a weak quality indicator.
        </p>
      </div>
    </div>
  );
}
