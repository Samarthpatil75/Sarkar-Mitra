import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Mic, 
  Check, 
  X, 
  Download, 
  Trash2, 
  Sparkles, 
  Volume2, 
  AlertCircle,
  HelpCircle,
  Save
} from 'lucide-react';
import speechRecognizer from '../services/speechRecognition';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

const DIALECTS = [
  { id: 'konkan', name_mr: 'कोकण (मालवणी / आगरी)', name_en: 'Konkan' },
  { id: 'vidarbha', name_mr: 'विदर्भ (वऱ्हाडी बोली)', name_en: 'Vidarbha' },
  { id: 'marathwada', name_mr: 'मराठवाडा बोली', name_en: 'Marathwada' },
  { id: 'khandesh', name_mr: 'खान्देश (अहिराणी)', name_en: 'Khandesh' },
  { id: 'paschim_mh', name_mr: 'पश्चिम महाराष्ट्र / प्रमाण मराठी', name_en: 'Standard Marathi' }
];

const SAMPLE_SENTENCES = [
  'मला लाडकी बहीण योजनेचे पैसे कधी मिळतील?',
  'आमच्या वावरात दोन एकर जमीन हाय, पीएम किसान मिळेल का?',
  'दवाखान्यात पाच लाखांपर्यंत मोफत उपचार भेटतात का?',
  'नवीन रेशन कार्ड काढण्यासाठी काय कागदपत्रे लागतील?',
  'माझा आधार कार्ड मोबाईल नंबरशी लिंक हाय.'
];

export default function AccuracyTestScreen() {
  const { showToast } = useApp();
  const { isSpeaking, speak, stopSpeaking } = useSpeech();

  const [selectedDialect, setSelectedDialect] = useState('paschim_mh');
  const [expectedSentence, setExpectedSentence] = useState(SAMPLE_SENTENCES[0]);
  const [recognizedText, setRecognizedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedResult, setSelectedResult] = useState('correct'); // 'correct' | 'partial' | 'incorrect'
  const [testerNotes, setTesterNotes] = useState('');
  
  // Local storage benchmark history
  const [benchmarks, setBenchmarks] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bolu_ya_dialect_benchmarks');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Calculate simple word similarity score between expected and recognized
  const calculateMatchScore = (expected, recognized) => {
    if (!expected || !recognized) return 0;
    const expWords = expected.toLowerCase().split(/\s+/).filter(Boolean);
    const recWords = recognized.toLowerCase().split(/\s+/).filter(Boolean);
    if (expWords.length === 0) return 0;

    let matched = 0;
    expWords.forEach(w => {
      if (recWords.includes(w)) matched++;
    });
    return Math.round((matched / expWords.length) * 100);
  };

  const currentMatchScore = calculateMatchScore(expectedSentence, recognizedText);

  // Toggle recording for accuracy benchmark
  const handleToggleRecord = () => {
    if (isRecording) {
      speechRecognizer.stop();
      setIsRecording(false);
      return;
    }

    setRecognizedText('');
    setInterimText('');
    setIsRecording(true);

    speechRecognizer.start({
      onStart: () => {
        setIsRecording(true);
      },
      onResult: ({ interim, final }) => {
        setInterimText(interim);
        if (final) {
          setRecognizedText(final);
          setInterimText('');
          setIsRecording(false);
        }
      },
      onError: (err) => {
        setIsRecording(false);
        showToast('आवाज ओळख अयशस्वी: ' + err, 'error');
      },
      onEnd: (lastInterim) => {
        setIsRecording(false);
        if (lastInterim && !recognizedText) {
          setRecognizedText(lastInterim);
        }
      }
    });
  };

  // Save current benchmark test
  const handleSaveTest = () => {
    if (!recognizedText.trim()) {
      showToast('कृपया आधी वाक्य रेकॉर्ड करा.', 'warning');
      return;
    }

    const newEntry = {
      id: `bench-${Date.now()}`,
      timestamp: new Date().toISOString(),
      dialect_id: selectedDialect,
      dialect_name: DIALECTS.find(d => d.id === selectedDialect)?.name_mr || selectedDialect,
      expected: expectedSentence,
      recognized: recognizedText,
      rating: selectedResult,
      match_score: currentMatchScore,
      notes: testerNotes
    };

    const updated = [newEntry, ...benchmarks];
    setBenchmarks(updated);
    localStorage.setItem('bolu_ya_dialect_benchmarks', JSON.stringify(updated));

    showToast('चाचणी नोंद यशस्वी झाली!', 'success');
    setRecognizedText('');
    setTesterNotes('');
  };

  // Clear all benchmarks
  const handleClearAll = () => {
    if (window.confirm('सर्व चाचण्यांचा इतिहास नष्ट करायचा आहे का?')) {
      setBenchmarks([]);
      localStorage.removeItem('bolu_ya_dialect_benchmarks');
      showToast('इतिहास साफ करण्यात आला.', 'info');
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    if (benchmarks.length === 0) {
      showToast('डाऊनलोड करण्यासाठी कोणतीही चाचणी नोंद नाही.', 'warning');
      return;
    }

    const headers = ['Timestamp', 'Dialect', 'Expected_Sentence', 'Recognized_Speech', 'Rating', 'Word_Match_Score_Pct', 'Notes'];
    const rows = benchmarks.map(b => [
      `"${b.timestamp}"`,
      `"${b.dialect_name}"`,
      `"${(b.expected || '').replace(/"/g, '""')}"`,
      `"${(b.recognized || '').replace(/"/g, '""')}"`,
      `"${b.rating}"`,
      `"${b.match_score}%"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bolu_Ya_Dialect_Benchmark_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV फाईल डाऊनलोड झाली.', 'success');
  };

  // Aggregated Stats
  const totalTests = benchmarks.length;
  const correctCount = benchmarks.filter(b => b.rating === 'correct').length;
  const partialCount = benchmarks.filter(b => b.rating === 'partial').length;
  const accuracyPct = totalTests > 0 ? Math.round(((correctCount + (partialCount * 0.5)) / totalTests) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-2 pb-32 space-y-6">

      {/* Screen Title */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-saffron-600" />
            <span>मराठी बोलीभाषा अचूकता चाचणी (Dialect Benchmark)</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            विदर्भ, कोकण, मराठवाडा आणि खान्देशी लहेजांमध्ये आवाज ओळख क्षमता तपासा व निकाल CSV मध्ये एक्सपोर्ट करा.
          </p>
        </div>

        {totalTests > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm min-h-[48px] shadow-sm transition-transform active:scale-95 flex-shrink-0"
          >
            <Download className="w-5 h-5" />
            <span>CSV एक्सपोर्ट करा</span>
          </button>
        )}
      </div>

      {/* Benchmark Testing Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-2 border-saffron-300 dark:border-saffron-700 shadow-md space-y-5">
        
        {/* Step 1: Select Dialect */}
        <div>
          <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300 mb-2">
            १. चाचणीसाठी बोली / लहेजा निवडा:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DIALECTS.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDialect(d.id)}
                className={`p-3 rounded-2xl text-sm font-bold border-2 transition-all text-left min-h-[48px] ${
                  selectedDialect === d.id
                    ? 'bg-civic-900 text-white border-civic-900 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:border-saffron-400'
                }`}
              >
                {d.name_mr}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Target Expected Sentence */}
        <div>
          <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300 mb-2">
            २. बोलण्यासाठी अपेक्षित वाक्य (किंवा स्वतः टाईप करा):
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {SAMPLE_SENTENCES.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setExpectedSentence(s)}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-saffron-100 hover:text-saffron-800"
              >
                नमुना {idx + 1}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={expectedSentence}
            onChange={(e) => setExpectedSentence(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-saffron-500 rounded-2xl text-base font-bold text-slate-900 dark:text-white outline-none"
          />
        </div>

        {/* Step 3: Record Voice */}
        <div className="pt-2 text-center">
          <button
            onClick={handleToggleRecord}
            className={`px-8 py-4 rounded-full font-black text-xl transition-all shadow-lg flex items-center justify-center gap-3 mx-auto min-h-[64px] min-w-[240px] active:scale-95 ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-saffron-600 to-saffron-700 text-white hover:from-saffron-700 hover:to-saffron-800'
            }`}
          >
            <Mic className="w-7 h-7" />
            <span>{isRecording ? 'थांबवा (रेकॉर्डिंग चालू)' : 'वाक्य बोला (रेकॉर्ड करा)'}</span>
          </button>

          {interimText && (
            <p className="mt-3 text-base font-bold text-saffron-600 dark:text-saffron-400 animate-pulse">
              ऐकत आहे: "{interimText}"
            </p>
          )}
        </div>

        {/* Step 4: Comparison & Match Result */}
        {recognizedText && (
          <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 space-y-4 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">
                ब्राऊझरने ओळखलेला आवाज (Recognized Speech):
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                "{recognizedText}"
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                शब्द जुळणी (Word Match):
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-black ${
                currentMatchScore >= 80 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : currentMatchScore >= 50
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}>
                {currentMatchScore}%
              </span>
            </div>

            {/* Mark Result as Tester */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                निकाल चिन्हांकित करा:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedResult('correct')}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 min-h-[48px] border-2 ${
                    selectedResult === 'correct'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>अचूक (Correct)</span>
                </button>

                <button
                  onClick={() => setSelectedResult('partial')}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 min-h-[48px] border-2 ${
                    selectedResult === 'partial'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>अंशतः (Partial)</span>
                </button>

                <button
                  onClick={() => setSelectedResult('incorrect')}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 min-h-[48px] border-2 ${
                    selectedResult === 'incorrect'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>अयोग्य (Incorrect)</span>
                </button>
              </div>
            </div>

            {/* Optional Tester Notes */}
            <div>
              <input
                type="text"
                placeholder="काही विशेष निरीक्षण (उदा. वऱ्हाडी 'हाय' शब्द 'आहे' म्हणून ऐकला)..."
                value={testerNotes}
                onChange={(e) => setTesterNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>

            <button
              onClick={handleSaveTest}
              className="w-full py-3.5 bg-civic-900 hover:bg-civic-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 min-h-[48px] transition-colors"
            >
              <Save className="w-5 h-5 text-saffron-400" />
              <span>चाचणी नोंद जतन करा (Save Benchmark)</span>
            </button>
          </div>
        )}

      </div>

      {/* Aggregate Statistics Dashboard */}
      {totalTests > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              एकूण चाचणी आकडेवारी (Statistics)
            </h3>
            <button
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:underline flex items-center gap-1 font-bold min-h-[36px]"
            >
              <Trash2 className="w-4 h-4" />
              <span>इतिहास साफ करा</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border">
              <span className="text-xs font-bold text-slate-500">एकूण चाचण्या</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalTests}</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">अचूक (Correct)</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{correctCount}</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400">अंशतः (Partial)</span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{partialCount}</p>
            </div>
            <div className="p-4 bg-civic-50 dark:bg-civic-950/40 rounded-2xl border border-civic-200">
              <span className="text-xs font-bold text-civic-800 dark:text-civic-400">सरासरी अचूकता</span>
              <p className="text-2xl font-black text-civic-900 dark:text-civic-200">{accuracyPct}%</p>
            </div>
          </div>

          {/* Recent Tests Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="pb-2">बोलीभाषा</th>
                  <th className="pb-2">अपेक्षित वाक्य</th>
                  <th className="pb-2">ओळखलेला आवाज</th>
                  <th className="pb-2">निकाल</th>
                  <th className="pb-2">जुळणी</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {benchmarks.slice(0, 5).map(b => (
                  <tr key={b.id} className="text-slate-800 dark:text-slate-200">
                    <td className="py-2 font-bold whitespace-nowrap">{b.dialect_name}</td>
                    <td className="py-2 max-w-[150px] truncate">{b.expected}</td>
                    <td className="py-2 max-w-[150px] truncate">{b.recognized}</td>
                    <td className="py-2 font-black">
                      {b.rating === 'correct' && <span className="text-emerald-600">अचूक</span>}
                      {b.rating === 'partial' && <span className="text-amber-600">अंशतः</span>}
                      {b.rating === 'incorrect' && <span className="text-red-600">अयोग्य</span>}
                    </td>
                    <td className="py-2 font-mono">{b.match_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
