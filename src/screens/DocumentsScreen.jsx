import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckSquare, 
  Square, 
  Volume2, 
  FileCheck, 
  ArrowRight, 
  HelpCircle, 
  Building2, 
  ShieldCheck, 
  ExternalLink,
  ArrowLeft,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import { isCancelOrBackIntent, isStopIntent } from '../services/marathiVoiceMatcher';

export default function DocumentsScreen() {
  const { selectedScheme, setSelectedScheme, schemes, setActiveScreen, lowBandwidth } = useApp();
  const { 
    isListening, 
    isSpeaking, 
    interimTranscript, 
    speak, 
    stopSpeaking,
    wasStoppedByUser,
    lastSpoken,
    replayLastAudio,
    registerVoiceHandler 
  } = useSpeech();

  // Checked state for documents
  const [checkedDocs, setCheckedDocs] = useState({});

  const documents = selectedScheme?.documents_mr || [];

  const handleSchemeChange = (scheme) => {
    setSelectedScheme(scheme);
    setCheckedDocs({});
  };

  const toggleCheck = (docId) => {
    setCheckedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  // Read entire document list aloud in Marathi
  const handleReadAllAloud = useCallback(() => {
    if (!documents || documents.length === 0) return;
    const docNames = documents.map((d, i) => `${i + 1}. ${d.name}`).join('. ');
    const speechText = `${selectedScheme.name_mr} साठी लागणारी आवश्यक कागदपत्रे: ${docNames}. हे सर्व पुरावे तयार ठेवून तुम्ही थेट अर्ज भरू शकता.`;
    speak(speechText, { force: true });
  }, [documents, selectedScheme, speak]);

  // Read single document aloud
  const handleReadSingle = (e, doc) => {
    e.stopPropagation();
    const speechText = `${doc.name}. टीप: ${doc.note || 'मूळ प्रत व झेरॉक्स सोबत ठेवावी.'}`;
    speak(speechText, { force: true });
  };

  // Welcome guidance when entering Documents screen
  useEffect(() => {
    if (selectedScheme && !lowBandwidth) {
      speak(`${selectedScheme.name_mr} साठी आवश्यक कागदपत्रे येथे तपासा. ऐकण्यासाठी "सर्व कागदपत्रे ऐका" म्हणा, किंवा अर्ज भरण्यासाठी "अर्ज भरा" म्हणा.`);
    }
  }, [selectedScheme, lowBandwidth, speak]);

  // Pure Voice Navigation handler on Documents screen
  useEffect(() => {
    const unregister = registerVoiceHandler((speechText) => {
      const raw = speechText.trim().toLowerCase();
      if (!raw) return true;

      // Spoken stop command interception
      if (isStopIntent(raw)) {
        stopSpeaking({ userInitiated: true });
        return true;
      }

      // Check if user says to read documents aloud
      if (raw.includes('ऐका') || raw.includes('वाचून') || raw.includes('सांगा') || raw.includes('read')) {
        handleReadAllAloud();
        return true;
      }

      // Check if user wants to advance to Form Fill
      if (raw.includes('अर्ज') || raw.includes('फॉर्म') || raw.includes('पुढील') || raw.includes('पुढे') || raw.includes('apply')) {
        speak('आवाजाने अर्ज भरणे सुरू करत आहोत.');
        setActiveScreen('form');
        return true;
      }

      // Go back / eligibility
      if (isCancelOrBackIntent(raw) || raw.includes('पात्रता') || raw.includes('मागे')) {
        speak('पात्रता तपासणीवर परत जात आहोत.');
        setActiveScreen('eligibility');
        return true;
      }

      return true; // Keep interactions within screen
    });

    return () => unregister();
  }, [handleReadAllAloud, registerVoiceHandler, setActiveScreen, speak, stopSpeaking]);

  const checkedCount = Object.values(checkedDocs).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 pb-32 space-y-6">

      {/* Scheme Selector */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-sm">
        <label className="block text-[16px] font-black text-slate-800 dark:text-slate-200 mb-2">
          योजना निवडा:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {schemes.map((s) => {
            const isSelected = selectedScheme?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSchemeChange(s)}
                className={`px-3 py-2.5 rounded-2xl text-[16px] font-bold transition-all text-center min-h-[48px] flex items-center justify-center border-2 ${
                  isSelected
                    ? 'bg-amber-200 border-amber-600 text-[#1F2937] font-black shadow-sm'
                    : 'bg-white dark:bg-slate-700/60 text-[#1F2937] dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-amber-500'
                }`}
              >
                {s.name_mr.split(' ')[0]} {s.name_mr.split(' ')[1] || ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Audio / Interim Waveform Visualizer */}
      <VoiceWaveVisualizer 
        isListening={isListening} 
        isSpeaking={isSpeaking} 
        interimText={interimTranscript} 
      />

      {/* Checklist Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="app-pill-accent px-3.5 py-1 text-[16px] font-black rounded-full border border-amber-400">
                पायरी ३ : कागदपत्रे तपासणी
              </span>
              <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300">
                {checkedCount} / {documents.length} तयार आहेत
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {selectedScheme?.name_mr}
            </h2>
          </div>

          {/* Action Buttons: Read All, Stop, Replay */}
          <div className="flex flex-wrap items-center gap-2">
            {isSpeaking ? (
              <button
                type="button"
                onClick={() => stopSpeaking({ userInitiated: true })}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm min-h-[48px] shadow-lg ring-4 ring-red-300 dark:ring-red-950 transition-all cursor-pointer animate-pulse"
                role="button"
                aria-label="आवाज थांबवा"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>आवाज थांबवा</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleReadAllAloud}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-civic-900 hover:bg-civic-800 text-white rounded-2xl font-bold text-sm min-h-[48px] transition-colors focus:ring-4 focus:ring-civic-400"
                  aria-label="सर्व कागदपत्रांची यादी मराठी आवाजात ऐका"
                >
                  <Volume2 className="w-5 h-5 text-saffron-400" />
                  <span>सर्व कागदपत्रे ऐका</span>
                </button>
                {wasStoppedByUser && lastSpoken && (
                  <button
                    type="button"
                    onClick={replayLastAudio}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 bg-saffron-600 hover:bg-saffron-700 text-white rounded-2xl font-bold text-xs min-h-[48px] shadow-sm transition-colors cursor-pointer"
                    role="button"
                    aria-label="पुन्हा ऐका"
                    title="शेवटचा आवाज पुन्हा ऐका"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>🔁 पुन्हा ऐका</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Interactive Documents Tickable List */}
        <div className="space-y-3 mt-6">
          {documents.map((doc, idx) => {
            const isChecked = !!checkedDocs[doc.id];

            return (
              <div
                key={doc.id || idx}
                onClick={() => toggleCheck(doc.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 min-h-[64px] ${
                  isChecked
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-saffron-400'
                }`}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleCheck(doc.id);
                  }
                }}
              >
                {/* Tick Checkbox */}
                <div className="mt-1 flex-shrink-0">
                  {isChecked ? (
                    <CheckSquare className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                  )}
                </div>

                {/* Document Name & Details */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {doc.name}
                    </span>
                    {doc.required ? (
                      <span className="px-2.5 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-200 text-[14px] font-black rounded-md border border-red-300">
                        आवश्यक (Mandatory)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-600 text-[#1F2937] dark:text-slate-100 text-[14px] font-bold rounded-md">
                        पर्यायी
                      </span>
                    )}
                  </div>

                  {doc.note && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      💡 {doc.note}
                    </p>
                  )}
                </div>

                {/* Per Document Listen Button */}
                <button
                  onClick={(e) => handleReadSingle(e, doc)}
                  className="p-2 text-saffron-600 hover:text-saffron-700 hover:bg-saffron-100 dark:hover:bg-slate-600 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label={`${doc.name} बद्दल माहिती ऐका`}
                  title="ऐका"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Trustworthy by Design Notice */}
        <div className="mt-6 p-3.5 bg-emerald-50 dark:bg-slate-900/60 rounded-2xl border-2 border-emerald-400 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-[14px]">
          <span className="flex items-center gap-1.5 font-black text-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>अधिकृत शासन निर्णयानुसार पडताळलेली कागदपत्रे सूची</span>
          </span>
          <span className="font-extrabold text-slate-800 dark:text-slate-300">
            शेवटची तपासणी: {selectedScheme?.last_verified_date}
          </span>
        </div>

        {/* Next Step / Form Apply CTA */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => setActiveScreen('eligibility')}
            className="text-[16px] font-bold text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5 text-civic-700 dark:text-civic-400" />
            <span>मागील पायरी: पात्रता तपासा</span>
          </button>
          
          <button
            onClick={() => setActiveScreen('form')}
            className="w-full sm:w-auto px-6 py-4 bg-saffron-600 hover:bg-saffron-700 text-white font-black text-lg rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 min-h-[58px]"
          >
            <span>पुढील पायरी ४: आवाजाने अर्ज भरा (Voice Apply)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* How to Apply & Guidance Accordion */}
      <div className="bg-slate-50 dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-civic-700 dark:text-civic-400" />
          <span>अर्ज कुठे व कसा करावा?</span>
        </h3>
        <p className="text-base text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-4">
          {selectedScheme?.how_to_apply_mr}
        </p>
        <a
          href={selectedScheme?.official_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[16px] font-bold text-[#1B2A5C] dark:text-amber-400 hover:underline min-h-[44px]"
        >
          <span>अधिकृत पोर्टलवर जा: {selectedScheme?.official_link}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

    </div>
  );
}
