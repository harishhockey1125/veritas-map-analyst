import React, { useState, useRef } from 'react';
import AnalysisControls from './components/AnalysisControls';
import ResultsDisplay from './components/ResultsDisplay';
import { AnalysisConfig, AnalysisMode, ModelType } from './types';
import { streamAnalysis } from './services/geminiService';
import { TextQuote, Sparkles, Eraser, Play, X, Image as ImageIcon, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [images, setImages] = useState<{data: string, mimeType: string, preview: string}[]>([]);
  
  const [config, setConfig] = useState<AnalysisConfig>({
    model: ModelType.FLASH_2_0, // Default to Gemini 2.0 Flash
    mode: AnalysisMode.GENERAL,
    thinkingBudget: 8192,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          
          setImages(prev => [...prev, {
            data: base64Data,
            mimeType: file.type,
            preview: base64String
          }]);

          // Automatically switch mode if user uploads images
          if (config.mode === AnalysisMode.GENERAL) {
            setConfig(prev => ({ ...prev, mode: AnalysisMode.MAP_EXTRACTION }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input value to allow selecting same files again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setText('');
    setResult('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim() && images.length === 0) return;
    
    setIsAnalyzing(true);
    setResult(''); // Clear previous results

    try {
      const fullConfig = {
        ...config,
        images: images.map(img => ({ data: img.data, mimeType: img.mimeType }))
      };
      
      await streamAnalysis(text, fullConfig, (chunk) => {
        setResult(chunk);
      });
    } catch (error) {
      setResult(`**Error:** Failed to analyze. Please check your connection or try a lower thinking budget.\n\n${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden text-slate-200 font-sans selection:bg-primary-500/30 selection:text-white">
      
      {/* Sidebar Controls */}
      <AnalysisControls 
        config={config} 
        setConfig={setConfig} 
        isAnalyzing={isAnalyzing} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Veritas AI
            </h1>
            <span className="text-xs font-mono text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded ml-2">v2.0 Flash</span>
          </div>
          <div className="text-xs text-slate-500">
            Powered by Google Gemini
          </div>
        </header>

        {/* Content Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Input Section */}
          <div className="flex-1 flex flex-col border-r border-slate-800 min-w-[350px]">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/30 border-b border-slate-800">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TextQuote className="w-4 h-4" />
                Input Data
              </label>
              <div className="flex gap-2">
                <button 
                  onClick={clearAll}
                  disabled={isAnalyzing}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
              
              {/* Bulk Image Area */}
              <div className="p-4 space-y-3">
                 {/* Upload Trigger */}
                 <div 
                    onClick={triggerFileUpload}
                    className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-slate-600 hover:bg-slate-900/50 transition-all group"
                  >
                    <div className="bg-slate-800 p-3 rounded-full mb-3 group-hover:bg-slate-700 transition-colors">
                      <Image as={ImageIcon} className="w-6 h-6 text-slate-400 group-hover:text-primary-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">
                      {images.length > 0 ? "Add More Maps/Images" : "Upload Maps (Bulk Supported)"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {images.length > 0 ? `${images.length} images selected` : "Supports multiple PNG, JPG files"}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Thumbnail Grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                          <img src={img.preview} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white p-1 text-center truncate backdrop-blur-sm">
                            Part {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Text Input */}
              <div className="px-4 pb-4 flex-1 flex flex-col">
                 <label className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                   Context / Notes
                 </label>
                 <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={images.length > 0 ? "Add notes about these map sections (e.g. 'These are north and south parts of Village X')..." : "Paste text for analysis..."}
                  className="flex-1 bg-slate-900/50 rounded-lg border border-slate-800 focus:border-slate-600 resize-none p-4 outline-none text-slate-300 placeholder:text-slate-600 font-mono text-sm leading-relaxed min-h-[150px] transition-colors"
                  spellCheck={false}
                  disabled={isAnalyzing}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <button
                onClick={handleAnalyze}
                disabled={(images.length === 0 && !text.trim()) || isAnalyzing}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-lg ${
                  (images.length === 0 && !text.trim()) || isAnalyzing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-primary-500/20 active:scale-[0.99]'
                }`}
              >
                {isAnalyzing ? (
                  <>Processing Batch...</>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    {images.length > 0 ? `Analyze ${images.length} Images` : 'Analyze Text'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="flex-1 bg-slate-900/20 min-w-[300px]">
             <ResultsDisplay 
                result={result} 
                isAnalyzing={isAnalyzing} 
                modelType={config.model}
             />
          </div>

        </div>
      </div>
    </div>
  );
};

// Helper for dynamic icon usage
const Image: React.FC<any> = ({ as: Component, className }) => <Component className={className} />;

export default App;
