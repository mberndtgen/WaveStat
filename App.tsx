
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  WaveletType, 
  ClusterTarget, 
  DistanceMetric, 
  LinkageMethod, 
  ProcessingOptions, 
  ImageDataState, 
  ProcessedResults 
} from './types';
import ProcessingPanel from './components/ProcessingPanel';
import { performDWT, performIDWT } from './services/waveletEngine';
import { performClustering, applyClusters } from './services/clusterEngine';

const App: React.FC = () => {
  const [image, setImage] = useState<ImageDataState | null>(null);
  const [results, setResults] = useState<ProcessedResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState<ProcessingOptions>({
    wavelet: WaveletType.HAAR,
    target: ClusterTarget.COEFFICIENTS,
    distance: DistanceMetric.EUCLIDEAN,
    linkage: LinkageMethod.KMEANS_FAST,
    clusters: 16,
    levels: 2,
    enableClustering: true
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const grayscale = new Float32Array(size * size);
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i+1];
        const b = imageData.data[i+2];
        grayscale[i/4] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      setImage({ original: grayscale, width: size, height: size });
      setResults(null);
    };
    img.src = URL.createObjectURL(file);
  };

  const calculateMetrics = (original: Float32Array, reconstructed: Float32Array) => {
    let mse = 0;
    for (let i = 0; i < original.length; i++) {
      mse += Math.pow(original[i] - reconstructed[i], 2);
    }
    mse /= original.length;
    
    const psnr = mse > 0 ? 20 * Math.log10(255 / Math.sqrt(mse)) : 100;
    const bitsPerPixel = options.enableClustering ? Math.max(1, Math.log2(options.clusters)) : 8;
    const compressionFactor = options.enableClustering ? 8 / bitsPerPixel : 1;

    return { mse, psnr, compressionFactor };
  };

  const runAnalysis = useCallback(async () => {
    if (!image || !image.original) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        let workData: Float32Array;
        let coefficients: Float32Array;
        
        // Use generalized DWT
        coefficients = performDWT(image.original!, image.width, image.height, options.levels, options.wavelet);

        let clusterMap: Uint32Array | null = null;
        let clusteredValues: Float32Array;

        if (options.enableClustering) {
          workData = options.target === ClusterTarget.COEFFICIENTS ? coefficients : image.original!;
          const clusterRes = performClustering(workData, options.clusters, options.distance);
          clusterMap = clusterRes.clusterMap;
          clusteredValues = applyClusters(workData, clusterMap, clusterRes.centroids);
        } else {
          clusteredValues = options.target === ClusterTarget.COEFFICIENTS ? coefficients : image.original!;
        }

        let reconstructed: Float32Array;
        if (options.target === ClusterTarget.COEFFICIENTS) {
          reconstructed = performIDWT(clusteredValues, image.width, image.height, options.levels, options.wavelet);
        } else {
          reconstructed = clusteredValues;
        }

        const metrics = calculateMetrics(image.original!, reconstructed);

        setResults({
          coefficients,
          clusteredCoefficients: clusteredValues,
          reconstructed,
          clusterMap,
          clusterCount: options.clusters,
          metrics
        });
      } catch (err) {
        console.error("Processing error:", err);
        alert("An error occurred during processing.");
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  }, [image, options]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-400">WaveStat Browser</h1>
        <p className="text-slate-400 mt-2">Exploratory Cluster Analysis of Wavelet Coefficients</p>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 items-start">
        <div className="w-full lg:w-auto space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-lg font-semibold mb-3 text-blue-300">1. Image Source</h2>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-blue-100 hover:file:bg-blue-800 transition-colors"
            />
          </div>

          <ProcessingPanel 
            options={options} 
            setOptions={setOptions} 
            onRun={runAnalysis} 
            isProcessing={isProcessing}
          />

          {image && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 animate-in fade-in duration-500">
              <h2 className="text-xl font-bold border-b border-slate-700 pb-2 text-blue-300">Analysis Data</h2>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <span className="text-slate-400">Dimensions:</span>
                <span className="text-slate-100 font-mono">{image.width} × {image.height}</span>
                
                <span className="text-slate-400">Total Samples:</span>
                <span className="text-slate-100 font-mono">{(image.width * image.height).toLocaleString()}</span>
                
                <span className="text-slate-400">Clustering:</span>
                <span className={`${options.enableClustering ? 'text-green-400' : 'text-slate-500'} font-semibold`}>
                  {options.enableClustering ? 'Enabled' : 'Disabled'}
                </span>

                {options.enableClustering && (
                  <>
                    <span className="text-slate-400">Clusters (K):</span>
                    <span className="text-slate-100 font-mono">{options.clusters}</span>
                    
                    <span className="text-slate-400">Target:</span>
                    <span className="text-slate-100">{options.target}</span>
                  </>
                )}

                {results?.metrics && (
                  <>
                    <div className="col-span-2 border-t border-slate-700 my-1"></div>
                    
                    <span className="text-slate-400">Avg. Error (MSE):</span>
                    <span className="text-slate-100 font-mono">{results.metrics.mse.toFixed(2)}</span>
                    
                    <span className="text-slate-400">Quality (PSNR):</span>
                    <span className="text-slate-100 font-mono">{results.metrics.psnr.toFixed(2)} dB</span>
                    
                    {options.enableClustering && (
                      <>
                        <span className="text-slate-400">Data Reduction:</span>
                        <span className="text-green-400 font-mono">{results.metrics.compressionFactor.toFixed(2)}x</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {image && (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Original Image</h3>
              <CanvasDisplay data={image.original!} width={image.width} height={image.height} />
            </div>
          )}

          {results && image && (
            <>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">
                  {results.clusterMap ? 'Reconstructed (Clustered)' : 'Reconstructed (IDWT Only)'}
                </h3>
                <CanvasDisplay data={results.reconstructed} width={image.width} height={image.height} />
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Cluster Map (Viz)</h3>
                {results.clusterMap ? (
                  <CanvasDisplay 
                    data={image.original!} 
                    width={image.width} 
                    height={image.height} 
                    clusterMap={results.clusterMap}
                    clusterCount={results.clusterCount}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[256px] bg-slate-900 rounded-lg text-slate-600 text-xs italic">
                    Clustering disabled
                  </div>
                )}
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Coefficients (DWT)</h3>
                <CanvasDisplay 
                  data={results.coefficients} 
                  width={image.width} 
                  height={image.height} 
                  isDWT 
                />
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 col-span-1 md:col-span-2">
                <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Difference (Error)</h3>
                <CanvasDisplay 
                    data={image.original!} 
                    compareData={results.reconstructed}
                    width={image.width} 
                    height={image.height} 
                    isDiff
                />
              </div>
            </>
          )}

          {!image && (
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-slate-700 rounded-3xl text-slate-500">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              <p>Upload a square image to begin analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CanvasDisplay: React.FC<{
  data: Float32Array;
  width: number;
  height: number;
  isDWT?: boolean;
  isDiff?: boolean;
  compareData?: Float32Array;
  clusterMap?: Uint32Array | null;
  clusterCount?: number;
}> = ({ data, width, height, isDWT, isDiff, compareData, clusterMap, clusterCount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(width, height);
    
    const colors = clusterMap && clusterCount 
        ? Array.from({ length: clusterCount }, (_, i) => {
            const hue = (i * 137.508) % 360;
            return hslToRgb(hue / 360, 0.7, 0.6);
          })
        : null;

    for (let i = 0; i < data.length; i++) {
      let r = 0, g = 0, b = 0;

      if (clusterMap && colors) {
        const cid = clusterMap[i];
        const color = colors[cid];
        if (color) {
          [r, g, b] = color;
        }
      } else if (isDiff && compareData) {
        const diff = Math.abs(data[i] - compareData[i]) * 10;
        r = g = b = Math.min(255, diff);
      } else if (isDWT) {
        const val = 128 + data[i];
        r = g = b = Math.max(0, Math.min(255, val));
      } else {
        const val = data[i];
        r = g = b = Math.max(0, Math.min(255, val));
      }

      const idx = i * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }, [data, width, height, isDWT, isDiff, compareData, clusterMap, clusterCount]);

  return (
    <div className="relative group flex justify-center">
       <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="w-full max-w-[256px] h-auto rounded-lg shadow-inner bg-black border border-slate-700"
      />
    </div>
  );
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hue2rgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export default App;
