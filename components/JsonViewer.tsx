import React, { useState } from 'react';
import { PdfParseResult } from '../types';

interface JsonViewerProps {
  data: PdfParseResult;
  fileName?: string;
}

type Tab = 'ai-json' | 'raw-text' | 'transactions';

const JsonViewer: React.FC<JsonViewerProps> = ({ data, fileName }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('ai-json');
  const [jsonViewMode, setJsonViewMode] = useState<'tree' | 'raw'>('tree');

  const hasTransactions = data.transactions && data.transactions.length > 0;

  const handleCopy = async () => {
    try {
      let textToCopy = '';
      if (activeTab === 'ai-json') {
        textToCopy = JSON.stringify(data, null, 2);
      } else if (activeTab === 'raw-text') {
        textToCopy = data.standardRawText || '';
      } else if (activeTab === 'transactions') {
        textToCopy = JSON.stringify(data.transactions, null, 2);
      }
        
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    try {
      let content = '';
      let mimeType = 'text/plain';
      let extension = 'txt';

      if (activeTab === 'ai-json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else if (activeTab === 'raw-text') {
        content = data.standardRawText || '';
        mimeType = 'text/plain';
        extension = 'txt';
      } else if (activeTab === 'transactions') {
        // Download transactions as CSV for utility
        const headers = ['Post Date', 'Trans Date', 'Description', 'Amount', 'Currency'];
        const rows = data.transactions?.map(t => [
            t.post_date,
            t.trans_date,
            `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
            t.amount,
            t.currency
        ]);
        content = [headers.join(','), ...(rows?.map(r => r.join(',')) || [])].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeFileName = fileName 
        ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^/.]+$/, "") 
        : "parsed-output";
      
      link.download = `${safeFileName}_${activeTab}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file.');
    }
  };

  const renderJsonTree = (obj: any, depth: number = 0): React.ReactNode => {
    if (typeof obj !== 'object' || obj === null) {
        let colorClass = 'text-yellow-300';
        if (typeof obj === 'string') colorClass = 'text-emerald-300';
        if (typeof obj === 'number') colorClass = 'text-blue-300';
        return <span className={`${colorClass}`}>{JSON.stringify(obj)}</span>;
    }

    const isArray = Array.isArray(obj);
    const isEmpty = Object.keys(obj).length === 0;
    if (isEmpty) return <span className="text-slate-500">{isArray ? '[]' : '{}'}</span>;

    return (
      <div className="ml-4 font-mono text-sm">
        <span className="text-slate-500">{isArray ? '[' : '{'}</span>
        <div className="flex flex-col">
          {Object.entries(obj).map(([key, value], index, arr) => (
            <div key={key} className="flex">
              {!isArray && <span className="text-purple-300 mr-1">"{key}":</span>}
              {renderJsonTree(value, depth + 1)}
              {index < arr.length - 1 && <span className="text-slate-500">,</span>}
            </div>
          ))}
        </div>
        <span className="text-slate-500">{isArray ? ']' : '}'}</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col h-full min-h-0">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 gap-3 shrink-0">
        
        {/* Tabs */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 shrink-0 overflow-x-auto max-w-full">
            <button
                onClick={() => setActiveTab('ai-json')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'ai-json' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                AI JSON
            </button>
            {hasTransactions && (
              <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'transactions' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                  <span>Transactions</span>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{data.transactions?.length}</span>
              </button>
            )}
            <button
                onClick={() => setActiveTab('raw-text')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'raw-text' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                Raw Text (Diff)
            </button>
        </div>

        {/* Controls Group */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeTab === 'ai-json' && (
              <div className="hidden md:flex bg-slate-900 rounded-lg p-1 border border-slate-700 mr-2">
                <button onClick={() => setJsonViewMode('tree')} className={`px-2 py-1 text-[10px] rounded transition-colors ${jsonViewMode === 'tree' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Tree</button>
                <button onClick={() => setJsonViewMode('raw')} className={`px-2 py-1 text-[10px] rounded transition-colors ${jsonViewMode === 'raw' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Raw</button>
              </div>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 hover:text-white rounded-md transition-all border border-slate-600 active:translate-y-0.5"
              title={activeTab === 'transactions' ? 'Download CSV' : 'Download File'}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {activeTab === 'transactions' ? 'CSV' : 'Download'}
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 hover:text-white rounded-md transition-all border border-slate-600 active:translate-y-0.5"
              title="Copy content"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  <span>Copy</span>
                </>
              )}
            </button>
        </div>
      </div>
      
      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-[#0d1117] p-4 min-h-0">
        {activeTab === 'ai-json' && (
           jsonViewMode === 'raw' ? (
             <pre className="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-all">{JSON.stringify(data, null, 2)}</pre>
           ) : (
             <div className="font-mono text-sm leading-6">{renderJsonTree(data)}</div>
           )
        )}
        
        {activeTab === 'raw-text' && (
           <div>
             <div className="mb-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-200/80 sticky top-0 backdrop-blur-md z-10">
                ℹ️ This is raw text extracted using a standard PDF parser (PDF.js). Use this to compare against the AI's structured output.
             </div>
             <pre className="font-mono text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{data.standardRawText || "No raw text extracted."}</pre>
           </div>
        )}

        {activeTab === 'transactions' && data.transactions && (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 font-medium border-b border-slate-700 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap">Date</th>
                            <th className="px-4 py-3 w-full">Description</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {data.transactions.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-mono whitespace-nowrap text-slate-400">
                                    <div className="flex flex-col">
                                        <span>{tx.trans_date}</span>
                                        {tx.post_date !== tx.trans_date && (
                                            <span className="text-[10px] text-slate-600">Post: {tx.post_date}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-200">{tx.description}</td>
                                <td className={`px-4 py-3 text-right font-mono font-medium whitespace-nowrap ${tx.amount < 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {tx.amount > 0 ? '' : '+'} {Math.abs(tx.amount).toFixed(2)} <span className="text-[10px] text-slate-500 ml-0.5">{tx.currency}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Footer Metadata */}
      {data.metadata && (
        <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 flex flex-wrap gap-4 text-xs text-slate-400 shrink-0">
           <span className="flex items-center gap-1"><span className="font-semibold text-slate-300">Title:</span> {data.metadata.title || 'N/A'}</span>
           <span className="flex items-center gap-1"><span className="font-semibold text-slate-300">Author:</span> {data.metadata.author || 'N/A'}</span>
           <span className="flex items-center gap-1"><span className="font-semibold text-slate-300">Lang:</span> {data.metadata.language || 'N/A'}</span>
        </div>
      )}
    </div>
  );
};

export default JsonViewer;