import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onFileSelected(file);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  }, [onFileSelected, isLoading]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        onFileSelected(file);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  }, [onFileSelected, isLoading]);

  return (
    <div
      className={`relative w-full border-2 border-dashed rounded-xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
        ${isDragging 
          ? 'border-primary-500 bg-primary-500/10 scale-[1.01]' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isLoading && document.getElementById('file-upload-input')?.click()}
    >
      <input
        type="file"
        id="file-upload-input"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      
      <div className="z-10 flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full bg-slate-700/50 text-primary-400 ${isDragging ? 'animate-bounce' : ''}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M12 18v-6"/>
            <path d="M9 15l3-3 3 3"/>
          </svg>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {isLoading ? 'Processing Document...' : 'Upload PDF Document'}
          </h3>
          <p className="text-sm text-slate-400">
            {isLoading 
              ? 'Please wait while Gemini analyzes your file.' 
              : 'Drag & drop or click to browse. Up to 20MB.'}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;