import React, { useState, useEffect, useCallback } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import { generateApplicationPDF } from '../services/pdfGenerator';

export default function VoiceFormScreen() {
  const { selectedScheme, setSelectedScheme, schemes, showToast, t } = useApp();
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

  const currentField = formFields[currentFieldIndex];

  // Speak prompt when entering a field in asking stage
  useEffect(() => {
    if (stage === 'asking' && currentField) {
      speak(currentField.spoken_prompt);
    }
  }, [stage, currentFieldIndex, currentField, speak]);

  // When answer is captured, read it back and confirm
  const handleAnswerCaptured = useCallback((answerText) => {
    if (!answerText || !answerText.trim()) return;
    const cleanAnswer = answerText.trim();
    setPendingAnswer(cleanAnswer);
    setStage('confirming');

    const confirmationText = `तुम्ही सांगितले: ${cleanAnswer}. हे बरोबर आहे का?`;
    speak(confirmationText);
  }, [speak]);

  // Confirm answer as YES
  const handleConfirmYes = useCallback(() => {
    if (!currentField) return;
    const updatedData = {
      ...formData,
      [currentField.key]: pendingAnswer
    };
    setFormData(updatedData);
    setPendingAnswer('');
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

  // Reject answer as NO (retry)
  const handleConfirmNo = useCallback(() => {
    setPendingAnswer('');
    setStage('asking');
    speak('ठीक आहे, पुन्हा सांगा.');
  }, [speak]);

  // Voice handler for answering and confirming
  useEffect(() => {
    if (stage === 'completed' || !currentField) return;

    const unregister = registerVoiceHandler((speechText) => {
      const norm = speechText.toLowerCase().trim();

      if (stage === 'asking') {
        handleAnswerCaptured(speechText);
        return true;
      }

      if (stage === 'confirming') {
        if (norm.includes('हो') || norm.includes('होय') || norm.includes('बरोबर') || norm.includes('yes') || norm.includes('करेक्ट')) {
          handleConfirmYes();
          return true;
        }
        if (norm.includes('नाही') || norm.includes('चूक') || norm.includes('नो') || norm.includes('no') || norm.includes('बदला')) {
          handleConfirmNo();
          return true;
        }
      }

      return false;
    });

    return () => unregister();
  }, [stage, currentField, handleAnswerCaptured, handleConfirmYes, handleConfirmNo, registerVoiceHandler]);

  // Download PDF handler
  const handleDownloadPDF = () => {
    const res = generateApplicationPDF({
      scheme: selectedScheme,
      formData: formData,
      verificationDate: selectedScheme?.last_verified_date
    });

    if (res.success) {
      setPdfGenerated(res);
      showToast(`PDF तयार झाली: ${res.filename}`, 'success');
      speak('तुमची अर्जाची PDF डाऊनलोड झाली आहे.');
    } else {
      showToast('प्रिंट किंवा सेव्ह विंडो उघडली आहे.', 'info');
    }
  };

  const handleRestartForm = () => {
    setCurrentFieldIndex(0);
    setFormData({});
    setPendingAnswer('');
    setStage('asking');
    setPdfGenerated(null);
  };

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
              <span>नाही, पुन्हा सांगा (No)</span>
            </button>
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

          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-semibold leading-relaxed">
            📢 ही PDF घेऊन तुम्ही जवळच्या सेतू केंद्र, ग्रामपंचायत किंवा अधिकृत पोर्टलवर जाऊन अंतिम पडताळणी करू शकता.
          </div>
        </div>
      )}

    </div>
  );
}
