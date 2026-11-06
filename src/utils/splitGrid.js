import { TILE } from '../config.js';

/**
 * Detect layout and extract discrete 32x32 tiles from any grid image.
 * Works in both browser (Canvas) and test environments.
 * 
 * Supports layouts:
 * - 4x4 (16 tiles): 552x552, 414x414, 128x128, etc.
 * - 2x4 (8 tiles): 414x210, 128x64, etc.
 * - 2x2 (4 tiles): 210x210, 64x64, etc.
 * - 1x16 (16 tiles): 512x32, etc.
 * 
 * Returns: Promise<string[]> (array of 32x32 PNG data-URLs)
 */
export function detectGridLayout(width, height) {
  const ratio = width / height;

  if (ratio > 8) {
    return { rows: 1, cols: 16, count: 16 };
  }
  if (ratio < 0.2) {
    return { rows: 16, cols: 1, count: 16 };
  }
  if (ratio >= 1.6 && ratio <= 2.5) {
    return { rows: 2, cols: 4, count: 8 };
  }
  if (ratio >= 0.4 && ratio <= 0.65) {
    return { rows: 4, cols: 2, count: 8 };
  }
  // Roughly square:
  if (width <= 100 || (width >= 180 && width <= 250)) {
    return { rows: 2, cols: 2, count: 4 };
  }
  return { rows: 4, cols: 4, count: 16 };
}

/**
 * Detect padding and scale from dimensions.
 */
export function detectGridParams(width, height, cols, rows) {
  // Check if standard torchvision make_grid with padding=2
  // grid_w = (cols * 32 + (cols + 1) * 2) * scale
  for (const s of [4, 3, 2, 1]) {
    const expectedW = (cols * 32 + (cols + 1) * 2) * s;
    const expectedH = (rows * 32 + (rows + 1) * 2) * s;
    if (Math.abs(width - expectedW) <= 2 && Math.abs(height - expectedH) <= 2) {
      return { scale: s, padding: 2, hasPadding: true };
    }
  }

  // Raw tile sheet without padding
  return { scale: width / (cols * 32), padding: 0, hasPadding: false };
}

/**
 * Splits any source image into an array of 32x32 tile data-URLs.
 */
export async function splitGrid(source) {
  if (!source) return [];

  // Helper to load image
  const loadImage = (src) => new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('Image is not defined in this environment'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);

    if (typeof src === 'string') {
      if (src.startsWith('data:') || src.startsWith('/') || src.startsWith('http')) {
        img.src = src;
      } else {
        img.src = `data:image/png;base64,${src}`;
      }
    } else {
      resolve(src);
    }
  });

  try {
    const img = await loadImage(source);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const { rows, cols, count } = detectGridLayout(w, h);
    const { scale, padding, hasPadding } = detectGridParams(w, h, cols, rows);

    const tiles = [];
    const canvas = document.createElement('canvas');
    canvas.width = TILE; // 32
    canvas.height = TILE; // 32
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sx, sy, sw, sh;
        if (hasPadding) {
          sx = (padding + c * (TILE + padding)) * scale;
          sy = (padding + r * (TILE + padding)) * scale;
          sw = TILE * scale;
          sh = TILE * scale;
        } else {
          sw = w / cols;
          sh = h / rows;
          sx = c * sw;
          sy = r * sh;
        }

        ctx.clearRect(0, 0, TILE, TILE);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TILE, TILE);
        tiles.push(canvas.toDataURL('image/png'));
      }
    }

    return tiles;
  } catch (err) {
    console.warn('[splitGrid] Failed to split grid:', err);
    return [];
  }
}
