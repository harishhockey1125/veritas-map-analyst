import React, { useState, useCallback, ChangeEvent } from 'react';
import { 
  Map as MapIcon, 
  Table, 
  FileJson, 
  Loader2, 
  Download, 
  AlertCircle, 
  Upload, 
  X 
} from 'lucide-react';
import { analyzeVillageMap, getSampleData } from './services/geminiService';
import { AnalysisResult, SurveyPartition } from './types';

// --- INLINED COMPONENTS TO PREVENT IMPORT ERRORS ---

const SimpleFileUpload: React.FC<{ 
  onFilesSelect: (files: File[]) => void; 
  selectedFiles: File[] 
}> = ({ onFilesSelect, selectedFiles }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelect(Array.from(e.target.files));
    }
  };

  return (
    <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:bg-slate-800/50 transition-colors cursor-pointer relative">
      <input 
        type="file" 
        multiple 
        accept="image/*,.pdf" 
        onChange={handleFileChange} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-slate-800 rounded-full text-indigo-400">
          <Upload size={24} />
        </div>
        <p className="text-sm text-slate-300 font-medium">Click to Upload Maps</p>
        <p className="text-xs text-slate-500">JPG, PNG or PDF</p>
      </div>
      {selectedFiles.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {selectedFiles.map((f, i) => (
            <span key={i} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded flex items-center gap-1">
              {f.name.slice(0, 15)}...
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN LOGIC ---

const processOverlaps = (rawData: AnalysisResult): SurveyPartition[] => {
  const surveyToPartitions = new Map<string, string[]>();
  rawData.partitions.forEach(partition => {
    partition.surveyNumbers.forEach(surveyNum => {
      if (!surveyToPartitions.has(surveyNum)) surveyToPartitions.set(surveyNum, []);
      surveyToPartitions.get(surveyNum)?.push(partition.partitionId);
    });
  });

  return rawData.partitions.map(partition => {
    const overlappingSurveys = partition.surveyNumbers.filter(s => {
      const parts = surveyToPartitions.get(s);
      return parts && parts.length > 1;
    });

    let remarks = "";
    if (overlappingSurveys.length > 0) {
      remarks = overlappingSurveys.map(s => {
        const parts = surveyToPartitions.get(s) || [];
        return `${s} → ${parts.join(' / ')}`;
      }).join('; ');
    }

    return { ...partition, remarks: remarks || "No overlaps detected" };
  });
};

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<SurveyPartition[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [error, setError] = useState<string | null>(null);
  
  const [manualVillageName, setManualVillageName] = useState("");
  const [manualPartitionId, setManualPartitionId] = useState("");
  const [partitionSource, setPartitionSource] = useState<'manual' | 'file'>('manual');

  const handleAnalyze = useCallback(async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysisPromises = files.map(file => {
        let effectivePartitionId = manualPartitionId;
        if (partitionSource === 'file') {
            effectivePartitionId = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
        }
        return analyzeVillageMap(file, manualVillageName, effectivePartitionId);
      });
      const resultsList = await Promise.all(analysisPromises);
      const allPartitions = resultsList.flatMap(r => r.partitions);
      const combinedResult: AnalysisResult = { partitions: allPartitions };
      const processed = processOverlaps(combinedResult);
      setResults(processed);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze maps. Check console for details.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [files, manualVillageName, manualPartitionId, partitionSource]);

  const handleSampleData = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const sampleFileName = "Sample_Map";
      let effectivePartitionId = manualPartitionId || sampleFileName.toUpperCase();
      const rawData = await getSampleData(manualVillageName, effectivePartitionId);
      const processed = processOverlaps(rawData);
      setResults(processed);
      setFiles([new File([""], `${sampleFileName}.jpg`, { type: "image/jpeg" })]);
    } catch (err) {
      setError("Failed to load sample data.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [manualVillageName, manualPartitionId]);

  const downloadCSV = () => {
    if (results.length === 0) return;
    const headers = ["Village Name", "Partition Number", "Survey Numbers", "Remarks"];
    const csvContent = [
      headers.join(","),
      ...results.map(row => `"${row.villageName}","${row.partitionId}","${row.surveyNumbers.join(" ")}","${row.remarks}"`)
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "village_map_analysis.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 font-sans">
      <aside className="w-full md:w-80 flex flex-col border-r border-slate-800 bg-slate-900/50 p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-600 rounded-lg"><MapIcon size={24} className="text-white" /></div>
          <div>
            <h1 className="text-xl font-bold text-white">Map Analyzer</h1>
            <p className="text-xs text-slate-400">AI Surveyor Tool</p>
          </div>
        </div>

        <SimpleFileUpload onFilesSelect={setFiles} selectedFiles={files} />

        <div className="mt-6 flex flex-col gap-3">
          <button onClick={handleAnalyze} disabled={files.length === 0 || isAnalyzing}
            className={`py-3 px-4 rounded-lg font-medium flex justify-center items-center gap-2 ${files.length === 0 || isAnalyzing ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
            {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : 'Analyze Maps'}
          </button>
          <button onClick={handleSampleData} disabled={isAnalyzing} className="py-3 px-4 rounded-lg font-medium border border-slate-700 hover:bg-slate-800 text-slate-400">
            Use Sample Data
          </button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-900/20 text-red-400 text-sm rounded border border-red-900/50 flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0"/>{error}</div>}
      </aside>

      <main className="flex-1 flex flex-col h-full bg-slate-950 relative">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
          <div className="flex gap-2">
             <button onClick={() => setViewMode('table')} className={`p-2 rounded ${viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}><Table size={20}/></button>
             <button onClick={() => setViewMode('json')} className={`p-2 rounded ${viewMode === 'json' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}><FileJson size={20}/></button>
          </div>
          <button onClick={downloadCSV} disabled={results.length === 0} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white disabled:opacity-50"><Download size={16}/> Export CSV</button>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <MapIcon size={48} className="opacity-20 mb-4" />
              <p>Upload a map to begin analysis</p>
            </div>
          ) : viewMode === 'table' ? (
             <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
               <table className="w-full text-left text-sm text-slate-300">
                 <thead className="bg-slate-800 text-xs uppercase text-slate-400">
                   <tr><th className="p-4">Village</th><th className="p-4">Partition</th><th className="p-4">Survey Nos</th><th className="p-4">Remarks</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {results.map((r, i) => (
                     <tr key={i} className="hover:bg-slate-800/50">
                       <td className="p-4">{r.villageName}</td>
                       <td className="p-4 font-mono text-indigo-400">{r.partitionId}</td>
                       <td className="p-4"><div className="flex flex-wrap gap-1">{r.surveyNumbers.map(s => <span key={s} className="px-1.5 py-0.5 bg-slate-800 rounded text-xs border border-slate-700">{s}</span>)}</div></td>
                       <td className="p-4 text-amber-400/80">{r.remarks}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          ) : (
            <pre className="bg-slate-900 p-6 rounded-lg border border-slate-800 text-emerald-400 font-mono text-xs overflow-auto">{JSON.stringify(results, null, 2)}</pre>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
