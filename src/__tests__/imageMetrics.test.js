import { describe, it, expect } from 'vitest';
import {
  computePixelDiversity,
  computeSharpness,
  computeColourfulness,
  computeMeanBrightness,
  computeMeanSaturation,
  computeRgbStats,
} from '../utils/imageMetrics.js';

function makeMockImageData(w, h, fillFn) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const [r, g, b, a] = fillFn(x, y);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a ?? 255;
    }
  }
  return { width: w, height: h, data };
}

describe('imageMetrics computer vision functions', () => {
  it('computes brightness and saturation accurately on known solid color', () => {
    // Pure red (255, 0, 0)
    const red = makeMockImageData(32, 32, () => [255, 0, 0, 255]);
    const brightness = computeMeanBrightness(red);
    expect(brightness).toBeCloseTo(0.299, 2);

    const sat = computeMeanSaturation(red);
    expect(sat).toBeCloseTo(1.0, 2);
  });

  it('computes sharpness (variance of Laplacian)', () => {
    // Flat image has zero sharpness
    const flat = makeMockImageData(32, 32, () => [128, 128, 128, 255]);
    expect(computeSharpness(flat)).toBeCloseTo(0, 4);

    // Checkerboard pattern has high sharpness
    const checker = makeMockImageData(32, 32, (x, y) => ((x + y) % 2 === 0 ? [255, 255, 255] : [0, 0, 0]));
    const sharp = computeSharpness(checker);
    expect(sharp).toBeGreaterThan(100);
  });

  it('computes colourfulness', () => {
    // Grayscale image has 0 colourfulness
    const gray = makeMockImageData(32, 32, (x) => [x * 8, x * 8, x * 8]);
    expect(computeColourfulness(gray)).toBeCloseTo(0, 2);

    // Vivid colorful image has positive colourfulness
    const colorful = makeMockImageData(32, 32, (x, y) => [x * 8, y * 8, 200]);
    expect(computeColourfulness(colorful)).toBeGreaterThan(20);
  });

  it('computes pairwise pixel diversity across multiple tiles', () => {
    const tileA = makeMockImageData(32, 32, () => [0, 0, 0]);
    const tileB = makeMockImageData(32, 32, () => [255, 255, 255]);
    const div = computePixelDiversity([tileA, tileB]);
    expect(div).toBeCloseTo(1.0, 2); // Max normalized distance
  });

  it('computes RGB stats vs CIFAR-10 reference', () => {
    const tile = makeMockImageData(32, 32, () => [125, 123, 114]);
    const stats = computeRgbStats([tile]);
    expect(stats.distance).toBeGreaterThan(0);
    expect(stats.means[0]).toBeCloseTo(125 / 255, 2);
  });
});

