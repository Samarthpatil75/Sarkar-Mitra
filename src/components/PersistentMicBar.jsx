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
  Volume2, 
  VolumeX, 
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
    speechSpeed,
    setSpeechSpeed,
    stopSpeaking,
    wasStoppedByUser,
    lastSpoken,
    replayLastAudio,
    autoSpeakAnswers,
    setAutoSpeakAnswers
  } = useSpeech();

  const { t, lowBandwidth, isOffline, showToast } = useApp();
  const [showTypeBox, setShowTypeBox] = useState(false);
  const [manualText, setManualText] = useState('');

  // Auto-switch to tap & type mode if offline, unsupported, or denied
  useEffect(() => {
    if (isOffline || micStatus === 'offline' || !isSpeechSupported || micStatus === 'denied' || micStatus === 'unsupported') {
      setShowTypeBox(true);
    }
  }, [isOffline, isSpeechSupported, micStatus]);

  const quickPrompts = [
    'लाडकी बहीण योजना काय आहे?',
    'मी पीएम किसान साठी पात्र आहे का?',
    'रेशन कार्डसाठी कागदपत्रे कोणती?',
    'आयुष्यमान भारत अर्ज कसा करावा?'
  ];

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualText.trim()) {
      // Automatic stopping on typing or sending a message
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
          <div className="mb-2 p-2 bg-saffron-50 dark:bg-slate-800 border-2 border-saffron-400 rounded-xl text-center animate-pulse">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              बोललेले ऐकले जात आहे:
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
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
              className="min-h-[48px] px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-base rounded-2xl shadow-xl ring-4 ring-red-300 dark:ring-red-950 flex items-center gap-2.5 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-400 cursor-pointer"
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
          <div className="mb-2 p-3 bg-red-50 dark:bg-red-950/60 border-2 border-red-400 dark:border-red-600 rounded-xl flex items-center gap-2.5 text-red-900 dark:text-red-200 text-sm font-black animate-fadeIn">
            <WifiOff className="w-5 h-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <span>ऑफलाइन — आवाज ओळख बंद, बटणे वापरा</span>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                इंटरनेट उपलब्ध नसल्यामुळे आवाज ओळख बंद आहे. खालील पर्याय किंवा कीबोर्ड वापरून संवाद साधा.
              </p>
            </div>
          </div>
        )}

        {/* Friendly Speech Unavailable / Permission Fallback Banner */}
        {!isOffline && (!isSpeechSupported || micStatus === 'denied' || micStatus === 'unsupported') && (
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
                type="button"
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
                onChange={(e) => {
                  if (isSpeaking) stopSpeaking();
                  setManualText(e.target.value);
                }}
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
            type="button"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setShowTypeBox(prev => !prev);
            }}
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
              type="button"
              onClick={() => {
                if (isOffline) {
                  showToast('ऑफलाइन — आवाज ओळख बंद, बटणे वापरा', 'warning');
                  setShowTypeBox(true);
                  return;
                }
                toggleListening();
              }}
              className={`group relative flex items-center justify-center gap-3 px-6 sm:px-8 py-3 rounded-full font-extrabold text-lg sm:text-xl transition-all shadow-lg min-h-[58px] min-w-[200px] focus:outline-none focus:ring-4 ${
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
                  <WifiOff className="w-6 h-6 text-amber-300 flex-shrink-0" />
                  <span className="text-sm sm:text-base">ऑफलाइन (बटणे वापरा)</span>
                </>
              ) : isListening ? (
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

          {/* Helper Chip, Auto-Speak Toggle & Speech Speed */}
          <div className="hidden sm:flex flex-col items-end gap-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              {/* 'उत्तर ऐका' quick toggle */}
              <button
                type="button"
                onClick={() => setAutoSpeakAnswers(!autoSpeakAnswers)}
                className={`px-2 py-0.5 rounded-lg font-bold text-xs border transition-colors flex items-center gap-1 ${
                  autoSpeakAnswers
                    ? 'bg-saffron-50 dark:bg-saffron-950 text-saffron-900 dark:text-saffron-200 border-saffron-300 dark:border-saffron-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                }`}
                title="उत्तर ऐकणे (आवाज) चालू किंवा बंद करा"
                aria-label="उत्तर ऐका टॉगल"
              >
                {autoSpeakAnswers ? (
                  <Volume2 className="w-3.5 h-3.5 text-saffron-600 dark:text-saffron-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>उत्तर ऐका</span>
              </button>

              {/* Speed control */}
              <button
                type="button"
                onClick={() => {
                  const nextSpeed = speechSpeed === 'slow' ? 'normal' : speechSpeed === 'normal' ? 'fast' : 'slow';
                  setSpeechSpeed(nextSpeed);
                }}
                className="px-2 py-0.5 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-saffron-800 dark:text-saffron-300 border border-slate-300 dark:border-slate-700 transition-colors"
                title="आवाजाचा वेग बदला (हळू / सामान्य / जलद)"
                aria-label="आवाजाचा वेग बदला"
              >
                {speechSpeed === 'slow' ? '🐢 हळू' : speechSpeed === 'fast' ? '⚡ जलद' : '🗣️ सामान्य'}
              </button>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">मराठीत बोला</span>
          </div>
        </div>

      </div>
    </aside>
  );
}
