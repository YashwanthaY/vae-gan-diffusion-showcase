import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, HelpCircle, BookOpen,
  CheckCircle2, AlertTriangle, Zap, Sliders, BarChart3, Database
} from 'lucide-react';
import { CANONICAL_METRICS } from '../data/metrics';

const SLIDES = [
  {
    num: 1,
    category: 'Project Overview',
    title: 'Generative Model Evaluation on CIFAR-10',
    subtitle: 'Comparative Parametric Study of β-VAE, WGAN-GP, and Class-Conditional DDPM',
    keyTakeaway: 'Generative architectures are benchmarked on distribution fidelity and downstream training utility under one standardized protocol.',
    bullets: [
      'Evaluation across three distinct probabilistic frameworks under one unified evaluation protocol.',
      '5-metric characterisation: FID, Precision, Recall, Density, Coverage plus inference latency.',
      'Empirical downstream classifier testing (ResNet-18) in data-scarce vs data-rich regimes.',
    ],
    highlight: 'DDPM achieves ~10× better fidelity than β-VAE and maintains full distribution coverage where WGAN-GP collapses.',
    speakerNotes: [
      'Architecture Selection Rationale: VAE, GAN, and Diffusion represent three fundamentally distinct mathematical formulations of generative modelling. We benchmark their empirical tradeoffs in fidelity, latency, and mode coverage.',
    ],
  },
  {
    num: 2,
    category: 'Research Protocol',
    title: 'Standardized Evaluation Methodology',
    subtitle: 'Fixed reference subset, 5 evaluation seeds, and strict reproducibility',
    keyTakeaway: 'Every model was evaluated on the exact same 10 000-image CIFAR-10 reference split.',
    bullets: [
      '1 trained checkpoint per model evaluated across 5 random seeds (DDPM evaluated at N = 5 000, 100 steps, w = 1.5).',
      'β-VAE (16.90 M) vs WGAN-GP (3.56 M G / 4.66 M D) vs DDPM (28.01 M UNet).',
      'Parameter sweeps across DDIM steps (10–200) and classifier-free guidance scale w (0.0–4.0).',
    ],
    highlight: 'Protocol constraint: FID uses N = 5 000 vs 10k reference — not comparable to 50k literature figures, but strictly controlled internally.',
    speakerNotes: [
      'FID Sample Count Context: Literature FID values evaluate 50 000 generated samples against 50 000 training images. Due to GPU constraints on Tesla T4, we compute paired FID with N = 5 000 against a fixed 10 000 reference subset.',
    ],
  },
  {
    num: 3,
    category: 'Fidelity & Quality',
    title: 'Distribution Fidelity Benchmark',
    subtitle: `DDPM FID ${CANONICAL_METRICS.ddpm.fid} vs β-VAE ${CANONICAL_METRICS.vae.fid} vs WGAN-GP ${CANONICAL_METRICS.wgan.fid}`,
    keyTakeaway: 'Diffusion achieves ~10× closer distribution alignment to real CIFAR-10 data than variational autoencoders.',
    bullets: [
      'β-VAE exhibits characteristic reconstruction blur due to pixel-space ELBO loss averaging high-frequency details.',
      'WGAN-GP failed to model multi-modal CIFAR-10 data without conditional guidance.',
      'DDPM accurately resolves class semantics across all 10 CIFAR-10 categories.',
    ],
    highlight: 'Diffusion iteratively denoises across latent trajectories, avoiding reconstruction blur and mode collapse.',
    speakerNotes: [
      'Reconstruction Blur Explanation: VAE optimizes the ELBO with pixel-wise MSE, which penalizes distance to conditional means. FID measures feature statistics in Inception embedding space, where smooth edges receive higher penalties.',
    ],
  },
  {
    num: 4,
    category: 'Diversity & Failure Analysis',
    title: 'Mode Collapse Diagnostics',
    subtitle: `WGAN-GP Recall ${CANONICAL_METRICS.wgan.recall} & Coverage ${CANONICAL_METRICS.wgan.coverage} vs DDPM Recall ${CANONICAL_METRICS.ddpm.recall}`,
    keyTakeaway: 'Multi-metric evaluation uncovers complete GAN mode collapse that standard loss metrics mask.',
    bullets: [
      'WGAN-GP generated repetitive high-contrast textures that reached adversarial equilibrium but dropped distribution modes.',
      `Precision and Recall: DDPM Precision ${CANONICAL_METRICS.ddpm.precision}, Recall ${CANONICAL_METRICS.ddpm.recall}; WGAN-GP Recall ${CANONICAL_METRICS.wgan.recall}.`,
      `Density and Coverage: DDPM Coverage ${CANONICAL_METRICS.ddpm.coverage}; WGAN-GP Coverage ${CANONICAL_METRICS.wgan.coverage}.`,
    ],
    highlight: 'Documented Failure: Gradient penalty controls Lipschitz continuity but does not prevent mode collapse without label conditioning.',
    speakerNotes: [
      'Mode Collapse Diagnostic: Unconditional WGAN-GP on 10 diverse CIFAR-10 classes without projection discriminator or auxiliary classifier loss struggles with manifold complexity. This failure is documented transparently.',
    ],
  },
  {
    num: 5,
    category: 'Compute & Pareto Frontier',
    title: 'Quality-vs-Cost Tradeoff Curve',
    subtitle: `${CANONICAL_METRICS.ddpm.latency} ms vs ${CANONICAL_METRICS.vae.latency} ms vs ${CANONICAL_METRICS.wgan.latency} ms per image on Tesla T4`,
    keyTakeaway: 'Generative quality requires iterative compute. The Pareto knee sits at 50 DDIM steps with w = 1.5.',
    bullets: [
      'β-VAE (0.41 ms/img) and WGAN-GP (0.80 ms/img) are single-pass feedforward models.',
      'DDPM requires 100 iterative UNet evaluations (524 ms/img) — a ~1 000× latency tradeoff.',
      'Knee of Pareto front: 50 DDIM steps yields 91% of maximum quality in 50% of sampling time.',
    ],
    highlight: 'Sampling past 100 DDIM steps yields diminishing returns (<0.3 FID improvement for 2× latency).',
    speakerNotes: [
      'Deployment Feasibility: Direct 100-step DDPM is too compute-intensive for embedded robotics. However, 50-step DDIM or progressive distillation provides a practical operational trade-off.',
    ],
  },
  {
    num: 6,
    category: 'Downstream Utility',
    title: 'Downstream Classifier Utility Benchmark',
    subtitle: 'ResNet-18 Trained on CIFAR-10 Subsets + 5 000 Synthetic Images',
    keyTakeaway: 'Synthetic data provides significant gains in low-data regimes (+4.38 pts, p = 0.030), but no significant gain (+0.54 pts, p = 0.13) with full real data.',
    bullets: [
      'Low data (500 real/class): Adding 5k DDPM synthetic images boosts accuracy from 76.76% to 81.14% (+4.38 pts, p = 0.030).',
      'Full data (5 000 real/class): Adding 5k synthetic images gives 94.11% vs 93.58% real-only (+0.54 pts, p = 0.13, n.s.).',
      'Synthetic-only baseline: Model trained strictly on 5k synthetic images reaches 73.64% test accuracy.',
    ],
    highlight: 'Empirical Rule: Synthetic data functions as an effective regulariser under scarcity, but does not substitute for real data at scale.',
    speakerNotes: [
      'Full Data Marginal Gain: The generative model is trained on the CIFAR-10 train set. Its distribution is a smoothed approximation. With full real data, synthetic images introduce inductive bias without new information.',
    ],
  },
  {
    num: 7,
    category: 'Conclusions',
    title: 'Practical Deployment Matrix',
    subtitle: 'Operational recommendations across generative paradigms',
    keyTakeaway: 'No single model dominates all axes. Selection depends strictly on latency vs fidelity requirements.',
    bullets: [
      'High Fidelity / Synthetic Data Augmentation: Class-conditional DDPM (50 DDIM steps, w = 1.5).',
      'Real-Time Latency / Latent Manipulation: β-VAE (latent vector arithmetic, 0.41 ms inference).',
      'WGAN-GP on Complex Datasets: Requires auxiliary conditioning; unconditional variant collapsed.',
      'Scientific Rigour: Published benchmarks must report evaluation reference sizes and downstream p-values.',
    ],
    highlight: 'Full reproducible code, checkpoints, evaluation harness, and raw JSON logs are openly hosted.',
    speakerNotes: [
      'Primary Takeaway: Class-conditional diffusion at 50 steps is the optimal recommendation for downstream data augmentation, while VAE remains essential for real-time edge deployment.',
    ],
  },
];

export default function ExaminerTourModal({ isOpen, onClose }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const currentSlide = SLIDES[slideIdx];

  const nextSlide = useCallback(() => {
    setSlideIdx(i => Math.min(SLIDES.length - 1, i + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setSlideIdx(i => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'n' || e.key === 'N') {
        setShowNotes(v => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, nextSlide, prevSlide, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="examiner-tour-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          key="examiner-tour-card"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold">
                Slide {currentSlide.num} of {SLIDES.length}
              </span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                {currentSlide.category}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNotes(v => !v)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
                  showNotes
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Toggle Speaker Notes & Defense (Hotkey: 'N')"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showNotes ? 'Hide Defense Notes (N)' : 'Speaker Notes (N)'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close presentation (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Slide Body */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {currentSlide.title}
              </h2>
              <p className="text-sm font-mono text-cyan-400">
                {currentSlide.subtitle}
              </p>
            </div>

            {/* Key Takeaway Banner */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-sm font-mono flex items-start space-x-3">
              <span className="font-bold text-cyan-400 shrink-0">TAKEAWAY:</span>
              <span>{currentSlide.keyTakeaway}</span>
            </div>

            {/* Bullets */}
            <div className="space-y-3">
              {currentSlide.bullets.map((b, i) => (
                <div key={i} className="flex items-start space-x-3 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {/* Highlight Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-emerald-300 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{currentSlide.highlight}</span>
            </div>

            {/* Speaker Notes Drawer */}
            {showNotes && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/50 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Discussion Defense & Context:</span>
                </div>
                {currentSlide.speakerNotes.map((sn, i) => (
                  <p key={i} className="text-xs font-mono text-amber-200/90 leading-relaxed">
                    {sn}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar Navigation */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
              <span>Keys: ← / → / Space to navigate · 'N' for speaker notes</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={prevSlide}
                disabled={slideIdx === 0}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono flex items-center space-x-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex space-x-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIdx(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      i === slideIdx ? 'bg-cyan-400 w-6' : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                disabled={slideIdx === SLIDES.length - 1}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono flex items-center space-x-1 transition-all shadow-md cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
