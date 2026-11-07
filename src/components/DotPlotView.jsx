import React from 'react';
import {
  METRIC_CONFIG,
  formatScorecardValue,
  normalizeDirectionAware,
} from '../utils/scorecardHelpers.js';

export default function DotPlotView({ allRawMetrics, allMetricsData }) {
  const models = [
    { key: 'vae',  name: 'β-VAE',    color: '#34D399', bg: 'bg-emerald-400' },
    { key: 'wgan', name: 'WGAN-GP',  color: '#FBBF24', bg: 'bg-amber-400' },
    { key: 'ddpm', name: 'DDPM',     color: '#60A5FA', bg: 'bg-blue-400' },
  ];

  const metrics = [
    'fid', 'precision', 'recall', 'density', 'coverage',
    'is', 'lpips', 'ssim', 'latency', 'peakMem', 'params'
  ];

  return (
    <div className="space-y-6">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h4 className="text-sm font-bold font-mono text-white tracking-tight">
            Multi-Metric Forest Dot Plot
          </h4>
          <p className="text-xs font-mono text-slate-400">
            Direction-aware normalized axis [0% = Worst, 100% = Best]. Whiskers represent standard deviation across seeds.
          </p>
        </div>

        {/* Model Legend */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          {models.map(m => (
            <div key={m.key} className="flex items-center space-x-1.5">
              <span className={`w-3 h-3 rounded-full ${m.bg}`} />
              <span className="text-slate-200 font-bold">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 bg-slate-950/70 space-y-4">
        {/* Scale labels header */}
        <div className="grid grid-cols-12 text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2">
          <div className="col-span-4 sm:col-span-3">Metric Name</div>
          <div className="col-span-8 sm:col-span-9 flex justify-between px-2">
            <span>0% (Worst)</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span className="text-emerald-400 font-bold">100% (Optimal)</span>
          </div>
        </div>

        {/* Metric Rows */}
        <div className="space-y-4">
          {metrics.map(k => {
            const cfg = METRIC_CONFIG[k];
            const allVals = models.map(m => allRawMetrics[m.key]?.[k]);
            const arrow = cfg.direction === 'higher' ? '↑' : '↓';

            return (
              <div key={k} className="grid grid-cols-12 items-center text-xs font-mono group hover:bg-slate-900/40 p-2 rounded-xl transition-colors">
                {/* Metric Label */}
                <div className="col-span-4 sm:col-span-3 pr-2">
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-slate-200">{cfg.label}</span>
                    <span className="text-slate-500">{arrow}</span>
                    {cfg.isProvisional && <span className="text-amber-400 font-bold">†</span>}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {cfg.group} {cfg.unit ? `· ${cfg.unit}` : ''}
                  </div>
                </div>

                {/* Plot Track */}
                <div className="col-span-8 sm:col-span-9 relative h-8 flex items-center px-2">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                    <div className="w-px h-full bg-slate-700" />
                    <div className="w-px h-full bg-slate-700" />
                    <div className="w-px h-full bg-slate-700" />
                    <div className="w-px h-full bg-slate-700" />
                    <div className="w-px h-full bg-slate-700" />
                  </div>

                  {/* Horizontal Track Line */}
                  <div className="w-full h-1 bg-slate-800/80 rounded-full" />

                  {/* Model Dots + Whiskers */}
                  {models.map(m => {
                    const val = allRawMetrics[m.key]?.[k];
                    if (val === null || val === undefined || isNaN(val)) return null;

                    const norm = normalizeDirectionAware(k, val, allVals);
                    const posPct = Math.min(98, Math.max(2, norm * 100));
                    const std = allRawMetrics[m.key]?.[`${k}Std`];
                    const valFormatted = formatScorecardValue(k, val, m.key);
                    const stdFormatted = std ? ` ± ${formatScorecardValue(k, std, m.key)}` : '';

                    return (
                      <div
                        key={m.key}
                        style={{ left: `${posPct}%` }}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group/dot cursor-pointer z-10"
                      >
                        {/* Dot */}
                        <div
                          className="w-4 h-4 rounded-full border-2 border-slate-950 shadow-lg transition-transform duration-150 group-hover/dot:scale-150"
                          style={{ backgroundColor: m.color }}
                        />

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-30 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl">
                          <span className="font-bold" style={{ color: m.color }}>{m.name}: </span>
                          <span>{valFormatted}{stdFormatted} {cfg.unit}</span>
                          <span className="text-[10px] text-slate-500 block">Score: {(norm * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
