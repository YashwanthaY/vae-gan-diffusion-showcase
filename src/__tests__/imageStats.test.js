import { describe, it, expect } from 'vitest';
import {
  computeChannelHistogram,
  wasserstein1,
  pairwiseDiversity,
  laplacianVariance,
  colourfulness,
  fft2,
  radialPowerSpectrum,
  pcaProject,
} from '../lib/imageStats.js';

describe('imageStats pure mathematical CV routines', () => {
  it('verifies that a constant image has zero sharpness (laplacian variance = 0)', () => {
    // 32x32 image with constant grey = 128
    const pixels = new Uint8ClampedArray(32 * 32 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 128;     // R
      pixels[i + 1] = 128; // G
      pixels[i + 2] = 128; // B
      pixels[i + 3] = 255; // A
    }

    const sharpness = laplacianVariance(pixels, 32, 32);
    expect(sharpness).toBe(0);
  });

  it('verifies that an identical pair of images has zero distance (wasserstein1 = 0 and pairwise diversity = 0)', () => {
    const pixelsA = new Uint8ClampedArray(32 * 32 * 4);
    const pixelsB = new Uint8ClampedArray(32 * 32 * 4);
    for (let i = 0; i < pixelsA.length; i += 4) {
      pixelsA[i] = 200;
      pixelsA[i + 1] = 100;
      pixelsA[i + 2] = 50;
      pixelsA[i + 3] = 255;

      pixelsB[i] = 200;
      pixelsB[i + 1] = 100;
      pixelsB[i + 2] = 50;
      pixelsB[i + 3] = 255;
    }

    // Histograms
    const histA = computeChannelHistogram(pixelsA, 32);
    const histB = computeChannelHistogram(pixelsB, 32);

    expect(wasserstein1(histA.r, histB.r)).toBe(0);
    expect(wasserstein1(histA.g, histB.g)).toBe(0);
    expect(wasserstein1(histA.b, histB.b)).toBe(0);

    // Pairwise diversity between identical tiles
    const diversity = pairwiseDiversity([pixelsA, pixelsB]);
    expect(diversity).toBe(0);
  });

  it('verifies that a pure sine wave has its radial spectrum peak in the expected frequency bin', () => {
    // Generate 32x32 greyscale with a horizontal sine wave of frequency f = 4 cycles per 32 pixels
    const targetFreq = 4;
    const sineImg = new Float64Array(32 * 32);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        // sin(2 * pi * f * x / 32)
        sineImg[y * 32 + x] = Math.sin((2 * Math.PI * targetFreq * x) / 32);
      }
    }

    const { real, imag } = fft2(sineImg, 32, 32);
    const spectrum = radialPowerSpectrum(real, imag, 32, 32, 16);

    // Find bin with maximum AC power (skip DC bin 0)
    let maxBin = 1;
    let maxPower = spectrum[1];
    for (let b = 2; b < 16; b++) {
      if (spectrum[b] > maxPower) {
        maxPower = spectrum[b];
        maxBin = b;
      }
    }

    expect(maxBin).toBe(targetFreq);
  });

  it('computes Hasler & Süsstrunk colourfulness metric', () => {
    // Monochrome grey image should have zero colourfulness
    const greyPixels = new Uint8ClampedArray(32 * 32 * 4);
    for (let i = 0; i < greyPixels.length; i += 4) {
      greyPixels[i] = 120;
      greyPixels[i + 1] = 120;
      greyPixels[i + 2] = 120;
      greyPixels[i + 3] = 255;
    }
    expect(colourfulness(greyPixels)).toBe(0);

    // Saturated colour image should have high colourfulness
    const redPixels = new Uint8ClampedArray(32 * 32 * 4);
    for (let i = 0; i < redPixels.length; i += 4) {
      redPixels[i] = 255;
      redPixels[i + 1] = 0;
      redPixels[i + 2] = 0;
      redPixels[i + 3] = 255;
    }
    expect(colourfulness(redPixels)).toBeGreaterThan(50);
  });

  it('computes PCA projection onto principal components', () => {
    const pixels = new Uint8ClampedArray(32 * 32 * 4);
    const pcaMean = new Float64Array(3072).fill(0.5);
    const comp1 = new Float64Array(3072).fill(0.01);
    const comp2 = new Float64Array(3072).fill(-0.01);

    const proj = pcaProject(pixels, pcaMean, [comp1, comp2]);
    expect(typeof proj.pc1).toBe('number');
    expect(typeof proj.pc2).toBe('number');
  });
});
