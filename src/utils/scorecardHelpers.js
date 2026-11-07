/**
 * Helper utilities for Model Scorecards, Matrix View, and Dot Plot.
 * Sourced strictly from src/data/metrics.js (prdc.json, speed.json, models_info.json, metrics_provisional.json).
 */

const METRIC_CONFIG = {
  fid:       { label: 'FID',             direction: 'lower',  decimals: 1, group: 'FIDELITY',   unit: '' },
  precision: { label: 'Precision',       direction: 'higher', decimals: 3, group: 'FIDELITY',   unit: '' },
  recall:    { label: 'Recall',          direction: 'higher', decimals: 3, group: 'DIVERSITY',  unit: '' },
  density:   { label: 'Density',         direction: 'higher', decimals: 3, group: 'DIVERSITY',  unit: '' },
  coverage:  { label: 'Coverage',        direction: 'higher', decimals: 3, group: 'DIVERSITY',  unit: '' },
  is:        { label: 'Inception Score', direction: 'higher', decimals: 2, group: 'PERCEPTUAL', unit: '', isProvisional: true },
  lpips:     { label: 'LPIPS',           direction: 'lower',  decimals: 4, group: 'PERCEPTUAL', unit: '', isProvisional: true },
  ssim:      { label: 'SSIM',            direction: 'higher', decimals: 4, group: 'PERCEPTUAL', unit: '', isProvisional: true, note: 'SSIM between unpaired generated and real images is a weak quality indicator' },
  latency:   { label: 'Latency / Img',   direction: 'lower',  decimals: 2, group: 'EFFICIENCY', unit: 'ms', isLog: true },
  peakMem:   { label: 'Peak RAM',        direction: 'lower',  decimals: 2, group: 'EFFICIENCY', unit: 'GB' },
  params:    { label: 'Parameters',      direction: 'lower',  decimals: 2, group: 'EFFICIENCY', unit: 'M' },
};

export { METRIC_CONFIG };

/**
 * Format metric value using Intl.NumberFormat
 */
export function formatScorecardValue(metricKey, val, modelKey = '') {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }

  let dec = METRIC_CONFIG[metricKey]?.decimals ?? 3;
  if (metricKey === 'latency') {
    dec = modelKey === 'ddpm' ? 1 : 2;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

  return formatter.format(val);
}

/**
 * Format value with std if available, or n=1 indicator
 */
export function formatValueWithStd(metricKey, mean, std, nSeeds = null, modelKey = '') {
  if (mean === null || mean === undefined || isNaN(mean)) {
    return { displayVal: '—', stdText: '', isPending: true };
  }

  const formattedMean = formatScorecardValue(metricKey, mean, modelKey);

  if (std !== null && std !== undefined && !isNaN(std)) {
    const formattedStd = formatScorecardValue(metricKey, std, modelKey);
    return {
      displayVal: formattedMean,
      stdText: `± ${formattedStd}`,
      isPending: false,
    };
  }

  return {
    displayVal: formattedMean,
    stdText: nSeeds ? `(n = ${nSeeds})` : '(n = 1)',
    isPending: false,
  };
}

/**
 * Direction-aware normalization into [0, 1] range where 1 is ALWAYS the best.
 * - Higher is better: (val - min) / (max - min)
 * - Lower is better:  (max - val) / (max - min)
 * - Latency (log scale, lower is better): (log(max) - log(val)) / (log(max) - log(min))
 */
export function normalizeDirectionAware(metricKey, value, allValues) {
  if (value === null || value === undefined || isNaN(value)) return 0;

  const validVals = allValues.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validVals.length === 0) return 0;

  const min = Math.min(...validVals);
  const max = Math.max(...validVals);

  if (min === max) return 1.0;

  const isLog = METRIC_CONFIG[metricKey]?.isLog;
  const isLowerBetter = METRIC_CONFIG[metricKey]?.direction === 'lower';

  if (isLog) {
    const logVal = Math.log10(Math.max(1e-4, value));
    const logMin = Math.log10(Math.max(1e-4, min));
    const logMax = Math.log10(Math.max(1e-4, max));
    if (logMin === logMax) return 1.0;
    // Lower latency is better => 1 is lowest logVal
    return Math.max(0, Math.min(1, (logMax - logVal) / (logMax - logMin)));
  }

  if (isLowerBetter) {
    return Math.max(0, Math.min(1, (max - value) / (max - min)));
  }

  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Computes positions [0, 100]% on the comparison rail for all 3 models.
 * Better is always to the right (100%).
 */
export function computeComparisonRail(metricKey, rawMap) {
  const models = ['vae', 'wgan', 'ddpm'];
  const allVals = models.map(m => rawMap[m]).filter(v => v !== null && v !== undefined && !isNaN(v));

  const result = {};
  models.forEach(m => {
    const val = rawMap[m];
    if (val === null || val === undefined || isNaN(val)) {
      result[m] = null;
    } else {
      const norm = normalizeDirectionAware(metricKey, val, allVals);
      result[m] = norm * 100; // in percent
    }
  });

  return result;
}

/**
 * Compute one-line hero verdict from real data
 */
export function computeHeroVerdict(modelKey, fidMap) {
  const ddpmFid = fidMap.ddpm;
  const vaeFid  = fidMap.vae;
  const wganFid = fidMap.wgan;

  if (modelKey === 'ddpm') {
    if (vaeFid && ddpmFid) {
      const ratio = (vaeFid / ddpmFid).toFixed(1);
      return `${ratio}× lower FID than β-VAE`;
    }
    return 'Lowest distribution divergence';
  }

  if (modelKey === 'vae') {
    if (wganFid && vaeFid) {
      const ratio = (wganFid / vaeFid).toFixed(1);
      return `${ratio}× lower FID than WGAN-GP`;
    }
    return 'Smooth latent manifold with blur trade-off';
  }

  if (modelKey === 'wgan') {
    return 'Severe distribution divergence due to mode collapse';
  }

  return '';
}

/**
 * Compute FID rank
 */
export function computeFidRank(modelKey, fidMap) {
  const entries = Object.entries(fidMap)
    .filter(([_, v]) => v !== null && v !== undefined && !isNaN(v))
    .sort((a, b) => a[1] - b[1]); // ascending (lower FID is better)

  const rankIdx = entries.findIndex(([k]) => k === modelKey);
  if (rankIdx === -1) return '#—';
  return `#${rankIdx + 1} fidelity`;
}
