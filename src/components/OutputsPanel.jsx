import React, { useState } from 'react';
import { Table2, BarChart2, LayoutGrid, Award, Database, Download, Sparkles } from 'lucide-react';
import OutputsTab1Results from './OutputsTab1Results.jsx';
import OutputsTab2Plots   from './OutputsTab2Plots.jsx';
import OutputsTab3Heatmaps  from './OutputsTab3Heatmaps.jsx';
import OutputsTab4Configs   from './OutputsTab4Configs.jsx';
import OutputsTab5Datasets  from './OutputsTab5Datasets.jsx';

const TABS = [
  { id: 0, label: 'Results & Benchmark',     Icon: Table2     },
  { id: 1, label: 'Performance Plots',       Icon: BarChart2  },
  { id: 2, label: 'Heatmaps (Param Impact)', Icon: LayoutGrid },
  { id: 3, label: 'Best Model Configs',      Icon: Award      },
  { id: 4, label: 'Synthetic Datasets',      Icon: Database   },
];

const TAKEAWAYS = {
  0: 'Benchmark takeaway: Under standardized 5-seed protocols, DDPM delivers the highest distribution fidelity (FID 11.2) and coverage (0.834), while WGAN-GP collapses with recall 0.000.',
  1: 'Pareto takeaway: DDPM achieves a 10× quality advantage over β-VAE and GANs, with a Pareto-optimal knee at 50 DDIM steps and guidance scale w=1.5.',
  2: 'Parameter sweep takeaway: Diffusion fidelity saturates past 100 DDIM steps, while classifier-free guidance w > 2.0 trades away recall and sample diversity.',
  3: 'Configuration takeaway: 50 DDIM steps at w=1.5 yields 91% of maximum DDPM quality at nearly half the sampling latency.',
  4: 'Utility takeaway: Synthetic augmentation increases downstream ResNet-18 accuracy by +4.38 pts (p=0.030) in data-scarce regimes, but provides no significant gain (+0.54 pts, p=0.13) with full training sets.',
};

export default function OutputsPanel({ lastRun, studioSliders, activeTab = 0, setActiveTab, onNavigateEvidence }) {
  const [internalTab, setInternalTab] = useState(0);
  const currentTab = activeTab !== undefined ? activeTab : internalTab;
  const setTab = setActiveTab || setInternalTab;

  const [exporting, setExporting] = useState(false);

  const handleExportFigures = async () => {
    setExporting(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      // Find all canvas elements in the outputs panel (charts and heatmaps)
      const canvases = document.querySelectorAll('#outputs-panel canvas');
      canvases.forEach((c, idx) => {
        try {
          const dataUrl = c.toDataURL('image/png');
          const b64 = dataUrl.split(',')[1];
          if (b64) {
            zip.file(`fig_${idx + 1}_chart.png`, b64, { base64: true });
          }
        } catch (e) {
          console.warn('Canvas export failed:', e);
        }
      });

      // Add run.json if lastRun exists
      if (lastRun) {
        zip.file('run.json', JSON.stringify(lastRun, null, 2));
      }

      // Add benchmark tables & JSON
      try {
        const prdcRes = await fetch('/data/json/prdc.json');
        if (prdcRes.ok) zip.file('prdc.json', await prdcRes.text());
        const speedRes = await fetch('/data/json/speed.json');
        if (speedRes.ok) zip.file('speed.json', await speedRes.text());
        const infoRes = await fetch('/data/json/models_info.json');
        if (infoRes.ok) zip.file('models_info.json', await infoRes.text());
      } catch (e) {}

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'figures_and_tables_report.zip';
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section id="benchmark" className="py-24 relative bg-slate-950 border-t border-slate-900">
      <div id="findings" className="sr-only" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10" id="outputs-panel">

        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-purple-500/40 text-purple-300 text-xs font-mono shadow-md">
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Research Findings · 5-Metric Benchmark</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Comparative Benchmark & Empirical Findings
          </h2>
          <p className="text-slate-400 text-sm font-mono">
            Standardized evaluation across 5 random seeds, parameter sweeps, and downstream ResNet-18 utility.
          </p>
        </div>

        {/* Tab bar + Export Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div
            role="tablist"
            aria-label="Outputs tabs"
            className="flex flex-wrap gap-2"
          >
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                role="tab"
                id={`outputs-tab-${id}`}
                aria-selected={currentTab === id}
                aria-controls={`outputs-panel-${id}`}
                onClick={() => setTab(id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  currentTab === id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleExportFigures}
            disabled={exporting}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-950/70 border border-purple-500/50 text-xs font-mono text-purple-300 hover:text-purple-100 hover:bg-purple-900/70 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Packaging ZIP...' : 'Export figures for report'}</span>
          </button>
        </div>

        {/* Plain-English Takeaway Banner */}
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm font-mono flex items-start space-x-3 shadow-md">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-400 font-bold uppercase tracking-wider mr-2">Key Finding:</strong>
            <span>{TAKEAWAYS[currentTab]}</span>
          </div>
        </div>

        {/* Tab panels */}
        {TABS.map(({ id }) => (
          <div
            key={id}
            role="tabpanel"
            id={`outputs-panel-${id}`}
            aria-labelledby={`outputs-tab-${id}`}
            hidden={currentTab !== id}
            className="focus-visible:outline-none"
          >
            {currentTab === id && (
              id === 0 ? <OutputsTab1Results lastRun={lastRun} studioSliders={studioSliders} onNavigateEvidence={onNavigateEvidence} /> :
              id === 1 ? <OutputsTab2Plots  lastRun={lastRun} studioSliders={studioSliders} /> :
              id === 2 ? <OutputsTab3Heatmaps lastRun={lastRun} studioSliders={studioSliders} /> :
              id === 3 ? <OutputsTab4Configs studioSliders={studioSliders} /> :
                         <OutputsTab5Datasets studioSliders={studioSliders} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}