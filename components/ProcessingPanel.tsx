
import React from 'react';
import { WaveletType, ClusterTarget, DistanceMetric, LinkageMethod, ProcessingOptions } from '../types';

interface Props {
  options: ProcessingOptions;
  setOptions: (o: ProcessingOptions) => void;
  onRun: () => void;
  isProcessing: boolean;
}

const ProcessingPanel: React.FC<Props> = ({ options, setOptions, onRun, isProcessing }) => {
  const handleChange = (key: keyof ProcessingOptions, value: any) => {
    setOptions({ ...options, [key]: value });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6 w-full max-w-sm sticky top-6">
      <h2 className="text-xl font-bold border-b border-slate-700 pb-2">Analysis Parameters</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Wavelet Transform</label>
          <select 
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
            value={options.wavelet}
            onChange={(e) => handleChange('wavelet', e.target.value)}
          >
            {Object.values(WaveletType).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Levels of Decomposition</label>
          <input 
            type="range" min="1" max="4" step="1"
            className="w-full"
            value={options.levels}
            onChange={(e) => handleChange('levels', parseInt(e.target.value))}
          />
          <div className="text-xs text-right mt-1">{options.levels} Levels</div>
        </div>

        <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
          <label className="text-sm font-bold text-slate-200">Enable Cluster Analysis</label>
          <button 
            type="button"
            onClick={() => handleChange('enableClustering', !options.enableClustering)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${options.enableClustering ? 'bg-blue-600' : 'bg-slate-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${options.enableClustering ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className={options.enableClustering ? 'space-y-4 opacity-100 transition-opacity' : 'space-y-4 opacity-30 pointer-events-none transition-opacity'}>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Cluster Target</label>
            <div className="flex gap-4">
               {Object.values(ClusterTarget).map(v => (
                 <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                   <input 
                    type="radio" 
                    disabled={!options.enableClustering}
                    checked={options.target === v} 
                    onChange={() => handleChange('target', v)}
                   />
                   {v}
                 </label>
               ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Distance Metric</label>
            <select 
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
              disabled={!options.enableClustering}
              value={options.distance}
              onChange={(e) => handleChange('distance', e.target.value)}
            >
              {Object.values(DistanceMetric).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Fusion Algorithm</label>
            <select 
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
              disabled={!options.enableClustering}
              value={options.linkage}
              onChange={(e) => handleChange('linkage', e.target.value)}
            >
              {Object.values(LinkageMethod).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Target Clusters (K)</label>
            <input 
              type="number" 
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
              disabled={!options.enableClustering}
              value={options.clusters}
              onChange={(e) => handleChange('clusters', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <button 
        onClick={onRun}
        disabled={isProcessing}
        className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
          isProcessing ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Run Analysis'}
      </button>
    </div>
  );
};

export default ProcessingPanel;
