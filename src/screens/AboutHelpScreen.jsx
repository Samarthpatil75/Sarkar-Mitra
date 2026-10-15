import React from 'react';
import { 
  ShieldCheck, 
  PhoneCall, 
  Lock, 
  Calendar, 
  ExternalLink, 
  HelpCircle, 
  HeartHandshake, 
  Cpu, 
  Sparkles 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AboutHelpScreen() {
  const { schemes, officialNotice, t } = useApp();

  const helplines = [
    { title: 'महिला हेल्पलाईन (Women Helpline)', number: '181', desc: 'लाडकी बहीण व महिला समस्या' },
    { title: 'मुख्यमंत्री महा-हेल्पलाईन (CM Helpline)', number: '1800 120 8040', desc: 'सर्व शासकीय योजना तक्रारी व माहिती' },
    { title: 'आरोग्य मित्र हेल्पलाईन (MJPJAY / Ayushman)', number: '155388', desc: 'मोफत उपचार व रुग्णालये' },
    { title: 'किसान कॉल सेंटर (Kisan Helpline)', number: '1800 180 1551', desc: 'शेतकरी सन्मान निधी व कृषी साहाय्य' },
    { title: 'अन्न व नागरी पुरवठा (Ration Helpline)', number: '1800 22 4950', desc: 'रेशन कार्ड व धान्य वाटप' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 pb-32 space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-saffron-600 via-saffron-700 to-civic-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <HeartHandshake className="w-8 h-8 text-saffron-300" />
          <h2 className="text-2xl sm:text-3xl font-black">
            बोलू या (Bolu Ya) बद्दल
          </h2>
        </div>
        <p className="text-base sm:text-lg text-saffron-100 font-medium leading-relaxed">
          "बोला, सरकारी योजना समजून घ्या." — ग्रामीण व सर्वसामान्य नागरिकांसाठी, ज्येष्ठांसाठी आणि पहिल्यांदा स्मार्टफोन वापरणाऱ्या नागरिकांसाठी मराठी आवाज सहाय्यक.
        </p>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-emerald-400 dark:border-emerald-600 shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              गोपनीयता व डेटा सुरक्षा (Privacy Note)
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              नागरिकांचा विश्वास हेच आमचे प्राधान्य
            </p>
          </div>
        </div>

        <div className="space-y-2 text-slate-700 dark:text-slate-300 text-base leading-relaxed">
          <p>
            • <strong>कोणताही आधार किंवा वैयक्तिक आयडी साठवला जात नाही:</strong> आम्ही तुमचा आधार क्रमांक, ओटीपी किंवा बँक पासवर्ड कधीही विचारत नाही आणि सर्व्हरवर साठवत नाही.
          </p>
          <p>
            • <strong>केवळ ब्राउझर सत्रापुरता डेटा:</strong> तुम्ही फॉर्ममध्ये भरलेली माहिती फक्त तुमच्या फोनच्या तात्पुरत्या मेमरीमध्ये राहते. पेज बंद करताच ती नष्ट होते.
          </p>
          <p>
            • <strong>क्लायंट-साइड PDF निर्मिती:</strong> अर्जाचा सारांश पूर्णपणे तुमच्या ब्राऊझरमध्ये तयार होतो, कोणत्याही बाह्य सर्व्हरवर पाठवला जात नाही.
          </p>
        </div>
      </div>

      {/* Last Verified Scheme Dates Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6 text-saffron-600" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            शासकीय योजना पडताळणी तारीख (Last Verified)
          </h3>
        </div>

        <p className="text-xs text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900 mb-4 font-bold">
          ⚠️ {officialNotice}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <th className="pb-3 font-extrabold">योजनेचे नाव</th>
                <th className="pb-3 font-extrabold">शेवटची तपासणी</th>
                <th className="pb-3 font-extrabold">अधिकृत स्त्रोत</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {schemes.map((s) => (
                <tr key={s.id} className="text-slate-800 dark:text-slate-200">
                  <td className="py-3 font-bold">{s.name_mr}</td>
                  <td className="py-3 font-mono text-xs">{s.last_verified_date}</td>
                  <td className="py-3">
                    <a
                      href={s.official_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-civic-700 dark:text-civic-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>पोर्टल</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Citizen Helplines */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <PhoneCall className="w-6 h-6 text-civic-700 dark:text-civic-400" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            नागरिकांसाठी टोल-फ्री हेल्पलाईन क्रमांक
          </h3>
        </div>

        <div className="space-y-3">
          {helplines.map((h, i) => (
            <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white text-base">
                  {h.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {h.desc}
                </p>
              </div>
              <a
                href={`tel:${h.number.replace(/\s+/g, '')}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl flex items-center gap-1.5 min-h-[44px] flex-shrink-0"
                aria-label={`कॉल करा ${h.number}`}
              >
                <PhoneCall className="w-4 h-4" />
                <span>{h.number}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Developer & Extensibility Note */}
      <div className="p-5 bg-slate-100 dark:bg-slate-800/60 rounded-3xl border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 dark:text-slate-200">
          <Cpu className="w-4 h-4 text-saffron-600" />
          <span>तांत्रिक रचना (Extensibility Architecture):</span>
        </div>
        <p>
          'बोलू या' ॲपची रचना मॉड्यूलर आहे. सद्य डेमोमध्ये Web Speech API ('mr-IN') व स्थानिक नियम-इंजिन वापरले आहे. भविष्यात हे स्तर सहजपणे <strong>Bhashini ASR/TTS</strong>, <strong>Whisper</strong>, आणि <strong>Gemini / LLM RAG API</strong> द्वारे जोडण्यासाठी कोडमध्ये स्पष्ट हुक्स दिलेले आहेत.
        </p>
      </div>

    </div>
  );
}
