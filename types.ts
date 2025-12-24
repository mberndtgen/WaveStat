
export enum WaveletType {
  HAAR = 'Haar',
  DAUBECHIES4 = 'Daubechies-4',
  ADELSON = 'Adelson (5-tap)',
  COIFLET1 = 'Coiflet-1',
  BATTLE_LEMARIE = 'Battle-Lemarie',
  LINEAR_BSPLINE = 'Linear B-Spline',
  CUBIC_BSPLINE = 'Cubic B-Spline',
  PSEUDO_COIFLET = 'Pseudo-Coiflet',
}

export enum ClusterTarget {
  PIXELS = 'Pixels',
  COEFFICIENTS = 'Wavelet Coefficients',
}

export enum DistanceMetric {
  EUCLIDEAN = 'Euclidean',
  CITY_BLOCK = 'City-Block',
}

export enum LinkageMethod {
  SINGLE = 'Single Linkage',
  COMPLETE = 'Complete Linkage',
  AVERAGE = 'Average Linkage',
  WARD = 'Ward\'s Method',
  KMEANS_FAST = 'K-Means (Fast Proxy)',
}

export interface ProcessingOptions {
  wavelet: WaveletType;
  target: ClusterTarget;
  distance: DistanceMetric;
  linkage: LinkageMethod;
  clusters: number;
  levels: number;
  enableClustering: boolean;
}

export interface ImageDataState {
  original: Float32Array | null;
  width: number;
  height: number;
}

export interface ProcessedResults {
  coefficients: Float32Array;
  clusteredCoefficients: Float32Array;
  reconstructed: Float32Array;
  clusterMap: Uint32Array | null;
  clusterCount: number;
  metrics?: {
    mse: number;
    psnr: number;
    compressionFactor: number;
  };
}
