/**
 * SINGLE SOURCE OF TRUTH FOR PROJECT METRICS
 * 
 * LOCKED FACTS:
 * Final results on CIFAR-10, mean ± std over 5 evaluation seeds,
 * N=5,000 generated samples per model per seed, 100-step DDIM, guidance 1.5 for DDPM.
 * 
 * IMPORTANT PROTOCOL NOTE:
 * FID uses N=5,000 samples vs a 10,000-image CIFAR-10 training subset,
 * so it is NOT comparable to published 50,000-sample FIDs.
 */

export const FID_DISCLAIMER = "FID uses N=5,000 samples vs a 10,000-image CIFAR-10 training subset, so it is NOT comparable to published 50,000-sample FIDs.";

export const MODEL_METRICS = {
  vae: {
    name: "β-VAE",               
    fullName: "Variational Autoencoder (β-VAE)",                                                   
    fid: { mean: 112.24, std: 0.52, formatted: "112.24 ± 0.52" },                            
    is: { mean: 4.04, std: 0.07, formatted: "4.04 ± 0.07" },
    lpips: { mean: 0.2703, std: 0.0013, formatted: "0.2703 ± 0.0013" },
    ssim: { mean: 0.2276, std: 0.0014, formatted: "0.2276 ± 0.0014" },
    qualityLabel: "Smooth / Blur-prone",
    statusNote: "Trained to convergence. High reconstruction blur due to pixel-space ELBO loss.",
    badgeColor: "emerald",
  },
  wgan: {
    name: "WGAN-GP",
    fullName: "Wasserstein GAN with Gradient Penalty",
    fid: { mean: 242.59, std: 0.47, formatted: "242.59 ± 0.47" },
    is: { mean: 2.30, std: 0.02, formatted: "2.30 ± 0.02" },
    lpips: { mean: 0.3683, std: 0.0010, formatted: "0.3683 ± 0.0010" },
    ssim: { mean: 0.1924, std: 0.0004, formatted: "0.1924 ± 0.0004" },
    qualityLabel: "Mode Collapse (Documented Failure)",
    statusNote: "Collapsed to repeated blob-like patterns. Documented failure case, shown for full research transparency.",
    badgeColor: "amber",
  },
  ddpm: {
    name: "DDPM",
    fullName: "Class-Conditional DDPM (100-step DDIM, CFG 1.5)",
    fid: { mean: 11.32, std: 0.14, formatted: "11.32 ± 0.14" },
    is: { mean: 9.35, std: 0.09, formatted: "9.35 ± 0.09" },
    lpips: { mean: 0.2233, std: 0.0016, formatted: "0.2233 ± 0.0016" },
    ssim: { mean: 0.2283, std: 0.0008, formatted: "0.2283 ± 0.0008" },
    qualityLabel: "High Fidelity (Headline Model)",
    statusNote: "Best performing architecture. Evaluated at 100 DDIM steps with guidance scale 1.5 and GroupNorm(8).",
    contextNote: "Context: An earlier 500-step DDPM protocol measured FID 10.03 under different step budgets.",
    badgeColor: "cyan",
  }
};

export const STATISTICAL_TESTS = {
  pairedTTest: {
    description: "Paired t-test across 5 evaluation seeds (N=5,000 per seed)",
    pValueAll: "< 0.0001",
    exception: "β-VAE vs DDPM on SSIM metric",
    exceptionPValue: "p = 0.29 (statistically non-significant)",
  },
  wilcoxonTest: {
    description: "Wilcoxon signed-rank test across 5 evaluation seeds",
    pValue: "0.0625",
    note: "Mechanical floor at N=5 evaluation seeds (minimum achievable two-tailed p-value for N=5)."
  }
};

export const DOWNSTREAM_FINAL = {
  isFinal: true,
  seeds: 3,
  architecture: "ResNet-18",
  epochs: 30,
  dataset: "CIFAR-10 test set (10,000 images)",
  metrics: {
    real_full_50k: { label: "Real Baseline (50,000 real)", mean: 93.58, std: 0.07, formatted: "93.58 ± 0.07%", note: "Full dataset control" },
    real_full_plus_synth: { label: "Real 50,000 + Synthetic 5,000", mean: 94.11, std: 0.31, formatted: "94.11 ± 0.31%", note: "+0.54% gain (paired t-test p=0.13: NOT significant)" },
    real_1000pc_only: { label: "Real Control (1,000/class = 10,000)", mean: 83.07, std: 0.23, formatted: "83.07 ± 0.23%", note: "Essential control (500pc+synth is worth less than real 1,000pc)" },
    real_500pc_plus_synth: { label: "500 Real/class + 5,000 Synthetic", mean: 81.14, std: 0.99, formatted: "81.14 ± 0.99%", note: "+4.38% gain over real 500pc (p=0.030)" },
    real_500pc_only: { label: "Real Baseline (500/class = 5,000)", mean: 76.76, std: 1.34, formatted: "76.76 ± 1.34%", note: "Low-data baseline" },
    synthetic_only_500pc: { label: "Synthetic Only (500/class = 5,000)", mean: 73.64, std: 0.38, formatted: "73.64 ± 0.38%", note: "3.12% below real 500pc (p=0.041)" }
  },
  wordingRules: {
    syntheticOnlyLimit: "Never claim synthetic-only reaches 92%; only real baselines exceed 92%.",
    forbiddenWords: ["substitute", "indistinguishable", "statistically equivalent"],
    fullDataDeltaNote: "+0.54% on full data is small, consistent across 3 seeds, but not statistically significant (p=0.13).",
    headlineNote: "Synthetic data provides a statistically significant +4.38 percentage point boost in low-data settings (76.76% -> 81.14%, p=0.030), but synthetic images are worth less than real ones (81.14% vs 83.07% for real 1000pc).",
    limitations: "3 seeds, one generator, one classifier architecture (ResNet-18), only 500 synthetic images per class."
  }
};

