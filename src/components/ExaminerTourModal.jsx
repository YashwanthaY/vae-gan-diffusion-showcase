import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, HelpCircle, BookOpen,
  CheckCircle2, AlertTriangle, Zap, Sliders, BarChart3, Database, Maximize2
} from 'lucide-react';

const SLIDES = [
  {
    num: 1,
    category: 'The Question',
    title: 'Which generative model should you trust to create training data?',
    subtitle: 'A Comparative Parametric Study of β-VAE, WGAN-GP, and Class-Conditional DDPM on CIFAR-10',
    keyTakeaway: 'Generators are evaluated on downstream training utility and distribution fidelity, not just pretty pictures.',
    bullets: [
      'Comparative evaluation across three distinct probabilistic frameworks under one unified evaluation protocol.',
      'Rigorous 5-metric characterisation: FID, Precision, Recall, Density, Coverage + Inference Latency.',
      'Tested against empirical downstream classifier performance (ResNet-18) in data-scarce vs data-rich regimes.',
    ],
    highlight: 'DDPM achieves 10× better fidelity than β-VAE and rescues mode coverage where GANs fail.',
    speakerNotes: [
      'Examiner Q: "Why compare such different architectures?"',
      'Answer: VAE, GAN, and Diffusion represent three fundamentally different mathematical formulations of generative modelling (variational lower bound, minimax game, score matching / denoising). We benchmark the exact trade-offs in quality, speed, and distribution coverage.',
    ],
  },
  {
    num: 2,
    category: 'Research Protocol',
    title: 'Controlled Parametric Benchmark: Zero Cherry-Picking',
    subtitle: 'Standardized evaluation subset, 5 evaluation seeds, and strict reproducibility',
    keyTakeaway: 'Every model was evaluated on the exact same 10,000-image CIFAR-10 reference split.',
    bullets: [
      '1 trained checkpoint per model evaluated across 5 random seeds (DDPM evaluated at N=5,000, 100 steps, w=1.5).',
      'β-VAE (16.9M params, latent dim 128) vs WGAN-GP (3.56M G / 4.66M D) vs DDPM (28.0M UNet).',
      'Parameter sweeps across DDIM steps (10–200) and classifier-free guidance scale w (0.0–4.0).',
    ],
    highlight: 'FID uses N=5,000 vs 10k reference — not comparable to 50k literature figures, but strictly fair internally.',
    speakerNotes: [
      'Examiner Q: "Why is your DDPM FID 11.2 and not 3.5 like Ho et al. 2020?"',
      'Answer: Literature FID (3.17–3.55) evaluates 50,000 generated samples against the full 50,000 training set. Due to free-tier GPU constraints (Tesla T4), we compute FID with N=5,000 against a fixed 10k reference subset. All 3 models were benchmarked on the exact same harness.',
    ],
  },
  {
    num: 3,
    category: 'Fidelity & Quality',
    title: 'Distribution Fidelity: Diffusion Dominates Pixel Statistics',
    subtitle: 'DDPM FID 11.16 vs β-VAE 112.37 vs WGAN-GP 242.47',
    keyTakeaway: 'Diffusion is ~10× closer to real CIFAR-10 data distribution than variational autoencoders.',
    bullets: [
      'β-VAE suffers from pixel-space Gaussian blur due to MSE loss over high-frequency components.',
      'WGAN-GP failed to learn multi-modal CIFAR-10 data, stagnating at FID 242.47 across all 5 seeds.',
      'DDPM achieves Inception Score 9.35 (provisional), accurately resolving class semantics (airplanes, horses, ships).',
    ],
    highlight: 'Diffusion iteratively denoises across latent trajectories, sidestepping mode collapse and blur.',
    speakerNotes: [
      'Examiner Q: "Why did VAE have high FID despite good reconstruction loss?"',
      'Answer: VAE optimises the ELBO with pixel-wise reconstruction loss (MSE), which penalises average pixel distance and leads to blurred conditional means. FID measures feature statistics in Inception embedding space, where blur is heavily penalised.',
    ],
  },
  {
    num: 4,
    category: 'Diversity & Failure Post-Mortem',
    title: 'Mode Collapse: When Discriminator Loss Hides Failure',
    subtitle: 'WGAN-GP Recall 0.000 & Coverage 0.012 vs DDPM Recall 0.672',
    keyTakeaway: 'FID alone is insufficient: multi-metric evaluation uncovers complete GAN mode collapse.',
    bullets: [
      'WGAN-GP generated repetitive high-contrast textures that tricked discriminator loss but dropped 99% of modes.',
      'Precision/Recall (Sajjadi / Kynkäänniemi): DDPM Precision 0.796, Recall 0.672; WGAN-GP Recall 0.000.',
      'Density/Coverage (Naeem et al.): DDPM Coverage 0.834; WGAN-GP Coverage 0.012.',
    ],
    highlight: 'Documented Failure: Gradient penalty controls Lipschitz continuity but does not prevent mode collapse without label guidance.',
    speakerNotes: [
      'Examiner Q: "Why did WGAN-GP collapse? Did you train long enough?"',
      'Answer: Yes, trained for 100k critic steps. Unconditional WGAN-GP on 10 diverse CIFAR-10 classes without auxiliary classifier loss or projection discriminator struggles with class imbalance and complex manifolds. We document this failure transparently as a scientific finding.',
    ],
  },
  {
    num: 5,
    category: 'Compute & Pareto Frontier',
    title: 'The Quality-vs-Cost Tradeoff: 1,000× Latency Penalty',
    subtitle: '524 ms vs 0.41 ms vs 0.80 ms on NVIDIA Tesla T4',
    keyTakeaway: 'Generative quality is purchased with compute. The Pareto knee is at 50 DDIM steps with w=1.5.',
    bullets: [
      'β-VAE (0.41 ms/img) and WGAN-GP (0.80 ms/img) are single-pass feedforward networks.',
      'DDPM requires 100 iterative UNet evaluations (524 ms/img) — over 1,200× slower.',
      'Knee of Pareto front: 50 DDIM steps delivers FID 13.42 at 261 ms/img (91% of maximum quality in 50% time).',
    ],
    highlight: 'Sampling past 100 steps yields diminishing returns (<0.3 FID improvement for 2× latency).',
    speakerNotes: [
      'Examiner Q: "Can diffusion be deployed in real-time robotics or edge systems?"',
      'Answer: Direct 100-step DDPM is too slow (1.9 images/sec on T4). However, using our 50-step Pareto knee or distillation (e.g., Progressive Distillation / Consistency Models), latency can be reduced to acceptable levels.',
    ],
  },
  {
    num: 6,
    category: 'Downstream Utility',
    title: 'Does Synthetic Data Actually Help a Downstream Classifier?',
    subtitle: 'ResNet-18 Trained on CIFAR-10 Subsets + 5,000 Synthetic Images',
    keyTakeaway: 'Synthetic data helps in low-data regimes (+4.38%, p=0.030), but provides no significant gain (+0.54%, p=0.13) with full data.',
    bullets: [
      'Low data (500 real/class): Adding 5k DDPM synthetic images boosts accuracy from 79.4% to 83.78% (p = 0.030).',
      'Full data (5,000 real/class): Adding 5k synthetic images gives 92.86% vs 92.32% real-only (+0.54%, p = 0.13, not significant).',
      'Synthetic-only baseline: Model trained strictly on 5k synthetic images reaches 76.2% accuracy.',
    ],
    highlight: 'Empirical Rule: Synthetic data functions as a data regulariser when real samples are scarce; never claim "as good as real data".',
    speakerNotes: [
      'Examiner Q: "Why didn\'t synthetic data help when you had 50,000 real images?"',
      'Answer: Because the generative model was trained on the CIFAR-10 training set. Its synthetic distribution is a smoothed, slightly lossy approximation of the true distribution. When the classifier already has the full real dataset, the synthetic data introduces domain bias without new information.',
    ],
  },
  {
    num: 7,
    category: 'Conclusions & Takeaways',
    title: 'Summary: Practical Deployment Matrix',
    subtitle: 'Which generative architecture should you deploy for what task?',
    keyTakeaway: 'No single model wins all dimensions. The optimal choice depends strictly on your latency vs fidelity budget.',
    bullets: [
      'High Fidelity / Synthetic Augmentation: Class-conditional DDPM (50 DDIM steps, w=1.5).',
      'Real-Time Latency / Latent Manipulation: β-VAE (latent vector arithmetic, 0.41 ms inference).',
      'WGAN-GP on Complex Datasets: Requires auxiliary conditioning; vanilla WGAN-GP collapsed.',
      'Scientific Honesty: Published benchmarks must report evaluation reference sizes and downstream p-values.',
    ],
    highlight: 'Full reproducible code, checkpoints, evaluation harness, and raw JSON logs are openly hosted.',
    speakerNotes: [
      'Examiner Q: "What is your main takeaway recommendation?"',
      'Answer: For downstream data augmentation, class-conditional diffusion at 50 steps is the only model that provided statistically significant gains. For embedded real-time tasks, VAE remains unbeatable on speed despite lower visual sharpness.',
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
          className="relative max-w-4xl w-full bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
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
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center space-x-1.5 transition-all ${
                  showNotes
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Toggle Speaker Notes & Examiner Q&A (Hotkey: 'N')"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showNotes ? 'Hide Q&A Notes (N)' : 'Speaker Q&A (N)'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                  <span>Examiner Anticipated Question & Crisp Defense:</span>
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
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono flex items-center space-x-1 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex space-x-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIdx(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === slideIdx ? 'bg-cyan-400 w-6' : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                disabled={slideIdx === SLIDES.length - 1}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono flex items-center space-x-1 transition-all shadow-md"
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