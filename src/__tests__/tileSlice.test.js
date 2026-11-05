import { describe, it, expect } from 'vitest';

/**
 * Coordinate mapping helper for 4x4 grid of 32x32 tiles.
 * Total dimensions: 128x128 px.
 */
export function getTileCoordinates(index, tileDim = 32, cols = 4) {
  if (index < 0 || index >= 16) throw new Error('Tile index out of range [0, 15]');
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    sx: col * tileDim,
    sy: row * tileDim,
    sw: tileDim,
    sh: tileDim,
  };
}

/**
 * Simulates slicing a 128x128 buffer into 16 discrete 32x32 tiles.
 */
export function sliceTileBuffer(buffer, width = 128, height = 128, tileDim = 32, channels = 4) {
  const tiles = [];
  const cols = width / tileDim;
  const rows = height / tileDim;
  const numTiles = rows * cols;

  for (let k = 0; k < numTiles; k++) {
    const { sx, sy, sw, sh } = getTileCoordinates(k, tileDim, cols);
    const tileData = new Uint8Array(sw * sh * channels);
    let targetIdx = 0;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const srcIdx = ((sy + y) * width + (sx + x)) * channels;
        for (let c = 0; c < channels; c++) {
          tileData[targetIdx++] = buffer[srcIdx + c];
        }
      }
    }
    tiles.push(tileData);
  }
  return tiles;
}

describe('tile slicing logic', () => {
  it('correctly maps 16 tiles across a 4x4 grid', () => {
    const coords0 = getTileCoordinates(0, 32, 4);
    expect(coords0).toEqual({ sx: 0, sy: 0, sw: 32, sh: 32 });

    const coords5 = getTileCoordinates(5, 32, 4);
    expect(coords5).toEqual({ sx: 32, sy: 32, sw: 32, sh: 32 });

    const coords15 = getTileCoordinates(15, 32, 4);
    expect(coords15).toEqual({ sx: 96, sy: 96, sw: 32, sh: 32 });
  });

  it('slices a 128x128 synthetic pixel buffer into 16 distinct 32x32 tiles without loss', () => {
    // Fill 128x128 buffer where each tile has a unique identifier in its red channel
    const width = 128;
    const height = 128;
    const channels = 4;
    const buffer = new Uint8Array(width * height * channels);

    for (let k = 0; k < 16; k++) {
      const { sx, sy, sw, sh } = getTileCoordinates(k, 32, 4);
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const idx = ((sy + y) * width + (sx + x)) * channels;
          buffer[idx] = k * 10;     // R: tile identifier
          buffer[idx + 1] = 100;    // G
          buffer[idx + 2] = 200;    // B
          buffer[idx + 3] = 255;    // A
        }
      }
    }

    const tiles = sliceTileBuffer(buffer, width, height, 32, channels);
    expect(tiles.length).toBe(16);

    tiles.forEach((tile, k) => {
      expect(tile.length).toBe(32 * 32 * 4);
      // Check first pixel
      expect(tile[0]).toBe(k * 10);
      expect(tile[1]).toBe(100);
      expect(tile[2]).toBe(200);
      expect(tile[3]).toBe(255);
      // Check last pixel
      const last = (32 * 32 - 1) * 4;
      expect(tile[last]).toBe(k * 10);
    });
  });
});

