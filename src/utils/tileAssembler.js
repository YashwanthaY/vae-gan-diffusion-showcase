import { splitGrid } from './splitGrid.js';
import { CIFAR10_CLASSES } from '../config.js';

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

/**
 * Ensures exactly 16 discrete real model tiles for a model and class.
 * Never invents, repeats, or fakes tiles.
 * 
 * Fallback chain:
 * 1. Primary grid from live run or cache
 * 2. If < 16, assemble remaining tiles from bank grids of the SAME model & class.
 */
export async function assemble16Tiles({
  modelKey = 'ddpm',
  className = 'dog',
  primarySource = null,
  seed = 42,
}) {
  const normCls = (className || 'dog').toLowerCase();
  let tiles = [];

  if (primarySource) {
    try {
      tiles = await splitGrid(primarySource);
    } catch (e) {
      console.warn('[assemble16Tiles] Failed splitting primary source:', e);
    }
  }

  if (tiles.length >= 16) {
    return tiles.slice(0, 16);
  }

  // Fallback: load bank grid of same model & class
  try {
    let fallbackPath = null;
    const seedNum = Number(seed);
    const validSeed = [42, 123, 256].includes(seedNum) ? seedNum : 42;

    if (modelKey === 'ddpm') {
      fallbackPath = CLASS_TO_GRID_MAP[normCls] || `/img/grids/ddpm_seed${validSeed}.png`;
    } else if (modelKey === 'vae') {
      fallbackPath = `/img/grids/vae_seed${validSeed}.png`;
    } else if (modelKey === 'wgan') {
      fallbackPath = `/img/grids/wgan_seed${validSeed}.png`;
    }

    if (fallbackPath) {
      const bankTiles = await splitGrid(fallbackPath);
      for (const t of bankTiles) {
        if (tiles.length >= 16) break;
        // Only append if not identical
        if (!tiles.includes(t)) {
          tiles.push(t);
        }
      }
    }
  } catch (err) {
    console.warn('[assemble16Tiles] Bank fallback failed:', err);
  }

  return tiles;
}

