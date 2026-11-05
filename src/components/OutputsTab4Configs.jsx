import React, { useMemo } from 'react';
import { Award, Zap, Target, ArrowRight } from 'lucide-react';
import useJsonData from '../hooks/useJsonData.js';

/**
 * Find the "knee" of a Pareto front (point with maximum perpendicular distance
 * from the line joining the first and last points on the sorted front).
 * points: [{x: cost, y: fid, ...}] sorted by cost ascending.
 * Returns the index of the knee point.
 */
export function paretoKnee(points) {
  if (!points || points.length < 3) return points?.length ? 0 : -1;
  const A = points[0];
  const B = points[points.length - 1];
  const dx = B.x - A.x, dy = B.y - A.y;
  const lineDist = Math.sqrt(dx * dx + dy * dy);
  if (lineDist === 0) return 0;

  let maxDist = -Infinity, kneeIdx = 0;
  for (let i = 0; i < points.length; i++) {
    const P = points[i];
    // Perpendicular distance from P to line AB
    const dist = Math.abs(dy * P.x - dx * P.y + B.x * A.y - B.y * A.x) / lineDist;
    if (dist > maxDist) { maxDist = dist; kneeIdx = i; }
  }
  return kneeIdx;
}

// Config card
function ConfigCard({ title, icon: Icon, color, config, onApply }) {
  if (!config) return (
    <div className={`p-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 space-y-2`}>
      <div className="flex items-center space-x-2 text-slate-500 text-sm font-bold">
        <Icon className="w-4 h-4" /><span>{title}</span>
      </div>
      <p className="text-xs font-mono text-slate-600">pending: run Kaggle evaluation stages</p>
    </div>
  );

  return (
    <div className={`p-5 rounded-2xl border ${color} glass-panel space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm font-bold text-white">
          <Icon className="w-4 h-4" /><span>{title}</span>
        </div>
        <button
          onClick={() => onApply(config)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700 text-xs font-mono text-cyan-300 hover:border-cyan-500/50 hover:text-cyan-200 transition-all"
        >
          <ArrowRight className="w-3.5 h-3.5" /><span>Apply to Studio</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {[
          ['Steps',    config.steps],
          ['CFG w',    config.cfg],
          ['FID',      config.fid?.toFixed(3)],
          ['Precision',config.precision?.toFixed(3)],
          ['Recall',   config.recall?.toFixed(3)],
          ['N',        config.n],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between">
            <span className="text-slate-500">{label}:</span>
            <span className="text-slate-200 font-bold">{val ?? '—'}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 font-mono">Source: {config.source}</p>
    </div>
  );
}

export default function OutputsTab4Configs({ studioSliders, setStudioSliders }) {
  const { data: sweeps } = useJsonData('/data/json/sweeps.json');
  const { data: speed }  = useJsonData('/data/json/speed.json');
  const { data: prdc }   = useJsonData('/data/json/prdc.json');

  const { best, fastest, knee } = useMemo(() => {
    const pts = [];
    const ddpm100ms = speed?.ddpm100_ms_per_img ?? null;

    // From sweeps.json steps
    if (sweeps?.steps?.length) {
      sweeps.steps.forEach(p => {
        if (p.fid !== null && p.fid !== undefined) {
          pts.push({ steps: p.steps, cfg: p.w ?? 1.5, fid: p.fid, precision: p.precision, recall: p.recall, n: sweeps.n, source: 'sweeps.json steps', x: ddpm100ms ? ddpm100ms * p.steps / 100 : p.steps });
        }
      });
    }

    // prdc.json DDPM 100-step point
    if (prdc?.ddpm?.fid?.mean !== null && prdc?.ddpm?.fid?.mean !== undefined) {
      pts.push({ steps: 100, cfg: 1.5, fid: prdc.ddpm.fid.mean, precision: prdc.ddpm.precision?.mean, recall: prdc.ddpm.recall?.mean, n: prdc.ddpm.n_images, source: 'prdc.json (100-step)', x: ddpm100ms ?? 100 });
    }

    if (!pts.length) return { best: null, fastest: null, knee: null };

    // Sort by x (cost) ascending
    pts.sort((a, b) => a.x - b.x);

    const minFid = Math.min(...pts.map(p => p.fid));
    const bestConfig = pts.find(p => p.fid === minFid);

    const threshold = minFid * 1.1;
    const within10 = pts.filter(p => p.fid <= threshold);
    const fastestConfig = within10.reduce((a, b) => (a.x < b.x ? a : b), within10[0]);

    const kneeIdx = paretoKnee(pts);
    const kneeConfig = pts[kneeIdx];

    return { best: bestConfig, fastest: fastestConfig, knee: kneeConfig };
  }, [sweeps, speed, prdc]);

  const handleApply = (config) => {
    // Fire a custom event for GenerativeLab to listen
    window.dispatchEvent(new CustomEvent('apply-config', { detail: { steps: config.steps, cfg: config.cfg } }));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
        Candidate set = measured DDPM configs (sweeps.json + prdc.json 100-step). Costs are NFE and derived ms/img from speed.json.
        <strong className="text-amber-300 ml-2">Values from different N and seeds are not mixed</strong>; each card states its source file.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ConfigCard
          title="Highest Quality (lowest FID)"
          icon={Award}
          color="border-emerald-500/40"
          config={best}
          onApply={handleApply}
        />
        <ConfigCard
          title="Fastest within 10% of Best FID"
          icon={Zap}
          color="border-amber-500/40"
          config={fastest}
          onApply={handleApply}
        />
        <ConfigCard
          title="Best Trade-off (Pareto Knee)"
          icon={Target}
          color="border-cyan-500/40"
          config={knee}
          onApply={handleApply}
        />
      </div>
    </div>
  );
}
