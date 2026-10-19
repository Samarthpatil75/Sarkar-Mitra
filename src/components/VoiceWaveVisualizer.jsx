import React from 'react';
import { Mic, Volume2, Square, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function VoiceWaveVisualizer({ isListening: propIsListening, isSpeaking: propIsSpeaking, interimText }) {
  const { lowBandwidth } = useApp();
  const { 
    isListening: ctxIsListening, 
    isSpeaking: ctxIsSpeaking, 
    stopSpeaking,
    wasStoppedByUser,
    lastSpoken,
    replayLastAudio
  } = useSpeech();

  const isListening = propIsListening !== undefined ? propIsListening : ctxIsListening;
  const isSpeaking = propIsSpeaking !== undefined ? propIsSpeaking : ctxIsSpeaking;

  if (!isListening && !isSpeaking && !interimText) {
    return null;
  }

  return (
    <div 
      className="w-full max-w-xl mx-auto my-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-saffron-400 dark:border-saffron-500 shadow-lg text-center transition-all animate-fadeIn"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-3 mb-2">
        {isListening ? (
          <div className="flex items-center gap-2 text-saffron-700 dark:text-saffron-400 font-extrabold text-lg">
            <span className="relative flex h-4 w-4">
              {!lowBandwidth && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-400 opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-4 w-4 bg-saffron-600"></span>
            </span>
            <Mic className="w-6 h-6 animate-pulse" />
            <span>ऐकत आहे... बोला</span>
          </div>
        ) : isSpeaking ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-civic-800 dark:text-civic-200 font-extrabold text-base sm:text-lg">
              <Volume2 className="w-6 h-6 animate-bounce text-saffron-600" />
              <span>उत्तर वाचून दाखवत आहे...</span>
            </div>
            
            {/* Prominent High-Contrast Stop Button */}
            <button
              type="button"
              onClick={() => stopSpeaking({ userInitiated: true })}
              className="min-h-[48px] px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg ring-4 ring-red-200 dark:ring-red-950 flex items-center justify-center gap-2 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-400"
              role="button"
              aria-label="आवाज थांबवा"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>आवाज थांबवा</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Visual Wave bars (Halt immediately when audio stops) */}
      {isListening && !lowBandwidth && (
        <div className="flex items-center justify-center gap-1.5 h-8 my-2">
          <span className="w-1.5 h-4 bg-saffron-500 rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"></span>
          <span className="w-1.5 h-7 bg-saffron-600 rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.1s]"></span>
          <span className="w-1.5 h-5 bg-saffron-500 rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.2s]"></span>
          <span className="w-1.5 h-8 bg-civic-600 rounded-full animate-[bounce_0.9s_ease-in-out_infinite_0.15s]"></span>
          <span className="w-1.5 h-6 bg-saffron-600 rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.05s]"></span>
          <span className="w-1.5 h-3 bg-saffron-500 rounded-full animate-[bounce_0.5s_ease-in-out_infinite]"></span>
        </div>
      )}

      {/* Interim Recognized text (Confirms what user is saying in real-time) */}
      {interimText && (
        <div className="mt-2 p-2.5 bg-saffron-50 dark:bg-slate-900 rounded-xl border border-saffron-200 dark:border-saffron-900/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
            तुमचा आवाज समजला:
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            "{interimText}"
          </p>
        </div>
      )}
    </div>
  );
}
