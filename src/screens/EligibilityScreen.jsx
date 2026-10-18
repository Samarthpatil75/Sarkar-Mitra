import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FileCheck,
  FileText,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import CitizenJourneyStepper from '../components/CitizenJourneyStepper';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import { 
  isYesIntent, 
  isNoIntent, 
  extractNumberFromMarathi, 
  isPreviousOrBackIntent,
  isCancelOrBackIntent,
  normalizeMarathiSpeech 
} from '../services/marathiVoiceMatcher';

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
    registerVoiceHandler,
    isSpeechSupported,
    micStatus,
    startListening 
  } = useSpeech();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null); // null | { status: 'eligible'|'not_eligible'|'inconclusive', reasons: [] }
  const [numberInputValue, setNumberInputValue] = useState('');
  const [feedbackHint, setFeedbackHint] = useState(null);

  const questions = selectedScheme?.eligibility_questions || [];
  const currentQuestion = questions[currentStep];
  const currentQuestionRef = useRef(currentQuestion);
  currentQuestionRef.current = currentQuestion;

  // Reset when scheme changes
  const handleSchemeChange = (scheme) => {
    setSelectedScheme(scheme);
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    setNumberInputValue('');
    setFeedbackHint(null);
  };

  // Speak question prompt whenever step advances
  useEffect(() => {
    if (!result && currentQuestion) {
      const promptToSpeak = currentQuestion.spoken_prompt_mr || currentQuestion.question_mr;
      speak(promptToSpeak);
      setFeedbackHint(null);
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
        summary_mr: `अभिनंदन! तुम्ही ${selectedScheme.name_mr} साठी पात्र आहात. आता पुढील पायरी म्हणजे आवश्यक कागदपत्रे तपासणे.`
      };
      setResult(res);
      speak(`${res.summary_mr} कागदपत्रे पाहण्यासाठी "कागदपत्रे" म्हणा, किंवा थेट अर्ज भरण्यासाठी "अर्ज भरा" म्हणा.`);

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
    const q = currentQuestionRef.current;
    if (!q) return;

    const updated = {
      ...answers,
      [q.field]: value
    };
    setAnswers(updated);
    setNumberInputValue('');
    setFeedbackHint(null);

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      evaluateEligibility(updated);
    }
  }, [answers, currentStep, questions.length, evaluateEligibility]);

  // Go back to the previous eligibility question
  const handleGoBack = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setNumberInputValue('');
      setFeedbackHint({
        text: 'मागील प्रश्नावर परत आलो आहोत.',
        type: 'info'
      });
      const prevQ = questions[prevStep];
      speak(`मागील प्रश्नावर परत आलो आहोत: ${prevQ.spoken_prompt_mr || prevQ.question_mr}`);
    }
  }, [currentStep, questions, speak]);

  // Listen to spoken answers (with high accuracy & zero out-of-scope leaks)
  useEffect(() => {
    const unregister = registerVoiceHandler((speechText) => {
      const raw = speechText.trim();
      if (!raw) return true;

      // 1. Handle go back to previous question
      if (isPreviousOrBackIntent(raw)) {
        if (currentStep > 0 && !result) {
          handleGoBack();
          return true;
        }
      }

      // 2. Handle cancel / exit to home
      const normRaw = normalizeMarathiSpeech(raw);
      if (['रद्द करा', 'कॅन्सल करा', 'कॅन्सल', 'थांबवा', 'मुख्य पान', 'होम', 'exit', 'quit'].some(k => normRaw.includes(k))) {
        speak('पात्रता तपासणी थांबवली आहे. मुख्य पानावर जात आहोत.');
        setActiveScreen('home');
        return true;
      }

      // If on result card, allow natural spoken navigation
      if (result) {
        const norm = raw.toLowerCase();
        if (norm.includes('कागद') || norm.includes('पुढील') || norm.includes('पुढे') || norm.includes('documents') || norm.includes('दाखवा')) {
          setActiveScreen('documents');
          speak('कागदपत्रांची यादी उघडत आहे.');
          return true;
        }
        if (norm.includes('अर्ज') || norm.includes('फॉर्म') || norm.includes('apply') || norm.includes('form')) {
          setActiveScreen('form');
          speak('अर्जाचा फॉर्म उघडत आहे.');
          return true;
        }
        if (norm.includes('निकाल') || norm.includes('ऐका') || norm.includes('repeat')) {
          speak(result.summary_mr, { force: true });
          return true;
        }
        if (norm.includes('पुन्हा') || norm.includes('तपासा') || norm.includes('restart')) {
          handleRestart();
          return true;
        }
        return true;
      }

      if (!currentQuestion) return true;

      const q = currentQuestionRef.current;
      if (!q) return true;

      // 1. Boolean Questions (e.g. Yes/No, Female/Male, Farmer/Not)
      if (q.type === 'boolean') {
        // ALWAYS check negative first so 'नाही आहे' or 'नको आहे' is NOT treated as YES!
        if (isNoIntent(raw)) {
          setFeedbackHint({ text: 'नोंदवले: "नाही"', type: 'info' });
          handleAnswer(false);
          return true;
        }

        if (isYesIntent(raw)) {
          setFeedbackHint({ text: 'नोंदवले: "होय"', type: 'info' });
          handleAnswer(true);
          return true;
        }

        // Unclear boolean utterance: prompt clearly and keep user on the same question
        setFeedbackHint({
          text: `समजलेला आवाज: "${raw}". कृपया "होय" (Yes) किंवा "नाही" (No) म्हणा.`,
          type: 'warning'
        });
        speak('कृपया होय किंवा नाही म्हणा.');
        return true;
      }

      // 2. Numeric Questions (e.g. Age: "तुमचे वय किती?")
      if (q.type === 'number') {
        const num = extractNumberFromMarathi(raw);
        if (num !== null && !isNaN(num) && num > 0) {
          setFeedbackHint({ text: `वय नोंदवले: ${num} वर्षे`, type: 'info' });
          handleAnswer(num);
          return true;
        }

        setFeedbackHint({
          text: `समजलेला आवाज: "${raw}". कृपया वयाचा आकडा सांगा (उदा. पंचवीस किंवा 28).`,
          type: 'warning'
        });
        speak('कृपया वयाचा आकडा सांगा.');
        return true;
      }

      // 3. Select / Multiple Choice Questions
      if (q.type === 'select') {
        const norm = normalizeMarathiSpeech(raw);

        // Special handling for income
        if (q.id === 'annual_income') {
          if (norm.includes('कमी') || norm.includes('2.5') || norm.includes('२.५') || isYesIntent(raw)) {
            handleAnswer('below_2_5');
            return true;
          }
          if (norm.includes('जास्त') || isNoIntent(raw)) {
            handleAnswer('above_2_5');
            return true;
          }
          if (norm.includes('रेशन') || norm.includes('पिवळे') || norm.includes('केशरी')) {
            handleAnswer('has_ration_card');
            return true;
          }
        }

        // Option matching
        if (q.options) {
          for (const opt of q.options) {
            const optNorm = normalizeMarathiSpeech(opt.label_mr);
            if (norm.includes(optNorm) || norm.includes(opt.value)) {
              handleAnswer(opt.value);
              return true;
            }
          }
        }

        // If unclear
        setFeedbackHint({
          text: `समजलेला आवाज: "${raw}". कृपया स्क्रीनवरील पर्यायांपैकी एक निवडा.`,
          type: 'warning'
        });
        speak('कृपया स्क्रीनवरील पर्यायांपैकी एक निवडा.');
        return true;
      }

      return true; // Always handle within screen to prevent leaking to global intent
    });

    return () => unregister();
  }, [currentQuestion, result, handleAnswer, registerVoiceHandler, speak, setActiveScreen]);

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    setNumberInputValue('');
    setFeedbackHint(null);
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

      {/* 4-Stage Citizen Journey Stepper */}
      <CitizenJourneyStepper currentStage="eligibility" />

      {/* Live Audio / Interim Waveform Visualizer */}
      <VoiceWaveVisualizer 
        isListening={isListening} 
        isSpeaking={isSpeaking} 
        interimText={interimTranscript} 
      />

      {/* Feedback Hint Banner */}
      {feedbackHint && (
        <div className={`p-3.5 rounded-2xl border-2 flex items-center gap-2 text-sm font-bold animate-fadeIn ${
          feedbackHint.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-900 dark:text-emerald-200'
        }`}>
          {feedbackHint.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          ) : (
            <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          )}
          <span>{feedbackHint.text}</span>
        </div>
      )}

      {/* Wizard Question Card */}
      {!result && currentQuestion && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-2 border-saffron-300 dark:border-saffron-600 shadow-lg animate-fadeIn">
          
          {/* Progress bar and Back Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-600 transition-colors min-h-[38px]"
                  aria-label="मागील प्रश्नावर जा"
                  title="मागील प्रश्न दुरुस्त करा"
                >
                  <ArrowLeft className="w-4 h-4 text-saffron-600" />
                  <span>मागील प्रश्न (Go Back)</span>
                </button>
              )}
              <span className="text-xs sm:text-sm font-extrabold text-saffron-700 dark:text-saffron-400 bg-saffron-50 dark:bg-saffron-950/60 px-3 py-1 rounded-full border border-saffron-200">
                प्रश्न {currentStep + 1} / {questions.length}
              </span>
            </div>

            <button
              onClick={() => speak(currentQuestion.spoken_prompt_mr || currentQuestion.question_mr, { force: true })}
              className="p-2 text-saffron-600 hover:text-saffron-700 hover:bg-saffron-50 dark:hover:bg-slate-700 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label="हा प्रश्न पुन्हा ऐका"
              title="प्रश्न ऐका"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Friendly Speech Fallback Banner (when speech unsupported or denied) */}
          {(!isSpeechSupported || micStatus === 'denied') && (
            <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <span>
                  {micStatus === 'denied'
                    ? 'मायक्रोफोन परवानगी नाकारली गेली आहे. काळजी करू नका! तुम्ही खालील बटणे दाबून थेट उत्तर देऊ शकता.'
                    : 'तुमच्या डिव्हाइसमध्ये थेट आवाज ओळख उपलब्ध नाही. काळजी करू नका! तुम्ही खालील बटणे दाबून सहज उत्तर देऊ शकता.'}
                </span>
              </div>
            </div>
          )}

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
            <span>🗣️ तुम्ही थेट माईकवर उत्तर बोलू शकता (उदा. "होय", "नाही", "पंचवीस").</span>
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
              <div className="space-y-2.5">
                {/* Next Stage: Document Checklist */}
                <button
                  onClick={() => setActiveScreen('documents')}
                  className="w-full py-4 px-6 bg-saffron-600 hover:bg-saffron-700 text-white font-black text-lg sm:text-xl rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-between min-h-[58px]"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-6 h-6 text-white" />
                    <span>पुढील पायरी: कागदपत्रे तपासा (Check Documents)</span>
                  </div>
                  <ArrowRight className="w-5 h-5 flex-shrink-0" />
                </button>

                {/* Direct Stage: Apply Form */}
                <button
                  onClick={() => setActiveScreen('form')}
                  className="w-full py-3.5 px-6 bg-civic-900 hover:bg-civic-800 text-white font-bold text-base rounded-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 min-h-[52px]"
                >
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span>किंवा थेट आवाजाने अर्ज भरा (Skip to Apply)</span>
                </button>
              </div>
            )}

            {/* Trustworthy by Design Badge */}
            <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-black text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>१००% नियम-आधारित निकाल (Rule-Based, No Guessing)</span>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {selectedScheme?.verification_tag}
              </span>
            </div>

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
