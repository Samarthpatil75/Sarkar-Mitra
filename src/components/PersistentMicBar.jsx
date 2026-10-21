import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Keyboard, 
  X, 
  Sparkles, 
  Square, 
  RotateCcw, 
  AlertCircle,
  WifiOff
} from 'lucide-react';
import { useSpeech } from '../context/SpeechContext';
import { useApp } from '../context/AppContext';

export default function PersistentMicBar() {
  const { 
    isListening, 
    isSpeaking,
    toggleListening, 
    interimTranscript, 
    micStatus, 
    processInput,
    isSpeechSupported,
    stopSpeaking,
    wasStoppedByUser,
    lastSpoken,
    replayLastAudio
  } = useSpeech();

  const { t, lowBandwidth, isOffline, showToast, activeScreen } = useApp();
  const [showTypeBox, setShowTypeBox] = useState(false);
  const [manualText, setManualText] = useState('');

  // Auto-switch to tap & type mode if offline, unsupported, or denied
  useEffect(() => {
    if (isOffline || micStatus === 'offline' || !isSpeechSupported || micStatus === 'denied' || micStatus === 'unsupported') {
      setShowTypeBox(true);
    }
  }, [isOffline, isSpeechSupported, micStatus]);

  const isQuestionScreen = ['eligibility', 'form', 'conversation'].includes(activeScreen);

  // If not on question screens, hide the persistent input bar.
  // BUT keep the "आवाज थांबवा" button visible whenever audio is playing (or replay if stopped by user).
  if (!isQuestionScreen) {
    if (isSpeaking) {
      return (
        <aside 
          aria-label="आवाज थांबवा" 
          className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none animate-fadeIn"
        >
          <button
            type="button"
            onClick={() => stopSpeaking({ userInitiated: true })}
            className="pointer-events-auto min-h-[48px] px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-base rounded-2xl shadow-2xl ring-4 ring-red-300 dark:ring-red-950 flex items-center gap-2.5 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-400 cursor-pointer animate-pulse"
            role="button"
            aria-label="आवाज थांबवा"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>आवाज थांबवा</span>
          </button>
        </aside>
      );
    }

    if (wasStoppedByUser && lastSpoken && lastSpoken.text) {
      return (
        <aside 
          aria-label="पुन्हा ऐका" 
          className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none animate-fadeIn"
        >
          <button
            type="button"
            onClick={replayLastAudio}
            className="pointer-events-auto min-h-[48px] px-6 py-2.5 bg-saffron-600 hover:bg-saffron-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl flex items-center gap-2 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-saffron-400 cursor-pointer"
            role="button"
            aria-label="पुन्हा ऐका"
            title="शेवटचा आवाज पुन्हा ऐका"
          >
            <RotateCcw className="w-5 h-5" />
            <span>🔁 पुन्हा ऐका</span>
          </button>
        </aside>
      );
    }

    return null;
  }

  const quickPrompts = [
    'लाडकी बहीण योजना काय आहे?',
    'मी पीएम किसान साठी पात्र आहे का?',
    'रेशन कार्डसाठी कागदपत्रे कोणती?',
    'आयुष्यमान भारत अर्ज कसा करावा?'
  ];

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualText.trim()) {
      stopSpeaking();
      processInput(manualText);
      setManualText('');
      setShowTypeBox(false);
    }
  };

  const handleQuickPromptClick = (prompt) => {
    stopSpeaking();
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
          <div className="mb-2 p-3 bg-amber-50 dark:bg-slate-800 border-2 border-amber-400 dark:border-amber-600 rounded-xl text-center animate-pulse shadow-xs">
            <span className="text-[16px] font-black text-[#1B2A5C] dark:text-amber-300 block mb-0.5">
              बोललेले ऐकले जात आहे:
            </span>
            <p className="text-base sm:text-lg font-black text-[#1F2937] dark:text-white">
              "{interimTranscript}"
            </p>
          </div>
        )}

        {/* Prominent High-Contrast Stop Button whenever isSpeaking is true */}
        {isSpeaking && (
          <div className="mb-2 flex items-center justify-center animate-fadeIn">
            <button
              type="button"
              onClick={() => stopSpeaking({ userInitiated: true })}
              className="min-h-[48px] px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-base rounded-2xl shadow-xl ring-4 ring-red-300 dark:ring-red-950 flex items-center gap-2.5 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-400 cursor-pointer animate-pulse"
              role="button"
              aria-label="आवाज थांबवा"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>आवाज थांबवा</span>
            </button>
          </div>
        )}

        {/* After stopping audio, button changes to "🔁 पुन्हा ऐका" for last spoken message */}
        {!isSpeaking && wasStoppedByUser && lastSpoken && lastSpoken.text && (
          <div className="mb-2 flex items-center justify-center animate-fadeIn">
            <button
              type="button"
              onClick={replayLastAudio}
              className="min-h-[48px] px-6 py-2.5 bg-saffron-600 hover:bg-saffron-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-md flex items-center gap-2 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-saffron-400 cursor-pointer"
              role="button"
              aria-label="पुन्हा ऐका"
              title="शेवटचा आवाज पुन्हा ऐका"
            >
              <RotateCcw className="w-5 h-5" />
              <span>🔁 पुन्हा ऐका</span>
            </button>
          </div>
        )}

        {/* Offline Fallback Banner */}
        {(isOffline || micStatus === 'offline') && (
          <div className="mb-2 p-3 bg-red-50 dark:bg-red-950/60 border-2 border-red-400 dark:border-red-600 rounded-xl flex items-center gap-2.5 text-red-950 dark:text-red-100 text-[16px] font-black animate-fadeIn">
            <WifiOff className="w-5 h-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <span>ऑफलाइन — आवाज ओळख बंद, बटणे वापरा</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                इंटरनेट उपलब्ध नसल्यामुळे आवाज ओळख बंद आहे. खालील पर्याय किंवा कीबोर्ड वापरून संवाद साधा.
              </p>
            </div>
          </div>
        )}

        {/* Friendly Speech Unavailable / Permission Fallback Banner */}
        {!isOffline && (!isSpeechSupported || micStatus === 'denied' || micStatus === 'unsupported') && (
          <div className="mb-2 p-3.5 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-600 rounded-xl flex items-start gap-2.5 text-[#1F2937] dark:text-white animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-black text-[16px] text-[#1B2A5C] dark:text-amber-300">
                {micStatus === 'denied'
                  ? 'मायक्रोफोन परवानगी मिळालेली नाही. काळजी करू नका!'
                  : 'तुमच्या ब्राउझरमध्ये थेट आवाज ओळख उपलब्ध नाही. काळजी करू नका!'}
              </p>
              <p className="text-sm mt-0.5 text-slate-800 dark:text-slate-200 font-bold">
                ॲप टॅप आणि टाईप मोडमध्ये सुरू झाले आहे. खालील कीबोर्ड किंवा सुचवलेल्या पर्यायांवर थेट बोट ठेवून संवाद साधा.
              </p>
            </div>
          </div>
        )}

        {/* Typing Box Drawer */}
        {showTypeBox && (
          <div className="mb-3 p-3.5 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border-2 border-slate-300 dark:border-slate-600 shadow-inner animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[16px] font-black text-[#1B2A5C] dark:text-slate-200 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-saffron-600" /> मजकूर टाईप करा:
              </span>
              <button 
                type="button"
                onClick={() => setShowTypeBox(false)}
                className="p-1 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg cursor-pointer"
                aria-label="टाईपिंग बंद करा"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => {
                  if (isSpeaking) stopSpeaking();
                  setManualText(e.target.value);
                }}
                placeholder={t('type_placeholder') || 'येथे लिहा...'}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-saffron-500 dark:focus:border-saffron-400 rounded-xl text-base text-slate-900 dark:text-white outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-5 py-3 bg-saffron-600 hover:bg-saffron-700 text-white font-black rounded-xl flex items-center gap-1.5 transition-colors min-h-[48px] focus:ring-4 focus:ring-saffron-400 cursor-pointer text-[16px]"
                aria-label={t('send') || 'पाठवा'}
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">{t('send') || 'पाठवा'}</span>
              </button>
            </form>

            {/* Quick Tap Chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[16px] text-slate-900 dark:text-slate-200 py-1 font-black flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-saffron-600" /> सुचवलेले प्रश्न:
              </span>
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPromptClick(q)}
                  className="px-3 py-1.5 app-chip rounded-xl font-bold text-left cursor-pointer text-[16px] shadow-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar Main Controls: "टाईप करा" + Center "बोलण्यासाठी दाबा" */}
        <div className="flex items-center justify-between gap-3">

          {/* Toggle Type / Prompt Drawer Button */}
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setShowTypeBox(prev => !prev);
            }}
            className={`p-3 rounded-2xl border-2 flex items-center gap-2 min-h-[48px] min-w-[48px] transition-colors focus:ring-4 focus:ring-saffron-400 cursor-pointer ${
              showTypeBox
                ? 'bg-amber-100 border-amber-500 text-[#1B2A5C] dark:bg-slate-800 dark:text-white'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800'
            }`}
            aria-label="टाईप करून विचारा किंवा सुचवलेले पर्याय पहा"
            title="टाईप करा"
          >
            <Keyboard className="w-6 h-6 text-saffron-600 dark:text-saffron-400" />
            <span className="hidden sm:inline text-[16px] font-black">
              {showTypeBox ? 'बंद करा' : 'टाईप करा'}
            </span>
          </button>

          {/* Center Giant Mic Button ("बोलण्यासाठी दाबा") */}
          <div className="flex-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (isOffline) {
                  showToast('ऑफलाइन — आवाज ओळख बंद, बटणे वापरा', 'warning');
                  setShowTypeBox(true);
                  return;
                }
                toggleListening();
              }}
              className={`group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-3 rounded-full font-black text-base sm:text-xl transition-all shadow-lg min-h-[56px] min-w-[200px] sm:min-w-[240px] focus:outline-none focus:ring-4 cursor-pointer ${
                isOffline
                  ? 'bg-slate-700 hover:bg-slate-800 text-white border-2 border-slate-600 focus:ring-slate-400'
                  : isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 animate-pulse'
                  : 'bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-700 hover:to-saffron-800 text-white focus:ring-saffron-400 shadow-glow-saffron'
              }`}
              aria-label={
                isOffline
                  ? 'ऑफलाइन — आवाज ओळख बंद, बटणे वापरा'
                  : isListening
                  ? 'बोलणे थांबवण्यासाठी दाबा'
                  : 'बोलण्यासाठी दाबा (मराठीत बोला)'
              }
            >
              {/* Outer pulsing ring for visual feedback */}
              {isListening && !lowBandwidth && !isOffline && (
                <span className="absolute -inset-1 rounded-full bg-red-500 opacity-60 animate-ping"></span>
              )}

              {isOffline ? (
                <>
                  <WifiOff className="w-6 h-6 text-amber-300 shrink-0" />
                  <span className="text-sm sm:text-base font-bold">ऑफलाइन (बटणे वापरा)</span>
                </>
              ) : isListening ? (
                <>
                  <MicOff className="w-6 h-6 sm:w-7 sm:h-7 animate-bounce shrink-0" />
                  <span>{t('stop_listening') || 'बोलणे थांबवा'}</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <span>{t('tap_to_speak') || 'बोलण्यासाठी दाबा'}</span>
                </>
              )}
            </button>
          </div>

          {/* Simple Marathi Language Prompt Reminder */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <span>🗣️ मराठीत बोला</span>
          </div>
        </div>

      </div>
    </aside>
  );
}
