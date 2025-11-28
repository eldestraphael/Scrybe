import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, RefreshCw } from 'lucide-react';
import { formatTime } from '../utils/audioUtils';

interface AudioRecorderProps {
  onAudioReady: (blob: Blob) => void;
  onClear: () => void;
  isDarkMode: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, onClear, isDarkMode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Re-draw visualizer if theme changes to update background color
  useEffect(() => {
    if (isRecording && canvasRef.current) {
        // The loop is running, the next frame will pick up the new color
    }
  }, [isDarkMode, isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Audio Visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Determine the best supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const finalMimeType = mediaRecorderRef.current?.mimeType || selectedMimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onAudioReady(blob);
        
        stream.getTracks().forEach(track => track.stop());
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      drawVisualizer();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!isRecording) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      // Dynamic background based on theme prop
      // We check the class on document or use the prop passed down. 
      // Using prop is reactive.
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff'; // slate-800 vs white
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // Gradient color for bars
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        if (isDark) {
            gradient.addColorStop(0, '#38bdf8'); // Sky 400
            gradient.addColorStop(1, '#3b82f6'); // Blue 500
        } else {
            gradient.addColorStop(0, '#6366f1'); // Indigo 500
            gradient.addColorStop(1, '#4f46e5'); // Indigo 600
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };
    
    draw();
  };

  const handleClear = () => {
    setAudioUrl(null);
    setDuration(0);
    chunksRef.current = [];
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    onClear();
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-6">
      {!audioUrl ? (
        <div className="flex flex-col items-center space-y-4 w-full">
          <div className="relative w-full h-32 bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-200 dark:border-slate-700 transition-colors duration-300">
            {isRecording ? (
              <canvas ref={canvasRef} width="600" height="128" className="w-full h-full" />
            ) : (
              <div className="text-slate-400 dark:text-slate-500 flex flex-col items-center">
                <Mic size={32} className="mb-2 opacity-50" />
                <span className="text-sm">Ready to record</span>
              </div>
            )}
          </div>
          
          <div className="text-4xl font-mono font-light text-slate-700 dark:text-slate-100 tabular-nums">
            {formatTime(duration)}
          </div>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 animate-pulse-slow' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30 hover:scale-105'
              }
            `}
          >
            {isRecording ? (
              <Square fill="currentColor" className="text-white ml-0.5" size={24} />
            ) : (
              <Mic className="text-white" size={28} />
            )}
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRecording ? 'Recording... Tap to stop' : 'Tap microphone to start'}
          </p>
        </div>
      ) : (
        <div className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col space-y-4 shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Recorded Audio</h3>
            <span className="text-xs text-slate-500 font-mono">{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlayback}
              className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-500 transition-colors text-white"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            
            <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
               <div className={`h-full bg-indigo-500 w-full ${isPlaying ? 'animate-pulse' : ''} opacity-50`}></div>
            </div>

            <button 
              onClick={handleClear}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-full transition-colors"
              title="Delete recording"
            >
              <Trash2 size={20} />
            </button>
          </div>
          
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            onEnded={() => setIsPlaying(false)} 
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden" 
          />
          
          <div className="flex justify-center pt-2">
            <button 
              onClick={handleClear} 
              className="text-xs flex items-center text-slate-500 hover:text-indigo-600 dark:hover:text-slate-300 transition-colors"
            >
              <RefreshCw size={12} className="mr-1" /> Record New
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;