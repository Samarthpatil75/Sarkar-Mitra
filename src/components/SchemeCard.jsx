import React from 'react';
import { CheckCircle2, FileText, Send, Volume2, ShieldCheck, ExternalLink, ArrowRight, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function SchemeCard({ scheme, onSelectAction }) {
  const { setSelectedScheme, setActiveScreen, t } = useApp();
  const { speak, stopSpeaking, isSpeaking, currentId } = useSpeech();

  const handleAction = (screenId) => {
    stopSpeaking();
    setSelectedScheme(scheme);
    setActiveScreen(screenId);
    if (onSelectAction) onSelectAction(screenId, scheme);
  };

  const handleReadAloud = (e) => {
    e.stopPropagation();
    const speechText = `${scheme.name_mr}. ${scheme.short_description_mr}. मुख्य लाभ: ${scheme.benefit_summary_mr}. अधिक माहितीसाठी पात्रता तपासा किंवा अर्ज करा बटण दाबा.`;
    speak(speechText, { id: scheme.id, force: true });
  };

  return (
    <article 
      className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-700 hover:border-saffron-500 dark:hover:border-saffron-400 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
      aria-labelledby={`scheme-title-${scheme.id}`}
    >
      <div>
        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="px-3.5 py-1 bg-blue-100 dark:bg-blue-950 text-[#1B2A5C] dark:text-blue-200 text-[16px] font-black rounded-full border-2 border-blue-400">
            {scheme.category_mr}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-black text-emerald-950 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full border-2 border-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>सत्यापित {scheme.last_verified_date}</span>
            </span>
            {isSpeaking && currentId === scheme.id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stopSpeaking({ userInitiated: true });
                }}
                className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors shadow-sm animate-pulse focus:ring-2 focus:ring-red-400 cursor-pointer"
                aria-label="आवाज थांबवा"
                title="आवाज थांबवा"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReadAloud}
                className="p-2 text-saffron-600 hover:text-saffron-700 hover:bg-saffron-50 dark:hover:bg-slate-700 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors focus:ring-2 focus:ring-saffron-400"
                aria-label={`${scheme.name_mr} बद्दल माहिती आवाजात ऐका`}
                title="माहिती ऐका"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scheme Title */}
        <h3 
          id={`scheme-title-${scheme.id}`}
          className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition-colors leading-snug"
        >
          {scheme.name_mr}
        </h3>
        <p className="text-[16px] text-slate-700 dark:text-slate-300 font-bold mb-3">
          {scheme.name_en}
        </p>

        {/* Short description in simple Marathi */}
        <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 mb-4 leading-relaxed font-medium">
          {scheme.short_description_mr}
        </p>

        {/* Key Benefit Highlight Box */}
        <div className="p-4 app-highlight-box rounded-2xl mb-5 shadow-xs">
          <span className="text-[16px] font-black text-[#1B2A5C] dark:text-amber-300 block mb-1">
            शासकीय लाभ:
          </span>
          <p className="text-[16px] sm:text-[18px] font-extrabold text-[#1F2937] dark:text-white leading-relaxed">
            {scheme.benefit_summary_mr}
          </p>
        </div>
      </div>

      {/* Action Buttons: Min 48px tap targets */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
        <div className="grid grid-cols-2 gap-2">
          {/* Check Eligibility */}
          <button
            onClick={() => handleAction('eligibility')}
            className="flex items-center justify-center gap-1.5 px-3 py-3 bg-civic-900 hover:bg-civic-800 text-white rounded-2xl font-black text-[16px] min-h-[48px] transition-colors focus:ring-4 focus:ring-civic-400"
            aria-label={`${scheme.name_mr} साठी पात्रता तपासा`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>पात्रता तपासा</span>
          </button>

          {/* View Documents */}
          <button
            onClick={() => handleAction('documents')}
            className="flex items-center justify-center gap-1.5 px-3 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-2xl font-black text-[16px] min-h-[48px] transition-colors focus:ring-4 focus:ring-slate-400 border border-slate-300 dark:border-slate-600"
            aria-label={`${scheme.name_mr} साठी आवश्यक कागदपत्रे पहा`}
          >
            <FileText className="w-5 h-5 text-saffron-600 dark:text-saffron-400 flex-shrink-0" />
            <span>कागदपत्रे</span>
          </button>
        </div>

        {/* Voice Form Fill Button */}
        <button
          onClick={() => handleAction('form')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-700 hover:to-saffron-800 text-white rounded-2xl font-black text-[16px] min-h-[48px] shadow-sm transition-all focus:ring-4 focus:ring-saffron-300 group/btn"
          aria-label={`${scheme.name_mr} चा आवाजाने अर्ज भरा`}
        >
          <span>आवाजाने अर्ज भरा</span>
          <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </article>
  );
}
