import React, { useState, useEffect } from 'react';
import { Mic, Upload, Wand2, Sparkles, AlertCircle, Loader2, FileText, Clock, Sun, Moon } from 'lucide-react';
import AudioRecorder from './components/AudioRecorder';
import FileUploader from './components/FileUploader';
import TranscriptDisplay from './components/TranscriptDisplay';
import { transcribeAudio } from './services/geminiService';
import { AudioState, AudioSourceType, TranscriptionState } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<AudioSourceType>(AudioSourceType.MICROPHONE);
  const [timestampInterval, setTimestampInterval] = useState<number>(2);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [audioState, setAudioState] = useState<AudioState>({
    blob: null,
    url: null,
    type: null
  });
  
  const [transcription, setTranscription] = useState<TranscriptionState>({
    isLoading: false,
    error: null,
    result: null
  });

  // Handle Theme Toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleAudioReady = (blob: Blob) => {
    setAudioState({
      blob,
      url: URL.createObjectURL(blob),
      type: blob.type
    });
    
    setTranscription({
      isLoading: false,
      error: null,
      result: null
    });
  };

  const handleClear = () => {
    if (audioState.url) {
      URL.revokeObjectURL(audioState.url);
    }
    setAudioState({ blob: null, url: null, type: null });
    setTranscription({ isLoading: false, error: null, result: null });
  };

  const handleTranscribe = async () => {
    if (!audioState.blob || !audioState.type) return;

    setTranscription({ isLoading: true, error: null, result: null });

    try {
      const text = await transcribeAudio(audioState.blob, audioState.type, timestampInterval);
      setTranscription({
        isLoading: false,
        error: null,
        result: text
      });
    } catch (error: any) {
      setTranscription({
        isLoading: false,
        error: error.message || "An unexpected error occurred during transcription.",
        result: null
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-600 dark:selection:text-indigo-200 pb-20 transition-colors duration-300">
      
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-slate-500 dark:from-white dark:to-slate-400">
              Scrybe
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium">
              Powered by Gemini 2.5 Flash
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Input */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Input Audio</h2>
              <p className="text-slate-500 dark:text-slate-400">Record a voice note or upload an audio file to get started.</p>
            </div>

            {/* Tabs */}
            <div className="bg-gray-200 dark:bg-slate-900/50 p-1.5 rounded-xl flex gap-1 border border-gray-200 dark:border-slate-800 transition-colors duration-300">
              <button
                onClick={() => {
                  setActiveTab(AudioSourceType.MICROPHONE);
                  handleClear();
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200
                  ${activeTab === AudioSourceType.MICROPHONE 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-slate-700' 
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                <Mic size={16} />
                <span>Record</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab(AudioSourceType.UPLOAD);
                  handleClear();
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200
                  ${activeTab === AudioSourceType.UPLOAD 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-slate-700' 
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                <Upload size={16} />
                <span>Upload</span>
              </button>
            </div>

            {/* Input Area */}
            <div className="min-h-[300px] flex flex-col justify-center">
              {activeTab === AudioSourceType.MICROPHONE ? (
                <AudioRecorder onAudioReady={handleAudioReady} onClear={handleClear} isDarkMode={isDarkMode} />
              ) : (
                <FileUploader 
                  onFileSelected={handleAudioReady} 
                  onClear={handleClear} 
                />
              )}
            </div>

            {/* Controls & Action */}
            <div className="space-y-6 pt-2">
              {/* Timestamp Settings */}
              <div className="bg-white dark:bg-slate-900/30 p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-3 transition-colors duration-300 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-slate-700 dark:text-slate-300 gap-2">
                    <Clock size={16} className="text-indigo-500 dark:text-indigo-400" />
                    <span className="font-medium">Timestamp Interval</span>
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">
                    {timestampInterval} min
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1"
                  value={timestampInterval}
                  onChange={(e) => setTimestampInterval(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
                  <span>1 min</span>
                  <span>5 min</span>
                  <span>10 min</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleTranscribe}
                  disabled={!audioState.blob || transcription.isLoading}
                  className={`
                    w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300
                    ${!audioState.blob 
                      ? 'bg-gray-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                      : transcription.isLoading
                        ? 'bg-indigo-600/80 text-white/80 cursor-wait'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0'
                    }
                  `}
                >
                  {transcription.isLoading ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      <span>Processing Audio...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={24} />
                      <span>Generate Transcript</span>
                    </>
                  )}
                </button>
                
                {!audioState.blob && (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    Please provide audio input first
                  </p>
                )}
              </div>
            </div>
            
            {transcription.error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-200">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">{transcription.error}</p>
              </div>
            )}

          </div>

          {/* Right Column: Output */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Transcript</h2>
              <p className="text-slate-500 dark:text-slate-400">AI-generated text will appear here.</p>
            </div>

            {transcription.result ? (
              <TranscriptDisplay text={transcription.result} />
            ) : (
              <div className="w-full h-[500px] bg-white/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500 dark:text-slate-600 p-8 text-center transition-colors duration-300">
                {transcription.isLoading ? (
                  <div className="space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-slate-700"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-slate-200 font-medium text-lg">Transcribing...</h3>
                      <p className="text-sm text-slate-500 mt-1">This usually takes a few seconds.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                      <FileText size={32} className="opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-400 mb-2">No transcript yet</h3>
                    <p className="text-sm max-w-xs mx-auto">
                      Record or upload audio and hit the generate button to see the magic happen.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;