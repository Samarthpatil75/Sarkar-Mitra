import React, { useEffect } from 'react';
import { Volume2, X, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function FirstLaunchWelcomeModal() {
  const { showWelcomeModal, dismissWelcomeModal, setSelectedScheme, setActiveScreen, schemes } = useApp();
  const { speak, stopSpeaking, processInput } = useSpeech();

  const welcomeText = 'नमस्कार! मी सरकार मित्र. तुम्हाला कोणत्या योजनेबद्दल माहिती हवी आहे?';

  // Speak the welcome greeting when modal appears
  useEffect(() => {
    if (showWelcomeModal) {
      speak(welcomeText, { force: true, isWelcome: true });
    }
  }, [showWelcomeModal, speak]);

  if (!showWelcomeModal) return null;

  const handleSkip = () => {
    stopSpeaking();
    dismissWelcomeModal();
  };

  const handleSelectScheme = (schemeId, query) => {
    stopSpeaking();
    dismissWelcomeModal();
    const scheme = schemes.find(s => s.id === schemeId);
    if (scheme) {
      setSelectedScheme(scheme);
    }
    processInput(query);
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-saffron-500 text-center space-y-5 animate-scaleUp">
        
        {/* Top Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="वगळा (Skip)"
          title="वगळा"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Civic Assistant Avatar with Sound Pulse */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute -inset-3 rounded-full bg-saffron-400/30 animate-ping"></div>
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-saffron-600 to-civic-900 text-white flex items-center justify-center shadow-xl relative z-10">
            <span className="text-4xl font-black">स</span>
          </div>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saffron-100 dark:bg-saffron-950/80 text-saffron-800 dark:text-saffron-300 text-xs font-black uppercase border border-saffron-300 mb-2">
            <Volume2 className="w-3.5 h-3.5 animate-pulse text-saffron-600" />
            <span>मराठी आवाज स्वागत</span>
          </span>
          <h2 id="welcome-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
            "{welcomeText}"
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
            तुम्ही थेट बोलू शकता किंवा खालील योजनेवर स्पर्श करून सुरुवात करू शकता:
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          <button
            onClick={() => handleSelectScheme('ladki-bahin', 'लाडकी बहीण योजना माहिती')}
            className="p-3 bg-saffron-50 hover:bg-saffron-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-saffron-200 dark:border-slate-600 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm"
          >
            🌸 लाडकी बहीण योजना (₹१,५००)
          </button>
          <button
            onClick={() => handleSelectScheme('pm-kisan', 'पीएम किसान योजना माहिती')}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-emerald-200 dark:border-slate-600 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm"
          >
            🌾 पीएम किसान व नमो शेतकरी
          </button>
          <button
            onClick={() => handleSelectScheme('ayushman-mjpjay', 'आयुष्यमान भारत हॉस्पिटल उपचार')}
            className="p-3 bg-sky-50 hover:bg-sky-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-sky-200 dark:border-slate-600 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm"
          >
            🏥 आयुष्यमान भारत (मोफत उपचार)
          </button>
          <button
            onClick={() => handleSelectScheme('ration-card', 'नवीन रेशन कार्ड कसे काढायचे')}
            className="p-3 bg-amber-50 hover:bg-amber-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-amber-200 dark:border-slate-600 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm"
          >
            🍚 रेशन कार्ड अन्न सुरक्षा योजना
          </button>
        </div>

        {/* Bottom Actions: Skip & Replay */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={() => speak(welcomeText, { force: true })}
            className="text-xs font-bold text-saffron-600 dark:text-saffron-400 hover:underline flex items-center gap-1 min-h-[44px]"
          >
            <Volume2 className="w-4 h-4" />
            <span>पुन्हा ऐका</span>
          </button>

          <button
            onClick={handleSkip}
            className="py-2.5 px-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-black text-sm rounded-xl transition-colors min-h-[44px]"
          >
            वगळा (Skip)
          </button>
        </div>

      </div>
    </div>
  );
}
