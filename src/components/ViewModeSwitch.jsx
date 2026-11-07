import React from 'react';
import { Image as ImageIcon, BarChart2 } from 'lucide-react';

export default function ViewModeSwitch({ mode, setMode, className = '' }) {
  return (
    <div className={`inline-flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-md ${className}`}>
      <button
        type="button"
        onClick={() => setMode('images')}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
          mode === 'images'
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="View 4×4 generated image grids (Shortcut: G)"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        <span>Images</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('graphs')}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
          mode === 'graphs'
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="View browser-computed mathematical diagnostics and graphs (Shortcut: G)"
      >
        <BarChart2 className="w-3.5 h-3.5" />
        <span>Graphs</span>
      </button>

      <span className="hidden sm:inline-block px-1.5 text-[10px] font-mono text-slate-500 border-l border-slate-800 ml-1">
        press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">G</kbd>
      </span>
    </div>
  );
}
