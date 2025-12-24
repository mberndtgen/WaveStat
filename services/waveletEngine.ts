
import { WaveletType } from '../types';

/**
 * WaveStat Wavelet Engine
 * Generalized FIR filter implementation for various wavelet bases.
 */

interface WaveletFilter {
  low: number[];
  high: number[];
  invLow: number[];
  invHigh: number[];
}

// Coefficients for common wavelets used in early 90s image analysis
const FILTERS: Record<WaveletType, WaveletFilter> = {
  [WaveletType.HAAR]: {
    low: [0.70710678, 0.70710678],
    high: [-0.70710678, 0.70710678],
    invLow: [0.70710678, 0.70710678],
    invHigh: [0.70710678, -0.70710678],
  },
  [WaveletType.DAUBECHIES4]: {
    low: [0.4829629131, 0.8365163037, 0.224143868, -0.1294095226],
    high: [-0.1294095226, -0.224143868, 0.8365163037, -0.4829629131],
    invLow: [-0.1294095226, 0.224143868, 0.8365163037, 0.4829629131],
    invHigh: [-0.4829629131, 0.8365163037, -0.224143868, -0.1294095226],
  },
  [WaveletType.ADELSON]: {
    // Adelson 5-tap (symmetric)
    low: [0.05, 0.25, 0.4, 0.25, 0.05],
    high: [-0.05, -0.25, 0.6, -0.25, -0.05],
    invLow: [0.05, 0.25, 0.4, 0.25, 0.05],
    invHigh: [-0.05, -0.25, 0.6, -0.25, -0.05],
  },
  [WaveletType.COIFLET1]: {
    low: [-0.0156557281, -0.0727326195, 0.3848648466, 0.8525720202, 0.3378976924, -0.0727326195],
    high: [0.0727326195, 0.3378976924, -0.8525720202, 0.3848648466, 0.0727326195, -0.0156557281],
    invLow: [-0.0727326195, 0.3378976924, 0.8525720202, 0.3848648466, -0.0727326195, -0.0156557281],
    invHigh: [-0.0156557281, 0.0727326195, 0.0727326195, -0.3848648466, 0.3378976924, 0.0727326195],
  },
  [WaveletType.BATTLE_LEMARIE]: {
    // 10-tap approximation
    low: [0.015, -0.021, -0.05, 0.24, 0.7, 0.6, -0.08, -0.1, 0.03, 0.01],
    high: [-0.01, 0.03, 0.1, -0.08, -0.6, 0.7, -0.24, -0.05, 0.021, 0.015],
    invLow: [0.01, 0.03, -0.1, -0.08, 0.6, 0.7, 0.24, -0.05, -0.021, 0.015],
    invHigh: [0.015, 0.021, -0.05, -0.24, 0.7, -0.6, -0.08, 0.1, 0.03, -0.01],
  },
  [WaveletType.LINEAR_BSPLINE]: {
    low: [0.25, 0.5, 0.25],
    high: [-0.25, 0.5, -0.25],
    invLow: [0.25, 0.5, 0.25],
    invHigh: [-0.25, 0.5, -0.25],
  },
  [WaveletType.CUBIC_BSPLINE]: {
    low: [0.0625, 0.25, 0.375, 0.25, 0.0625],
    high: [-0.0625, -0.25, 0.625, -0.25, -0.0625],
    invLow: [0.0625, 0.25, 0.375, 0.25, 0.0625],
    invHigh: [-0.0625, -0.25, 0.625, -0.25, -0.0625],
  },
  [WaveletType.PSEUDO_COIFLET]: {
    low: [-0.05, 0.1, 0.4, 0.8, 0.4, 0.1, -0.05],
    high: [0.05, 0.1, -0.4, 0.8, -0.4, 0.1, 0.05],
    invLow: [-0.05, 0.1, 0.4, 0.8, 0.4, 0.1, -0.05],
    invHigh: [0.05, -0.1, 0.4, -0.8, 0.4, -0.1, 0.05],
  },
};

/**
 * 1D Forward DWT using Filter Bank
 */
function dwt1D(data: Float32Array, length: number, stride: number, filter: WaveletFilter): Float32Array {
  const output = new Float32Array(length);
  const half = length / 2;
  const fLen = filter.low.length;

  for (let i = 0; i < half; i++) {
    let lSum = 0;
    let hSum = 0;
    for (let f = 0; f < fLen; f++) {
      const dataIdx = (i * 2 + f) % length;
      lSum += data[dataIdx * stride] * filter.low[f];
      hSum += data[dataIdx * stride] * filter.high[f];
    }
    output[i] = lSum;
    output[i + half] = hSum;
  }
  return output;
}

/**
 * 1D Inverse DWT using Filter Bank
 */
function idwt1D(data: Float32Array, length: number, stride: number, filter: WaveletFilter): Float32Array {
  const output = new Float32Array(length);
  const half = length / 2;
  const fLen = filter.invLow.length;

  for (let i = 0; i < length; i++) {
    let sum = 0;
    // We reverse the downsampling and convolve
    for (let f = 0; f < fLen; f++) {
      const idx = i - f;
      if (idx >= 0 && idx % 2 === 0) {
        const k = idx / 2;
        sum += data[k * stride] * filter.invLow[f];
        sum += data[(k + half) * stride] * filter.invHigh[f];
      }
    }
    output[i] = sum;
  }
  return output;
}

export function performDWT(data: Float32Array, width: number, height: number, levels: number, type: WaveletType): Float32Array {
  const filter = FILTERS[type];
  const output = new Float32Array(data);
  let w = width;
  let h = height;

  for (let l = 0; l < levels; l++) {
    // Rows
    for (let y = 0; y < h; y++) {
      const row = new Float32Array(w);
      for (let x = 0; x < w; x++) row[x] = output[y * width + x];
      const res = dwt1D(row, w, 1, filter);
      for (let x = 0; x < w; x++) output[y * width + x] = res[x];
    }
    // Cols
    for (let x = 0; x < w; x++) {
      const col = new Float32Array(h);
      for (let y = 0; y < h; y++) col[y] = output[y * width + x];
      const res = dwt1D(col, h, 1, filter);
      for (let y = 0; y < h; y++) output[y * width + x] = res[y];
    }
    w /= 2;
    h /= 2;
  }
  return output;
}

export function performIDWT(data: Float32Array, width: number, height: number, levels: number, type: WaveletType): Float32Array {
  const filter = FILTERS[type];
  const output = new Float32Array(data);
  const sizes = [];
  let currW = width;
  let currH = height;
  for (let l = 0; l < levels; l++) {
    sizes.push({ w: currW, h: currH });
    currW /= 2;
    currH /= 2;
  }
  sizes.reverse();

  for (const { w, h } of sizes) {
    // Cols first (inverse of DWT order)
    for (let x = 0; x < w; x++) {
      const col = new Float32Array(h);
      for (let y = 0; y < h; y++) col[y] = output[y * width + x];
      const res = idwt1D(col, h, 1, filter);
      for (let y = 0; y < h; y++) output[y * width + x] = res[y];
    }
    // Rows
    for (let y = 0; y < h; y++) {
      const row = new Float32Array(w);
      for (let x = 0; x < w; x++) row[x] = output[y * width + x];
      const res = idwt1D(row, w, 1, filter);
      for (let x = 0; x < w; x++) output[y * width + x] = res[x];
    }
  }
  return output;
}

// Legacy helpers kept for compatibility if needed, but we prefer the generalized ones
export const performHaarDWT = (d: Float32Array, w: number, h: number, l: number) => performDWT(d, w, h, l, WaveletType.HAAR);
export const performHaarIDWT = (d: Float32Array, w: number, h: number, l: number) => performIDWT(d, w, h, l, WaveletType.HAAR);
