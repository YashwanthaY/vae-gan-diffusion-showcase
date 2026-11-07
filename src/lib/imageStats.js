/**
 * Pure Mathematical Computer Vision & Image Statistics Functions
 * Evaluated client-side directly on 32x32 CIFAR-10 generated tiles.
 * 
 * Functions:
 * 1. computeChannelHistogram (32 bins)
 * 2. wasserstein1 (1D Earth Mover's Distance)
 * 3. pairwiseDiversity (Mean pairwise L2 distance)
 * 4. laplacianVariance (Sharpness metric)
 * 5. colourfulness (Hasler & Süsstrunk metric)
 * 6. fft2 & radialPowerSpectrum (Radix-2 2D FFT & radial spectrum)
 * 7. pcaProject (Pixel-space projection onto principal components)
 */

/**
 * 1. Compute 32-bin normalized histograms for R, G, B channels in [0, 1]
 * @param {Uint8ClampedArray|number[]} rgbaPixels - 4096 bytes (32x32x4)
 * @param {number} numBins - 32 bins
 */
export function computeChannelHistogram(rgbaPixels, numBins = 32) {
  const rHist = new Float64Array(numBins);
  const gHist = new Float64Array(numBins);
  const bHist = new Float64Array(numBins);

  const totalPixels = rgbaPixels.length / 4;
  if (totalPixels === 0) {
    return { r: rHist, g: gHist, b: bHist };
  }

  for (let i = 0; i < rgbaPixels.length; i += 4) {
    const rBin = Math.min(numBins - 1, Math.floor((rgbaPixels[i] / 256) * numBins));
    const gBin = Math.min(numBins - 1, Math.floor((rgbaPixels[i + 1] / 256) * numBins));
    const bBin = Math.min(numBins - 1, Math.floor((rgbaPixels[i + 2] / 256) * numBins));

    rHist[rBin]++;
    gHist[gBin]++;
    bHist[bBin]++;
  }

  // Normalize so sum equals 1.0
  for (let b = 0; b < numBins; b++) {
    rHist[b] /= totalPixels;
    gHist[b] /= totalPixels;
    bHist[b] /= totalPixels;
  }

  return { r: rHist, g: gHist, b: bHist };
}

/**
 * 2. 1D Wasserstein-1 Distance (Earth Mover's Distance)
 * For 1D normalized distributions on [0, 1]: W_1 = (1 / N) * sum |CDF_A(i) - CDF_B(i)|
 * @param {Float64Array|number[]} histA
 * @param {Float64Array|number[]} histB
 */
export function wasserstein1(histA, histB) {
  if (!histA || !histB || histA.length !== histB.length || histA.length === 0) {
    return 0;
  }

  const n = histA.length;
  let cdfA = 0;
  let cdfB = 0;
  let w1Sum = 0;

  for (let i = 0; i < n; i++) {
    cdfA += histA[i];
    cdfB += histB[i];
    w1Sum += Math.abs(cdfA - cdfB);
  }

  return w1Sum / n;
}

/**
 * 3. Pairwise Pixel Diversity: mean pairwise L2 distance across tiles in [0, 1]
 * @param {Array<Uint8ClampedArray|number[]>} tilesPixels - array of 16 tile pixel buffers
 */
export function pairwiseDiversity(tilesPixels) {
  const K = tilesPixels.length;
  if (K < 2) return 0;

  let totalDist = 0;
  let pairCount = 0;

  for (let i = 0; i < K; i++) {
    const pA = tilesPixels[i];
    for (let j = i + 1; j < K; j++) {
      const pB = tilesPixels[j];
      let sumSq = 0;
      let count = 0;

      // Sample RGB channels (skip alpha)
      for (let p = 0; p < pA.length; p += 4) {
        const diffR = (pA[p] - pB[p]) / 255;
        const diffG = (pA[p + 1] - pB[p + 1]) / 255;
        const diffB = (pA[p + 2] - pB[p + 2]) / 255;
        sumSq += diffR * diffR + diffG * diffG + diffB * diffB;
        count += 3;
      }

      totalDist += Math.sqrt(sumSq / count);
      pairCount++;
    }
  }

  return pairCount > 0 ? totalDist / pairCount : 0;
}

/**
 * 4. Sharpness: Variance of Laplacian operator on greyscale intensity
 * @param {Uint8ClampedArray|number[]} rgbaPixels - 32x32x4
 * @param {number} width - 32
 * @param {number} height - 32
 */
export function laplacianVariance(rgbaPixels, width = 32, height = 32) {
  if (!rgbaPixels || rgbaPixels.length < width * height * 4) return 0;

  // Convert to greyscale in [0, 255]
  const grey = new Float64Array(width * height);
  for (let i = 0, g = 0; i < rgbaPixels.length; i += 4, g++) {
    grey[g] = 0.299 * rgbaPixels[i] + 0.587 * rgbaPixels[i + 1] + 0.114 * rgbaPixels[i + 2];
  }

  // 3x3 discrete Laplacian kernel
  const innerCount = (width - 2) * (height - 2);
  if (innerCount <= 0) return 0;

  const laplacian = new Float64Array(innerCount);
  let idx = 0;
  let sum = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const c = grey[y * width + x];
      const val =
        grey[(y - 1) * width + x] +
        grey[(y + 1) * width + x] +
        grey[y * width + (x - 1)] +
        grey[y * width + (x + 1)] -
        4 * c;

      laplacian[idx++] = val;
      sum += val;
    }
  }

  const mean = sum / innerCount;
  let varSum = 0;
  for (let i = 0; i < innerCount; i++) {
    const diff = laplacian[i] - mean;
    varSum += diff * diff;
  }

  return varSum / innerCount;
}

/**
 * 5. Colourfulness: Hasler & Süsstrunk (2003)
 * @param {Uint8ClampedArray|number[]} rgbaPixels - 32x32x4
 */
export function colourfulness(rgbaPixels) {
  if (!rgbaPixels || rgbaPixels.length === 0) return 0;

  const n = rgbaPixels.length / 4;
  let sumRg = 0;
  let sumYb = 0;

  const rgs = new Float64Array(n);
  const ybs = new Float64Array(n);

  for (let i = 0, p = 0; i < rgbaPixels.length; i += 4, p++) {
    const r = rgbaPixels[i];
    const g = rgbaPixels[i + 1];
    const b = rgbaPixels[i + 2];

    const rg = r - g;
    const yb = 0.5 * (r + g) - b;

    rgs[p] = rg;
    ybs[p] = yb;
    sumRg += rg;
    sumYb += yb;
  }

  const meanRg = sumRg / n;
  const meanYb = sumYb / n;

  let varRg = 0;
  let varYb = 0;
  for (let p = 0; p < n; p++) {
    const dRg = rgs[p] - meanRg;
    const dYb = ybs[p] - meanYb;
    varRg += dRg * dRg;
    varYb += dYb * dYb;
  }

  const stdRg = Math.sqrt(varRg / n);
  const stdYb = Math.sqrt(varYb / n);
  const stdRoot = Math.sqrt(stdRg * stdRg + stdYb * stdYb);
  const meanRoot = Math.sqrt(meanRg * meanRg + meanYb * meanYb);

  return stdRoot + 0.3 * meanRoot;
}

/**
 * 1D Radix-2 in-place Cooley-Tukey FFT (power of 2 length)
 */
function fft1D(real, imag) {
  const n = real.length;
  // Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      const tempR = real[i];
      real[i] = real[j];
      real[j] = tempR;

      const tempI = imag[i];
      imag[i] = imag[j];
      imag[j] = tempI;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // Cooley-Tukey butterflies
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let wR = 1.0;
      let wI = 0.0;
      for (let k = 0; k < half; k++) {
        const uR = real[i + k];
        const uI = imag[i + k];
        const vR = real[i + k + half] * wR - imag[i + k + half] * wI;
        const vI = real[i + k + half] * wI + imag[i + k + half] * wR;

        real[i + k] = uR + vR;
        imag[i + k] = uI + vI;
        real[i + k + half] = uR - vR;
        imag[i + k + half] = uI - vI;

        const nextWR = wR * wStepR - wI * wStepI;
        wI = wR * wStepI + wI * wStepR;
        wR = nextWR;
      }
    }
  }
}

/**
 * 6. 2D Radix-2 FFT on 32x32 greyscale image
 * @param {Float64Array|number[]} greyscale32x32 - 1024 samples
 */
export function fft2(greyscale32x32, width = 32, height = 32) {
  const n = width * height;
  const real = new Float64Array(greyscale32x32);
  const imag = new Float64Array(n);

  // 1. Transform each row (width = 32)
  const rowReal = new Float64Array(width);
  const rowImag = new Float64Array(width);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      rowReal[x] = real[rowOffset + x];
      rowImag[x] = imag[rowOffset + x];
    }
    fft1D(rowReal, rowImag);
    for (let x = 0; x < width; x++) {
      real[rowOffset + x] = rowReal[x];
      imag[rowOffset + x] = rowImag[x];
    }
  }

  // 2. Transform each column (height = 32)
  const colReal = new Float64Array(height);
  const colImag = new Float64Array(height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      colReal[y] = real[y * width + x];
      colImag[y] = imag[y * width + x];
    }
    fft1D(colReal, colImag);
    for (let y = 0; y < height; y++) {
      real[y * width + x] = colReal[y];
      imag[y * width + x] = colImag[y];
    }
  }

  return { real, imag };
}

/**
 * Radially averaged power spectrum with fftshift (16 radial bins)
 * @param {Float64Array} real
 * @param {Float64Array} imag
 * @param {number} numBins - 16
 */
export function radialPowerSpectrum(real, imag, width = 32, height = 32, numBins = 16) {
  const halfW = width >> 1; // 16
  const halfH = height >> 1; // 16

  const binSums = new Float64Array(numBins);
  const binCounts = new Float64Array(numBins);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Shift DC component to (halfW, halfH)
      const u = (x + halfW) % width;
      const v = (y + halfH) % height;

      const dx = u - halfW;
      const dy = v - halfH;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const bin = Math.min(numBins - 1, Math.floor(radius));

      const r = real[y * width + x];
      const i = imag[y * width + x];
      const power = r * r + i * i;

      binSums[bin] += power;
      binCounts[bin]++;
    }
  }

  const spectrum = new Float64Array(numBins);
  for (let b = 0; b < numBins; b++) {
    spectrum[b] = binCounts[b] > 0 ? binSums[b] / binCounts[b] : 0;
  }

  return spectrum;
}

/**
 * 7. Project 32x32x3 image onto PCA components from reference_stats.json
 * @param {Uint8ClampedArray|number[]} rgbaPixels - 4096 bytes (1024 pixels)
 * @param {number[]} pcaMean - 3072 floats
 * @param {number[][]} pcaComponents - [comp1 (3072), comp2 (3072)]
 */
export function pcaProject(rgbaPixels, pcaMean, pcaComponents) {
  if (!pcaMean || !pcaComponents || pcaComponents.length < 2) {
    return { pc1: 0, pc2: 0 };
  }

  // Extract flattened RGB in [0, 1]
  let pc1 = 0;
  let pc2 = 0;
  const comp1 = pcaComponents[0];
  const comp2 = pcaComponents[1];

  let pIdx = 0;
  for (let i = 0; i < rgbaPixels.length; i += 4) {
    const r = (rgbaPixels[i] / 255) - (pcaMean[pIdx] || 0);
    const g = (rgbaPixels[i + 1] / 255) - (pcaMean[pIdx + 1] || 0);
    const b = (rgbaPixels[i + 2] / 255) - (pcaMean[pIdx + 2] || 0);

    pc1 += r * comp1[pIdx] + g * comp1[pIdx + 1] + b * comp1[pIdx + 2];
    pc2 += r * comp2[pIdx] + g * comp2[pIdx + 1] + b * comp2[pIdx + 2];

    pIdx += 3;
  }

  return { pc1, pc2 };
}

/**
 * 8. Load an image URL and extract its 32x32 RGBA pixel buffer (Uint8ClampedArray).
 * @param {string} url - base64, data-URL or relative path
 * @returns {Promise<Uint8ClampedArray>}
 */
export async function getImageDataFromUrl(url) {
  if (!url) return new Uint8ClampedArray(32 * 32 * 4);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 32, 32);
    const imgData = ctx.getImageData(0, 0, 32, 32);
    return imgData.data;
  } catch (e) {
    return new Uint8ClampedArray(32 * 32 * 4);
  }
}

/**
 * 9. Extract ImageData pixel buffers from array of tile URLs
 * @param {string[]} tileUrls
 * @returns {Promise<Uint8ClampedArray[]>}
 */
export async function extractTilePixels(tileUrls) {
  if (!Array.isArray(tileUrls)) return [];
  return Promise.all(tileUrls.map(url => getImageDataFromUrl(url)));
}

