/**
 * Client-side real computer vision image metrics computed on discrete tiles.
 * Everything computed mathematically from ImageData in browser Canvas - zero hardcoded values.
 */

// Helper to get ImageData from a tile (data URL, image URL, or Image element)
export async function getTileImageData(tileSource) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 32;
        canvas.height = img.naturalHeight || img.height || 32;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imgData);
      } catch (e) {
        console.warn('Canvas getImageData failed:', e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = tileSource;
  });
}

/**
 * 1. Pixel Diversity: Mean pairwise L2 distance between all 16 tiles in [0, 1] RGB space.
 */
export function computePixelDiversity(imageDataList) {
  const valid = imageDataList.filter(Boolean);
  if (valid.length < 2) return 0;

  // Convert each image data into a normalized float array in [0, 1]
  const vectors = valid.map((id) => {
    const data = id.data;
    const len = data.length;
    const vec = new Float32Array(len * 0.75); // exclude alpha
    let vIdx = 0;
    for (let i = 0; i < len; i += 4) {
      vec[vIdx++] = data[i] / 255;
      vec[vIdx++] = data[i + 1] / 255;
      vec[vIdx++] = data[i + 2] / 255;
    }
    return vec;
  });

  let totalDist = 0;
  let count = 0;

  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const v1 = vectors[i];
      const v2 = vectors[j];
      let sumSq = 0;
      for (let k = 0; k < v1.length; k++) {
        const diff = v1[k] - v2[k];
        sumSq += diff * diff;
      }
      totalDist += Math.sqrt(sumSq / v1.length);
      count++;
    }
  }

  return count > 0 ? totalDist / count : 0;
}

/**
 * 2. Sharpness: Variance of the discrete Laplacian kernel response.
 * Kernel = [ 0, 1, 0; 1, -4, 1; 0, 1, 0 ]
 */
export function computeSharpness(imageData) {
  if (!imageData) return 0;
  const { width: w, height: h, data } = imageData;
  if (w < 3 || h < 3) return 0;

  // Compute grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Apply Laplacian
  const lap = new Float32Array((w - 2) * (h - 2));
  let idx = 0;
  let sum = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const c = gray[y * w + x];
      const val =
        gray[(y - 1) * w + x] +
        gray[(y + 1) * w + x] +
        gray[y * w + (x - 1)] +
        gray[y * w + (x + 1)] -
        4 * c;
      lap[idx++] = val;
      sum += val;
    }
  }

  const n = lap.length;
  if (n === 0) return 0;
  const mean = sum / n;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const diff = lap[i] - mean;
    sumSq += diff * diff;
  }

  return sumSq / n;
}

/**
 * 3. Colourfulness (Hasler and Süsstrunk metric, 2003).
 */
export function computeColourfulness(imageData) {
  if (!imageData) return 0;
  const { data } = imageData;
  const n = data.length / 4;
  if (n === 0) return 0;

  let sumRg = 0;
  let sumYb = 0;

  const rg = new Float32Array(n);
  const yb = new Float32Array(n);

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const valRg = r - g;
    const valYb = 0.5 * (r + g) - b;

    rg[j] = valRg;
    yb[j] = valYb;
    sumRg += valRg;
    sumYb += valYb;
  }

  const meanRg = sumRg / n;
  const meanYb = sumYb / n;

  let varRg = 0;
  let varYb = 0;
  for (let i = 0; i < n; i++) {
    const dRg = rg[i] - meanRg;
    const dYb = yb[i] - meanYb;
    varRg += dRg * dRg;
    varYb += dYb * dYb;
  }

  const stdRg = Math.sqrt(varRg / n);
  const stdYb = Math.sqrt(varYb / n);

  const stdRgyb = Math.sqrt(stdRg * stdRg + stdYb * stdYb);
  const meanRgyb = Math.sqrt(meanRg * meanRg + meanYb * meanYb);

  return stdRgyb + 0.3 * meanRgyb;
}

/**
 * 4. Mean Brightness (in [0, 1]).
 */
export function computeMeanBrightness(imageData) {
  if (!imageData) return 0;
  const { data } = imageData;
  let sum = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return n > 0 ? (sum / n) / 255 : 0;
}

/**
 * 5. Mean Saturation (in [0, 1]).
 */
export function computeMeanSaturation(imageData) {
  if (!imageData) return 0;
  const { data } = imageData;
  let sumSat = 0;
  const n = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const sat = max === 0 ? 0 : delta / max;
    sumSat += sat;
  }

  return n > 0 ? sumSat / n : 0;
}

/**
 * RGB Histograms and Distribution Distance vs CIFAR-10 training set reference.
 * CIFAR-10 reference: mean = [0.4914, 0.4822, 0.4465], std = [0.2470, 0.2435, 0.2616]
 */
export const CIFAR10_REF = {
  mean: [0.4914, 0.4822, 0.4465],
  std:  [0.2470, 0.2435, 0.2616],
};

export function computeRgbStats(imageDataList) {
  const valid = imageDataList.filter(Boolean);
  if (!valid.length) {
    return {
      means: [0, 0, 0],
      stds: [0, 0, 0],
      distance: 0,
      histR: new Array(16).fill(0),
      histG: new Array(16).fill(0),
      histB: new Array(16).fill(0),
    };
  }

  let totalPixels = 0;
  let sumR = 0, sumG = 0, sumB = 0;
  const histR = new Array(16).fill(0);
  const histG = new Array(16).fill(0);
  const histB = new Array(16).fill(0);

  for (const id of valid) {
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255;
      const g = d[i + 1] / 255;
      const b = d[i + 2] / 255;

      sumR += r;
      sumG += g;
      sumB += b;
      totalPixels++;

      const bR = Math.min(15, Math.floor(r * 16));
      const bG = Math.min(15, Math.floor(g * 16));
      const bB = Math.min(15, Math.floor(b * 16));
      histR[bR]++;
      histG[bG]++;
      histB[bB]++;
    }
  }

  const meanR = sumR / totalPixels;
  const meanG = sumG / totalPixels;
  const meanB = sumB / totalPixels;

  let sqR = 0, sqG = 0, sqB = 0;
  for (const id of valid) {
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255 - meanR;
      const g = d[i + 1] / 255 - meanG;
      const b = d[i + 2] / 255 - meanB;
      sqR += r * r;
      sqG += g * g;
      sqB += b * b;
    }
  }

  const stdR = Math.sqrt(sqR / totalPixels);
  const stdG = Math.sqrt(sqG / totalPixels);
  const stdB = Math.sqrt(sqB / totalPixels);

  // Wasserstein-1 / distribution distance on Gaussians: sqrt((m1-m2)^2 + (s1-s2)^2)
  const distR = Math.sqrt((meanR - CIFAR10_REF.mean[0]) ** 2 + (stdR - CIFAR10_REF.std[0]) ** 2);
  const distG = Math.sqrt((meanG - CIFAR10_REF.mean[1]) ** 2 + (stdG - CIFAR10_REF.std[1]) ** 2);
  const distB = Math.sqrt((meanB - CIFAR10_REF.mean[2]) ** 2 + (stdB - CIFAR10_REF.std[2]) ** 2);
  const distance = (distR + distG + distB) / 3;

  return {
    means: [meanR, meanG, meanB],
    stds: [stdR, stdG, stdB],
    distance,
    histR: histR.map(v => v / totalPixels),
    histG: histG.map(v => v / totalPixels),
    histB: histB.map(v => v / totalPixels),
  };
}

/**
 * Compute all 5 metrics for a set of tile image data
 */
export async function computeAllTileMetrics(tileUrls) {
  const imgDataList = await Promise.all(tileUrls.map(url => getTileImageData(url)));
  const validData = imgDataList.filter(Boolean);

  if (!validData.length) {
    return {
      diversity: 0,
      sharpness: 0,
      colourfulness: 0,
      brightness: 0,
      saturation: 0,
      rgbStats: computeRgbStats([]),
    };
  }

  const diversity = computePixelDiversity(validData);
  const sharpnessList = validData.map(id => computeSharpness(id));
  const meanSharpness = sharpnessList.reduce((a, b) => a + b, 0) / sharpnessList.length;

  const colorList = validData.map(id => computeColourfulness(id));
  const meanColor = colorList.reduce((a, b) => a + b, 0) / colorList.length;

  const brightList = validData.map(id => computeMeanBrightness(id));
  const meanBrightness = brightList.reduce((a, b) => a + b, 0) / brightList.length;

  const satList = validData.map(id => computeMeanSaturation(id));
  const meanSaturation = satList.reduce((a, b) => a + b, 0) / satList.length;

  const rgbStats = computeRgbStats(validData);

  return {
    diversity,
    sharpness: meanSharpness,
    colourfulness: meanColor,
    brightness: meanBrightness,
    saturation: meanSaturation,
    rgbStats,
  };
}

