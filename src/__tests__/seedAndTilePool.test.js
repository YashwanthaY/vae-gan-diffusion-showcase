import { describe, it, expect, beforeEach } from 'vitest';
import { generateRandomSeed31, fastTileHash } from '../utils/seedGenerator.js';
import {
  createPrng,
  shuffleWithPrng,
  deduplicateTiles,
  drawFromShuffleBag,
  resetSessionTileHistory,
} from '../utils/tilePool.js';

describe('Seed Generator & Tile Hash Utility', () => {
  it('generates 31-bit positive integer seeds that differ across consecutive calls', () => {
    const seeds = new Set();
    for (let i = 0; i < 20; i++) {
      const s = generateRandomSeed31();
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(2147483647); // 2^31 - 1
      expect(Number.isInteger(s)).toBe(true);
      seeds.add(s);
    }
    // Across 20 random 31-bit draws, all 20 should be unique
    expect(seeds.size).toBe(20);
  });

  it('computes deterministic hashes for tile data', () => {
    const t1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...tileA';
    const t2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...tileA';
    const t3 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...tileB';

    expect(fastTileHash(t1)).toBe(fastTileHash(t2));
    expect(fastTileHash(t1)).not.toBe(fastTileHash(t3));
  });
});

describe('Tile Pool & Shuffle Bag Mechanics', () => {
  beforeEach(() => {
    resetSessionTileHistory();
  });

  it('deduplicateTiles removes duplicate tiles based on hash', () => {
    const pool = [
      'data:tile1',
      'data:tile2',
      'data:tile1', // duplicate
      'data:tile3',
      'data:tile2', // duplicate
    ];
    const deduped = deduplicateTiles(pool);
    expect(deduped).toHaveLength(3);
    expect(deduped).toEqual(['data:tile1', 'data:tile2', 'data:tile3']);
  });

  it('draws 16 distinct tiles without replacement from a pool of 100 tiles over 6 consecutive batches with zero repetition', () => {
    // Generate pool of 100 unique simulated tiles
    const pool = Array.from({ length: 100 }, (_, i) => `data:image/png;base64,sample_tile_${i}_payload`);
    const allDrawnTiles = [];

    // Draw 6 batches of 16 tiles (6 * 16 = 96 tiles)
    for (let batch = 0; batch < 6; batch++) {
      const seed = 1000 + batch * 37;
      const { tiles, hashes } = drawFromShuffleBag(pool, seed, 16, 'test_model');

      expect(tiles).toHaveLength(16);
      expect(hashes).toHaveLength(16);

      // Verify zero duplicates within the single batch
      const batchSet = new Set(hashes);
      expect(batchSet.size).toBe(16);

      allDrawnTiles.push(...tiles);
    }

    // Over 6 consecutive batches of 16 (96 tiles total), NO tile should repeat because pool has 100
    const totalSet = new Set(allDrawnTiles);
    expect(totalSet.size).toBe(96);
  });

  it('avoids immediately repeating tiles when pool is slightly larger than 16', () => {
    // Pool of 32 tiles
    const pool = Array.from({ length: 32 }, (_, i) => `data:image/png;base64,pool32_tile_${i}`);

    const run1 = drawFromShuffleBag(pool, 42, 16, 'model_key');
    expect(run1.tiles).toHaveLength(16);

    const run2 = drawFromShuffleBag(pool, 43, 16, 'model_key');
    expect(run2.tiles).toHaveLength(16);

    // Run 1 and Run 2 should share 0 tiles because pool has 32 (16 in run1, 16 remaining in run2)
    const run1Hashes = new Set(run1.hashes);
    const overlap = run2.hashes.filter(h => run1Hashes.has(h));
    expect(overlap.length).toBe(0);
  });
});
