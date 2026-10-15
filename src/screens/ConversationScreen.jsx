import React, { useEffect, useRef } from 'react';
import { Volume2, CheckCircle2, FileText, ArrowRight, ExternalLink, Bot, User, Sparkles } from 'lucide-react';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function ConversationScreen() {
  const { messages, setSelectedScheme, setActiveScreen, t } = useApp();
  const { isListening, isSpeaking, interimTranscript, speak } = useSpeech();
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  const handleReplay = (text) => {
    speak(text, { force: true });
  };

  const handleAction = (screenId, scheme) => {
    if (scheme) setSelectedScheme(scheme);
    setActiveScreen(screenId);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 pb-32 space-y-4">

      {/* Screen Title & Instruction Header */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-saffron-600" />
            <span>मराठी संभाषण (Voice Chat)</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            माईक दाबा आणि बोला, किंवा उत्तर ऐकण्यासाठी 🔊 बटण दाबा.
          </p>
        </div>
      </div>

      {/* Live Audio / Interim Waveform Visualizer */}
      <VoiceWaveVisualizer 
        isListening={isListening} 
        isSpeaking={isSpeaking} 
        interimText={interimTranscript} 
      />

      {/* Message List */}
      <div className="space-y-4 min-h-[350px]">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';

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
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-sm text-base leading-relaxed ${
                  isAssistant
                    ? 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                    : 'bg-civic-900 text-white rounded-tr-sm'
                }`}
              >
                {/* Assistant Voice Replay Button & Timestamp */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {isAssistant ? 'बोलू या सहाय्यक' : 'तुम्ही बोललात'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {msg.timestamp}
                    </span>
                    {isAssistant && (
                      <button
                        onClick={() => handleReplay(msg.text_mr)}
                        className="p-1.5 text-saffron-600 dark:text-saffron-400 hover:bg-saffron-50 dark:hover:bg-slate-700 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors focus:ring-2 focus:ring-saffron-400"
                        aria-label="हे उत्तर पुन्हा ऐका"
                        title="पुन्हा ऐका"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <p className="font-medium whitespace-pre-line text-lg leading-relaxed">
                  {msg.text_mr}
                </p>

                {/* External link if provided */}
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

                {/* Interactive Action Shortcuts if scheme is referenced */}
                {isAssistant && msg.scheme && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAction('eligibility', msg.scheme)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 min-h-[40px]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>पात्रता तपासा</span>
                    </button>
                    <button
                      onClick={() => handleAction('documents', msg.scheme)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1 min-h-[40px]"
                    >
                      <FileText className="w-3.5 h-3.5 text-saffron-500" />
                      <span>कागदपत्रे यादी</span>
                    </button>
                    <button
                      onClick={() => handleAction('form', msg.scheme)}
                      className="px-3 py-1.5 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 min-h-[40px]"
                    >
                      <span>अर्ज भरा</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
        <div ref={messagesEndRef} />
      </div>

    </div>
  );
}
