import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Copy, Check, Download, Table } from 'lucide-react';
import { ModelType } from '../types';

interface ResultsDisplayProps {
  result: string;
  isAnalyzing: boolean;
  modelType: ModelType;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, isAnalyzing, modelType }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    // Basic Markdown Table Parser
    const lines = result.split('\n');
    const tableLines = lines.filter(line => line.trim().startsWith('|'));
    
    if (tableLines.length < 2) {
      alert("No table data found to export.");
      return;
    }

    // Extract headers and rows
    const csvRows = [];
    
    // Process header
    // Filter out the separator line (contains ---)
    const dataLines = tableLines.filter(line => !line.includes('---'));
    
    for (const line of dataLines) {
      const row = line
        .split('|')
        .map(cell => cell.trim())
        .filter((cell, index, arr) => index > 0 && index < arr.length - 1) // Remove first and last empty splits
        .map(cell => `"${cell.replace(/"/g, '""')}"`) // Escape quotes
        .join(',');
      csvRows.push(row);
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'extraction_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasTable = result.includes('|') && result.includes('---');

  if (!result && !isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-12 text-center">
        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Analyze</h3>
        <p className="max-w-md">Configure your analysis settings on the left, paste your text, and let Veritas AI extract the insights you need.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          Analysis Result
          {isAnalyzing && (
             <span className="flex items-center gap-1.5 text-xs font-normal text-primary-400 ml-2 bg-primary-500/10 px-2 py-0.5 rounded-full">
               <Loader2 className="w-3 h-3 animate-spin" />
               {modelType === ModelType.PRO_REASONING ? 'Reasoning...' : 'Processing...'}
             </span>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          {hasTable && !isAnalyzing && (
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-600/30 rounded-lg text-xs font-medium transition-colors"
              title="Download as CSV (Excel)"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
          )}

          {result && (
            <button 
              onClick={handleCopy}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-table:border-collapse prose-th:bg-slate-800 prose-th:p-3 prose-td:p-3 prose-td:border-b prose-td:border-slate-800">
          <ReactMarkdown>{result}</ReactMarkdown>
          {isAnalyzing && (
            <div className="mt-4 flex items-center gap-2 text-slate-500 animate-pulse">
               <span className="w-2 h-4 bg-primary-500 block"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Icon helper for the empty state
const Activity = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default ResultsDisplay;
