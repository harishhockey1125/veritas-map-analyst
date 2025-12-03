import React from 'react';
import { AnalysisConfig, AnalysisMode, ModelType } from '../types';
import { Settings, Zap, BrainCircuit, Activity, TableProperties, FileText, AlertTriangle } from 'lucide-react';

interface AnalysisControlsProps {
  config: AnalysisConfig;
  setConfig: React.Dispatch<React.SetStateAction<AnalysisConfig>>;
  isAnalyzing: boolean;
}

const AnalysisControls: React.FC<AnalysisControlsProps> = ({ config, setConfig, isAnalyzing }) => {
  
  const handleModeChange = (mode: AnalysisMode) => {
    setConfig(prev => {
      const newConfig = { ...prev, mode };
      // Set default columns for Map Extraction if not already set
      if (mode === AnalysisMode.MAP_EXTRACTION && !prev.targetColumns) {
        newConfig.targetColumns = "Boundary Label, Khasara Number, Remarks";
      }
      return newConfig;
    });
  };

  const handleModelChange = (model: ModelType) => {
    setConfig(prev => ({ ...prev, model }));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, thinkingBudget: parseInt(e.target.value) }));
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 h-full p-6 flex flex-col gap-8 overflow-y-auto w-80 flex-shrink-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary-500/20 p-2 rounded-lg">
          <Settings className="w-5 h-5 text-primary-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">Configuration</h2>
      </div>

      {/* Accuracy Level / Model Selection */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Accuracy Engine
        </label>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => handleModelChange(ModelType.FLASH)}
            disabled={isAnalyzing}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
              config.model === ModelType.FLASH
                ? 'bg-primary-500/10 border-primary-500 text-slate-100 ring-1 ring-primary-500/50'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Zap className={`w-5 h-5 mt-0.5 ${config.model === ModelType.FLASH ? 'text-primary-400' : 'text-slate-500'}`} />
            <div>
              <div className="font-medium">Standard Speed</div>
              <div className="text-xs opacity-70 mt-1">Gemini 2.0 Flash. Fast, efficient, stable on Free Tier.</div>
            </div>
          </button>

          <button
            onClick={() => handleModelChange(ModelType.PRO_REASONING)}
            disabled={isAnalyzing}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
              config.model === ModelType.PRO_REASONING
                ? 'bg-purple-500/10 border-purple-500 text-slate-100 ring-1 ring-purple-500/50'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <BrainCircuit className={`w-5 h-5 mt-0.5 ${config.model === ModelType.PRO_REASONING ? 'text-purple-400' : 'text-slate-500'}`} />
            <div>
              <div className="font-medium">Deep Reasoner (Safe Mode)</div>
              {/* UPDATED DESCRIPTION: Reflects that we are using Flash to avoid crashes */}
              <div className="text-xs opacity-70 mt-1">Gemini 2.0 Flash (Mapped). Use this for consistent analysis without rate limits.</div>
            </div>
          </button>
        </div>
      </div>

      {/* Thinking Budget Slider - DISABLED VISUALLY for Free Tier Stability */}
      {config.model === ModelType.PRO_REASONING && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 opacity-60">
          <div className="flex justify-between items-center">
             <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
               Thinking Budget
             </label>
             <span className="text-xs text-slate-400 font-mono">Auto</span>
          </div>
          <input 
            type="range" 
            min="1024" 
            max="32768" 
            step="1024" 
            value={config.thinkingBudget}
            onChange={handleBudgetChange}
            disabled={true} 
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-not-allowed accent-slate-500"
          />
          <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-900/20 p-2 rounded">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p>
              Thinking budget is disabled in Free Tier Safe Mode to prevent "400 Bad Request" errors.
            </p>
          </div>
        </div>
      )}

      {/* Analysis Mode */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Analysis Type
        </label>
        <div className="flex flex-col gap-1.5">
          {Object.values(AnalysisMode).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              disabled={isAnalyzing}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                config.mode === mode
                  ? 'bg-slate-700 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Activity className={`w-4 h-4 ${config.mode === mode ? 'text-primary-400' : 'opacity-0'}`} />
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Table Schema & Rules for Map Extraction */}
      {config.mode === AnalysisMode.MAP_EXTRACTION && (
        <div className="space-y-4 pt-4 border-t border-slate-700 animate-in fade-in slide-in-from-top-2">
          
          <div className="space-y-2">
             <label className="text-xs font-semibold text-primary-400 uppercase tracking-wider flex items-center gap-2">
              <TableProperties className="w-4 h-4" />
              Excel Columns
            </label>
            <input
              type="text"
              value={config.targetColumns || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, targetColumns: e.target.value }))}
              placeholder="e.g. Boundary, Khasara, Remarks"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-semibold text-primary-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Formatting Rules
            </label>
            <textarea
              value={config.extractionInstructions || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, extractionInstructions: e.target.value }))}
              placeholder="E.g., Format dates as DD-MM-YYYY, Ignore red lines, Capitalize boundary labels..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary-500 transition-colors min-h-[80px] resize-y"
            />
            <p className="text-[10px] text-slate-500 leading-snug">
              Add specific requirements for output formatting here.
            </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default AnalysisControls;
