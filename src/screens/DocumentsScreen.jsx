import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Volume2, 
  FileCheck, 
  ArrowRight, 
  HelpCircle, 
  Building2, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function DocumentsScreen() {
  const { selectedScheme, setSelectedScheme, schemes, setActiveScreen } = useApp();
  const { speak } = useSpeech();

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
  const handleReadAllAloud = () => {
    if (!documents || documents.length === 0) return;
    const docNames = documents.map((d, i) => `${i + 1}. ${d.name}`).join('. ');
    const speechText = `${selectedScheme.name_mr} साठी लागणारी आवश्यक कागदपत्रे: ${docNames}. हे सर्व पुरावे तयार ठेवून तुम्ही अर्ज करू शकता.`;
    speak(speechText, { force: true });
  };

  // Read single document aloud
  const handleReadSingle = (e, doc) => {
    e.stopPropagation();
    const speechText = `${doc.name}. टीप: ${doc.note || 'मूळ प्रत व झेरॉक्स सोबत ठेवावी.'}`;
    speak(speechText, { force: true });
  };

  const checkedCount = Object.values(checkedDocs).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 pb-32 space-y-6">

      {/* Scheme Selector */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          योजना निवडा:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {schemes.map((s) => {
            const isSelected = selectedScheme?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSchemeChange(s)}
                className={`px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center min-h-[48px] flex items-center justify-center ${
                  isSelected
                    ? 'bg-saffron-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s.name_mr.split(' ')[0]} {s.name_mr.split(' ')[1] || ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Checklist Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 bg-saffron-100 dark:bg-saffron-950/60 text-saffron-800 dark:text-saffron-300 text-xs font-black rounded-full">
                कागदपत्रे तपासणी
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {checkedCount} / {documents.length} तयार आहेत
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {selectedScheme?.name_mr}
            </h2>
          </div>

          {/* Read All Button */}
          <button
            onClick={handleReadAllAloud}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-civic-900 hover:bg-civic-800 text-white rounded-2xl font-bold text-sm min-h-[48px] transition-colors focus:ring-4 focus:ring-civic-400"
            aria-label="सर्व कागदपत्रांची यादी मराठी आवाजात ऐका"
          >
            <Volume2 className="w-5 h-5 text-saffron-400" />
            <span>सर्व कागदपत्रे ऐका</span>
          </button>
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
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-xs font-extrabold rounded-md">
                        आवश्यक (Mandatory)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-md">
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

        {/* Next Step / Form Apply CTA */}
        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            कागदपत्रे तयार असल्यास तुम्ही आता आवाजाने थेट अर्ज भरू शकता.
          </div>
          <button
            onClick={() => setActiveScreen('form')}
            className="w-full sm:w-auto px-6 py-3.5 bg-saffron-600 hover:bg-saffron-700 text-white font-black text-base rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 min-h-[52px]"
          >
            <span>आवाजाने अर्ज भरा</span>
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
          className="inline-flex items-center gap-2 text-sm font-bold text-saffron-700 dark:text-saffron-400 hover:underline min-h-[44px]"
        >
          <span>अधिकृत पोर्टलवर जा: {selectedScheme?.official_link}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

    </div>
  );
}
