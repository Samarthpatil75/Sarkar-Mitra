import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Volume2, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function EligibilityScreen() {
  const { 
    selectedScheme, 
    setSelectedScheme, 
    schemes, 
    setActiveScreen, 
    t, 
    lowBandwidth 
  } = useApp();

  const { 
    isListening, 
    isSpeaking, 
    speak, 
    interimTranscript, 
    registerVoiceHandler 
  } = useSpeech();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null); // null | { status: 'eligible'|'not_eligible'|'inconclusive', reasons: [] }
  const [numberInputValue, setNumberInputValue] = useState('');

  const questions = selectedScheme?.eligibility_questions || [];
  const currentQuestion = questions[currentStep];

  // Reset when scheme changes
  const handleSchemeChange = (scheme) => {
    setSelectedScheme(scheme);
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    setNumberInputValue('');
  };

  // Speak question prompt whenever step advances
  useEffect(() => {
    if (!result && currentQuestion) {
      const promptToSpeak = currentQuestion.spoken_prompt_mr || currentQuestion.question_mr;
      speak(promptToSpeak);
    }
  }, [currentStep, selectedScheme, result, speak, currentQuestion]);

  // Evaluate rule-based logic from schemes.json
  const evaluateEligibility = useCallback((finalAnswers) => {
    const failedRules = [];
    let hasInconclusive = false;

    questions.forEach((q) => {
      const val = finalAnswers[q.field];
      
      if (q.type === 'boolean') {
        if (q.id === 'gender' && val !== true) failedRules.push(q.fail_reason_mr);
        if (q.id === 'maharashtra_resident' && val !== true) failedRules.push(q.fail_reason_mr);
        if (q.id === 'resident' && val !== true) failedRules.push(q.fail_reason_mr);
        if (q.id === 'residence' && val !== true) failedRules.push(q.fail_reason_mr);
        if (q.id === 'govt_job_or_tax' && val === true) failedRules.push(q.fail_reason_mr);
        if (q.id === 'govt_job' && val === true) failedRules.push(q.fail_reason_mr);
        if (q.id === 'income_tax' && val === true) failedRules.push(q.fail_reason_mr);
        if (q.id === 'is_farmer' && val !== true) failedRules.push(q.fail_reason_mr);
        if (q.id === 'existing_card' && val !== true) failedRules.push(q.fail_reason_mr);
      } else if (q.type === 'number') {
        const num = Number(val);
        if (q.id === 'age') {
          if (isNaN(num) || num < 21 || num > 65) {
            failedRules.push(q.fail_reason_mr);
          }
        }
      } else if (q.type === 'select') {
        if (q.id === 'annual_income') {
          if (val === 'above_2_5') failedRules.push(q.fail_reason_mr);
          if (val === 'has_ration_card') {
            // valid under exemption, but note verification
          }
        }
        if (q.id === 'ekyc_status' && val === 'pending') {
          hasInconclusive = true;
        }
      }
    });

    if (failedRules.length > 0) {
      const res = {
        status: 'not_eligible',
        reasons: failedRules,
        summary_mr: 'तुम्ही दिलेल्या माहितीनुसार तुम्ही सध्या या योजनेच्या अटी पूर्ण करत नाही.'
      };
      setResult(res);
      speak(`${res.summary_mr}. कारण: ${failedRules.join('. ')}`);
    } else if (hasInconclusive) {
      const res = {
        status: 'inconclusive',
        reasons: ['काही कागदपत्रांची अथवा ई-केवायसीची खात्री करणे आवश्यक आहे.'],
        summary_mr: 'तुम्ही प्राथमिकदृष्ट्या पात्र वाटता, परंतु आधार ई-केवायसी किंवा रेशन कार्डची प्रत्यक्ष पडताळणी आवश्यक आहे.'
      };
      setResult(res);
      speak(res.summary_mr);
    } else {
      const res = {
        status: 'eligible',
        reasons: [],
        summary_mr: `अभिनंदन! तुम्ही ${selectedScheme.name_mr} साठी पात्र आहात. आता तुम्ही आवाजाने थेट अर्ज भरू शकता.`
      };
      setResult(res);
      speak(res.summary_mr);

      // Trigger celebration confetti
      if (!lowBandwidth && typeof confetti === 'function') {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          console.warn('Confetti error:', e);
        }
      }
    }
  }, [questions, selectedScheme, speak, lowBandwidth]);

  // Answer handler
  const handleAnswer = useCallback((value) => {
    const updated = {
      ...answers,
      [currentQuestion.field]: value
    };
    setAnswers(updated);
    setNumberInputValue('');

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      evaluateEligibility(updated);
    }
  }, [answers, currentQuestion, currentStep, questions.length, evaluateEligibility]);

  // Listen to spoken answers (e.g. "होय", "नाही", "पंचवीस", "28")
  useEffect(() => {
    if (result || !currentQuestion) return;

    const unregister = registerVoiceHandler((speechText) => {
      const norm = speechText.toLowerCase().trim();

      if (currentQuestion.type === 'boolean') {
        if (norm.includes('हो') || norm.includes('होय') || norm.includes('yes') || norm.includes('आहे')) {
          handleAnswer(true);
          return true;
        }
        if (norm.includes('नाही') || norm.includes('नो') || norm.includes('no') || norm.includes('ना')) {
          handleAnswer(false);
          return true;
        }
      }

      if (currentQuestion.type === 'number') {
        // Extract numbers from Marathi/English speech
        const match = norm.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          handleAnswer(num);
          return true;
        }
      }

      if (currentQuestion.type === 'select') {
        if (currentQuestion.options) {
          for (const opt of currentQuestion.options) {
            if (norm.includes(opt.label_mr.toLowerCase()) || norm.includes(opt.value)) {
              handleAnswer(opt.value);
              return true;
            }
          }
        }
      }

      return false; // let global processor handle if not matched
    });

    return () => unregister();
  }, [currentQuestion, result, handleAnswer, registerVoiceHandler]);

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    setNumberInputValue('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 pb-32 space-y-6">

      {/* Scheme Selector Pills */}
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

      {/* Live Audio / Interim Waveform Visualizer */}
      <VoiceWaveVisualizer 
        isListening={isListening} 
        isSpeaking={isSpeaking} 
        interimText={interimTranscript} 
      />

      {/* Wizard Question Card */}
      {!result && currentQuestion && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-2 border-saffron-300 dark:border-saffron-600 shadow-lg animate-fadeIn">
          
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm font-extrabold text-saffron-700 dark:text-saffron-400 bg-saffron-50 dark:bg-saffron-950/60 px-3 py-1 rounded-full border border-saffron-200">
              प्रश्न {currentStep + 1} / {questions.length}
            </span>
            <button
              onClick={() => speak(currentQuestion.spoken_prompt_mr || currentQuestion.question_mr, { force: true })}
              className="p-2 text-saffron-600 hover:text-saffron-700 hover:bg-saffron-50 dark:hover:bg-slate-700 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label="हा प्रश्न पुन्हा ऐका"
              title="प्रश्न ऐका"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Question Text */}
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6 leading-snug">
            {currentQuestion.question_mr}
          </h3>

          {/* Options / Input Form */}
          <div className="space-y-3">
            {currentQuestion.type === 'boolean' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleAnswer(true)}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xl min-h-[58px] shadow-sm transition-transform active:scale-95 focus:ring-4 focus:ring-emerald-300 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span>होय (Yes)</span>
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="px-6 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-2xl font-black text-xl min-h-[58px] transition-transform active:scale-95 focus:ring-4 focus:ring-slate-400 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-6 h-6" />
                  <span>नाही (No)</span>
                </button>
              </div>
            )}

            {currentQuestion.type === 'number' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={numberInputValue}
                    onChange={(e) => setNumberInputValue(e.target.value)}
                    placeholder={currentQuestion.placeholder_mr || 'आकडा भरा (उदा. 35)'}
                    className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-saffron-500 rounded-2xl text-2xl font-black text-slate-900 dark:text-white outline-none min-h-[58px]"
                  />
                  <button
                    onClick={() => {
                      if (numberInputValue) handleAnswer(Number(numberInputValue));
                    }}
                    disabled={!numberInputValue}
                    className="px-6 py-4 bg-saffron-600 hover:bg-saffron-700 disabled:opacity-50 text-white rounded-2xl font-black text-lg min-h-[58px]"
                  >
                    पुढे जा
                  </button>
                </div>

                {/* Common age quick chips */}
                {currentQuestion.id === 'age' && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold py-1">
                      सामान्य वय निवडा:
                    </span>
                    {[22, 28, 35, 42, 50, 60].map((ageVal) => (
                      <button
                        key={ageVal}
                        onClick={() => handleAnswer(ageVal)}
                        className="px-4 py-2 bg-slate-100 hover:bg-saffron-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl text-base min-h-[44px]"
                      >
                        {ageVal} वर्षे
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentQuestion.type === 'select' && currentQuestion.options && (
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt.value)}
                    className="w-full text-left px-5 py-4 bg-slate-50 hover:bg-saffron-50 dark:bg-slate-700/70 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-saffron-500 rounded-2xl font-bold text-lg text-slate-900 dark:text-white min-h-[56px] transition-all flex items-center justify-between"
                  >
                    <span>{opt.label_mr}</span>
                    <ArrowRight className="w-5 h-5 text-saffron-600" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
            <span>🗣️ तुम्ही थेट माईकवर उत्तर बोलू शकता.</span>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="text-civic-700 dark:text-civic-400 font-bold hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> मागील प्रश्न
              </button>
            )}
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div 
          className={`rounded-3xl p-6 sm:p-8 border-4 shadow-xl animate-fadeIn ${
            result.status === 'eligible'
              ? 'bg-emerald-50/90 dark:bg-slate-800 border-emerald-500 text-emerald-950 dark:text-emerald-100'
              : result.status === 'not_eligible'
              ? 'bg-red-50/90 dark:bg-slate-800 border-red-500 text-red-950 dark:text-red-100'
              : 'bg-amber-50/90 dark:bg-slate-800 border-amber-500 text-amber-950 dark:text-amber-100'
          }`}
        >
          {/* Status Header */}
          <div className="flex items-center gap-3 mb-4">
            {result.status === 'eligible' && (
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            )}
            {result.status === 'not_eligible' && (
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0">
                <XCircle className="w-9 h-9" />
              </div>
            )}
            {result.status === 'inconclusive' && (
              <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-9 h-9" />
              </div>
            )}

            <div>
              <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                पात्रता तपासणी निकाल
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">
                {result.status === 'eligible' && 'पात्र (Eligible)'}
                {result.status === 'not_eligible' && 'पात्र नाही (Not Eligible)'}
                {result.status === 'inconclusive' && 'खात्री आवश्यक (Inconclusive)'}
              </h3>
            </div>
          </div>

          {/* Scheme Name */}
          <div className="p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl mb-4 font-bold text-sm">
            योजना: {selectedScheme?.name_mr}
          </div>

          {/* Reason in simple Marathi */}
          <p className="text-lg sm:text-xl font-bold leading-relaxed mb-4">
            {result.summary_mr}
          </p>

          {/* Specific reasons list */}
          {result.reasons && result.reasons.length > 0 && (
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-red-200 dark:border-red-900/60 mb-6 space-y-2">
              <span className="text-xs font-black uppercase text-red-600 dark:text-red-400">
                तपशीलवार कारणे:
              </span>
              {result.reasons.map((r, i) => (
                <p key={i} className="text-sm font-semibold flex items-start gap-2">
                  <span className="text-red-500 font-black">•</span>
                  <span>{r}</span>
                </p>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {result.status === 'eligible' && (
              <button
                onClick={() => setActiveScreen('form')}
                className="w-full py-4 px-6 bg-saffron-600 hover:bg-saffron-700 text-white font-black text-xl rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 min-h-[58px]"
              >
                <FileCheck className="w-6 h-6" />
                <span>आवाजाने अर्ज भरा (Fill Form)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => speak(result.summary_mr, { force: true })}
                className="py-3 px-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Volume2 className="w-5 h-5 text-saffron-600" />
                <span>निकाल ऐका</span>
              </button>
              <button
                onClick={handleRestart}
                className="py-3 px-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-2 min-h-[48px]"
              >
                <RotateCcw className="w-5 h-5 text-civic-600" />
                <span>पुन्हा तपासा</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
