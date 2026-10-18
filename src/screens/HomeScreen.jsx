import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, ShieldCheck, HeartHandshake, HelpCircle, ArrowRight, Workflow, Volume2, PlayCircle } from 'lucide-react';
import SchemeCard from '../components/SchemeCard';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import { DEMO_PERSONAS } from '../data/demoPersonas';

export default function HomeScreen() {
  const { schemes, setSelectedScheme, setActiveScreen, t, lowBandwidth } = useApp();
  const { isListening, isSpeaking, toggleListening, interimTranscript, processInput } = useSpeech();

  const rotatingChips = [
    'लाडकी बहीण योजनेबद्दल सांगा',
    'मला कोणत्या योजना मिळू शकतात?',
    'कागदपत्रे कोणती लागतील?'
  ];

  const [currentChipIdx, setCurrentChipIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentChipIdx(prev => (prev + 1) % rotatingChips.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [rotatingChips.length]);

  const sampleVoicePrompts = [
    { label: 'लाडकी बहीण योजनेची माहिती द्या', query: 'लाडकी बहीण योजना माहिती' },
    { label: 'मी पीएम किसानसाठी पात्र आहे का?', query: 'पीएम किसान पात्रता' },
    { label: 'आयुष्यमान भारत हॉस्पिटल उपचार', query: 'आयुष्यमान भारत हॉस्पिटल' },
    { label: 'नवीन रेशन कार्ड कसे काढायचे?', query: 'रेशन कार्ड कसे काढायचे' }
  ];

  return (
    <div className="space-y-8 pb-24">

      {/* Hero Civic Banner */}
      <section className="text-center pt-4 sm:pt-6 pb-2 px-2 max-w-3xl mx-auto">
        
        {/* Language Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-saffron-100 dark:bg-saffron-950/60 text-saffron-900 dark:text-saffron-200 text-sm font-extrabold border border-saffron-300 dark:border-saffron-700 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-saffron-600 animate-pulse"></span>
          <span>भाषा: मराठी (मराठी-First Voice AI)</span>
        </div>

        {/* Civic Main Heading */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
          बोला, सरकारी योजना समजून घ्या.
        </h2>
        <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
          महाराष्ट्रातील नागरिक, माता-भगिनी, शेतकरी व ज्येष्ठांसाठी खास बोलून माहिती मिळवणारा आवाज सहाय्यक.
        </p>

        {/* Giant Mic Section for Home Hero */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div className="relative group">
            {/* Pulsing civic aura rings */}
            {!lowBandwidth && isListening && (
              <>
                <div className="absolute -inset-4 rounded-full bg-saffron-500 opacity-40 animate-ping"></div>
                <div className="absolute -inset-8 rounded-full bg-saffron-400 opacity-20 animate-pulse"></div>
              </>
            )}

            <button
              onClick={toggleListening}
              className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-transform active:scale-95 focus:outline-none focus:ring-8 ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 ring-8 ring-red-200 dark:ring-red-950'
                  : 'bg-gradient-to-br from-saffron-500 via-saffron-600 to-civic-900 text-white hover:scale-105 focus:ring-saffron-300 shadow-glow-saffron'
              }`}
              aria-label={isListening ? 'माईक थांबवा' : 'बोलण्यासाठी दाबा (मराठीत बोला)'}
            >
              <Mic className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-md" />
              <span className="text-xs sm:text-sm font-black tracking-wide uppercase px-1">
                {isListening ? 'थांबवा' : 'येथे दाबा'}
              </span>
            </button>
          </div>

          <p className="mt-4 text-base sm:text-lg font-extrabold text-saffron-800 dark:text-saffron-300">
            {isListening ? 'आम्ही ऐकत आहोत... तुमची शंका बोला' : '👆 वरील बटण दाबून मराठीत बोला'}
          </p>

          {/* Rotating "असे म्हणा" example chips under big mic button */}
          <div className="mt-5 w-full max-w-lg flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saffron-100 dark:bg-saffron-950/80 border border-saffron-300 dark:border-saffron-700 text-xs sm:text-sm font-extrabold text-saffron-900 dark:text-saffron-200 mb-2.5">
              <Sparkles className="w-4 h-4 text-saffron-600 animate-pulse" />
              <span>"असे म्हणा" (किंवा खालील पर्यायावर दाबा):</span>
            </div>

            {/* Featured Rotating Example Chip Button */}
            <button
              onClick={() => processInput(rotatingChips[currentChipIdx])}
              className="group w-full max-w-md py-3 px-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-saffron-400 dark:border-saffron-500 shadow-md hover:shadow-lg hover:border-saffron-500 text-left flex items-center justify-between gap-3 transition-all transform hover:scale-[1.02] active:scale-95"
              aria-label={`असे म्हणा: ${rotatingChips[currentChipIdx]}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xl">💬</span>
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  "{rotatingChips[currentChipIdx]}"
                </span>
              </div>
              <span className="px-3 py-1 rounded-xl bg-saffron-600 text-white text-xs font-black uppercase shrink-0 group-hover:bg-saffron-700">
                विचारा 👉
              </span>
            </button>

            {/* Small Quick Chips Row */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {rotatingChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentChipIdx(idx);
                    processInput(chip);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all text-left shadow-sm ${
                    idx === currentChipIdx
                      ? 'bg-saffron-100 dark:bg-saffron-950 text-saffron-900 dark:text-saffron-200 border-saffron-500 ring-2 ring-saffron-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-saffron-400'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Audio / Interim Waveform Visualizer */}
        <VoiceWaveVisualizer 
          isListening={isListening} 
          isSpeaking={isSpeaking} 
          interimText={interimTranscript} 
        />

        {/* Sample Voice Quick Chips */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-saffron-500" />
            <span>तुम्ही थेट असे विचारू शकता (किंवा खालील पर्यायांवर दाबा):</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sampleVoicePrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => processInput(item.query)}
                className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-saffron-500 dark:hover:border-saffron-400 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-saffron-600 dark:hover:text-saffron-400 shadow-sm transition-all text-left min-h-[48px]"
              >
                "{item.label}"
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* "डेमो पहा" Section - 3 One-Tap Persona Cards */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-r from-amber-500/10 via-saffron-500/10 to-amber-500/10 dark:from-amber-950/40 dark:to-slate-800 rounded-3xl p-5 sm:p-7 border-2 border-amber-300 dark:border-amber-700 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <span className="px-3 py-0.5 rounded-full bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs font-black uppercase">
                  ९० सेकंदांचे प्रात्यक्षिक
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                🎥 "डेमो पहा" (Watch Live Voice Demo)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                माईकची आवश्यकता नाही! खालील एका पात्रावर स्पर्श करा, ॲप आपोआप संपूर्ण प्रवास बोलून दाखवेल.
              </p>
            </div>
            <button
              onClick={() => setActiveScreen('demo')}
              className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-saffron-600 hover:from-amber-600 hover:to-saffron-700 text-slate-950 font-black text-sm rounded-2xl shadow-md flex items-center gap-2 min-h-[46px] transition-transform active:scale-95"
            >
              <PlayCircle className="w-5 h-5" />
              <span>सर्व डेमो पहा</span>
            </button>
          </div>

          {/* 3 One-Tap Persona Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {DEMO_PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => {
                  setActiveScreen('demo');
                }}
                className="p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 text-left shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl p-1.5 rounded-xl bg-amber-50 dark:bg-slate-700">{persona.avatar}</span>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {persona.name_mr}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{persona.role_mr}</span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 inline-block mb-1.5">
                    {persona.scheme_name_mr}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {persona.description_mr}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-black text-amber-700 dark:text-amber-400">
                  <span>प्रवास पहा (९० सेकंद)</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Core Pillars: Voice-first, End-to-End, Trustworthy by Design */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-br from-white via-saffron-50/40 to-civic-50/40 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-saffron-200 dark:border-slate-700 shadow-lg">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="px-3.5 py-1 rounded-full bg-saffron-500/10 text-saffron-800 dark:text-saffron-300 border border-saffron-300 dark:border-saffron-800 text-xs sm:text-sm font-black tracking-wide uppercase">
              ★ सरकार मित्रची ३ प्रमुख वैशिष्ट्ये ★
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              नागरिकांसाठी डिझाईन केलेले ३ प्रमुख खांब
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 font-medium">
              केवळ उत्तरे देणारे ॲप नाही — शोध, पात्रता, कागदपत्रे ते थेट अर्ज डाऊनलोडपर्यंत संपूर्ण प्रवास.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1: Voice-first, Marathi-first */}
            <div className="bg-white dark:bg-slate-800/95 rounded-2xl p-5 border-2 border-saffron-300 dark:border-saffron-700/60 shadow-md flex flex-col justify-between hover:shadow-xl transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-saffron-500 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-saffron-100 dark:bg-saffron-950 text-saffron-800 dark:text-saffron-300 text-xs font-black mb-2">
                  १. व्हॉईस-फर्स्ट, मराठी-फर्स्ट
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">
                  वाचन किंवा टायपिंगची गरज नाही
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  नागरिक थेट मराठीत बोलतात — बोलीभाषा (विदर्भ, कोकण, मराठवाडा, खान्देश) व कोड-मिक्स्ड भाषण (<span className="font-bold text-slate-800 dark:text-slate-200">"application status check kar"</span>) अचूक ओळखले जाते आणि साध्या मराठीत बोलून उत्तरे मिळतात.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-bold text-saffron-700 dark:text-saffron-400">
                  ✓ शून्य टायपिंग आवश्यक
                </span>
                <button
                  onClick={toggleListening}
                  className="text-xs font-extrabold text-saffron-600 dark:text-saffron-400 hover:underline flex items-center gap-1 min-h-[36px]"
                >
                  <span>आता बोला</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pillar 2: End-to-end journey in one place */}
            <div className="bg-white dark:bg-slate-800/95 rounded-2xl p-5 border-2 border-civic-300 dark:border-civic-700/60 shadow-md flex flex-col justify-between hover:shadow-xl transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-civic-800 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Workflow className="w-6 h-6 text-saffron-300" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-civic-100 dark:bg-civic-950 text-civic-800 dark:text-civic-300 text-xs font-black mb-2">
                  २. एकाच ठिकाणी पूर्ण प्रवास
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">
                  शोध ➔ पात्रता ➔ कागदपत्रे ➔ अर्ज
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  बहुतांश ॲप्स फक्त प्रश्नोत्तरे देतात. 'सरकार मित्र' नागरिकाला योग्य योजना निवडण्यापासून, ४ प्रश्नांत पात्रता तपासणे, कागदपत्रांची यादी देणे, आणि आवाजाने अर्ज भरून अधिकृत PDF देण्यापर्यंत सर्व काम एकाच ठिकाणी पूर्ण करते.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-bold text-civic-700 dark:text-civic-400">
                  ✓ ४-टप्प्यांची सलग गाईड
                </span>
                <button
                  onClick={() => {
                    if (schemes.length > 0) {
                      setSelectedScheme(schemes[0]);
                      setActiveScreen('eligibility');
                    }
                  }}
                  className="text-xs font-extrabold text-civic-700 dark:text-civic-400 hover:underline flex items-center gap-1 min-h-[36px]"
                >
                  <span>प्रवास सुरू करा</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pillar 3: Trustworthy by design */}
            <div className="bg-white dark:bg-slate-800/95 rounded-2xl p-5 border-2 border-emerald-300 dark:border-emerald-700/60 shadow-md flex flex-col justify-between hover:shadow-xl transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black mb-2">
                  ३. विश्वासार्ह शासकीय डिझाईन
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">
                  १००% नियम-आधारित, खोटे अंदाज नाही
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  पात्रता कोणत्याही AI अंदाजाशिवाय अधिकृत शासन निर्णयानुसार (GR) तपासली जाते. माहिती पडताळणी तारीख व अधिकृत लिंक दिली जाते. माहिती नसलेल्या प्रश्नांवर थाप न मारता <span className="font-bold text-slate-800 dark:text-slate-200">"अधिकृत संकेतस्थळ पाहा"</span> असा प्रामाणिक सल्ला दिला जातो.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  ✓ GR पडताळणी व सुरक्षितता
                </span>
                <button
                  onClick={() => setActiveScreen('about')}
                  className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 min-h-[36px]"
                >
                  <span>तारीख पहा</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Schemes Grid */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {t('popular_schemes')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              कोणत्याही योजनेची माहिती मिळवा, पात्रता तपासा किंवा आवाजाने अर्ज भरा
            </p>
          </div>
          <button
            onClick={() => setActiveScreen('conversation')}
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-civic-700 dark:text-civic-300 hover:underline min-h-[48px] px-2"
          >
            <span>संभाषण पहा</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Large Scheme Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {schemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      </section>

      {/* Trust & Privacy Civic Footer Banner */}
      <section className="max-w-4xl mx-auto px-4 mt-8">
        <div className="p-4 sm:p-5 bg-civic-50/70 dark:bg-slate-800/80 rounded-3xl border border-civic-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-civic-900 text-white flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-6 h-6 text-saffron-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
              नागरिकांसाठी सुरक्षित व मोफत सुविधा
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              {t('privacy_note')}
            </p>
          </div>
          <button
            onClick={() => setActiveScreen('about')}
            className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 min-h-[44px]"
          >
            अधिक माहिती
          </button>
        </div>
      </section>

    </div>
  );
}
