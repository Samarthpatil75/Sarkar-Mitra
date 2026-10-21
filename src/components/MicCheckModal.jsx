import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, CheckCircle2, XCircle, RotateCcw, X, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import speechRecognizer from '../services/speechRecognition';
import VoiceWaveVisualizer from './VoiceWaveVisualizer';

export default function MicCheckModal() {
  const { isMicCheckOpen, closeMicCheck, showToast } = useApp();
  const { speak, stopSpeaking } = useSpeech();

  const [status, setStatus] = useState('prompting'); // 'prompting' | 'listening' | 'success' | 'error'
  const [heardWord, setHeardWord] = useState('');
  const [interimText, setInterimText] = useState('');

  const promptText = "माइक तपासण्यासाठी कृपया 'नमस्कार' बोला.";
  const promptTextRef = useRef(promptText);

  const startTestListening = useCallback(() => {
    setStatus('listening');
    setHeardWord('');
    setInterimText('');

    speechRecognizer.start({
      onStart: () => {
        setStatus('listening');
      },
      onResult: ({ interim, final }) => {
        setInterimText(interim);
        if (final && final.trim()) {
          const cleanFinal = final.trim();
          setHeardWord(cleanFinal);
          setStatus('success');
          
          try {
            if (typeof confetti === 'function') {
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
            }
          } catch (e) {}

          const confirmMsg = 'छान! तुमचा आवाज स्पष्ट ऐकू आला. माइक व्यवस्थित काम करत आहे.';
          speak(confirmMsg);
          showToast('माइक यशस्वीरीत्या तपासला गेला!', 'success');
        }
      },
      onError: (err) => {
        console.warn('Mic check error:', err);
        if (err === 'not-allowed') {
          setStatus('error');
        }
      },
      onEnd: (lastInterim) => {
        if (lastInterim && lastInterim.trim()) {
          setHeardWord(lastInterim.trim());
          setStatus('success');
          speak('छान! तुमचा आवाज ऐकू आला. माइक व्यवस्थित काम करत आहे.');
        }
      }
    });
  }, [speak, showToast]);

  // When modal opens, speak prompt and begin listening
  useEffect(() => {
    if (isMicCheckOpen) {
      setStatus('prompting');
      setHeardWord('');
      setInterimText('');

      speak(promptTextRef.current, {
        onEnd: () => {
          startTestListening();
        }
      });
    } else {
      speechRecognizer.stop();
      stopSpeaking();
    }

    return () => {
      speechRecognizer.stop();
      stopSpeaking();
    };
  }, [isMicCheckOpen, speak, stopSpeaking, startTestListening]);

  if (!isMicCheckOpen) return null;

  const handleClose = () => {
    speechRecognizer.stop();
    stopSpeaking();
    closeMicCheck();
  };

  const handleRetry = () => {
    speechRecognizer.stop();
    speak(promptTextRef.current, {
      onEnd: () => {
        startTestListening();
      }
    });
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="mic-check-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-saffron-500 text-center space-y-5 animate-scaleUp">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="बंद करा"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div>
          <span className="app-pill-accent inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[16px] font-black uppercase border border-amber-400 mb-2">
            <Mic className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>एक-वेळ मायक्रोफोन चाचणी</span>
          </span>
          <h2 id="mic-check-title" className="text-2xl font-black text-slate-900 dark:text-white">
            माइक तपासा (Microphone Check)
          </h2>
          <p className="text-[14px] sm:text-[16px] text-slate-700 dark:text-slate-300 font-bold mt-1">
            तुमचा आवाज स्पष्ट ऐकू येतोय का हे तपासण्यासाठी:
          </p>
        </div>

        {/* Status Stage Display */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          
          {status !== 'success' && status !== 'error' && (
            <>
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-saffron-600 text-white flex items-center justify-center shadow-lg animate-pulse">
                  <Mic className="w-10 h-10" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                "माइक तपासण्यासाठी कृपया 'नमस्कार' बोला."
              </p>
              <p className="text-[14px] font-bold text-[#B45309] dark:text-amber-300">
                {status === 'listening' ? '👂 आम्ही ऐकत आहोत... आता "नमस्कार" म्हणा' : 'कृपया प्रतीक्षा करा...'}
              </p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="space-y-2 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                छान! माइक व्यवस्थित काम करत आहे.
              </h3>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-800 font-mono text-base font-bold text-slate-900 dark:text-white">
                ऐकू आलेला आवाज: "{heardWord}" ✓
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-2 animate-fadeIn text-red-800 dark:text-red-300">
              <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <XCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black">
                मायक्रोफोन परवानगी मिळालेली नाही
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                कृपया ब्राउझरच्या ॲड्रेस बारमधील कुलूप (Lock) चिन्हावर दाबून मायक्रोफोन सुरू करा.
              </p>
            </div>
          )}

          {/* Live Waveform Indicator */}
          <VoiceWaveVisualizer 
            isListening={status === 'listening'}
            isSpeaking={false}
            interimText={interimText}
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-2">
          {status === 'success' ? (
            <button
              onClick={handleClose}
              className="w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[16px] rounded-2xl shadow-lg min-h-[50px] transition-transform active:scale-95"
            >
              पूर्ण झाले (Done)
            </button>
          ) : (
            <>
              <button
                onClick={handleRetry}
                className="flex-1 py-3 px-4 bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-[16px] rounded-2xl flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>पुन्हा बोला</span>
              </button>
              <button
                onClick={handleClose}
                className="py-3 px-5 border-2 border-slate-300 dark:border-slate-600 text-[#1F2937] dark:text-slate-100 font-bold text-[16px] rounded-2xl min-h-[48px] hover:bg-slate-100"
              >
                बंद करा
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
