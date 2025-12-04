import React, { useState } from 'react';
import { Map as MapIcon, Upload, Loader2, FileJson, Table, AlertCircle } from 'lucide-react';
import { analyzeVillageMap, getSampleData } from './services/geminiService';
import { AnalysisResult, SurveyPartition } from './types';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<SurveyPartition[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const allResults: SurveyPartition[] = [];
      for (const file of files) {
        const result = await analyzeVillageMap(file);
        allResults.push(...result.partitions);
      }
      setResults(allResults);
    } catch (err) {
      setError("Analysis failed. Please check your API Key and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSample = async () => {
    setIsAnalyzing(true);
    const data = await getSampleData();
    setResults(data.partitions);
    setIsAnalyzing(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <MapIcon className="text-white" size={24} />
          </div>
          <h1 className="font-bold text-lg">Map Analyzer</h1>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:bg-slate-800/50 transition relative cursor-pointer">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="mx-auto text-indigo-400 mb-2" />
            <p className="text-sm font-medium">Upload Maps</p>
            <p className="text-xs text-slate-500 mt-1">{files.length > 0 ? `${files.length} files selected` : "Drag & drop or click"}</p>
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={files.length === 0 || isAnalyzing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : "Analyze Maps"}
          </button>
          
          <button onClick={loadSample} className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Load Sample Data
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 text-red-400 text-sm rounded border border-red-900/30 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
          <h2 className="font-medium text-slate-300">Analysis Results</h2>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Table size={18} /></button>
            <button onClick={() => setViewMode('json')} className={`p-2 rounded ${viewMode === 'json' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><FileJson size={18} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <MapIcon size={48} className="opacity-20 mb-4" />
              <p>Upload a map to start</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-4 whitespace-nowrap">Partition ID</th>
                      <th className="p-4 whitespace-nowrap">Village</th>
                      <th className="p-4">Survey Numbers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {results.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/50">
                        <td className="p-4 font-mono text-indigo-400 font-medium">{row.partitionId}</td>
                        <td className="p-4">{row.villageName}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {row.surveyNumbers.map(num => (
                              <span key={num} className="px-2 py-0.5 bg-slate-800 rounded text-xs border border-slate-700 text-slate-300">{num}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <pre className="bg-slate-900 p-6 rounded-lg border border-slate-800 text-emerald-400 font-mono text-sm overflow-auto h-full">
              {JSON.stringify(results, null, 2)}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
