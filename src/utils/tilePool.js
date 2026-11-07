/**
 * Tile Pool & Shuffle Bag for Diverse 16-Tile Batches.
 * Guarantees zero duplicate tiles inside any 4x4 grid.
 * Prefers unseen tiles across consecutive runs.
 */

import { splitGrid } from './splitGrid.js';
import { fastTileHash } from './seedGenerator.js';

// Session-level memory of tile hashes shown to the user
const sessionSeenHashes = new Set();
const lastBatchModelHashes = new Map();

// In-memory cache of sliced tiles per image URL to avoid re-slicing
const slicedTileCache = new Map();

/**
 * Deterministic 32-bit Mulberry32 PRNG seeded by an integer.
 * @param {number} seed
 * @returns {() => number} uniform float in [0, 1)
 */
export function createPrng(seed) {
  let s = (seed >>> 0) || 1;
  return function next() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates array shuffle using a custom PRNG.
 * @template T
 * @param {T[]} array
 * @param {() => number} prng
 * @returns {T[]} new shuffled array
 */
export function shuffleWithPrng(array, prng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Deduplicate an array of tile strings based on their content hash.
 * @param {string[]} tiles
 * @returns {string[]} distinct tiles
 */
export function deduplicateTiles(tiles) {
  const seen = new Set();
  const distinct = [];
  for (const t of tiles) {
    if (!t) continue;
    const h = fastTileHash(t);
    if (!seen.has(h)) {
      seen.add(h);
      distinct.push(t);
    }
  }
  return distinct;
}

/**
 * Draw up to N distinct tiles from a pool using a shuffle bag.
 * Guarantees zero duplicate tiles in the returned array.
 * Prefers tiles not previously seen in this session.
 * Avoids repeating tiles from the immediate previous run.
 * 
 * @param {string[]} pool - array of available tile strings
 * @param {number} seed - integer seed for deterministic shuffle
 * @param {number} count - number of tiles to draw (default 16)
 * @param {string} cacheKey - identifier for model/class tracking
 * @returns {{ tiles: string[], hashes: string[], exhausted: boolean }}
 */
export function drawFromShuffleBag(pool, seed, count = 16, cacheKey = 'default') {
  const uniquePool = deduplicateTiles(pool);
  if (uniquePool.length === 0) {
    return { tiles: [], hashes: [], exhausted: true };
  }

  const prng = createPrng(seed);
  const lastHashes = lastBatchModelHashes.get(cacheKey) || new Set();

  // Partition pool into unseen, seen, and immediate-last
  const unseen = [];
  const previouslySeen = [];

  for (const t of uniquePool) {
    const h = fastTileHash(t);
    if (lastHashes.has(h)) {
      continue; // Exclude tiles from immediate previous batch if possible
    }
    if (!sessionSeenHashes.has(h)) {
      unseen.push(t);
    } else {
      previouslySeen.push(t);
    }
  }

  // Shuffle both candidate buckets
  const shuffledUnseen = shuffleWithPrng(unseen, prng);
  const shuffledSeen = shuffleWithPrng(previouslySeen, prng);

  // If candidate pool without last-batch tiles has enough, pick from them
  let candidates = [...shuffledUnseen, ...shuffledSeen];

  // If pool is small and excluding last-batch leaves < count, include last batch as last resort
  let exhausted = false;
  if (candidates.length < count) {
    exhausted = true;
    const remainingNeeded = count - candidates.length;
    const lastBatchItems = uniquePool.filter(t => lastHashes.has(fastTileHash(t)));
    const shuffledLast = shuffleWithPrng(lastBatchItems, prng);
    candidates = [...candidates, ...shuffledLast];
  }

  // Pick exactly `count` distinct tiles without replacement
  const chosenTiles = [];
  const chosenHashes = [];
  const chosenSet = new Set();

  for (const t of candidates) {
    if (chosenTiles.length >= count) break;
    const h = fastTileHash(t);
    if (!chosenSet.has(h)) {
      chosenSet.add(h);
      chosenTiles.push(t);
      chosenHashes.push(h);
      sessionSeenHashes.add(h);
    }
  }

  // Record into last batch for this key
  lastBatchModelHashes.set(cacheKey, chosenSet);

  return {
    tiles: chosenTiles,
    hashes: chosenHashes,
    exhausted,
  };
}

/**
 * Asynchronously load and slice an image into 32x32 tiles, cached in memory.
 * @param {string} url
 * @returns {Promise<string[]>}
 */
export async function getCachedSlicedTiles(url) {
  if (!url) return [];
  if (slicedTileCache.has(url)) {
    return slicedTileCache.get(url);
  }
  try {
    const tiles = await splitGrid(url);
    slicedTileCache.set(url, tiles);
    return tiles;
  } catch (err) {
    console.warn(`[tilePool] Failed slicing ${url}:`, err);
    return [];
  }
}

/**
 * Clear session tracking (useful in tests).
 */
export function resetSessionTileHistory() {
  sessionSeenHashes.clear();
  lastBatchModelHashes.clear();
  slicedTileCache.clear();
}
