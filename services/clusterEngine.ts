
import { LinkageMethod, DistanceMetric } from '../types';

/**
 * WaveStat Clustering Engine
 */

export interface ClusteringResult {
  clusterMap: Uint32Array;
  centroids: Float32Array;
}

// Simple K-Means as a fast proxy for browser performance
// Note: Real hierarchical clustering on 16k pixels is O(N^2) and very slow for a live web app.
// We implement a fast K-Means but allow it to be configured.
export function performClustering(
  data: Float32Array, 
  k: number, 
  metric: DistanceMetric = DistanceMetric.EUCLIDEAN
): ClusteringResult {
  const n = data.length;
  const clusterMap = new Uint32Array(n);
  const centroids = new Float32Array(k);

  // Initialize centroids randomly from data
  for (let i = 0; i < k; i++) {
    centroids[i] = data[Math.floor(Math.random() * n)];
  }

  const maxIter = 10;
  for (let iter = 0; iter < maxIter; iter++) {
    const counts = new Uint32Array(k);
    const sums = new Float64Array(k);

    // Assignment
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestK = 0;
      for (let j = 0; j < k; j++) {
        const dist = metric === DistanceMetric.EUCLIDEAN 
          ? Math.abs(data[i] - centroids[j]) ** 2
          : Math.abs(data[i] - centroids[j]);
        
        if (dist < minDist) {
          minDist = dist;
          bestK = j;
        }
      }
      clusterMap[i] = bestK;
      counts[bestK]++;
      sums[bestK] += data[i];
    }

    // Update
    let changed = false;
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        const next = sums[j] / counts[j];
        if (Math.abs(centroids[j] - next) > 0.001) {
          centroids[j] = next;
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  return { clusterMap, centroids };
}

// Map clusters back to values
export function applyClusters(data: Float32Array, clusterMap: Uint32Array, centroids: Float32Array): Float32Array {
  const output = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    output[i] = centroids[clusterMap[i]];
  }
  return output;
}
