import React, { useState } from 'react';
import { Maximize2, AlertCircle } from 'lucide-react';

export default function TileGrid({
  tiles = [],
  rows = 4,
  cols = 4,
  isLoading = false,
  onTileClick,
  className = '',
  modelName = '',
}) {
  const targetCount = rows * cols; // 16
  const actualCount = tiles.length;
  const isDeficient = !isLoading && actualCount > 0 && actualCount < targetCount;

  if (isLoading) {
    return (
      <div className={`w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-1.5 grid grid-cols-4 grid-rows-4 gap-[2px] animate-pulse ${className}`}>
        {Array.from({ length: targetCount }).map((_, i) => (
          <div key={i} className="w-full h-full rounded bg-slate-800/80" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square group">
      <div
        className={`w-full h-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-1 grid grid-cols-4 grid-rows-4 gap-[2px] ${className}`}
        style={{ imageRendering: 'pixelated' }}
      >
        {tiles.slice(0, targetCount).map((tileSrc, idx) => (
          <div
            key={idx}
            onClick={() => onTileClick?.(tileSrc, idx)}
            className="relative w-full h-full cursor-zoom-in overflow-hidden rounded-[2px] bg-slate-900 group/tile"
          >
            <img
              src={tileSrc}
              alt={`${modelName || 'Model'} tile ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-150 group-hover/tile:scale-105"
              style={{ imageRendering: 'pixelated' }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover/tile:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Deficient notice if fewer than 16 tiles */}
      {isDeficient && (
        <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl bg-amber-950/90 border border-amber-500/60 backdrop-blur-md flex items-center space-x-2 text-[10px] font-mono text-amber-200 shadow-lg">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{actualCount} of 16 available (cached); run the Kaggle bank stage</span>
        </div>
      )}
    </div>
  );
}

