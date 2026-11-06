import prdc from './json/prdc.json';
import speed from './json/speed.json';
import modelsInfo from './json/models_info.json';
import prov from './json/metrics_provisional.json';

/**
 * SINGLE SOURCE OF TRUTH FOR METRICS (src/data/metrics.js)
 * 
 * Rules:
 * - All numbers derive from public/data/json/*.json
 * - Canonical DDPM evaluated checkpoint: 100 DDIM steps, w=1.5, N=5,000, 1 seed.
 * - Formatted strings follow academic reporting standards.
 */

export const RAW_DATA = {
  prdc,
  speed,
  modelsInfo,
  prov,
};

// Formatting helpers
export const fmtFid = (mean, std) => {
  if (mean === null || mean === undefined) return '—';
  if (std !== null && std !== undefined) {
    return `${Number(mean).toFixed(1)} ± ${Number(std).toFixed(1)}`;
  }
  return Number(mean).toFixed(1);
};

export const fmtMetric3 = (val) => {
  if (val === null || val === undefined) return '—';
  return Number(val).toFixed(3);
};

export const fmtParams = (modelKey) => {
  if (modelKey === 'vae') return '16.90 M';
  if (modelKey === 'wgan') return '3.56 M (G) + 4.66 M (D)';
  if (modelKey === 'ddpm') return '28.01 M';
  return '—';
};

export const fmtLatency = (val) => {
  if (val === null || val === undefined) return '—';
  if (val < 1) return Number(val).toFixed(2);
  return Math.round(val).toString();
};

export const fmtSeeds = (n) => `n = ${n}`;

// Canonical formatted metric objects
export const CANONICAL_METRICS = {
  vae: {
    name: 'β-VAE',
    params: fmtParams('vae'),
    paramsExact: modelsInfo.vae_total,
    fid: fmtFid(prdc.vae.fid.mean, prdc.vae.fid.std),
    fidRaw: prdc.vae.fid.mean,
    fidStd: prdc.vae.fid.std,
    precision: fmtMetric3(prdc.vae.precision.mean),
    recall: fmtMetric3(prdc.vae.recall.mean),
    density: fmtMetric3(prdc.vae.density.mean),
    coverage: fmtMetric3(prdc.vae.coverage.mean),
    latency: fmtLatency(speed.vae_ms_per_img),
    latencyRaw: speed.vae_ms_per_img,
    seeds: fmtSeeds(prdc.vae.n_seeds),
    seedsCount: prdc.vae.n_seeds,
  },
  wgan: {
    name: 'WGAN-GP',
    params: fmtParams('wgan'),
    paramsExact: modelsInfo.wgan_generator + modelsInfo.wgan_critic,
    fid: fmtFid(prdc.wgan.fid.mean, prdc.wgan.fid.std),
    fidRaw: prdc.wgan.fid.mean,
    fidStd: prdc.wgan.fid.std,
    precision: fmtMetric3(prdc.wgan.precision.mean),
    recall: fmtMetric3(prdc.wgan.recall.mean),
    density: fmtMetric3(prdc.wgan.density.mean),
    coverage: fmtMetric3(prdc.wgan.coverage.mean),
    latency: fmtLatency(speed.wgan_ms_per_img),
    latencyRaw: speed.wgan_ms_per_img,
    seeds: fmtSeeds(prdc.wgan.n_seeds),
    seedsCount: prdc.wgan.n_seeds,
  },
  ddpm: {
    name: 'DDPM',
    params: fmtParams('ddpm'),
    paramsExact: modelsInfo.ddpm_total,
    fid: fmtFid(prdc.ddpm.fid.mean, null), // 11.2 (1 seed canonical)
    fidRaw: prdc.ddpm.fid.mean,
    fidStd: null,
    precision: fmtMetric3(prdc.ddpm.precision.mean),
    recall: fmtMetric3(prdc.ddpm.recall.mean),
    density: fmtMetric3(prdc.ddpm.density.mean),
    coverage: fmtMetric3(prdc.ddpm.coverage.mean),
    latency: fmtLatency(speed.ddpm100_ms_per_img),
    latencyRaw: speed.ddpm100_ms_per_img,
    seeds: fmtSeeds(prdc.ddpm.n_seeds),
    seedsCount: prdc.ddpm.n_seeds,
  },
};

// 4 Headline cards data
export const HEADLINE_NUMBERS = [
  {
    category: 'QUALITY',
    metric: CANONICAL_METRICS.ddpm.fid,
    label: 'DDPM FID',
    comparison: `vs ${CANONICAL_METRICS.vae.fid.split(' ')[0]} (β-VAE) · ${CANONICAL_METRICS.wgan.fid.split(' ')[0]} (WGAN-GP)`,
    soWhat: 'Diffusion is ~10× closer to real CIFAR-10 data distribution.',
    target: 'benchmark',
    accentColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40 hover:border-cyan-400',
  },
  {
    category: 'DIVERSITY',
    metric: CANONICAL_METRICS.ddpm.recall,
    label: 'Recall',
    comparison: `vs ${CANONICAL_METRICS.vae.recall} (β-VAE) · ${CANONICAL_METRICS.wgan.recall} (WGAN-GP)`,
    soWhat: 'WGAN-GP suffered complete mode collapse; FID alone hid the failure.',
    target: 'evidence',
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500/40 hover:border-rose-400',
  },
  {
    category: 'COST',
    metric: `${CANONICAL_METRICS.ddpm.latency} ms`,
    label: 'Latency / Img (T4)',
    comparison: `vs ${CANONICAL_METRICS.vae.latency} ms (β-VAE) · ${CANONICAL_METRICS.wgan.latency} ms (WGAN-GP)`,
    soWhat: 'Quality is bought with compute: DDPM demands ~1,000× more inference budget.',
    target: 'benchmark',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/40 hover:border-amber-400',
  },
  {
    category: 'UTILITY',
    metric: '+4.38 pts',
    label: 'ResNet-18 Accuracy Gain',
    comparison: 'p = 0.030 (low-data) · +0.54 pts (p = 0.13, n.s.)',
    soWhat: 'ResNet-18 accuracy, 500 real images (p = 0.030); +0.54 pts with the full real set (p = 0.13, not significant).',
    target: 'synthetic-data',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
  },
];

export const BENCHMARK_FOOTNOTE =
  'Protocol: 1 trained checkpoint per model; 5 evaluation seeds for β-VAE and WGAN-GP; 1 seed for DDPM (100 steps, w=1.5); N = 5,000 images per model per seed. Reference: fixed 10,000-image CIFAR-10 train subset. Hardware: NVIDIA Tesla T4. FID is not comparable with published 50,000-sample values.';

