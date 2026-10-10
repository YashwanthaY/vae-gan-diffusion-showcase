import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, TrendingUp, BarChart2, AlertCircle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DOWNSTREAM_FINAL } from '../data/results';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DISPLAY_NAME_MAP = {
  real_full_50k: "Real Baseline (50,000 Real)",
  real_full_plus_synth: "Real 50k + Synthetic 5k",
  real_1000pc_only: "Real Control (1,000/class = 10,000)",
  real_500pc_plus_synth: "500 Real/class + 5k Synthetic",
  real_500pc_only: "Real Only (500/class = 5,000)",
  synthetic_only_500pc: "Synthetic Only (500/class = 5,000)"
};

export default function DownstreamAccuracy() {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missingJson, setMissingJson] = useState(false);

  useEffect(() => {
    fetch('/results/downstream_v2.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setJsonData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.info("results/downstream_v2.json not available:", err.message);
        setMissingJson(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 flex items-center space-x-2">
        <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
        <span>Loading downstream evaluation dataset (results/downstream_v2.json)...</span>
      </div>
    );
  }

  // Fallback when JSON is missing or invalid
  const activeResults = (!missingJson && jsonData && jsonData.results) ? jsonData.results : DOWNSTREAM_FINAL.metrics;
  const isFallback = missingJson || !jsonData || !jsonData.results;

  // Order entries: real_full_50k, real_full_plus_synth, real_1000pc_only, real_500pc_plus_synth, real_500pc_only, synthetic_only_500pc
  const ORDERED_KEYS = [
    'real_full_50k',
    'real_full_plus_synth',
    'real_1000pc_only',
    'real_500pc_plus_synth',
    'real_500pc_only',
    'synthetic_only_500pc'
  ];

  const entries = ORDERED_KEYS
    .filter((k) => activeResults[k] !== undefined)
    .map((k) => [k, activeResults[k]]);

  // Compute low-data delta (500 real + synth vs 500 real only)
  let lowDataDelta = null;
  if (activeResults.real_500pc_plus_synth && activeResults.real_500pc_only) {
    const synthPlusReal = activeResults.real_500pc_plus_synth.mean;
    const realOnly = activeResults.real_500pc_only.mean;
    lowDataDelta = (synthPlusReal - realOnly).toFixed(2);
  }

  // Compute full-data delta
  let fullDataDelta = null;
  if (activeResults.real_full_plus_synth && activeResults.real_full_50k) {
    const fullPlusSynth = activeResults.real_full_plus_synth.mean;
    const fullReal = activeResults.real_full_50k.mean;
    fullDataDelta = (fullPlusSynth - fullReal).toFixed(2);
  }

  const chartLabels = entries.map(([key]) => DISPLAY_NAME_MAP[key] || key);
  const chartValues = entries.map(([, val]) => val.mean);

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'ResNet-18 Final Test Accuracy (%)',
        data: chartValues,
        backgroundColor: entries.map(([key]) => 
          key === 'real_500pc_plus_synth' ? 'rgba(0, 243, 255, 0.85)' :
          key === 'real_1000pc_only' ? 'rgba(168, 85, 247, 0.75)' :
          key.includes('real_full') ? 'rgba(16, 185, 129, 0.75)' : 'rgba(148, 163, 184, 0.5)'
        ),
        borderColor: entries.map(([key]) => 
          key === 'real_500pc_plus_synth' ? '#00f3ff' :
          key === 'real_1000pc_only' ? '#a855f7' :
          key.includes('real_full') ? '#10b981' : '#64748b'
        ),
        borderWidth: 1.5,
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#38bdf8',
        borderColor: '#334155',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        min: 65,
        max: 100,
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-cyan-500/40 space-y-6 font-mono text-xs text-slate-200">
      
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base font-heading">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Downstream ResNet-18 Classifier Evaluation</span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {isFallback ? (
              <span className="text-amber-400 font-semibold">Loaded from central LOCKED FACTS fallback (results/downstream_v2.json loading)</span>
            ) : (
              <span>Loaded dynamically from <code className="text-cyan-400">results/downstream_v2.json</code> (3 evaluation seeds, mean ± std)</span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {lowDataDelta && (
            <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Low-Data Benefit: +{lowDataDelta}% (p=0.030)</span>
            </span>
          )}
        </div>
      </div>

      {/* Chart View */}
      <div className="h-64 w-full">
        <Bar data={barChartData} options={chartOptions} />
      </div>

      {/* Accuracy Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2.5 px-3">Evaluation Setting</th>
              <th className="py-2.5 px-3">Accuracy (Mean ± Std)</th>
              <th className="py-2.5 px-3">Protocol / Runs</th>
              <th className="py-2.5 px-3">Key Insight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {entries.map(([key, val]) => {
              const numRuns = val.runs ? val.runs.length : (val.std !== undefined && val.std !== null ? 3 : 1);
              const isSingleRun = numRuns === 1 || val.std === null || val.std === undefined;
              const displayAccuracy = isSingleRun
                ? `${val.mean.toFixed(2)}%`
                : `${val.mean.toFixed(2)}% ± ${val.std.toFixed(2)}%`;

              return (
                <tr key={key} className={key === 'real_500pc_plus_synth' ? 'bg-cyan-950/40 font-bold text-cyan-300' : key === 'real_1000pc_only' ? 'bg-purple-950/30 text-purple-200' : ''}>
                  <td className="py-3 px-3 text-slate-200">{DISPLAY_NAME_MAP[key] || key}</td>
                  <td className="py-3 px-3 font-bold text-cyan-300">{displayAccuracy}</td>
                  <td className="py-3 px-3 text-slate-400">
                    {isSingleRun ? "single run" : `n = ${numRuns} seeds`}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {key === 'real_500pc_plus_synth' && lowDataDelta ? `+${lowDataDelta}% low-data gain (p=0.030)` :
                     key === 'real_full_plus_synth' && fullDataDelta ? `+${fullDataDelta}% vs full real (p=0.13: NOT significant)` :
                     key === 'real_1000pc_only' ? 'Control: synthetic images worth less than real ones (81.14% < 83.07%)' :
                     key === 'synthetic_only_500pc' ? 'Synthetic data alone (3.12% below real 500pc, p=0.041)' :
                     key === 'real_500pc_only' ? 'Low-data baseline (5,000 total images)' :
                     key === 'real_full_50k' ? 'Full dataset control (50,000 real images)' : 'Control'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed space-y-1">
        <div><strong>Wording & Protocol Rules:</strong> Only the real baseline (93.58%) and real+synthetic (94.11%) exceed 92%; synthetic-only (73.64%) does not. The +0.54% gain on full data is small, consistent, but not statistically significant (p=0.13).</div>
        <div><strong>Essential Control:</strong> 500pc + synthetic (81.14%) remains below real 1,000pc (83.07%), demonstrating that synthetic images are worth less than real ones.</div>
        <div><strong>Evaluation Limits:</strong> 3 seeds, single generator (DDPM), single classifier architecture (ResNet-18), 500 synthetic images per class.</div>
      </div>

    </div>
  );
}

