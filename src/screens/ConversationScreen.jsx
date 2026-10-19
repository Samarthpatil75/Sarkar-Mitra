import React, { useState, useEffect, useRef, useTransition } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  ExternalLink, 
  Bot, 
  User, 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  ShieldAlert, 
  Download, 
  Trash2, 
  X, 
  HelpCircle, 
  Database,
  Square
} from 'lucide-react';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import { 
  getSessionUnansweredQueries, 
  clearSessionUnansweredQueries, 
  exportUnansweredQueriesCSV 
} from '../services/faqMatcher';

export default function ConversationScreen() {
  const { 
    messages, 
    setSelectedScheme, 
    selectedScheme, 
    setActiveScreen, 
    schemes, 
    t 
  } = useApp();

  const { 
    isListening, 
    isSpeaking, 
    currentId,
    wasStoppedByUser,
    lastSpoken,
    replayLastAudio,
    interimTranscript, 
    speak, 
    stopSpeaking, 
    processInput, 
    speechSpeed, 
    setSpeechSpeed, 
    autoSpeakAnswers, 
    setAutoSpeakAnswers, 
    toggleListening 
  } = useSpeech();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [unansweredList, setUnansweredList] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Refresh unanswered queries list whenever modal opens or messages change
  const refreshUnanswered = () => {
    setUnansweredList(getSessionUnansweredQueries());
  };

  useEffect(() => {
    refreshUnanswered();
  }, [messages.length]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, isTyping]);

  // Cleanup on unmount so nothing keeps speaking after screen closes
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const handleReplay = (text, msgId = null) => {
    speak(text, { id: msgId || text, force: true });
  };

  const handleAction = (screenId, scheme) => {
    stopSpeaking();
    if (scheme) setSelectedScheme(scheme);
    setActiveScreen(screenId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    // Automatic stopping when user types or sends a message
    stopSpeaking();
    const query = inputText.trim();
    setInputText('');

    // Natural typing delay simulation for conversational realism
    setIsTyping(true);
    setTimeout(() => {
      processInput(query);
      setIsTyping(false);
      refreshUnanswered();
    }, 380);
  };

  const handleQuickChipClick = (query) => {
    stopSpeaking();
    setIsTyping(true);
    setTimeout(() => {
      processInput(query);
      setIsTyping(false);
      refreshUnanswered();
    }, 300);
  };

  const handleClearInsights = () => {
    clearSessionUnansweredQueries();
    setUnansweredList([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 pt-1 pb-36 space-y-4">

      {/* Screen Header: Title, Auto-Speak Toggle, Speed Controls & Insights */}
      <header className="p-4 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-saffron-600 to-civic-900 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>सरकारी योजना प्रश्नोत्तरे</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-saffron-100 dark:bg-saffron-950 text-saffron-800 dark:text-saffron-300 font-bold border border-saffron-300">
                  अधिकृत माहिती
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                शासकीय नियमांनुसार थेट अचूक उत्तरे • कोणतीही खोटी माहिती नाही
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          
          {/* Prominent Stop Button when speaking */}
          {isSpeaking && (
            <button
              type="button"
              onClick={() => stopSpeaking({ userInitiated: true })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md animate-pulse focus:ring-4 focus:ring-red-400 cursor-pointer"
              role="button"
              aria-label="आवाज थांबवा"
              title="आवाज थांबवा"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>⏹ आवाज थांबवा</span>
            </button>
          )}

          {/* 'उत्तर ऐका' Auto-Speak Toggle Switch */}
          <button
            onClick={() => setAutoSpeakAnswers(!autoSpeakAnswers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
              autoSpeakAnswers
                ? 'bg-saffron-600 text-white border-saffron-700 ring-2 ring-saffron-300 dark:ring-saffron-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200'
            }`}
            title="नवीन उत्तरे आपोआप आवाजात ऐकणे चालू/बंद करा"
            aria-label="उत्तर ऐका टॉगल"
          >
            {autoSpeakAnswers ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>उत्तर ऐका: {autoSpeakAnswers ? 'सुरू' : 'बंद'}</span>
          </button>

          {/* Speech Speed Controls */}
          <div className="flex items-center rounded-xl p-0.5 bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600">
            <button
              onClick={() => setSpeechSpeed('slow')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                speechSpeed === 'slow' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="हळू आवाज"
            >
              हळू
            </button>
            <button
              onClick={() => setSpeechSpeed('normal')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                speechSpeed === 'normal' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="सामान्य आवाज"
            >
              सामान्य
            </button>
            <button
              onClick={() => setSpeechSpeed('fast')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                speechSpeed === 'fast' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="जलद आवाज"
            >
              जलद
            </button>
          </div>

          {/* Hidden Insights Button: "न मिळालेले प्रश्न" */}
          <button
            onClick={() => {
              refreshUnanswered();
              setShowInsightsModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 transition-colors"
            title="सत्रातील अनुत्तरीत प्रश्न व CSV निर्यात"
            aria-label="न मिळालेले प्रश्न पहा"
          >
            <Database className="w-3.5 h-3.5 text-saffron-600" />
            <span className="hidden sm:inline">न मिळालेले प्रश्न</span>
            <span className="px-1.5 py-0.2 rounded-full bg-saffron-500 text-white text-[10px] font-black">
              {unansweredList.length}
            </span>
          </button>
        </div>
      </header>

      {/* Live Audio / Interim Waveform Visualizer */}
      <VoiceWaveVisualizer 
        isListening={isListening} 
        isSpeaking={isSpeaking} 
        interimText={interimTranscript} 
      />

      {/* Scheme Quick Switch Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <span className="text-slate-500 dark:text-slate-400 shrink-0">योजना निवडा:</span>
        {schemes.map((s) => {
          const isSelected = selectedScheme && selectedScheme.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setSelectedScheme(s);
                handleQuickChipClick(`${s.name_mr} बद्दल सांगा`);
              }}
              className={`px-3 py-1.5 rounded-full shrink-0 transition-all border ${
                isSelected
                  ? 'bg-civic-900 text-white border-civic-950 dark:bg-saffron-600 dark:border-saffron-500 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-saffron-400'
              }`}
            >
              {s.name_mr}
            </button>
          );
        })}
      </div>

      {/* Conversation Messages Container */}
      <div className="space-y-4 min-h-[380px]">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';

          // 1. PRIVACY ALERT CARD (If user accidentally typed Aadhaar / OTP / Bank details)
          if (msg.isPrivacyWarning) {
            return (
              <div key={msg.id} className="flex items-start gap-3 justify-start animate-fadeIn">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl p-5 bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100 shadow-sm rounded-tl-sm space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm">
                    <ShieldAlert className="w-4 h-4" />
                    <span>सुरक्षा व गोपनीयता सूचना (Privacy Protection)</span>
                  </div>
                  <p className="font-bold text-base leading-relaxed">
                    {msg.text_mr}
                  </p>
                  <p className="text-xs text-amber-900/80 dark:text-amber-300/80">
                    टीप: सरकार मित्र तुमचा कोणताही वैयक्तिक डेटा साठवत नाही.
                  </p>
                </div>
              </div>
            );
          }

          // 2. STANDARD USER & ASSISTANT MESSAGE CARDS
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAssistant ? 'justify-start' : 'justify-end'} animate-fadeIn`}
            >
              {isAssistant && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-saffron-600 to-civic-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-[92%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 shadow-sm text-base leading-relaxed transition-all ${
                  isAssistant
                    ? 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                    : 'bg-civic-900 text-white rounded-tr-sm ml-auto'
                }`}
              >
                {/* Assistant Card Header: Sender Name, Timestamp, Replay Button */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                      {isAssistant ? 'सरकार मित्र Q&A' : 'तुम्ही बोललात'}
                    </span>
                    {isAssistant && msg.topic && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        विषय: {msg.topic}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {msg.timestamp}
                    </span>
                    {isAssistant && (
                      isSpeaking && currentId === (msg.id || msg.text_mr) ? (
                        <button
                          type="button"
                          onClick={() => stopSpeaking({ userInitiated: true })}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md animate-pulse min-h-[34px] cursor-pointer"
                          role="button"
                          aria-label="आवाज थांबवा"
                          title="आवाज थांबवा"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>⏹ थांबवा</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReplay(msg.text_mr, msg.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-saffron-800 dark:text-saffron-300 bg-saffron-50 hover:bg-saffron-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-saffron-300 dark:border-slate-600 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-saffron-400 min-h-[34px]"
                          aria-label="हे उत्तर पुन्हा ऐका"
                          title="पुन्हा ऐका"
                        >
                          <span className="text-xs">🔁</span>
                          <span>पुन्हा ऐका</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Source Verification Chip */}
                {isAssistant && (msg.source_gr || msg.scheme) && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <span className="text-saffron-600 font-black">योजना:</span>
                      <span>{msg.scheme?.name_mr || 'शासकीय योजना'}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-slate-500 font-semibold">GR: {msg.source_gr || msg.scheme?.verification_tag || 'अधिकृत शासन परिपत्रक'}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-slate-500 font-semibold">शेवटची पडताळणी: {msg.last_verified || msg.scheme?.last_verified_date || '2026-09-15'}</span>
                    </div>

                    {/* Development Mode Notice for Unverified Draft Entries */}
                    {msg.verified === false && import.meta.env.DEV && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 text-[10px] font-extrabold border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>अपडेट करणे बाकी (पडताळणी बाकी)</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Main Message Text */}
                <p className="font-medium whitespace-pre-line text-base sm:text-lg leading-relaxed">
                  {msg.text_mr}
                </p>

                {/* Interactive Eligibility Wizard Launch Button */}
                {isAssistant && msg.hasEligibilityAction && (
                  <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>तुम्ही या योजनेसाठी पात्र आहात का?</span>
                      </h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        ५ सोप्या प्रश्नांची उत्तरे देऊन स्वतःची अधिकृत पात्रता तपासा.
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction('eligibility', msg.scheme)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 shrink-0 min-h-[42px]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{msg.action_label_mr || 'माझी पात्रता तपासा'}</span>
                    </button>
                  </div>
                )}

                {/* Tappable Follow-Up Question Chips */}
                {isAssistant && msg.follow_ups && msg.follow_ups.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
                      <span>सुचवलेले पुढील प्रश्न:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.follow_ups.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickChipClick(fu.query)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-saffron-50 dark:bg-slate-700/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-saffron-400 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-all shadow-sm flex items-center gap-1.5 text-left active:scale-95"
                        >
                          <span className="text-saffron-600">💬</span>
                          <span>{fu.label_mr}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disambiguation / Scheme Selection Chips */}
                {isAssistant && msg.options && msg.options.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-saffron-800 dark:text-saffron-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-saffron-600" />
                      <span>खालीलपैकी एका पर्यायावर स्पर्श करा:</span>
                    </span>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                      {msg.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleQuickChipClick(opt.query || opt.label_mr)}
                          className="px-3.5 py-2.5 bg-saffron-50 hover:bg-saffron-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-saffron-300 dark:border-slate-600 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm flex items-center gap-2 text-left active:scale-95"
                        >
                          <span className="text-saffron-600 dark:text-saffron-400">👉</span>
                          <span>{opt.label_mr}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Official Portal Link */}
                {msg.link && (
                  <div className="mt-3 pt-2">
                    <a
                      href={msg.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-saffron-50 dark:bg-saffron-950/60 border border-saffron-300 dark:border-saffron-800 text-saffron-800 dark:text-saffron-300 rounded-xl text-xs font-bold hover:underline"
                    >
                      <span>{msg.link_text || 'अधिकृत संकेतस्थळ उघडा'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-10 h-10 rounded-2xl bg-civic-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Indicator while Assistant is processing query */}
        {isTyping && (
          <div className="flex items-start gap-3 justify-start animate-fadeIn">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-saffron-600 to-civic-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
              <Bot className="w-5 h-5" />
            </div>
            <div className="rounded-3xl p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-tl-sm flex items-center gap-2 shadow-sm">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                सरकार मित्र उत्तर तयार करत आहे
              </span>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-saffron-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-saffron-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-saffron-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Chat Input & Mic Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-200 dark:border-slate-800 p-3 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            
            {/* Mic Button with Pulse */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl text-white font-bold flex items-center justify-center min-h-[50px] min-w-[50px] transition-all shadow-md active:scale-95 ${
                isListening
                  ? 'bg-red-600 ring-4 ring-red-300 animate-pulse'
                  : 'bg-saffron-600 hover:bg-saffron-700'
              }`}
              aria-label={isListening ? 'माइक थांबवा' : 'मराठीत बोला'}
              title={isListening ? 'थांबवा' : 'माइक दाबून बोला'}
            >
              {isListening ? <MicOff className="w-6 h-6 animate-bounce" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Text Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => {
                if (isSpeaking) stopSpeaking();
                setInputText(e.target.value);
              }}
              placeholder="योजनेबद्दल कोणतीही शंका विचारा... (उदा. लाडकी बहीण पैसे कधी येतात?)"
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:border-saffron-500 dark:focus:border-saffron-400 rounded-2xl text-base text-slate-900 dark:text-white outline-none min-h-[50px]"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 bg-civic-900 hover:bg-civic-950 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center justify-center min-h-[50px] min-w-[50px] transition-all shadow-sm active:scale-95"
              aria-label="पाठवा"
              title="प्रश्न विचारा"
            >
              <Send className="w-5 h-5 text-saffron-400" />
            </button>
          </form>

          {/* Quick Helper Note */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span>💡 बोला किंवा टाईप करा: "पात्रता", "कागदपत्रे", "अर्ज कसा करावा", "पैसे कधी जमा होतात"</span>
            <span className="hidden sm:inline font-bold">100% Offline Q&A • No LLM</span>
          </div>
        </div>
      </div>

      {/* Hidden Insights Modal: "न मिळालेले प्रश्न" (Unanswered Queries View with CSV Export) */}
      {showInsightsModal && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="insights-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-slate-300 dark:border-slate-700 space-y-4 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <div>
                <h3 id="insights-title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-saffron-600" />
                  <span>न मिळालेले प्रश्न (Session Insights)</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  वापरकर्त्यांनी विचारलेले असे प्रश्न ज्यांना अचूक FAQ मॅच मिळाला नाही (नवीन FAQ जोडण्यासाठी उपयुक्त).
                </p>
              </div>
              <button
                onClick={() => setShowInsightsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="बंद करा"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Action Buttons: Export CSV & Clear Log */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                एकूण नोंदी: {unansweredList.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportUnansweredQueriesCSV}
                  disabled={unansweredList.length === 0}
                  className="px-3 py-1.5 bg-saffron-600 hover:bg-saffron-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV डाऊनलोड करा</span>
                </button>
                <button
                  onClick={handleClearInsights}
                  disabled={unansweredList.length === 0}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-40 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>नोंदी पुसा</span>
                </button>
              </div>
            </div>

            {/* Table of Unanswered Questions */}
            <div className="flex-1 overflow-y-auto border rounded-2xl border-slate-200 dark:border-slate-700">
              {unansweredList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="font-bold text-sm">सध्या कोणतीही अनुत्तरीत नोंद नाही.</p>
                  <p className="text-xs">सर्व प्रश्नांना योग्य अधिकृत उत्तर मिळाले आहे.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">वेळ</th>
                      <th className="p-2.5">विचारलेला प्रश्न</th>
                      <th className="p-2.5">योजना</th>
                      <th className="p-2.5">स्कोअर</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {unansweredList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-2.5 text-slate-400 whitespace-nowrap">{item.timestamp}</td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white max-w-xs break-words">{item.query}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.detectedSchemeId || '-'}</td>
                        <td className="p-2.5 text-slate-500 whitespace-nowrap">{item.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer close button */}
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowInsightsModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
