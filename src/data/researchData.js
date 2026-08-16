export const RESEARCH_PROJECT = {
  title: "Comparative Study of VAE, GAN, and Diffusion Models on CIFAR-10",
  author: "Yashwantha",
  githubUrl: "https://github.com/Yashwantha123/vae-gan-diffusion-study",
  huggingFaceUrl: "https://huggingface.co/Yashwantha123/vae-gan-diffusion-study",
  kaggleUrl: "https://www.kaggle.com/code/yashwanthagastya/vae-gan-diffusion-comparative-study",
  dataset: "CIFAR-10 (32x32 RGB, 10 Classes)",
  compute: "Kaggle Notebooks (NVIDIA Tesla T4 GPU)",
  headlineResult: {
    bestModel: "DDPM (Class-Conditional)",
    bestFid: 10.03,
    bestIs: 9.44,
    fidGainVsGan: "7.7x",
    fidGainVsVae: "12x",
    downstreamAccuracy: "57.10% ± 0.91% (Matches Real-Data Baseline 58.93%)"
  }
};

export const MODELS_DATA = [
  {
    id: "vae",
    name: "β-VAE",
    badge: "Baseline Latent Model",
    color: "#10b981", // Emerald
    accentBg: "rgba(16, 185, 129, 0.1)",
    fid: "123.28 ± 0.59",
    fidNumeric: 123.28,
    is: "3.85 ± 0.03",
    isNumeric: 3.85,
    parameters: "4.2M",
    epochs: 60,
    samplingTime: "~0.05s / img",
    fidelityRating: 2,
    speedRating: 5,
    diversityRating: 3,
    keyFeature: "Continuous Latent Manifold & Reconstructive Loss",
    summary: "Encodes images into a Gaussian latent distribution regulated by KL-divergence. Fast sampling, but blurry samples due to MSE loss over-smoothing high-frequency details.",
    samplingMethod: "Direct Single-Pass Decoder Inference",
    lossFunction: "Reconstruction Loss (MSE) + β * KL Divergence"
  },
  {
    id: "gan",
    name: "WGAN-GP (v3)",
    badge: "Adversarial Engine",
    color: "#f59e0b", // Amber
    accentBg: "rgba(245, 158, 11, 0.1)",
    fid: "77.19 ± 0.54",
    fidNumeric: 77.19,
    is: "4.95 ± 0.05",
    isNumeric: 4.95,
    parameters: "9.8M",
    epochs: 150,
    samplingTime: "~0.08s / img",
    fidelityRating: 3.5,
    speedRating: 4.5,
    diversityRating: 3.5,
    keyFeature: "Wasserstein Distance + Gradient Penalty Stabilization",
    summary: "Uses a Discriminator network to critique Generator samples. Stabilized with Gradient Penalty to prevent mode collapse and training divergence.",
    samplingMethod: "Direct Single-Pass Generator Forward",
    lossFunction: "Wasserstein Distance with 1-Lipschitz Gradient Penalty (E[D(x)] - E[D(G(z))])"
  },
  {
    id: "ddpm",
    name: "DDPM (Final)",
    badge: "State-of-the-Art Diffusion",
    color: "#00f3ff", // Cyber Cyan
    accentBg: "rgba(0, 243, 255, 0.1)",
    fid: "10.03",
    fidNumeric: 10.03,
    is: "9.44",
    isNumeric: 9.44,
    parameters: "28.0M",
    epochs: "40 + 500 DDIM Steps",
    samplingTime: "~2.4s / img (500 DDIM)",
    fidelityRating: 5,
    speedRating: 2,
    diversityRating: 5,
    keyFeature: "Class-Conditional UNet + Closed-Form Cosine Schedule",
    summary: "Iteratively denoises Gaussian noise into crisp images over 500 DDIM timesteps using a 28M parameter UNet with skip connections and AdaGN conditioning.",
    samplingMethod: "DDIM Deterministic / Stochastic Accelerated Sampling",
    lossFunction: "Variational Bound Denoising Score Matching (Simplified MSE on Noise ε)"
  }
];

export const DOMAIN_GAP_DATA = {
  title: "Domain-Gap Analysis: Synthetic Data Utility for Downstream ResNet-18 Classifier",
  subtitle: "Testing whether synthetic images actually hold up as training replacement data for a ResNet-18 model trained on real CIFAR-10 test set evaluation.",
  multiSeedResults: [
    { syntheticRatio: "0% (Real Only)", ratioNumeric: 0, accuracyMean: 58.93, std: 2.89, label: "Real Baseline" },
    { syntheticRatio: "25% Synthetic", ratioNumeric: 25, accuracyMean: 59.23, std: 3.08, label: "25% Replacing Real" },
    { syntheticRatio: "50% Synthetic", ratioNumeric: 50, accuracyMean: 58.37, std: 2.22, label: "Half & Half Mix" },
    { syntheticRatio: "75% Synthetic", ratioNumeric: 75, accuracyMean: 59.05, std: 1.37, label: "75% Synthetic Mix" },
    { syntheticRatio: "100% (Synthetic Only)", ratioNumeric: 100, accuracyMean: 57.10, std: 0.91, label: "Full Synthetic" }
  ],
  preVsPostFix: {
    metric: "ResNet-18 100%-Synthetic Downstream Accuracy",
    beforeFix: 21.86, // Barely above 10% random chance!
    beforeFixFid: 11.70,
    beforeFixDescription: "Pre-fix DDPM (cosine schedule chain multiplication bug hit near-zero denominator at t=999, silently corrupting high-frequency latent structures). Classifier collapsed!",
    afterFix: 57.10,
    afterFixFid: 10.03,
    afterFixDescription: "Post-fix DDPM (closed-form alpha schedule). Synthetic-trained classifier achieves 57.10%, matching the 58.93% real-data baseline with full t-SNE feature overlap!"
  }
};

export const DEBUGGING_POSTMORTEMS = [
  {
    id: 1,
    title: "WGAN-GP Training Divergence",
    category: "Training Stability",
    severity: "Critical",
    badgeColor: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    symptom: "Early versions (v1, v2) of WGAN-GP experienced discriminator domination and total generator collapse midway through training.",
    rootCause: "An aggressive learning-rate ratio (4:1 D/G ratio) combined with n_critic=5 caused the discriminator to become too strong, leading to vanishing gradients for the generator.",
    fix: "Reduced D/G learning rate ratio to 1.33x, set n_critic=3, and introduced gradient norm clipping. Resulted in smooth convergence across 150 epochs.",
    codeSnippet: `// BEFORE (v1/v2 Collapsed):
optimizer_D = Adam(D.parameters(), lr=4e-4)
optimizer_G = Adam(G.parameters(), lr=1e-4)
N_CRITIC = 5

// AFTER FIX (v3 Stable FID 77.19):
optimizer_D = Adam(D.parameters(), lr=2e-4, betas=(0.5, 0.999))
optimizer_G = Adam(G.parameters(), lr=1.5e-4, betas=(0.5, 0.999))
N_CRITIC = 3`
  },
  {
    id: 2,
    title: "UNet Reconstruction from Raw Checkpoints",
    category: "Reverse Engineering",
    severity: "High",
    badgeColor: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
    symptom: "Original DDPM code was lost; only a 28M parameter PyTorch `.pt` checkpoint (247 tensors) survived.",
    rootCause: "No architecture script existed to instantiate the model for sampling or evaluation.",
    fix: "Reconstructed the UNet block-by-block using tensor shape analysis, strict state-dict matching (247/247 tensors), and a behavioral denoising similarity test across multiple noise levels.",
    codeSnippet: `// 3-Stage Verification Pipeline:
1. Exact Tensor Count Match: 247 / 247 weight keys
2. Strict State-Dict Load: model.load_state_dict(ckpt, strict=True) -> Zero missing keys
3. Behavioral Denoising Test: Cosine similarity > 0.94 between denoised output & original image at t=100`
  },
  {
    id: 3,
    title: "Cosine Noise-Schedule Chain Multiplication Bug",
    category: "Mathematical Bug",
    severity: "Critical",
    badgeColor: "border-red-500/40 text-red-400 bg-red-500/10",
    symptom: "DDPM sampling produced high visual FID (11.70) but downstream accuracy crashed to 21.86% (near random chance). Sampling hit NaNs at t=999.",
    rootCause: "Cumulative chain multiplication of 1,000 floating-point beta steps caused numerical underflow/near-zero denominator at t=999.",
    fix: "Replaced chain multiplication with a direct closed-form formula for alpha_bar(t), enabling full 0–999 step sampling and elevating downstream accuracy from 21.86% to 57.10%.",
    codeSnippet: `// BEFORE (Numerically Unstable):
alpha_bar = torch.cumprod(1.0 - betas, dim=0) // Underflow at t=999!

// AFTER (Direct Closed-Form Cosine Schedule):
def cosine_alpha_bar(t, T=1000, s=0.008):
    f_t = torch.cos(((t / T + s) / (1 + s)) * (math.pi / 2)) ** 2
    f_0 = math.cos((s / (1 + s)) * (math.pi / 2)) ** 2
    return f_t / f_0`
  },
  {
    id: 4,
    title: "FID Small-Sample Size Bias Discovery",
    category: "Evaluation Protocol",
    severity: "Medium",
    badgeColor: "border-purple-500/40 text-purple-400 bg-purple-500/10",
    symptom: "Small-sample CFG sweeps (n=300) suggested an optimal guidance scale that performed poorly on full evaluation runs.",
    rootCause: "FID is systematically biased (higher) at small sample sizes due to empirical covariance estimation error.",
    fix: "Proved small-sample bias via toy Gaussian simulations (showing spurious ~2800 FID at n=300 between identical distributions). Enforced mandatory n=5,000 evaluation for all final metrics.",
    codeSnippet: `// Small Sample Bias Proof:
identical_dist_1 = Normal(0, 1).sample((300, 2048))
identical_dist_2 = Normal(0, 1).sample((300, 2048))
calculate_fid(identical_dist_1, identical_dist_2) -> 2814.2 (Spurious Bias!)

calculate_fid(dist_1_n5000, dist_2_n5000) -> 0.04 (Accurate)`
  },
  {
    id: 5,
    title: "DDIM Sampling Resolution vs Fine-Tuning Epochs",
    category: "Performance Tuning",
    severity: "Medium",
    badgeColor: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    symptom: "Additional training epochs yielded diminishing FID returns (14.28 -> 13.80 -> 13.62).",
    rootCause: "The model was already well-converged; bottleneck was sampling trajectory discretization error.",
    fix: "Increased DDIM steps from 100 to 250 and 500, dropping FID directly to 10.03 for free without re-training.",
    codeSnippet: `// Step Trajectory Efficiency:
100 DDIM Steps -> FID: 14.28
250 DDIM Steps -> FID: 11.45
500 DDIM Steps -> FID: 10.03 (Headline Result)`
  },
  {
    id: 6,
    title: "Filename-Collision Silent Corruption in Checkpoint Merging",
    category: "Data Pipeline",
    severity: "Critical",
    badgeColor: "border-rose-500/40 text-rose-400 bg-rose-500/10",
    symptom: "500-step DDPM evaluation returned an unexpectedly terrible FID of 41.64 despite pristine sample previews.",
    rootCause: "Resumable session counters reset to 0 across Kaggle session restarts. Merging per-class zip archives silently overwrote images, resulting in only 2,000 unique images instead of 5,000.",
    fix: "Re-extracted archives with deterministic class-derived filenames (`class{N}_{i:04d}.png`), resolving collisions and revealing the true headline FID of 10.03.",
    codeSnippet: `// BUG:
filename = f"sample_{counter:04d}.png" // Reset to 0 on session resume!

// FIX (Content & Class-Derived Deterministic Naming):
filename = f"class{class_id:02d}_sample{img_idx:04d}.png"`
  }
];

export const STATISTICAL_SIGNIFICANCE = {
  seedsCount: 5,
  pairedTTestPValue: "< 0.0001",
  rankingAgreement: "5/5 Seeds (100% Directional Consistency)",
  wilcoxonNote: "Wilcoxon signed-rank test is floor-limited at n=5 (p >= 0.0625). Paired t-test serves as primary statistical proof.",
  seedData: [
    { seed: 42, vae: 123.85, gan: 77.62, ddpm: 10.03 },
    { seed: 101, vae: 122.91, gan: 76.85, ddpm: 9.98 },
    { seed: 2024, vae: 123.40, gan: 77.40, ddpm: 10.12 },
    { seed: 777, vae: 122.75, gan: 76.50, ddpm: 9.95 },
    { seed: 999, vae: 123.49, gan: 77.58, ddpm: 10.07 }
  ]
};

export const CIFAR10_CLASSES = [
  "Airplane", "Automobile", "Bird", "Cat", "Deer",
  "Dog", "Frog", "Horse", "Ship", "Truck"
];
