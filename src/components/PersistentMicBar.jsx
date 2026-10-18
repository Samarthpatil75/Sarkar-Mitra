import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Keyboard, X, Sparkles, ChevronUp, AlertTriangle, AlertCircle } from 'lucide-react';
import { useSpeech } from '../context/SpeechContext';
import { useApp } from '../context/AppContext';

export default function PersistentMicBar() {
  const { 
    isListening, 
    toggleListening, 
    interimTranscript, 
    micStatus, 
    errorMessage, 
    processInput,
    isSpeechSupported
  } = useSpeech();

  const { t, lowBandwidth } = useApp();
  const [showTypeBox, setShowTypeBox] = useState(false);
  const [manualText, setManualText] = useState('');

  // Auto-switch to tap & type mode if speech recognition is unsupported or permission is denied
  useEffect(() => {
    if (!isSpeechSupported || micStatus === 'denied' || micStatus === 'unsupported') {
      setShowTypeBox(true);
    }
  }, [isSpeechSupported, micStatus]);

  const quickPrompts = [
    'लाडकी बहीण योजना काय आहे?',
    'मी पीएम किसान साठी पात्र आहे का?',
    'रेशन कार्डसाठी कागदपत्रे कोणती?',
    'आयुष्यमान भारत अर्ज कसा करावा?'
  ];

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualText.trim()) {
      processInput(manualText);
      setManualText('');
      setShowTypeBox(false);
    }
  };

  const handleQuickPromptClick = (prompt) => {
    processInput(prompt);
    setShowTypeBox(false);
  };

  return (
    <aside 
      aria-label="आवाज सहाय्यक आणि इनपुट बार" 
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all"
    >
      <div className="max-w-3xl mx-auto px-4 py-2 sm:py-3">

        {/* Interim / Live Transcript Confirmation Banner */}
        {interimTranscript && (
          <div className="mb-2 p-2 bg-saffron-50 dark:bg-slate-800 border-2 border-saffron-400 rounded-xl text-center animate-pulse">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              बोललेले ऐकले जात आहे:
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              "{interimTranscript}"
            </p>
          </div>
        )}

        {/* Friendly Speech Unavailable / Permission Fallback Banner */}
        {(!isSpeechSupported || micStatus === 'denied' || micStatus === 'unsupported') && (
          <div className="mb-2 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2 text-amber-900 dark:text-amber-200 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">
                {micStatus === 'denied'
                  ? 'मायक्रोफोन परवानगी मिळालेली नाही. काळजी करू नका!'
                  : 'तुमच्या ब्राउझरमध्ये थेट आवाज ओळख उपलब्ध नाही. काळजी करू नका!'}
              </p>
              <p className="text-xs mt-0.5 text-slate-700 dark:text-slate-300">
                ॲप टॅप आणि टाईप मोडमध्ये सुरू झाले आहे. खालील कीबोर्ड किंवा सुचवलेल्या पर्यायांवर थेट बोट ठेवून संवाद साधा.
              </p>
            </div>
          </div>
        )}

        {/* Typing Box Drawer */}
        {showTypeBox && (
          <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Keyboard className="w-4 h-4 text-saffron-600" /> मजकूर टाईप करा:
              </span>
              <button 
                onClick={() => setShowTypeBox(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg"
                aria-label="टाईपिंग बंद करा"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={t('type_placeholder')}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-saffron-500 dark:focus:border-saffron-400 rounded-xl text-base text-slate-900 dark:text-white outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-5 py-3 bg-saffron-600 hover:bg-saffron-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors min-h-[48px] focus:ring-4 focus:ring-saffron-400"
                aria-label={t('send')}
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">{t('send')}</span>
              </button>
            </form>

            {/* Quick Tap Chips */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 py-1 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-saffron-500" /> सुचवलेले प्रश्न:
              </span>
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPromptClick(q)}
                  className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-saffron-500 text-slate-800 dark:text-slate-200 rounded-lg transition-colors font-medium text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar Main Controls */}
        <div className="flex items-center justify-between gap-3">

          {/* Toggle Type / Prompt Drawer Button */}
          <button
            onClick={() => setShowTypeBox(prev => !prev)}
            className={`p-3 rounded-2xl border flex items-center gap-2 min-h-[48px] min-w-[48px] transition-colors focus:ring-4 focus:ring-saffron-400 ${
              showTypeBox
                ? 'bg-saffron-100 border-saffron-400 text-saffron-900 dark:bg-saffron-950 dark:text-saffron-200'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            aria-label="टाईप करून विचारा किंवा सुचवलेले पर्याय पहा"
            title="टाईप करा"
          >
            <Keyboard className="w-6 h-6 text-saffron-600 dark:text-saffron-400" />
            <span className="hidden sm:inline text-sm font-bold">
              {showTypeBox ? 'बंद करा' : 'टाईप करा'}
            </span>
          </button>

          {/* Center Giant Mic Button */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={toggleListening}
              className={`group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-3 rounded-full font-extrabold text-lg sm:text-xl transition-all shadow-lg min-h-[58px] min-w-[200px] focus:outline-none focus:ring-4 ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 animate-pulse'
                  : 'bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-700 hover:to-saffron-800 text-white focus:ring-saffron-400 shadow-glow-saffron'
              }`}
              aria-label={isListening ? 'बोलणे थांबवण्यासाठी दाबा' : 'बोलण्यासाठी दाबा (मराठीत बोला)'}
            >
              {/* Outer pulsing ring for visual feedback */}
              {isListening && !lowBandwidth && (
                <span className="absolute -inset-1 rounded-full bg-red-500 opacity-60 animate-ping"></span>
              )}

              {isListening ? (
                <>
                  <MicOff className="w-7 h-7 animate-bounce" />
                  <span>{t('stop_listening')}</span>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <span>{t('tap_to_speak')}</span>
                </>
              )}
            </button>
          </div>

          {/* Helper Chip for elderly / quick guidance */}
          <div className="hidden sm:flex flex-col text-right text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-700 dark:text-slate-300">मराठीत बोला</span>
            <span>कोणतीही योजना विचारा</span>
          </div>
        </div>

      </div>
    </aside>
  );
}
