import { splitGrid } from './splitGrid.js';
import { CIFAR10_CLASSES } from '../config.js';
import { getCachedSlicedTiles, drawFromShuffleBag, deduplicateTiles } from './tilePool.js';

const CLASS_TO_GRID_MAP = {
  airplane: '/img/grids/ddpm_class0_plane.png',
  plane: '/img/grids/ddpm_class0_plane.png',
  automobile: '/img/grids/ddpm_class1_car.png',
  car: '/img/grids/ddpm_class1_car.png',
  bird: '/img/grids/ddpm_class2_bird.png',
  cat: '/img/grids/ddpm_class3_cat.png',
  deer: '/img/grids/ddpm_class4_deer.png',
  dog: '/img/grids/ddpm_class5_dog.png',
  frog: '/img/grids/ddpm_class6_frog.png',
  horse: '/img/grids/ddpm_class7_horse.png',
  ship: '/img/grids/ddpm_class8_ship.png',
  truck: '/img/grids/ddpm_class9_truck.png',
};

const CLASS_SHORT_MAP = {
  airplane: 'plane',
  plane: 'plane',
  automobile: 'car',
  car: 'car',
};

/**
 * Returns candidate grid image paths for a model and class.
 * @param {string} modelKey
 * @param {string} normCls
 * @returns {string[]}
 */
function getCandidateGridUrls(modelKey, normCls) {
  const shortCls = CLASS_SHORT_MAP[normCls] || normCls;
  const bankIndices = [0, 1, 2];
  const seeds = [42, 123, 256];

  if (modelKey === 'ddpm') {
    const urls = [];
    // 1. Direct class bank grids (raw & super-resolution: 48 + 48 = 96 distinct tiles)
    for (const idx of bankIndices) {
      urls.push(`/img/bank/ddpm_raw/${shortCls}_seed${idx}.png`);
      urls.push(`/img/bank/ddpm_sr/${shortCls}_seed${idx}.png`);
    }
    // 2. Class grid
    const classGrid = CLASS_TO_GRID_MAP[normCls];
    if (classGrid) urls.push(classGrid);
    // 3. Seed grids
    for (const s of seeds) {
      urls.push(`/img/grids/ddpm_seed${s}.png`);
      urls.push(`/img/bank/ddpm_seed${s}.png`);
    }
    return urls;
  }

  if (modelKey === 'vae') {
    const urls = [];
    for (const idx of bankIndices) {
      urls.push(`/img/bank/vae/unconditional_seed${idx}.png`);
    }
    for (const s of seeds) {
      urls.push(`/img/grids/vae_seed${s}.png`);
      urls.push(`/img/bank/vae_seed${s}.png`);
    }
    return urls;
  }

  if (modelKey === 'wgan') {
    const urls = [];
    for (const idx of bankIndices) {
      urls.push(`/img/bank/wgan/unconditional_seed${idx}.png`);
    }
    for (const s of seeds) {
      urls.push(`/img/grids/wgan_seed${s}.png`);
      urls.push(`/img/bank/wgan_seed${s}.png`);
    }
    return urls;
  }

  return [];
}

/**
 * Ensures exactly 16 discrete real model tiles for a model and class.
 * Never invents or repeats tiles inside a single 4x4 grid.
 * Uses a shuffle bag without replacement to vary outputs on every run.
 * 
 * @param {object} params
 * @param {string} params.modelKey - 'vae' | 'wgan' | 'ddpm'
 * @param {string} params.className - CIFAR-10 class name
 * @param {string|null} params.primarySource - base64/url from live response
 * @param {number} params.seed - current run seed
 * @returns {Promise<string[]>} array of exactly 16 tile URLs
 */
export async function assemble16Tiles({
  modelKey = 'ddpm',
  className = 'dog',
  primarySource = null,
  seed = 42,
  isLive = false,
  isLocked = false,
}) {
  const normCls = (className || 'dog').toLowerCase();
  let primaryTiles = [];

  if (primarySource) {
    try {
      primaryTiles = await splitGrid(primarySource);
    } catch (e) {
      console.warn('[assemble16Tiles] Failed splitting primary source:', e);
    }
  }

  // Deduplicate primary tiles
  const distinctPrimary = deduplicateTiles(primaryTiles);

  // If live run from Space ZeroGPU provided 16 distinct tiles, return them directly
  if (isLive && distinctPrimary.length >= 16) {
    return distinctPrimary.slice(0, 16);
  }

  // Build full candidate tile pool for this model/class from all available bank grids
  const candidateUrls = getCandidateGridUrls(modelKey, normCls);
  const poolTiles = [...distinctPrimary];

  for (const url of candidateUrls) {
    try {
      const sliced = await getCachedSlicedTiles(url);
      if (sliced && sliced.length) {
        poolTiles.push(...sliced);
      }
    } catch (err) {
      // Ignore individual file load errors
    }
  }

  const uniquePool = deduplicateTiles(poolTiles);

  // If pool has fewer than 16 tiles (rare fallback), top up from unconditional bank
  if (uniquePool.length < 16) {
    const backupSeeds = [42, 123, 256];
    for (const bs of backupSeeds) {
      const backupUrl = `/img/grids/ddpm_seed${bs}.png`;
      const extra = await getCachedSlicedTiles(backupUrl);
      uniquePool.push(...extra);
      if (deduplicateTiles(uniquePool).length >= 16) break;
    }
  }

  // Draw 16 tiles using the deterministic shuffle bag keyed by seed and model
  const { tiles } = drawFromShuffleBag(uniquePool, seed, 16, `${modelKey}_${normCls}`, isLocked);

  return tiles;
}
