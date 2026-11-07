import { describe, it, expect } from 'vitest';
import {
  formatScorecardValue,
  formatValueWithStd,
  normalizeDirectionAware,
  computeComparisonRail,
  computeHeroVerdict,
  computeFidRank,
} from '../utils/scorecardHelpers.js';

describe('Scorecard Helpers and Direction-Aware Normalisation', () => {
  it('formats metric values according to precision rules using Intl.NumberFormat', () => {
    expect(formatScorecardValue('fid', 11.16)).toBe('11.2');
    expect(formatScorecardValue('precision', 0.796)).toBe('0.796');
    expect(formatScorecardValue('recall', 0)).toBe('0.000');
    expect(formatScorecardValue('is', 9.35)).toBe('9.35');
    expect(formatScorecardValue('lpips', 0.2233)).toBe('0.2233');
    expect(formatScorecardValue('latency', 0.41, 'vae')).toBe('0.41');
    expect(formatScorecardValue('latency', 524, 'ddpm')).toBe('524.0');
    expect(formatScorecardValue('fid', null)).toBe('—');
  });

  it('formats value with std or n=1 indicator', () => {
    const withStd = formatValueWithStd('fid', 112.37, 0.48, 5);
    expect(withStd.displayVal).toBe('112.4');
    expect(withStd.stdText).toBe('± 0.5');

    const singleSeed = formatValueWithStd('fid', 11.16, null, 1);
    expect(singleSeed.displayVal).toBe('11.2');
    expect(singleSeed.stdText).toBe('(n = 1)');
  });

  it('normalizes direction-aware: higher is better', () => {
    const vals = [0.1, 0.5, 0.8];
    // 0.8 is best (1.0), 0.1 is worst (0.0)
    expect(normalizeDirectionAware('precision', 0.8, vals)).toBeCloseTo(1.0);
    expect(normalizeDirectionAware('precision', 0.1, vals)).toBeCloseTo(0.0);
    expect(normalizeDirectionAware('precision', 0.45, vals)).toBeCloseTo(0.5);
  });

  it('normalizes direction-aware: lower is better (linear)', () => {
    const fids = [11.2, 112.4, 242.5];
    // 11.2 is best (1.0), 242.5 is worst (0.0)
    expect(normalizeDirectionAware('fid', 11.2, fids)).toBeCloseTo(1.0);
    expect(normalizeDirectionAware('fid', 242.5, fids)).toBeCloseTo(0.0);
  });

  it('normalizes latency with log scale where lower is better', () => {
    const lats = [0.41, 0.80, 524.0];
    // 0.41 is fastest (1.0), 524.0 is slowest (0.0)
    expect(normalizeDirectionAware('latency', 0.41, lats)).toBeCloseTo(1.0);
    expect(normalizeDirectionAware('latency', 524.0, lats)).toBeCloseTo(0.0);
    // 0.80 should be very close to 1.0 on a log scale
    const normMid = normalizeDirectionAware('latency', 0.80, lats);
    expect(normMid).toBeGreaterThan(0.85);
  });

  it('computes comparison rail ensuring best is always at 100%', () => {
    const rawMap = { vae: 112.4, wgan: 242.5, ddpm: 11.2 };
    const rail = computeComparisonRail('fid', rawMap);
    expect(rail.ddpm).toBeCloseTo(100);
    expect(rail.wgan).toBeCloseTo(0);
    expect(rail.vae).toBeGreaterThan(0);
    expect(rail.vae).toBeLessThan(100);
  });

  it('computes dynamic hero verdict and rank', () => {
    const fidMap = { vae: 112.37, wgan: 242.47, ddpm: 11.16 };
    expect(computeHeroVerdict('ddpm', fidMap)).toContain('lower FID than β-VAE');
    expect(computeHeroVerdict('wgan', fidMap)).toContain('mode collapse');

    expect(computeFidRank('ddpm', fidMap)).toBe('#1 fidelity');
    expect(computeFidRank('vae', fidMap)).toBe('#2 fidelity');
    expect(computeFidRank('wgan', fidMap)).toBe('#3 fidelity');
  });
});
