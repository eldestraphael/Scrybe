import React, { useCallback, useState } from 'react';
import { UploadCloud, Music, X } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  onClear: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, onClear }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file);
        onFileSelected(file);
      } else {
        alert("Please upload a valid audio file.");
      }
    }
  }, [onFileSelected]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelected(file);
    }
  }, [onFileSelected]);

  const handleRemove = () => {
    setSelectedFile(null);
    onClear();
  };

  if (selectedFile) {
    return (
      <div className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 flex items-center justify-between animate-in fade-in zoom-in duration-300 shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
            <Music size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 dark:text-slate-200 font-medium truncate">{selectedFile.name}</p>
            <p className="text-slate-500 text-sm">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </div>
        <button 
          onClick={handleRemove}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out flex flex-col items-center justify-center p-6 text-center
        ${dragActive 
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" 
          : "border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-gray-400 dark:hover:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800"
        }
      `}
      onDragEnter={handleDrag} 
      onDragLeave={handleDrag} 
      onDragOver={handleDrag} 
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={handleChange}
        accept="audio/*"
      />
      
      <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400 shadow-sm dark:shadow-none">
        <UploadCloud size={32} />
      </div>
      
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-1">
        Click or drag audio file here
      </h3>
      <p className="text-sm text-slate-500 max-w-xs">
        Supports MP3, WAV, WEBM, M4A and other common audio formats.
      </p>
    </div>
  );
};

export default FileUploader;