import React, { useState } from 'react';
import { Table2, BarChart2, LayoutGrid, Award, Database, Download } from 'lucide-react';
import OutputsTab1Results from './OutputsTab1Results.jsx';
import OutputsTab2Plots   from './OutputsTab2Plots.jsx';
import OutputsTab3Heatmaps  from './OutputsTab3Heatmaps.jsx';
import OutputsTab4Configs   from './OutputsTab4Configs.jsx';
import OutputsTab5Datasets  from './OutputsTab5Datasets.jsx';

const TABS = [
  { id: 0, label: 'Results Tables',         Icon: Table2     },
  { id: 1, label: 'Performance Plots',      Icon: BarChart2  },
  { id: 2, label: 'Heatmaps (Param Impact)',Icon: LayoutGrid },
  { id: 3, label: 'Best Model Configs',     Icon: Award      },
  { id: 4, label: 'Synthetic Datasets',     Icon: Database   },
];

export default function OutputsPanel({ lastRun, studioSliders, activeTab, setActiveTab }) {
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
    <div id="outputs-panel" className="space-y-6">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-purple-500/40 text-purple-300 text-xs font-mono">
          <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
          <span>10. OUTPUTS</span>
        </div>
        <h3 className="text-2xl font-extrabold text-white tracking-tight">
          Results Tables · Performance Plots · Heatmaps · Best Configs · Synthetic Datasets
        </h3>
        <p className="text-xs text-slate-400 font-mono">
          Every panel reacts to the last generation. Missing data files show "pending".
        </p>
      </div>

      {/* Tab bar + Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
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
              aria-selected={activeTab === id}
              aria-controls={`outputs-panel-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                activeTab === id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300'
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
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-950/70 border border-purple-500/50 text-xs font-mono text-purple-300 hover:text-purple-100 hover:bg-purple-900/70 transition-all shadow-md shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{exporting ? 'Packaging ZIP...' : 'Export figures for report'}</span>
        </button>
      </div>

      {/* Tab panels */}
      {TABS.map(({ id }) => (
        <div
          key={id}
          role="tabpanel"
          id={`outputs-panel-${id}`}
          aria-labelledby={`outputs-tab-${id}`}
          hidden={activeTab !== id}
          className="focus-visible:outline-none"
        >
          {activeTab === id && (
            id === 0 ? <OutputsTab1Results lastRun={lastRun} /> :
            id === 1 ? <OutputsTab2Plots  lastRun={lastRun} studioSliders={studioSliders} /> :
            id === 2 ? <OutputsTab3Heatmaps lastRun={lastRun} studioSliders={studioSliders} /> :
            id === 3 ? <OutputsTab4Configs studioSliders={studioSliders} /> :
                       <OutputsTab5Datasets studioSliders={studioSliders} />
          )}
        </div>
      ))}
    </div>
  );
}
