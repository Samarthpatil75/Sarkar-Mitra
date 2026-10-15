import React from 'react';
import { Mic, Sparkles, ShieldCheck, HeartHandshake, HelpCircle, ArrowRight } from 'lucide-react';
import SchemeCard from '../components/SchemeCard';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function HomeScreen() {
  const { schemes, setSelectedScheme, setActiveScreen, t, lowBandwidth } = useApp();
  const { isListening, isSpeaking, toggleListening, interimTranscript, processInput } = useSpeech();

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
