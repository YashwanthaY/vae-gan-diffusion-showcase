import React, { useState, useEffect } from 'react';
import { Eye, AlertTriangle, X, ZoomIn } from 'lucide-react';
import { CIFAR10_CLASSES } from '../config.js';
import { CANONICAL_METRICS } from '../data/metrics.js';
import TileGrid from './TileGrid.jsx';
import { assemble16Tiles } from '../utils/tileAssembler.js';

export default function EvidenceSection({ activeTab: externalTab, setActiveTab: setExternalTab }) {
  const [internalTab, setInternalTab] = useState('classes');
  const activeTab = externalTab !== undefined ? externalTab : internalTab;
  const setActiveTab = setExternalTab || setInternalTab;

  const [activeClassIdx, setActiveClassIdx] = useState(5); // dog
  const [classTiles, setClassTiles] = useState([]);
  const [classTilesLoading, setClassTilesLoading] = useState(false);

  const [wganTiles, setWganTiles] = useState([]);
  const [wganTilesLoading, setWganTilesLoading] = useState(false);

  const [selectedTile, setSelectedTile] = useState(null);

  // Load 16 discrete tiles for selected class
  useEffect(() => {
    let isCancelled = false;
    setClassTilesLoading(true);
    const clsName = CIFAR10_CLASSES[activeClassIdx].name;

    assemble16Tiles({
      modelKey: 'ddpm',
      className: clsName,
      seed: 42,
    }).then(tiles => {
      if (!isCancelled) {
        setClassTiles(tiles);
        setClassTilesLoading(false);
      }
    }).catch(err => {
      console.warn('Failed loading class tiles:', err);
      if (!isCancelled) setClassTilesLoading(false);
    });

    return () => { isCancelled = true; };
  }, [activeClassIdx]);

  // Load 16 discrete tiles for WGAN-GP failure panel
  useEffect(() => {
    let isCancelled = false;
    setWganTilesLoading(true);

    assemble16Tiles({
      modelKey: 'wgan',
      className: 'airplane',
      seed: 42,
    }).then(tiles => {
      if (!isCancelled) {
        setWganTiles(tiles);
        setWganTilesLoading(false);
      }
    }).catch(err => {
      console.warn('Failed loading WGAN tiles:', err);
      if (!isCancelled) setWganTilesLoading(false);
    });

    return () => { isCancelled = true; };
  }, []);

  return (
    <section id="evidence" className="py-24 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Empirical Evidence & Diagnostics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Visual Quality, Trajectories & Failure Modes
          </h2>
          <p className="text-slate-400 text-sm font-mono">
            Class conditioning explorer, step-by-step denoising trajectories, latent space continuity, and documented failure cases.
          </p>
        </div>

        {/* Sub-navigation tabs: 5 canonical tabs */}
        <div className="flex flex-wrap gap-2 justify-center p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-fit mx-auto">
          {[
            { id: 'classes',      label: 'Class Explorer (4×4)' },
            { id: 'trajectory',   label: 'Denoising Trajectory' },
            { id: 'interp',       label: 'VAE Latent Interpolation' },
            { id: 'memorisation', label: 'Memorisation Check' },
            { id: 'wgan_failure', label: 'WGAN-GP Failure Panel' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Class Explorer */}
        {activeTab === 'classes' && (
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Class-Conditional Generation Explorer (4×4 Grid = 16 Samples)</h3>
              <p className="text-xs font-mono text-slate-400">
                The DDPM is conditioned on CIFAR-10 class labels (0 through 9). Each grid renders 16 discrete samples generated with DDIM-100 and w = 1.5. Click any tile to inspect.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {CIFAR10_CLASSES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveClassIdx(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeClassIdx === c.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.id}: {c.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-cyan-300">Class {activeClassIdx}: {CIFAR10_CLASSES[activeClassIdx].label} (4×4 = 16 Images)</span>
                  <span className="text-slate-400">100 DDIM steps · w = 1.5</span>
                </div>
                <div className="max-w-[420px] mx-auto md:mx-0">
                  <TileGrid
                    tiles={classTiles}
                    rows={4}
                    cols={4}
                    isLoading={classTilesLoading}
                    onTileClick={(src) => setSelectedTile({ src, title: `DDPM Class ${CIFAR10_CLASSES[activeClassIdx].label}` })}
                    modelName={`DDPM Class ${CIFAR10_CLASSES[activeClassIdx].label}`}
                  />
                </div>
              </div>
              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-cyan-400 font-bold">Class Conditioning Mechanism</div>
                  <p className="text-slate-400 leading-relaxed">
                    Labels are mapped through a learned embedding table and added directly into UNet residual blocks. Classifier-free guidance combines unconditional and conditional predictions:
                  </p>
                  <code className="block p-2 rounded bg-slate-950 text-cyan-300 border border-slate-800 text-[11px]">
                    ε = ε_uncond + w · (ε_cond - ε_uncond)
                  </code>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Setting w=0 produces unconditional generation, while w=1.5 sharpens class-specific features without mode collapse. Every tile above is rendered at 32×32 resolution with sharp pixelated scaling.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Denoising Trajectory */}
        {activeTab === 'trajectory' && (
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">DDIM Deterministic Denoising Trajectory</h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Visualizing intermediate Tweedie estimates across 100 DDIM timesteps for each CIFAR-10 class.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
              <img
                src="/img/traj/ddpm_trajectory.png"
                onError={(e) => { e.target.src = '/img/grids/ddpm_seed42.png'; }}
                alt="DDPM Denoising Trajectory Across 100 Steps"
                className="w-full h-auto rounded-xl"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <span className="text-cyan-400 font-bold">Trajectory Column Legend: </span>
              Rows correspond to the 10 CIFAR-10 classes. The columns show snapshots of the reconstructed estimate x0-hat as noise decreases from t=999 down to t=0.
            </div>
          </div>
        )}

        {/* Tab 3: VAE Latent Interpolation */}
        {activeTab === 'interp' && (
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">β-VAE Latent Manifold Linear Interpolation</h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Spherical and linear walks in the 128-dimensional Gaussian latent space.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
              <img
                src="/img/interp/vae_interp.png"
                onError={(e) => { e.target.src = '/img/grids/vae_seed42.png'; }}
                alt="VAE Latent Space Interpolation Trajectory"
                className="w-full h-auto rounded-xl"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">Latent Smoothness Observation: </span>
              Transitions between distinct classes proceed smoothly across intermediate latent vectors without abrupt structural tears, validating the continuous topology enforced by the KL-divergence ELBO term.
            </div>
          </div>
        )}

        {/* Tab 4: Memorisation Check */}
        {activeTab === 'memorisation' && (
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Generalisation vs Memorisation Diagnostic</h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Comparing generated DDPM samples against their nearest training set neighbours in pixel space.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                <img
                  src="/img/nn/ddpm_vs_nearest_real.png"
                  onError={(e) => { e.target.src = '/img/grids/ddpm_seed42.png'; }}
                  alt="DDPM vs Nearest Training Neighbor"
                  className="w-full h-auto rounded-xl"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-cyan-400 font-bold">Nearest Neighbor Pixel Diagnostic</div>
                  <p className="text-slate-400 leading-relaxed">
                    To check if the diffusion model copies training images, we query the 50,000 CIFAR-10 training images for the minimum L2 pixel distance to each generated output.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] space-y-1">
                  <span className="font-bold">⚠ Diagnostic Note: </span>
                  Pixel-space L2 nearest-neighbour check is a qualitative sanity diagnostic, not a comprehensive memorisation metric. It confirms distinct background features, poses, and color palettes from closest training samples.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: WGAN-GP Failure Panel */}
        {activeTab === 'wgan_failure' && (
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-amber-500/30 space-y-6">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">WGAN-GP Documented Mode Collapse Case Study</h3>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              In this study, WGAN-GP is retained as a fully documented generative failure case. The discriminator and generator reached an adversarial equilibrium that produced collapsed blob-like patterns across latent seeds.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-amber-400">16 Generated Samples (Mode Collapse)</span>
                  <span className="text-slate-500">Seed 42 · 150 epochs</span>
                </div>
                <div className="max-w-[420px] mx-auto md:mx-0">
                  <TileGrid
                    tiles={wganTiles}
                    rows={4}
                    cols={4}
                    isLoading={wganTilesLoading}
                    onTileClick={(src) => setSelectedTile({ src, title: 'WGAN-GP Mode Collapse Tile' })}
                    modelName="WGAN-GP Collapse"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/20">
                    <div className="text-slate-500 text-[11px]">Evaluated FID:</div>
                    <div className="text-amber-400 text-lg font-bold">{CANONICAL_METRICS.wgan.fid}</div>
                    <div className="text-[10px] text-slate-500">vs DDPM {CANONICAL_METRICS.ddpm.fid}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/20">
                    <div className="text-slate-500 text-[11px]">Precision / Recall:</div>
                    <div className="text-amber-400 text-base font-bold">Recall {CANONICAL_METRICS.wgan.recall}</div>
                    <div className="text-[10px] text-slate-500">Coverage {CANONICAL_METRICS.wgan.coverage}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/20">
                    <div className="text-slate-500 text-[11px]">Architecture:</div>
                    <div className="text-slate-200 font-bold">{CANONICAL_METRICS.wgan.params}</div>
                    <div className="text-[10px] text-slate-500">150 epochs, 1-Lipschitz GP</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-2">
                  <div className="text-amber-300 font-bold">Academic Failure Documentation:</div>
                  <p>
                    Rule R6 Compliance: WGAN-GP is never presented as a success. It demonstrates the inherent stability advantages of diffusion score-matching over adversarial minimax games under limited hyperparameter tuning.
                  </p>
                  <p className="text-slate-500">
                    All 16 tiles above display the identical untextured circular artifact regardless of latent random vector input.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedTile && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedTile(null)}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white font-mono">{selectedTile.title}</span>
                <button
                  onClick={() => setSelectedTile(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-2">
                <img
                  src={selectedTile.src}
                  alt={selectedTile.title}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 text-center">
                Native CIFAR-10 Resolution: 32×32 RGB (Pixelated Scaling)
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
