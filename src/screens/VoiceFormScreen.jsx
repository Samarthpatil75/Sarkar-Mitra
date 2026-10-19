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
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  Square
} from 'lucide-react';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import WhatNextView from '../components/WhatNextView';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import { generateApplicationPDF } from '../services/pdfGenerator';
import { 
  isYesIntent, 
  isNoIntent, 
  isStopIntent,
  extractNumberFromMarathi, 
  parseSpokenPhoneNumber,
  detectSpokenLanguage,
  formatPhoneNumberForSpeech,
  isPreviousOrBackIntent,
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
    wasStoppedByUser,
    lastSpoken,
    replayLastAudio,
    interimTranscript, 
    startListening, 
    registerVoiceHandler,
    isSpeechSupported,
    micStatus 
  } = useSpeech();

  const formFields = selectedScheme?.form_fields || [];

  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [pendingAnswer, setPendingAnswer] = useState('');
  const [detectedLang, setDetectedLang] = useState('mr'); // 'en' | 'mr'
  const [isEditingFromSummary, setIsEditingFromSummary] = useState(false);
  const [stage, setStage] = useState('asking'); // 'asking' | 'confirming' | 'completed'
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(null);
  const [speechFeedback, setSpeechFeedback] = useState(null); // { text, type: 'info'|'warning'|'success' }

  const currentField = formFields[currentFieldIndex];
  const stageRef = useRef(stage);
  stageRef.current = stage;

  // Auto-switch to tap & type mode if speech is unsupported or denied
  useEffect(() => {
    if (!isSpeechSupported || micStatus === 'denied') {
      setIsEditingManually(true);
    }
  }, [isSpeechSupported, micStatus]);

  // Common tap-to-answer choices for each field type
  const getQuickChoicesForField = useCallback((field) => {
    if (!field) return [];
    const k = (field.key || '').toLowerCase();
    
    if (k.includes('district') || k.includes('जिल्हा')) {
      return ['पुणे', 'सातारा', 'बीड', 'कोल्हापूर', 'छ. संभाजीनगर', 'नाशिक', 'नागपूर', 'मुंबई', 'सोलापूर', 'ठाणे'];
    }
    if (k.includes('mobile') || k.includes('phone') || field.type === 'tel') {
      return ['9822451234', '9664429410', '9420123456', '9890123456'];
    }
    if (k.includes('land') || k.includes('acre') || k.includes('जमीन')) {
      return ['१ एकर', '२ एकर', '३ एकर', '४ एकर', '५ एकर'];
    }
    if (k.includes('gat') || k.includes('गट')) {
      return ['गट क्र. १२४/२ (३ एकर)', 'गट क्र. ५६/१ (२ एकर)', 'गट क्र. ८९ (१.५ एकर)'];
    }
    if (k.includes('ration') || k.includes('रेशन')) {
      return ['पिवळे रेशन कार्ड (BPL)', 'केशरी रेशन कार्ड', 'अंत्योदय अन्न योजना कार्ड'];
    }
    if (k.includes('bank') || k.includes('ifsc') || k.includes('बँक')) {
      return ['बँक ऑफ महाराष्ट्र', 'State Bank of India', 'बँक ऑफ इंडिया', 'जिल्हा मध्यवर्ती बँक'];
    }
    if (k.includes('name') || k.includes('नाव')) {
      return ['सुनिता प्रकाश पाटील', 'तुकाराम ज्ञानोबा शिंदे', 'दत्तात्रय गोविंद कांबळे'];
    }
    if (k.includes('treatment') || k.includes('उपचार')) {
      return ['मोतीबिंदू शस्त्रक्रिया', 'गुडघा प्रत्यारोपण', 'हृदयरोग उपचार', 'सामान्य शस्त्रक्रिया'];
    }
    return ['होय, बरोबर आहे', 'नाही, माहिती नाही'];
  }, []);

  // Speak prompt when entering a field in asking stage
  useEffect(() => {
    if (stage === 'asking' && currentField) {
      speak(currentField.spoken_prompt);
    }
  }, [stage, currentFieldIndex, currentField, speak]);

  // Go back to the previous question (allows user to correct mistaken answers)
  const handleGoBack = useCallback(() => {
    stopSpeaking();
    if (currentFieldIndex <= 0) {
      showToast('हा पहिलाच प्रश्न आहे.', 'info');
      speak('हा पहिलाच प्रश्न आहे.');
      return;
    }
    const targetIndex = currentFieldIndex - 1;
    const targetField = formFields[targetIndex];

    setCurrentFieldIndex(targetIndex);
    setStage('asking');
    setIsEditingManually(false);

    const prevAnswer = formData[targetField.key] || '';
    setPendingAnswer(prevAnswer);
    setSpeechFeedback({
      text: `मागील प्रश्न: "${targetField.label_mr}" दुरुस्त करण्यासाठी उघडला आहे.`,
      type: 'info'
    });

    speak(`मागील प्रश्नावर परत आलो आहोत: ${targetField.spoken_prompt}. तुमचे योग्य उत्तर सांगा.`);
  }, [currentFieldIndex, formFields, formData, speak, stopSpeaking, showToast]);

  // Jump to edit a specific field directly from the summary screen
  const handleEditFieldFromSummary = useCallback((index) => {
    const targetField = formFields[index];
    if (!targetField) return;

    setCurrentFieldIndex(index);
    setIsEditingFromSummary(true);
    setStage('asking');
    setIsEditingManually(false);

    const prevVal = formData[targetField.key] || '';
    setPendingAnswer(prevVal);
    setSpeechFeedback({
      text: `दुरुस्तीसाठी उघडले: "${targetField.label_mr}"`,
      type: 'info'
    });

    speak(`${targetField.label_mr} दुरुस्त करण्यासाठी उघडले आहे: ${targetField.spoken_prompt}`);
  }, [formFields, formData, speak]);

  // When answer is captured, read it back and confirm
  const handleAnswerCaptured = useCallback((answerText) => {
    if (!answerText || !answerText.trim()) return;
    let cleanAnswer = answerText.trim();
    const spokenLang = detectSpokenLanguage(cleanAnswer);
    setDetectedLang(spokenLang);

    const isPhoneField = currentField && (currentField.type === 'tel' || currentField.key?.includes('mobile') || currentField.key?.includes('phone'));

    // If mobile number / phone field, convert spoken words (Marathi or English) into numerical format
    if (isPhoneField) {
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

    if (isPhoneField && spokenLang === 'en') {
      setSpeechFeedback({
        text: `Recognized Mobile Number (English): "${cleanAnswer}"`,
        type: 'info'
      });
    } else {
      setSpeechFeedback({
        text: `समजलेले उत्तर: "${cleanAnswer}"`,
        type: 'info'
      });
    }

    setStage('confirming');

    // Natural spoken confirmation:
    // If phone field, read digit-by-digit in the spoken language so speech synthesis doesn't misread
    if (isPhoneField) {
      const speechDigits = formatPhoneNumberForSpeech(cleanAnswer, spokenLang);
      if (spokenLang === 'en') {
        speak(`You said: ${speechDigits}. Is this correct? बरोबर आहे का?`);
      } else {
        speak(`तुम्ही सांगितले: ${speechDigits}. हे बरोबर आहे का?`);
      }
    } else {
      speak(`तुम्ही सांगितले: ${cleanAnswer}. हे बरोबर आहे का?`);
    }
  }, [speak, currentField]);

  // Confirm answer as YES
  const handleConfirmYes = useCallback(() => {
    stopSpeaking();
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

    // If user came from summary screen to edit a single field, take them straight back to summary
    if (isEditingFromSummary) {
      setIsEditingFromSummary(false);
      setStage('completed');
      speak('बदल जतन केला आहे! अर्जाचा सारांश अद्ययावत झाला आहे.');
      return;
    }

    if (currentFieldIndex < formFields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
      setStage('asking');
    } else {
      // Completed all fields
      setStage('completed');
      speak('अभिनंदन! तुमचे सर्व तपशील नोंदवले गेले आहेत. खाली दिलेले PDF डाउनलोड करा बटण दाबून अर्जाचा सारांश जतन करा.');
    }
  }, [currentField, formData, pendingAnswer, isEditingFromSummary, currentFieldIndex, formFields.length, speak, stopSpeaking]);

  // Reject answer as NO (retry / "i dont want" / cancel)
  const handleConfirmNo = useCallback(() => {
    stopSpeaking();
    setPendingAnswer('');
    setSpeechFeedback({
      text: 'उत्तर रद्द केले (Cancelled). कृपया तुमचे उत्तर पुन्हा सांगा.',
      type: 'warning'
    });
    setStage('asking');
    speak('ठीक आहे, उत्तर रद्द केले. कृपया पुन्हा सांगा.');
  }, [speak, stopSpeaking]);

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
        setStage('what_next');
        speak('तुमची पूर्व-अर्ज सारांशाची PDF डाऊनलोड झाली आहे. आता पुढे काय करायचे आणि प्रत्यक्ष अर्ज कुठे सादर करायचा याची माहिती समोर दिली आहे.');
      } else {
        showToast('प्रिंट किंवा सेव्ह विंडो उघडली आहे.', 'info');
        setStage('what_next');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('प्रिंट विंडो उघडली आहे.', 'warning');
      window.print();
      setStage('what_next');
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

      // 0. Spoken stop command: recognize Marathi/English stop words ("थांबा", "थांब", "बंद कर", "stop")
      // Cease playback immediately and NEVER treat it as an answer or navigation
      if (isStopIntent(raw)) {
        stopSpeaking({ userInitiated: true });
        return true;
      }

      // 1. In 'completed' or 'what_next' stage: voice-driven download, what-next, summary, print, restart, edit
      if (stageRef.current === 'completed' || stageRef.current === 'what_next') {
        const norm = raw.toLowerCase();
        if (norm.includes('pdf') || norm.includes('डाऊनलोड') || norm.includes('download') || norm.includes('सेव्ह')) {
          handleDownloadPDF();
          return true;
        }
        if (norm.includes('पुढे काय') || norm.includes('what next') || norm.includes('मार्गदर्शन') || norm.includes('पुढे')) {
          setStage('what_next');
          return true;
        }
        if (norm.includes('सारांश') || norm.includes('summary') || (stageRef.current === 'what_next' && (norm.includes('मागे') || norm.includes('back')))) {
          setStage('completed');
          return true;
        }
        if (norm.includes('प्रिंट') || norm.includes('print')) {
          window.print();
          return true;
        }
        if (norm.includes('दुरुस्त') || norm.includes('बदला') || norm.includes('edit') || norm.includes('बदल')) {
          handleEditFieldFromSummary(0);
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

      // 2. Check if user wants to go back to previous question/field
      if (isPreviousOrBackIntent(raw)) {
        if (currentFieldIndex > 0 || stageRef.current === 'confirming') {
          handleGoBack();
          return true;
        }
      }

      // 3. Check if user explicitly wants to cancel or exit completely to home
      const normRaw = normalizeMarathiSpeech(raw);
      if (['रद्द करा', 'कॅन्सल करा', 'कॅन्सल', 'मुख्य पान', 'होम', 'exit', 'quit'].some(k => normRaw === k || normRaw.includes(k))) {
        speak('फॉर्म थांबवला आहे. मुख्य पानावर जात आहोत.');
        setActiveScreen('home');
        return true;
      }

      if (!currentField) return true;

      // 4. In 'asking' stage: capture the field's value
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

      // 5. In 'confirming' stage: strictly evaluate YES vs NO
      if (stageRef.current === 'confirming') {
        // Negation / Reject / "I don't want" / "No"
        if (isNoIntent(raw)) {
          handleConfirmNo();
          return true;
        }

        // Affirmation / Approval / "Yes"
        if (isYesIntent(raw)) {
          handleConfirmYes();
          return true;
        }

        // Ambiguous speech during confirmation
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
  }, [
    currentField, 
    currentFieldIndex, 
    handleAnswerCaptured, 
    handleConfirmYes, 
    handleConfirmNo, 
    handleGoBack,
    handleDownloadPDF, 
    handleRestartForm, 
    handleEditFieldFromSummary, 
    registerVoiceHandler, 
    speak, 
    setActiveScreen
  ]);

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
            <div className="flex items-center gap-2">
              {currentFieldIndex > 0 && (
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
                माहिती विचारत आहे {currentFieldIndex + 1} / {formFields.length}
              </span>
            </div>

            {isSpeaking ? (
              <button
                type="button"
                onClick={() => stopSpeaking({ userInitiated: true })}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black min-h-[44px] flex items-center gap-1.5 shadow-md animate-pulse focus:ring-4 focus:ring-red-400 cursor-pointer"
                role="button"
                aria-label="आवाज थांबवा"
                title="आवाज थांबवा"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>आवाज थांबवा</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => speak(currentField.spoken_prompt, { force: true })}
                className="p-2 text-saffron-600 hover:text-saffron-700 hover:bg-saffron-50 dark:hover:bg-slate-700 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                aria-label="प्रश्न पुन्हा ऐका"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 leading-snug">
            {currentField.spoken_prompt}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            फील्ड नाव: <span className="font-bold text-slate-700 dark:text-slate-300">{currentField.label_mr}</span>
            {(currentField.type === 'tel' || currentField.key?.includes('mobile')) && (
              <span className="ml-2 inline-block px-2.5 py-0.5 rounded-md bg-saffron-100 dark:bg-saffron-950 text-saffron-800 dark:text-saffron-300 text-xs font-bold">
                मराठी किंवा इंग्रजीत बोला (English or Marathi)
              </span>
            )}
          </p>

          {/* Friendly Speech Fallback Banner */}
          {(!isSpeechSupported || micStatus === 'denied') && (
            <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <span>
                  {micStatus === 'denied'
                    ? 'मायक्रोफोन परवानगी नाकारली गेली आहे. काळजी करू नका! खालील पर्याय निवडून किंवा टाईप करून उत्तर नोंदवा.'
                    : 'तुमच्या डिव्हाइसमध्ये थेट आवाज ओळख उपलब्ध नाही. काळजी करू नका! खालील पर्याय निवडून किंवा टाईप करून उत्तर नोंदवा.'}
                </span>
              </div>
            </div>
          )}

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

            {/* Always Visible Tap-to-Answer Buttons (beside / below the mic) */}
            <div className="pt-2">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-saffron-500" />
                <span>थेट पर्याय निवडून पुढे जा (Tap to Answer):</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {getQuickChoicesForField(currentField).map((choice, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => handleAnswerCaptured(choice)}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-saffron-100 dark:bg-slate-700/80 dark:hover:bg-saffron-950/70 border-2 border-slate-200 dark:border-slate-600 hover:border-saffron-400 text-slate-900 dark:text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 min-h-[44px]"
                  >
                    {choice}
                  </button>
                ))}
              </div>
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

            {/* Go back helper note */}
            {currentFieldIndex > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                <span>मागील उत्तर चुकले असल्यास:</span>
                <button
                  onClick={handleGoBack}
                  className="text-saffron-600 dark:text-saffron-400 font-bold hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>मागे जाऊन दुरुस्त करा (Go Back)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stage 2: Confirming Answer */}
      {stage === 'confirming' && currentField && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-4 border-amber-400 dark:border-amber-500 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-extrabold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>उत्तर पडताळणी:</span>
            </div>

            {currentFieldIndex > 0 && (
              <button
                onClick={handleGoBack}
                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-amber-300 dark:border-slate-600 transition-colors min-h-[36px]"
                title="मागील प्रश्नावर जा"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-saffron-600" />
                <span>मागील प्रश्न (Go Back)</span>
              </button>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
            तुम्ही दिलेले उत्तर:
          </h3>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-800 my-4 text-center">
            {detectedLang === 'en' && (currentField.type === 'tel' || currentField.key?.includes('mobile') || currentField.key?.includes('phone')) && (
              <span className="text-xs font-bold text-saffron-700 dark:text-saffron-400 block mb-1">
                इंग्रजीत नोंदवलेला मोबाईल नंबर (English Mobile Number):
              </span>
            )}
            <p className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-100 font-mono tracking-wider">
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
            🗣️ तुम्ही थेट माईकमध्ये "होय", "नाही" / "नको" किंवा "मागे जा" बोलू शकता.
          </div>
        </div>
      )}

      {/* Stage 3: Completed Form Summary & PDF Download */}
      {stage === 'completed' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-4 border-emerald-500 shadow-2xl animate-fadeIn space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-saffron-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <FileCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-black text-saffron-700 dark:text-saffron-400 uppercase tracking-wider">
                पूर्व-अर्ज सारांश (Pre-Application Summary)
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {selectedScheme?.name_mr}
              </h3>
            </div>
          </div>

          {/* Entered Fields List with Individual Edit Buttons */}
          <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">
                नोंदवलेली माहिती:
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                (कोणतीही माहिती दुरुस्त करण्यासाठी 'दुरुस्त करा' दाबा)
              </span>
            </div>

            {formFields.map((field, idx) => {
              const isPhone = field.type === 'tel' || field.key?.includes('mobile') || field.key?.includes('phone');
              const val = formData[field.key];
              return (
                <div key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-200/60 dark:border-slate-800 last:border-0 gap-2">
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 block">
                      {field.label_mr} {isPhone && <span className="text-xs text-saffron-600 font-semibold">(Mobile Number)</span>}:
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                      {val || 'उपलब्ध नाही'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEditFieldFromSummary(idx)}
                    className="px-3 py-1.5 bg-slate-200/80 hover:bg-saffron-100 dark:bg-slate-700 dark:hover:bg-saffron-950/60 text-slate-800 hover:text-saffron-700 dark:text-slate-200 dark:hover:text-saffron-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[38px]"
                    aria-label={`${field.label_mr} दुरुस्त करा`}
                    title="माहिती दुरुस्त करा"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-saffron-600" />
                    <span>दुरुस्त करा (Edit)</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Download PDF & Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-4 px-6 bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-700 hover:to-saffron-800 text-white font-black text-xl rounded-2xl shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-3 min-h-[58px]"
            >
              <Download className="w-7 h-7" />
              <span>{t('download_pdf')}</span>
            </button>

            <button
              onClick={() => setStage('what_next')}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2.5 min-h-[52px]"
            >
              <span>आता पुढे काय करायचे? (What Next?)</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => window.print()}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Printer className="w-5 h-5 text-civic-600" />
                <span>{t('print_form')}</span>
              </button>
              <button
                onClick={() => handleEditFieldFromSummary(0)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Edit3 className="w-5 h-5 text-saffron-600" />
                <span>माहिती दुरुस्त करा</span>
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

          {/* Visible Mandatory Disclaimer Notice (Non-Government Document) */}
          <div className="p-4 sm:p-5 bg-red-50 dark:bg-red-950/40 rounded-2xl border-2 border-red-400 dark:border-red-600 space-y-2">
            <div className="flex items-center gap-2 font-black text-red-700 dark:text-red-300 text-sm sm:text-base">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>महत्त्वाची सूचना (Important Disclaimer):</span>
            </div>
            <p className="font-extrabold text-red-900 dark:text-red-200 text-sm sm:text-base leading-relaxed">
              ही सरकार मित्रने तयार केलेली पूर्व-अर्ज सारांश पत्रिका आहे. हा अधिकृत शासकीय दस्तऐवज नाही. कृपया अधिकृत पोर्टल किंवा कार्यालयात अर्ज सादर करा.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-red-200 dark:border-red-800/80 text-xs text-red-800 dark:text-red-300 font-medium">
              <span>
                मसुदा संदर्भ नोंद: <strong className="font-mono font-bold text-red-950 dark:text-red-100">SM-DRAFT</strong> (Draft, not a government registration number.)
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                {selectedScheme?.verification_tag}
              </span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-semibold leading-relaxed">
            📢 ही पूर्व-अर्ज सारांश PDF घेऊन तुम्ही जवळच्या सेतू केंद्र, ग्रामपंचायत किंवा अधिकृत पोर्टलवर जाऊन अर्ज सादर करू शकता. (तुम्ही थेट माईकमध्ये "डाऊनलोड करा" बोलू शकता.)
          </div>
        </div>
      )}

      {/* Stage 4: What Next Screen (Official Portal Link, Office to Visit, Documents to Carry, 3-Step Process) */}
      {stage === 'what_next' && (
        <WhatNextView 
          onBackToSummary={() => setStage('completed')}
          onDownloadAgain={handleDownloadPDF}
          onRestartForm={handleRestartForm}
        />
      )}

    </div>
  );
}
