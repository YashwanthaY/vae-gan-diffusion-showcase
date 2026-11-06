import { describe, it, expect } from 'vitest';
import { detectGridLayout, detectGridParams } from '../utils/splitGrid.js';

describe('splitGrid layout detection fixtures', () => {
  it('correctly detects 4x4 layout (16 tiles) for 552x552 and 128x128', () => {
    const layout552 = detectGridLayout(552, 552);
    expect(layout552).toEqual({ rows: 4, cols: 4, count: 16 });

    const layout128 = detectGridLayout(128, 128);
    expect(layout128).toEqual({ rows: 4, cols: 4, count: 16 });

    const params552 = detectGridParams(552, 552, 4, 4);
    expect(params552.hasPadding).toBe(true);
    expect(params552.scale).toBe(4);
  });

  it('correctly detects 2x4 layout (8 tiles) for 414x210', () => {
    const layout414 = detectGridLayout(414, 210);
    expect(layout414).toEqual({ rows: 2, cols: 4, count: 8 });

    const params = detectGridParams(414, 210, 4, 2);
    expect(params.hasPadding).toBe(true);
    expect(params.scale).toBe(3);
  });

  it('correctly detects 2x2 layout (4 tiles) for 210x210 and 64x64', () => {
    const layout210 = detectGridLayout(210, 210);
    expect(layout210).toEqual({ rows: 2, cols: 2, count: 4 });

    const layout64 = detectGridLayout(64, 64);
    expect(layout64).toEqual({ rows: 2, cols: 2, count: 4 });

    const params = detectGridParams(210, 210, 2, 2);
    expect(params.hasPadding).toBe(true);
    expect(params.scale).toBe(3);
  });

  it('correctly detects 1x16 layout (16 tiles) for 512x32', () => {
    const layout = detectGridLayout(512, 32);
    expect(layout).toEqual({ rows: 1, cols: 16, count: 16 });
  });
});

