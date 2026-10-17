import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mic, 
  Check, 
  X, 
  Download, 
  Printer, 
  Volume2, 
  Edit3, 
  FileCheck, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import CitizenJourneyStepper from '../components/CitizenJourneyStepper';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import { generateApplicationPDF } from '../services/pdfGenerator';
import { 
  isYesIntent, 
  isNoIntent, 
  extractNumberFromMarathi, 
  parseSpokenPhoneNumber,
  normalizeMarathiSpeech,
  isCancelOrBackIntent 
} from '../services/marathiVoiceMatcher';

export default function VoiceFormScreen() {
  const { selectedScheme, setSelectedScheme, schemes, showToast, t, setActiveScreen } = useApp();
  const { 
    isListening, 
    isSpeaking, 
    speak, 
    stopSpeaking,
    interimTranscript, 
    startListening, 
    registerVoiceHandler 
  } = useSpeech();

  const formFields = selectedScheme?.form_fields || [];

  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [pendingAnswer, setPendingAnswer] = useState('');
  const [stage, setStage] = useState('asking'); // 'asking' | 'confirming' | 'completed'
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(null);
  const [speechFeedback, setSpeechFeedback] = useState(null); // { text, type: 'info'|'warning'|'success' }

  const currentField = formFields[currentFieldIndex];
  const stageRef = useRef(stage);
  stageRef.current = stage;

  // Speak prompt when entering a field in asking stage
  useEffect(() => {
    if (stage === 'asking' && currentField) {
      speak(currentField.spoken_prompt);
    }
  }, [stage, currentFieldIndex, currentField, speak]);

  // When answer is captured, read it back and confirm
  const handleAnswerCaptured = useCallback((answerText) => {
    if (!answerText || !answerText.trim()) return;
    let cleanAnswer = answerText.trim();

    // If mobile number / phone field, convert spoken words (Marathi or English) into numerical format
    if (currentField && (currentField.type === 'tel' || currentField.key?.includes('mobile') || currentField.key?.includes('phone'))) {
      const extractedPhone = parseSpokenPhoneNumber(cleanAnswer);
      if (extractedPhone) {
        cleanAnswer = extractedPhone;
      }
    } else if (currentField && currentField.type === 'number') {
      const extractedNum = extractNumberFromMarathi(cleanAnswer);
      if (extractedNum !== null) {
        cleanAnswer = String(extractedNum);
      }
    }

    setPendingAnswer(cleanAnswer);
    setSpeechFeedback({
      text: `समजलेले उत्तर: "${cleanAnswer}"`,
      type: 'info'
    });
    setStage('confirming');

    const confirmationText = `तुम्ही सांगितले: ${cleanAnswer}. हे बरोबर आहे का?`;
    speak(confirmationText);
  }, [speak, currentField]);

  // Confirm answer as YES
  const handleConfirmYes = useCallback(() => {
    if (!currentField) return;
    const updatedData = {
      ...formData,
      [currentField.key]: pendingAnswer
    };
    setFormData(updatedData);
    setPendingAnswer('');
    setSpeechFeedback({
      text: 'उत्तर नोंदवले गेले (Saved)!',
      type: 'success'
    });
    setIsEditingManually(false);

    if (currentFieldIndex < formFields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
      setStage('asking');
    } else {
      // Completed all fields
      setStage('completed');
      speak('अभिनंदन! तुमचे सर्व तपशील नोंदवले गेले आहेत. खाली दिलेले PDF डाउनलोड करा बटण दाबून अर्जाचा सारांश जतन करा.');
    }
  }, [currentField, formData, pendingAnswer, currentFieldIndex, formFields.length, speak]);

  // Reject answer as NO (retry / "i dont want" / cancel)
  const handleConfirmNo = useCallback(() => {
    setPendingAnswer('');
    setSpeechFeedback({
      text: 'उत्तर रद्द केले (Cancelled). कृपया तुमचे उत्तर पुन्हा सांगा.',
      type: 'warning'
    });
    setStage('asking');
    speak('ठीक आहे, उत्तर रद्द केले. कृपया पुन्हा सांगा.');
  }, [speak]);

  // Download PDF handler
  const handleDownloadPDF = useCallback(async () => {
    showToast('PDF तयार करत आहोत, कृपया प्रतीक्षा करा...', 'info');
    try {
      const res = await generateApplicationPDF({
        scheme: selectedScheme,
        formData: formData,
        verificationDate: selectedScheme?.last_verified_date
      });

      if (res && res.success) {
        setPdfGenerated(res);
        showToast(`PDF तयार झाली: ${res.filename}`, 'success');
        speak('तुमची अर्जाची PDF डाऊनलोड झाली आहे. ही प्रत घेऊन जवळच्या सेतू केंद्र किंवा ग्रामपंचायतीत संपर्क करा.');
      } else {
        showToast('प्रिंट किंवा सेव्ह विंडो उघडली आहे.', 'info');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('प्रिंट विंडो उघडली आहे.', 'warning');
      window.print();
    }
  }, [selectedScheme, formData, showToast, speak]);

  const handleRestartForm = useCallback(() => {
    setCurrentFieldIndex(0);
    setFormData({});
    setPendingAnswer('');
    setStage('asking');
    setPdfGenerated(null);
    setSpeechFeedback(null);
  }, []);

  // Voice handler for answering, confirming, and completed summary actions
  useEffect(() => {
    const unregister = registerVoiceHandler((speechText) => {
      const raw = speechText.trim();
      if (!raw) return true;

      // Check if user wants to cancel or go back
      if (isCancelOrBackIntent(raw)) {
        speak('फॉर्म थांबवला आहे. मुख्य पानावर जात आहोत.');
        setActiveScreen('home');
        return true;
      }

      // 1. In 'completed' stage: voice-driven download, print, restart
      if (stageRef.current === 'completed') {
        const norm = raw.toLowerCase();
        if (norm.includes('pdf') || norm.includes('डाऊनलोड') || norm.includes('download') || norm.includes('सेव्ह')) {
          handleDownloadPDF();
          return true;
        }
        if (norm.includes('प्रिंट') || norm.includes('print')) {
          window.print();
          return true;
        }
        if (norm.includes('पुन्हा') || norm.includes('restart') || norm.includes('नवीन')) {
          handleRestartForm();
          return true;
        }
        if (norm.includes('मुख्य') || norm.includes('होम') || norm.includes('home')) {
          setActiveScreen('home');
          return true;
        }
        return true;
      }

      if (!currentField) return true;

      // 2. In 'asking' stage: capture the field's value
      if (stageRef.current === 'asking') {
        // If user says "नको" or "cancel" right away
        if (isNoIntent(raw)) {
          setSpeechFeedback({
            text: 'कृपया या प्रश्नाचे उत्तर सांगा, किंवा माहिती नसेल तर "माहिती नाही" म्हणा.',
            type: 'warning'
          });
          speak('कृपया तुमचे उत्तर सांगा.');
          return true;
        }

        handleAnswerCaptured(raw);
        return true;
      }

      // 3. In 'confirming' stage: strictly evaluate YES vs NO (including 'नको' / 'मला नको आहे' / 'no')
      if (stageRef.current === 'confirming') {
        // Negation / Reject / "I don't want" / "No"
        if (isNoIntent(raw)) {
          handleConfirmNo();
          return true;
        }

        // Affirmation / Accept / "Yes" / "Correct"
        if (isYesIntent(raw)) {
          handleConfirmYes();
          return true;
        }

        // Ambiguous speech during confirmation:
        // NEVER leak to global intent parser! Handle gracefully within the screen.
        setSpeechFeedback({
          text: `तुमचा आवाज: "${raw}". कृपया 'होय' (बरोबर आहे) किंवा 'नाही' (नको / बदला) म्हणा.`,
          type: 'warning'
        });
        speak('कृपया होय किंवा नाही म्हणा.');
        return true;
      }

      return true; // Always handle within form screen to prevent leaks
    });

    return () => unregister();
  }, [currentField, handleAnswerCaptured, handleConfirmYes, handleConfirmNo, handleDownloadPDF, handleRestartForm, registerVoiceHandler, speak, setActiveScreen]);

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
                onClick={() => {
                  setSelectedScheme(s);
                  handleRestartForm();
                }}
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
      <CitizenJourneyStepper currentStage="form" />

      {/* Live Audio / Interim Waveform Visualizer */}
      <VoiceWaveVisualizer 
        isListening={isListening} 
        isSpeaking={isSpeaking} 
        interimText={interimTranscript} 
      />

      {/* Synchronized Feedback Notice Banner */}
      {speechFeedback && (
        <div className={`p-3.5 rounded-2xl border-2 flex items-center gap-2 text-sm font-bold animate-fadeIn ${
          speechFeedback.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-900 dark:text-amber-200'
            : speechFeedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-900 dark:text-emerald-200'
            : 'bg-civic-50 dark:bg-civic-950/50 border-civic-400 text-civic-900 dark:text-civic-200'
        }`}>
          {speechFeedback.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          ) : (
            <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          )}
          <span>{speechFeedback.text}</span>
        </div>
      )}

      {/* Stage 1: Asking / Speaking Step */}
      {stage === 'asking' && currentField && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-2 border-saffron-400 dark:border-saffron-500 shadow-lg animate-fadeIn">
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm font-extrabold text-saffron-700 dark:text-saffron-400 bg-saffron-50 dark:bg-saffron-950/60 px-3 py-1 rounded-full border border-saffron-200">
              माहिती विचारत आहे {currentFieldIndex + 1} / {formFields.length}
            </span>
            <button
              onClick={() => speak(currentField.spoken_prompt, { force: true })}
              className="p-2 text-saffron-600 hover:text-saffron-700 hover:bg-saffron-50 dark:hover:bg-slate-700 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label="प्रश्न पुन्हा ऐका"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 leading-snug">
            {currentField.spoken_prompt}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            फील्ड नाव: <span className="font-bold text-slate-700 dark:text-slate-300">{currentField.label_mr}</span>
          </p>

          {/* Spoken Mic Input or Typing Input */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={startListening}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-700 hover:to-saffron-800 text-white font-extrabold text-xl rounded-2xl shadow-lg flex items-center justify-center gap-3 min-h-[58px] active:scale-95 transition-transform"
              >
                <Mic className="w-7 h-7" />
                <span>उत्तर बोलण्यासाठी दाबा</span>
              </button>

              <button
                onClick={() => setIsEditingManually(prev => !prev)}
                className="py-3 px-5 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Edit3 className="w-5 h-5 text-saffron-600" />
                <span>{isEditingManually ? 'माईक वापरा' : 'टाईप करा'}</span>
              </button>
            </div>

            {/* Manual Typing Box */}
            {isEditingManually && (
              <div className="pt-2 animate-fadeIn flex gap-2">
                <input
                  type={currentField.type === 'tel' ? 'tel' : 'text'}
                  placeholder={currentField.placeholder || 'येथे टाईप करा...'}
                  value={pendingAnswer}
                  onChange={(e) => setPendingAnswer(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-saffron-500 rounded-xl text-lg font-bold text-slate-900 dark:text-white outline-none min-h-[48px]"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (pendingAnswer.trim()) {
                      handleAnswerCaptured(pendingAnswer);
                    }
                  }}
                  disabled={!pendingAnswer.trim()}
                  className="px-5 py-3 bg-saffron-600 text-white font-bold rounded-xl disabled:opacity-50 min-h-[48px]"
                >
                  नोंदवा
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stage 2: Confirming Answer */}
      {stage === 'confirming' && currentField && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-4 border-amber-400 dark:border-amber-500 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-400 font-extrabold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>उत्तर पडताळणी:</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
            तुम्ही दिलेले उत्तर:
          </h3>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-800 my-4 text-center">
            <p className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-100">
              "{pendingAnswer}"
            </p>
          </div>

          <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200 text-center mb-6">
            हे बरोबर आहे का? (Is this correct?)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleConfirmYes}
              className="py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 min-h-[58px]"
            >
              <Check className="w-6 h-6" />
              <span>होय, बरोबर आहे (Yes)</span>
            </button>
            <button
              onClick={handleConfirmNo}
              className="py-4 px-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-xl rounded-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 min-h-[58px]"
            >
              <X className="w-6 h-6" />
              <span>नाही, नको / बदला (No / Reject)</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
            🗣️ तुम्ही थेट माईकमध्ये "होय" किंवा "नाही" / "नको" बोलू शकता.
          </div>
        </div>
      )}

      {/* Stage 3: Completed Form Summary & PDF Download */}
      {stage === 'completed' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-4 border-emerald-500 shadow-2xl animate-fadeIn space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                तयार झालेला अर्ज सारांश
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {selectedScheme?.name_mr}
              </h3>
            </div>
          </div>

          {/* Entered Fields List */}
          <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">
              नोंदवलेली माहिती:
            </h4>
            {formFields.map((field, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-200/60 dark:border-slate-800 last:border-0 gap-1">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  {field.label_mr}:
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {formData[field.key] || 'उपलब्ध नाही'}
                </span>
              </div>
            ))}
          </div>

          {/* Download PDF & Print Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-4 px-6 bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-700 hover:to-saffron-800 text-white font-black text-xl rounded-2xl shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-3 min-h-[58px]"
            >
              <Download className="w-7 h-7" />
              <span>{t('download_pdf')}</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.print()}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Printer className="w-5 h-5 text-civic-600" />
                <span>{t('print_form')}</span>
              </button>
              <button
                onClick={handleRestartForm}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl flex items-center justify-center gap-2 min-h-[48px]"
              >
                <RotateCcw className="w-5 h-5 text-saffron-600" />
                <span>पुन्हा भरा</span>
              </button>
            </div>
          </div>

          {/* Trustworthy by Design & Privacy Notice */}
          <div className="p-3.5 bg-emerald-50 dark:bg-slate-900/70 rounded-2xl border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-black text-emerald-900 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>विश्वासार्ह डिजिटल अर्ज सारांश (Verified Civic Summary)</span>
            </span>
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {selectedScheme?.verification_tag}
            </span>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-semibold leading-relaxed">
            📢 ही PDF घेऊन तुम्ही जवळच्या सेतू केंद्र, ग्रामपंचायत किंवा अधिकृत पोर्टलवर जाऊन अंतिम पडताळणी करू शकता. (तुम्ही थेट माईकमध्ये "डाऊनलोड करा" बोलू शकता.)
          </div>
        </div>
      )}

    </div>
  );
}
