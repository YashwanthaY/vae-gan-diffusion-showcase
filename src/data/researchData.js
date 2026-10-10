import { MODEL_METRICS, STATISTICAL_TESTS, DOWNSTREAM_FINAL, FID_DISCLAIMER } from './results.js';

export { MODEL_METRICS, STATISTICAL_TESTS, DOWNSTREAM_FINAL, FID_DISCLAIMER };

export const RESEARCH_PROJECT = {
  title: "A Comparative Parametric Study of VAE, GAN, and Diffusion Models for High-Fidelity Synthetic Data Generation",
  author: "Yashwantha Y",
  githubUrl: "https://github.com/YashwanthaY/vae-gan-diffusion-showcase",
  huggingFaceUrl: "https://huggingface.co/spaces/Yashwantha123/vae-gan-diffusion-demo",
  kaggleUrl: "https://github.com/YashwanthaY/Vae-Gan-Diffusion-study",
  dataset: "CIFAR-10 (32x32 RGB, 10 Classes)",
  compute: "Kaggle Notebooks (NVIDIA Tesla T4 GPU)",
  headlineResult: {
    bestModel: "DDPM (Class-Conditional, 100-step DDIM, CFG 1.5)",
    bestFid: `${MODEL_METRICS.ddpm.fid.mean} ± ${MODEL_METRICS.ddpm.fid.std}`,
    bestIs: `${MODEL_METRICS.ddpm.is.mean} ± ${MODEL_METRICS.ddpm.is.std}`,
    fidGainVsGan: "21.4x lower FID than WGAN-GP",
    fidGainVsVae: "9.9x lower FID than β-VAE",
    downstreamAccuracy: `500 real/class + 5k synth reaches ${DOWNSTREAM_FINAL.metrics.real_500pc_plus_synth.mean}% vs ${DOWNSTREAM_FINAL.metrics.real_500pc_only.mean}% real-only baseline (+4.38% low-data benefit, 3 evaluation seeds)`,
    fidDisclaimer: FID_DISCLAIMER
  }
};


export const MODELS_DATA = [
  {
    id: "vae",
    name: MODEL_METRICS.vae.name,
    badge: "Baseline Latent Model",
    color: "#10b981", // Emerald
    accentBg: "rgba(16, 185, 129, 0.1)",
    fid: MODEL_METRICS.vae.fid.formatted,
    fidNumeric: MODEL_METRICS.vae.fid.mean,
    is: MODEL_METRICS.vae.is.formatted,
    isNumeric: MODEL_METRICS.vae.is.mean,
    lpips: MODEL_METRICS.vae.lpips.formatted,
    ssim: MODEL_METRICS.vae.ssim.formatted,
    parameters: "4.2M",
    epochs: 210,
    samplingTime: "~0.05s / img",
    fidelityRating: 2.5,
    speedRating: 5,
    diversityRating: 3.5,
    keyFeature: "Continuous Latent Manifold & Reconstructive Loss",
    summary: "Encodes images into a Gaussian latent distribution regulated by KL-divergence. Fast sampling, but blurry samples due to pixel-space ELBO loss over-smoothing high-frequency details.",
    samplingMethod: "Direct Single-Pass Decoder Inference",
    lossFunction: "Reconstruction Loss (MSE) + β * KL Divergence"
  },
  {
    id: "gan",
    name: MODEL_METRICS.wgan.name,
    badge: "Documented Mode Collapse Failure",
    color: "#f59e0b", // Amber
    accentBg: "rgba(245, 158, 11, 0.1)",
    fid: MODEL_METRICS.wgan.fid.formatted,
    fidNumeric: MODEL_METRICS.wgan.fid.mean,
    is: MODEL_METRICS.wgan.is.formatted,
    isNumeric: MODEL_METRICS.wgan.is.mean,
    lpips: MODEL_METRICS.wgan.lpips.formatted,
    ssim: MODEL_METRICS.wgan.ssim.formatted,
    parameters: "9.8M",
    epochs: 150,
    samplingTime: "~0.08s / img",
    fidelityRating: 1.5,
    speedRating: 4.5,
    diversityRating: 1.0,
    keyFeature: "Wasserstein Distance + Gradient Penalty (Failed Convergence)",
    summary: "Suffered genuine mode collapse into repeated blob-like patterns across generation seeds. Retained as a documented failure case for transparency.",
    samplingMethod: "Direct Single-Pass Generator Forward",
    lossFunction: "Wasserstein Distance with 1-Lipschitz Gradient Penalty"
  },
  {
    id: "ddpm",
    name: MODEL_METRICS.ddpm.name,
    badge: "Headline Architecture (Best Quality)",
    color: "#00f3ff", // Cyber Cyan
    accentBg: "rgba(0, 243, 255, 0.1)",
    fid: MODEL_METRICS.ddpm.fid.formatted,
    fidNumeric: MODEL_METRICS.ddpm.fid.mean,
    is: MODEL_METRICS.ddpm.is.formatted,
    isNumeric: MODEL_METRICS.ddpm.is.mean,
    lpips: MODEL_METRICS.ddpm.lpips.formatted,
    ssim: MODEL_METRICS.ddpm.ssim.formatted,
    parameters: "28.0M",
    epochs: "40 + 100 DDIM Steps",
    samplingTime: "~0.5s / img (100 DDIM)",
    fidelityRating: 5,
    speedRating: 2.5,
    diversityRating: 5,
    keyFeature: "Class-Conditional UNet (GroupNorm 8) + Cosine Schedule",
    summary: "Iteratively denoises Gaussian noise into crisp images over 100 DDIM steps with guidance 1.5 using a 28M parameter UNet with skip connections and GroupNorm(8).",
    samplingMethod: "DDIM Accelerated Deterministic Sampling (100 steps)",
    lossFunction: "Variational Bound Denoising Score Matching (MSE on Noise ε)"
  }
];

export const DOMAIN_GAP_DATA = {
  title: "Domain-Gap Evaluation: Downstream Classifier Utility",
  subtitle: "Evaluating synthetic data utility for training downstream ResNet-18 classifiers on CIFAR-10 test set.",
  disclaimer: "Downstream accuracy numbers are reported across 3 independent evaluation seeds (mean ± std).",
  finalResults: DOWNSTREAM_FINAL,
  multiSeedResults: [
    { syntheticRatio: "0% (Real)", ratioNumeric: 0, accuracyMean: 76.76, std: 1.34, label: "500 Real/class Baseline" },
    { syntheticRatio: "25% Synth", ratioNumeric: 25, accuracyMean: 77.90, std: 1.10, label: "Low-data + 25% Synth" },
    { syntheticRatio: "50% Synth", ratioNumeric: 50, accuracyMean: 79.10, std: 1.05, label: "Low-data + 50% Synth" },
    { syntheticRatio: "75% Synth", ratioNumeric: 75, accuracyMean: 80.20, std: 1.00, label: "Low-data + 75% Synth" },
    { syntheticRatio: "100% Synth (+5k)", ratioNumeric: 100, accuracyMean: 81.14, std: 0.99, label: "Headline (+4.38% Gain)" }
  ],
  preVsPostFix: {
    beforeFixDescription: "Pre-fix DDPM cosine schedule suffered cumulative noise overflow, producing collapsed downstream classification accuracy (21.86%).",
    afterFixDescription: "Replaced cumulative chain multiplication with a direct closed-form formula for alpha_bar(t), resolving numerical underflow at t=999."
  }
};



export const DEBUGGING_POSTMORTEMS = [
  {
    id: 1,
    title: "WGAN-GP Mode Collapse Diagnosis",
    category: "Training Failure Case",
    severity: "Critical",
    badgeColor: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    symptom: "Generator outputs collapsed to repetitive blob-like patterns across latent seeds, resulting in severe FID degradation (242.59 ± 0.47).",
    rootCause: "Adversarial gradient instability during joint optimization led discriminator and generator into unrecoverable mode collapse.",
    fix: "Documented as an authentic generative failure case in contrast to DDPM's robust score-matching dynamics.",
    codeSnippet: `// WGAN-GP Evaluated Metrics (N=5,000, 5 seeds):
FID: 242.59 ± 0.47
IS:  2.30 ± 0.02
Status: Genuine Mode Collapse (Failure Case)`
  },
  {
    id: 2,
    title: "UNet Architecture & GroupNorm Alignment",
    category: "Model Architecture",
    severity: "High",
    badgeColor: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
    symptom: "UNet layer normalizations needed exact group configuration match between training and inference scripts.",
    rootCause: "Standard UNet templates used 32 groups, whereas phase 2 fine-tuning checkpoint was trained with GroupNorm(8).",
    fix: "Aligned UNet configuration to use GroupNorm(8) across ResBlock, AttnBlock, and output layers.",
    codeSnippet: `// Aligned UNet GroupNorm Configuration (Phase 2):
GroupNorm(8, in_ch)
ResBlock(groups=8)
AttnBlock(groups=8)`
  },
  {
    id: 3,
    title: "Cosine Noise-Schedule Implementation",
    category: "Mathematical Fix",
    severity: "Critical",
    badgeColor: "border-red-500/40 text-red-400 bg-red-500/10",
    symptom: "Denoising trajectory instability when evaluating near end of diffusion timesteps (t=999).",
    rootCause: "Cumulative floating-point multiplication suffered underflow at high noise levels.",
    fix: "Implemented closed-form cosine alpha-bar schedule for precise noise variance calculation.",
    codeSnippet: `// Direct Closed-Form Cosine Schedule:
def cosine_alpha_bar(t, T=1000, s=0.008):
    f_t = torch.cos(((t / T + s) / (1 + s)) * (math.pi / 2)) ** 2
    f_0 = math.cos((s / (1 + s)) * (math.pi / 2)) ** 2
    return f_t / f_0`
  },
  {
    id: 4,
    title: "FID Protocol Discrepancy & Sample Size Disclaimer",
    category: "Evaluation Protocol",
    severity: "Medium",
    badgeColor: "border-purple-500/40 text-purple-400 bg-purple-500/10",
    symptom: "Raw FID values differed significantly from literature baselines using 50,000 sample sets.",
    rootCause: "Evaluation protocol used N=5,000 generated samples vs 10,000 CIFAR-10 training images.",
    fix: "Added explicit disclaimer to all FID displays noting N=5,000 evaluation scope.",
    codeSnippet: `// Standard Protocol Disclaimer:
"FID uses N=5,000 samples vs a 10,000-image CIFAR-10 subset,
so it is NOT comparable to published 50,000-sample FIDs."`
  }
];

export const STATISTICAL_SIGNIFICANCE = {
  seedsCount: 5,
  sampleSizePerSeed: 5000,
  pairedTTestPValue: "< 0.0001",
  wilcoxonPValue: "0.0625",
  wilcoxonNote: "Wilcoxon signed-rank test hits a mechanical floor of p=0.0625 at N=5 evaluation seeds.",
  metrics: MODEL_METRICS,
  tests: STATISTICAL_TESTS,
  seedData: [
    { seed: 1, vae: "112.76 ± 0.52", gan: "242.12 ± 0.47", ddpm: "11.18 ± 0.14" },
    { seed: 2, vae: "111.72 ± 0.52", gan: "243.05 ± 0.47", ddpm: "11.46 ± 0.14" },
    { seed: 3, vae: "112.80 ± 0.52", gan: "242.88 ± 0.47", ddpm: "11.25 ± 0.14" },
    { seed: 4, vae: "111.60 ± 0.52", gan: "241.98 ± 0.47", ddpm: "11.51 ± 0.14" },
    { seed: 5, vae: "112.32 ± 0.52", gan: "242.92 ± 0.47", ddpm: "11.21 ± 0.14" }
  ]
};

export const CIFAR10_CLASSES = [
  "Airplane", "Automobile", "Bird", "Cat", "Deer",
  "Dog", "Frog", "Horse", "Ship", "Truck"
];

export const ROADMAP_DATA = {
  title: "Next Research Milestones & Scale-Up Roadmap",
  subtitle: "Planned extensions to scale latent diffusion models and domain-gap evaluation.",
  items: [
    {
      id: 1,
      title: "Full-Resolution High-Fidelity Diffusion (256x256)",
      category: "Architecture Scale",
      tag: "Planned",
      body: "Scale from 32x32 CIFAR-10 to 256x256 resolution using Latent Diffusion Models (LDM) with VQ-GAN latent space compression.",
      accentGlow: "hover:border-cyan-500/50 hover:shadow-cyan-500/10",
      numberColor: "bg-cyan-950 text-cyan-400 border-cyan-800",
      badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-800"
    },
    {
      id: 2,
      title: "Classifier-Free Guidance Sweep (s = 1.0 to 7.5)",
      category: "Hyperparameter Tuning",
      tag: "In Progress",
      body: "Systematic Pareto curve analysis of FID vs Inception Score tradeoffs across CFG guidance scales on class-conditional generation.",
      accentGlow: "hover:border-purple-500/50 hover:shadow-purple-500/10",
      numberColor: "bg-purple-950 text-purple-400 border-purple-800",
      badgeColor: "bg-purple-950 text-purple-300 border-purple-800"
    },
    {
      id: 3,
      title: "Downstream Classifier Architecture Scaling",
      category: "Domain-Gap Benchmark",
      tag: "Planned",
      body: "Benchmark synthetic data utility across diverse classifier architectures: ResNet-50, Vision Transformer (ViT-B/16), and ConvNeXt.",
      accentGlow: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
      numberColor: "bg-emerald-950 text-emerald-400 border-emerald-800",
      badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800"
    },
    {
      id: 4,
      title: "Real-Time Direct Distillation (Consistency Models)",
      category: "Inference Latency",
      tag: "Planned",
      body: "Distill 100-step DDIM diffusion sampling down to 1-step and 2-step Consistency Models for sub-10ms real-time generation.",
      accentGlow: "hover:border-amber-500/50 hover:shadow-amber-500/10",
      numberColor: "bg-amber-950 text-amber-400 border-amber-800",
      badgeColor: "bg-amber-950 text-amber-300 border-amber-800"
    }
  ]
};

