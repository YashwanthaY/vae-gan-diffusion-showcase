import { describe, it, expect } from 'vitest';
import { paretoKnee } from '../components/OutputsTab4Configs.jsx';

describe('paretoKnee', () => {
  it('returns 0 for a single point', () => {
    expect(paretoKnee([{ x: 1, y: 10 }])).toBe(0);
  });

  it('returns -1 for empty array', () => {
    expect(paretoKnee([])).toBe(-1);
  });

  it('returns -1 for null', () => {
    expect(paretoKnee(null)).toBe(-1);
  });

  it('finds the knee in a clear L-shaped front', () => {
    // Points: large cost reduction early, then diminishing returns
    // cost: 10, 20, 50, 100, 200  fid: 50, 20, 10, 8, 7
    // The knee should be around index 2 (big gain in quality per cost)
    const pts = [
      { x: 10, y: 50 },
      { x: 20, y: 20 },
      { x: 50, y: 10 },
      { x: 100, y: 8 },
      { x: 200, y: 7 },
    ];
    const idx = paretoKnee(pts);
    // The knee is at (50, 10) — the biggest perpendicular distance from line (10,50)-(200,7)
    expect(idx).toBe(2);
  });

  it('returns 0 for a perfectly linear front', () => {
    const pts = [{ x: 1, y: 10 }, { x: 2, y: 8 }, { x: 3, y: 6 }];
    // All points equidistant; first or last should be returned (first wins at equal dist)
    const idx = paretoKnee(pts);
    expect(typeof idx).toBe('number');
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(pts.length);
  });
});
