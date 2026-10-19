import React, { useEffect, useCallback } from 'react';
import { 
  Building2, 
  ExternalLink, 
  FileCheck2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Download, 
  Printer, 
  RotateCcw, 
  Volume2, 
  ShieldCheck, 
  Calendar, 
  FileText,
  ChevronRight,
  Globe,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import { stripVerifyTags, formatAfterSubmitLines } from '../utils/sanitize';

export default function WhatNextView({ 
  onBackToSummary, 
  onDownloadAgain, 
  onRestartForm 
}) {
  const { selectedScheme, setActiveScreen, showToast } = useApp();
  const { speak, stopSpeaking } = useSpeech();

  // Strip all internal [VERIFY] tags so citizen NEVER sees or hears "VERIFY"
  const cleanOffice = stripVerifyTags(selectedScheme?.submit_where_mr || 'जवळचे सेतू केंद्र किंवा शासकीय कार्यालय');
  const cleanAfterSubmitSteps = formatAfterSubmitLines(selectedScheme?.after_submit_mr || '');
  const documents = selectedScheme?.documents_mr || [];
  const officialLink = selectedScheme?.official_link || '#';
  const lastVerifiedDate = selectedScheme?.last_verified_date || '२०२६-०९-१५';

  // Welcoming guidance spoken on entering What Next screen
  useEffect(() => {
    const welcomeSpeech = `अभिनंदन! तुमची पूर्व-अर्ज सारांश PDF तयार झाली आहे. आता पुढे काय करायचे, अर्ज कुठे सादर करायचा आणि कोणती कागदपत्रे सोबत न्यायची याची माहिती समोर दिली आहे.`;
    speak(welcomeSpeech);
  }, [speak]);

  // Read full What Next information aloud in Marathi
  const handleReadAllAloud = useCallback(() => {
    stopSpeaking();
    const docNames = documents.map((d, i) => `${i + 1}. ${d.name}`).join('. ');
    const stepsSpeech = cleanAfterSubmitSteps.join('. ');
    
    const fullText = `आता पुढे काय करावे याचे संपूर्ण मार्गदर्शन: ` +
      `१. अर्ज कुठे सादर करावा: ${cleanOffice}. ` +
      `२. सोबत नेण्याची कागदपत्रे: ${docNames}. ` +
      `३. अर्ज सादर केल्यानंतर: ${stepsSpeech}. ` +
      `अधिकृत ऑनलाईन संकेतस्थळ आहे: ${officialLink}.`;

    speak(fullText, { force: true });
  }, [cleanOffice, cleanAfterSubmitSteps, documents, officialLink, speak, stopSpeaking]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Celebration & Guidance Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-civic-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-400/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>पायरी ४: अंतिम मार्गदर्शन • आता पुढे काय?</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
              आता पुढे काय करायचे? (What Next?)
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
              तुमची <strong className="text-white underline decoration-amber-400">पूर्व-अर्ज सारांश PDF</strong> तयार झाली आहे. प्रत्यक्ष लाभ मिळवण्यासाठी खालील प्रमाणे अधिकृत पोर्टलवर किंवा प्रत्यक्ष कार्यालयात अर्ज सादर करा.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReadAllAloud}
            className="self-start sm:self-auto px-4 py-3 bg-white text-slate-900 hover:bg-emerald-50 font-black text-sm rounded-2xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer min-h-[48px]"
            title="सर्व मार्गदर्शन मोठ्याने ऐका"
            aria-label="सर्व माहिती ऐका"
          >
            <Volume2 className="w-5 h-5 text-emerald-600" />
            <span>सर्व माहिती ऐका</span>
          </button>
        </div>
      </div>

      {/* Grid: 1. Official Portal Link + 2. Which Office to Visit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Official Portal Link */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                शासकीय संकेतस्थळ (Official Portal)
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                अधिकृत ऑनलाईन पोर्टल
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              या योजनेसाठी ऑनलाईन अर्ज किंवा स्थिती तपासण्यासाठी महाराष्ट्र शासनाच्या खालील अधिकृत संकेतस्थळाला भेट द्या:
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 break-all text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              {officialLink}
            </div>
          </div>

          <a
            href={officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors min-h-[48px]"
          >
            <span>अधिकृत पोर्टल उघडा (Open Portal)</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Card 2: Which Office to Visit */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-saffron-50 dark:bg-saffron-950/60 text-saffron-600 dark:text-saffron-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-saffron-600 dark:text-saffron-400 uppercase tracking-wider">
                प्रत्यक्ष अर्ज केंद्र (Physical Center)
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                कोणत्या कार्यालयात जायचे?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              जर ऑनलाईन अर्ज करणे शक्य नसेल किंवा प्रत्यक्ष मदत हवी असल्यास खालील ठिकाणी भेट द्या:
            </p>
            <div className="p-3.5 bg-saffron-50/80 dark:bg-saffron-950/40 rounded-xl border border-saffron-300 dark:border-saffron-800 text-sm font-extrabold text-saffron-950 dark:text-saffron-200 leading-relaxed">
              📍 {cleanOffice}
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>💡 सोबत पूर्व-अर्ज सारांश PDF ची प्रिंट प्रत अवश्य घेऊन जा.</span>
          </div>
        </div>

      </div>

      {/* Card 3: Documents to Carry (From Checklist) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                सोबत नेण्याची आवश्यक कागदपत्रे (Documents to Carry)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                शासकीय कार्यालयात किंवा केंद्रावर जाताना खालील कागदपत्रे तयार ठेवा:
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {documents.map((doc, idx) => (
            <div 
              key={idx}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                ✓
              </div>
              <div className="flex-1">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                  {doc.name}
                </span>
                {doc.note && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                    टीप: {doc.note}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-200">
          ⚠️ महत्त्वाची सूचना: सर्व कागदपत्रांची मूळ प्रत (Originals) आणि किमान २ स्व-साक्षांकित (Self-attested) झेरॉक्स प्रती सोबत ठेवाव्यात.
        </div>
      </div>

      {/* Card 4: Three-line "अर्ज सादर केल्यानंतर" Explanation */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              अर्ज सादर केल्यानंतर काय होते? (३ महत्त्वाचे टप्पे)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              अधिकृत अर्ज जमा केल्यानंतर पुढील प्रक्रिया अशा प्रकारे पार पडते:
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {cleanAfterSubmitSteps.length > 0 ? (
            cleanAfterSubmitSteps.map((stepText, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-purple-50/30 dark:from-slate-900/60 dark:to-purple-950/20 border border-slate-200 dark:border-slate-700 flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-400 block uppercase tracking-wider mb-0.5">
                    टप्पा {idx + 1}
                  </span>
                  <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-relaxed">
                    {stepText.replace(/^[१२३४५\d]+[\.\-\s]*/, '')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              अर्ज सादर केल्यानंतर पावती मिळवावी आणि छाननीनंतर लाभ दिला जातो.
            </p>
          )}
        </div>
      </div>

      {/* Card 5: Last Verified Date & Non-Official Disclaimer */}
      <div className="p-5 bg-red-50 dark:bg-red-950/40 rounded-3xl border-2 border-red-300 dark:border-red-800 space-y-3">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-black text-sm sm:text-base">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>अस्वीकरण व पडताळणी नोंद (Disclaimer):</span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-red-900 dark:text-red-200 leading-relaxed">
          ही सरकार मित्रने तयार केलेली पूर्व-अर्ज सारांश पत्रिका आहे. हा अधिकृत शासकीय दस्तऐवज नाही. कृपया अधिकृत पोर्टल किंवा कार्यालयात अर्ज सादर करा.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-red-200 dark:border-red-800/80 text-xs text-red-800 dark:text-red-300 font-semibold">
          <span>
            मसुदा संदर्भ नोंद: <strong className="font-mono text-red-950 dark:text-red-100">SM-DRAFT</strong> (Draft, not a government registration number.)
          </span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>माहिती पडताळणी दिनांक: {lastVerifiedDate}</span>
          </span>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onBackToSummary}
          className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>भरलेला अर्ज सारांश पहा</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onDownloadAgain}
            className="flex-1 sm:flex-none px-5 py-3.5 bg-saffron-600 hover:bg-saffron-700 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors min-h-[48px]"
          >
            <Download className="w-4 h-4" />
            <span>PDF पुन्हा डाउनलोड करा</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 min-h-[48px]"
          >
            <Printer className="w-4 h-4" />
            <span>प्रिंट काढा</span>
          </button>
          <button
            onClick={() => setActiveScreen('home')}
            className="w-full sm:w-auto px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl flex items-center justify-center gap-1.5 min-h-[48px]"
          >
            <span>मुख्य पान</span>
          </button>
        </div>
      </div>

    </div>
  );
}
