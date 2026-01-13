import React, { useState, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import JsonViewer from './components/JsonViewer';
import { parsePdfWithGemini } from './services/geminiService';
import { parsePdfLocal } from './services/localPdfService';
import { PdfParseResult, ParseStatus, TokenUsage } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<ParseStatus>(ParseStatus.IDLE);
  const [result, setResult] = useState<PdfParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fileUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return null;
  }, [file]);

  const handleFileSelected = async (selectedFile: File) => {
    setStatus(ParseStatus.PROCESSING);
    setErrorMsg(null);
    setFile(selectedFile);
    setResult(null);

    try {
      // Run both parsers in parallel
      const [aiResult, rawText] = await Promise.all([
        parsePdfWithGemini(selectedFile),
        parsePdfLocal(selectedFile)
      ]);

      // Combine results
      setResult({
        ...aiResult,
        standardRawText: rawText
      });
      
      setStatus(ParseStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unknown error occurred while parsing the PDF.");
      setStatus(ParseStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(ParseStatus.IDLE);
    setResult(null);
    setErrorMsg(null);
    setFile(null);
  };

  // Pricing Estimator (based on Standard Flash Rates)
  // Input: $0.075 / 1M tokens | Output: $0.30 / 1M tokens
  const calculateCost = (usage: TokenUsage) => {
    const inputCost = (usage.promptTokens / 1000000) * 0.075;
    const outputCost = (usage.responseTokens / 1000000) * 0.30;
    return (inputCost + outputCost).toFixed(6);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-primary-500/30 selection:text-primary-200 flex flex-col h-screen overflow-hidden">
      <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-primary-600 p-2 rounded-lg shadow-lg shadow-primary-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                
                <div className="relative overflow-hidden rounded-md bg-gradient-to-b from-slate-100 to-slate-300 px-8 py-1 shadow-lg hidden sm:block">
                    <span className="font-bold text-primary-600 text-lg">2</span>
                    <div className="absolute inset-0 bg-white/20"></div>
                </div>
            </div>

            {/* API Stats Widget */}
            <div className="hidden lg:flex items-center gap-6 ml-4 pl-6 border-l border-slate-800">
               {/* Model & Limit Info */}
               <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">Model / Limit</span>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                     <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-medium">Gemini 3 Flash</span>
                     </span>
                     <span className="text-slate-600">|</span>
                     <span className="text-slate-400" title="Model Context Window">1M Limit</span>
                  </div>
               </div>
               
               {/* Pricing Info */}
               <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">Price (Ref)</span>
                  <div className="text-xs text-slate-400 font-mono" title="Input: $0.075/1M, Output: $0.30/1M">
                     $0.075 / $0.30 <span className="text-slate-600 text-[10px]">per 1M</span>
                  </div>
               </div>

               {/* Live Usage Stats */}
               {status === ParseStatus.SUCCESS && result?.tokenUsage && (
                   <div className="flex flex-col animate-fade-in">
                      <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">Burned ($$)</span>
                      <div className="flex items-center gap-3 text-xs font-mono">
                         <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                            ${calculateCost(result.tokenUsage)}
                         </span>
                         <span className="text-slate-500">
                            ({result.tokenUsage.totalTokens.toLocaleString()} tks)
                         </span>
                      </div>
                   </div>
               )}
            </div>
            
            {status === ParseStatus.SUCCESS && file && (
               <div className="hidden md:flex flex-col ml-4 lg:hidden">
                  <span className="text-xs text-slate-500 font-mono">Current File</span>
                  <span className="text-sm font-medium text-white max-w-[150px] truncate" title={file.name}>{file.name}</span>
               </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
             {status === ParseStatus.SUCCESS && (
               <button onClick={handleReset} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 transition-colors">
                  New File
               </button>
             )}
          </div>
        </div>
      </header>

      <main className={`flex-1 overflow-hidden relative flex flex-col min-h-0 ${status === ParseStatus.IDLE || status === ParseStatus.PROCESSING ? 'overflow-y-auto' : ''}`}>
        
        {/* State: IDLE / PROCESSING / ERROR */}
        {(status === ParseStatus.IDLE || status === ParseStatus.PROCESSING || status === ParseStatus.ERROR) && (
           <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-full">
             <div className="text-center mb-10 animate-fade-in">
               <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
                 Turn Documents into <span className="text-primary-400">Structured Data</span>
               </h2>
               <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                 Upload a PDF to instantly extract structured JSON using Gemini AI, and compare it side-by-side with standard text extraction for validation.
               </p>
             </div>

             <div className="w-full max-w-xl animate-fade-in-up">
                 <div className="bg-slate-900/50 rounded-2xl p-2 border border-slate-800 shadow-2xl backdrop-blur-sm">
                     <FileUpload 
                        onFileSelected={handleFileSelected} 
                        isLoading={status === ParseStatus.PROCESSING} 
                     />
                 </div>
                 {status === ParseStatus.ERROR && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200 animate-shake">
                       <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       <p>{errorMsg}</p>
                    </div>
                 )}
             </div>
           </div>
        )}

        {/* State: SUCCESS (Split Screen) */}
        {status === ParseStatus.SUCCESS && result && fileUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-0">
            {/* Left Pane: PDF Viewer */}
            <div className="bg-slate-800 border-r border-slate-700 h-full flex flex-col min-h-0">
               <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-700 flex justify-between items-center shrink-0">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Original PDF Source</span>
                  <span className="text-xs text-slate-500 hidden sm:inline-block max-w-[200px] truncate">{file?.name}</span>
               </div>
               <div className="flex-1 bg-slate-500/10 relative min-h-0">
                  <iframe 
                    src={fileUrl} 
                    className="w-full h-full absolute inset-0 border-0"
                    title="PDF Viewer"
                  />
               </div>
            </div>

            {/* Right Pane: Parsed Result */}
            <div className="h-full flex flex-col bg-slate-950 min-h-0">
               <div className="flex-1 overflow-hidden p-0 sm:p-4 min-h-0">
                  <JsonViewer data={result} fileName={file?.name} />
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;