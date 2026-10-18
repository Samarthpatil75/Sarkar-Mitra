import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileCheck, 
  Download, 
  User, 
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEMO_PERSONAS } from '../data/demoPersonas';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import { generateApplicationPDF } from '../services/pdfGenerator';
import VoiceWaveVisualizer from '../components/VoiceWaveVisualizer';

export default function DemoScreen() {
  const { setActiveScreen, setSelectedScheme, schemes, showToast } = useApp();
  const { speak, stopSpeaking } = useSpeech();

  const [selectedPersona, setSelectedPersona] = useState(DEMO_PERSONAS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1 | 1.5 | 2
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const timerRef = useRef(null);
  const currentStep = selectedPersona.steps[currentStepIndex];

  // Helper to trigger confetti on success steps
  const triggerConfetti = useCallback(() => {
    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  // Play audio for current step if not muted
  const playCurrentStepAudio = useCallback((step) => {
    if (isAudioMuted || !step) return;
    const textToSpeak = `${step.assistantSpeech} ${step.assistantConfirm || ''}`;
    speak(textToSpeak);
  }, [isAudioMuted, speak]);

  // Advance to next step
  const handleNextStep = useCallback(() => {
    if (currentStepIndex < selectedPersona.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, selectedPersona.steps.length]);

  // Advance to previous step
  const handlePrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  // Handle step change
  useEffect(() => {
    if (isPlaying && currentStep) {
      playCurrentStepAudio(currentStep);

      if (currentStep.id === 'eligibility_result') {
        triggerConfetti();
      }

      // Step duration calculated from text length and speed
      // Base approx 8 seconds per step, divided by speed
      const baseDurationMs = 8000;
      const stepDuration = Math.max(3500, baseDurationMs / playbackSpeed);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleNextStep();
      }, stepDuration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStepIndex, isPlaying, playbackSpeed, currentStep, handleNextStep, playCurrentStepAudio, triggerConfetti]);

  // Start persona demo
  const handleSelectPersona = (persona) => {
    stopSpeaking();
    setSelectedPersona(persona);
    setCurrentStepIndex(0);
    setIsPlaying(true);
    setPdfDownloaded(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setIsPlaying(true);
      if (currentStep) {
        playCurrentStepAudio(currentStep);
      }
    }
  };

  const handleRestart = () => {
    stopSpeaking();
    setCurrentStepIndex(0);
    setIsPlaying(true);
    setPdfDownloaded(false);
  };

  const handleDownloadDemoPDF = async () => {
    const matchedScheme = schemes.find(s => s.id === selectedPersona.scheme_id) || schemes[0];
    
    // Build simulated demo form data based on persona
    let demoFormData = {};
    if (selectedPersona.id === 'sunita_patil') {
      demoFormData = {
        applicant_name: 'सुनिता प्रकाश पाटील',
        mobile_number: '9822451234',
        district: 'सातारा',
        village_address: 'मु. पो. कोरेगाव, जि. सातारा',
        bank_account: '11023456789',
        bank_ifsc: 'MAHB0001234',
        ration_card_type: 'केशरी रेशन कार्ड'
      };
    } else if (selectedPersona.id === 'tukaram_shinde') {
      demoFormData = {
        farmer_name: 'तुकाराम ज्ञानोबा शिंदे',
        mobile_number: '9664429410',
        district: 'बीड',
        gat_number: 'गट क्र. १२४/२, ३ एकर कोरडवाहू',
        bank_account: '34567890123',
        bank_ifsc: 'SBIN0004567'
      };
    } else {
      demoFormData = {
        patient_name: 'दत्तात्रय गोविंद कांबळे',
        mobile_number: '9420123456',
        district: 'कोल्हापूर',
        ration_card_no: '272801234567',
        treatment_needed: 'मोतीबिंदू व गुडघे शस्त्रक्रिया'
      };
    }

    showToast('प्रात्यक्षिक पूर्व-अर्ज सारांश PDF तयार करत आहोत...', 'info');
    try {
      const res = await generateApplicationPDF({
        scheme: matchedScheme,
        formData: demoFormData,
        verificationDate: matchedScheme?.last_verified_date
      });
      if (res && res.success) {
        setPdfDownloaded(true);
        showToast(`डेमो PDF डाऊनलोड झाली: ${res.filename}`, 'success');
      }
    } catch (e) {
      console.error('Demo PDF error:', e);
      window.print();
    }
  };

  const handleExitToLiveApp = () => {
    stopSpeaking();
    const matchedScheme = schemes.find(s => s.id === selectedPersona.scheme_id) || schemes[0];
    setSelectedScheme(matchedScheme);
    setActiveScreen('eligibility');
    showToast(`थेट अर्ज मोड सुरू झाला: ${matchedScheme.name_mr}`, 'success');
  };

  const progressPercentage = Math.round(((currentStepIndex + 1) / selectedPersona.steps.length) * 100);

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">

      {/* Demo Mode Ribbon */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2 rounded-2xl font-black text-xs sm:text-sm tracking-wide flex items-center justify-between shadow-md border border-amber-600">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
          <span>🟡 प्रात्यक्षिक डेमो मोड (Automated Demo Mode) • माईकची गरज नाही</span>
        </div>
        <span className="text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-bold">
          सिम्युलेटेड डेटा / Not real data
        </span>
      </div>

      {/* Screen Header */}
      <div className="text-center pt-2">
        <span className="inline-block px-3 py-1 bg-saffron-100 dark:bg-saffron-950 text-saffron-800 dark:text-saffron-300 text-xs font-black rounded-full border border-saffron-300 mb-2">
          ★ ९० सेकंदांचा स्वयंचलित प्रवास ★
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
          'सरकार मित्र' चा थेट डेमो पहा
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-1">
          खालील ३ नागरिकांपैकी कोणत्याही एका पात्रावर स्पर्श करा. ॲप पूर्णपणे आवाजात संवाद साधून अर्ज तयार करून दाखवेल.
        </p>
      </div>

      {/* 3 One-Tap Persona Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEMO_PERSONAS.map((persona) => {
          const isSelected = selectedPersona.id === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => handleSelectPersona(persona)}
              className={`p-5 rounded-3xl border-3 text-left transition-all relative overflow-hidden group min-h-[140px] flex flex-col justify-between ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-saffron-500 shadow-xl ring-4 ring-saffron-300 dark:ring-saffron-900 scale-102'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-saffron-400 shadow-md'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-saffron-500 text-white flex items-center justify-center text-xs font-black shadow">
                  <Check className="w-4 h-4" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-700 shadow-inner">
                    {persona.avatar}
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      {persona.name_mr}
                    </h3>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {persona.role_mr}
                    </span>
                  </div>
                </div>

                <div className="inline-block px-2.5 py-1 bg-saffron-50 dark:bg-saffron-950/60 text-saffron-800 dark:text-saffron-300 text-xs font-bold rounded-lg border border-saffron-200 dark:border-saffron-800 mb-2">
                  योजना: {persona.scheme_name_mr}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {persona.description_mr}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-black text-saffron-600 dark:text-saffron-400">
                <span>{isSelected && isPlaying ? '▶️ सध्या सुरू आहे' : 'हा प्रवास पहा'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Demo Player Container */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-7 border-2 border-slate-300 dark:border-slate-700 shadow-xl space-y-6 animate-fadeIn">
        
        {/* Active Stage & Progress Bar */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-extrabold">
            <span className="text-saffron-700 dark:text-saffron-400 bg-saffron-50 dark:bg-saffron-950 px-3 py-1 rounded-full border border-saffron-300">
              {currentStep.stageName_mr}
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-mono">
              पायरी {currentStepIndex + 1} / {selectedPersona.steps.length} ({progressPercentage}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-saffron-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Live Conversation Simulation Theater */}
        <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 space-y-4 min-h-[220px] flex flex-col justify-center">
          
          {/* Assistant's Spoken Statement */}
          <div className="flex items-start gap-3 animate-fadeIn">
            <div className="w-10 h-10 rounded-xl bg-saffron-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow">
              स
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border-2 border-saffron-200 dark:border-saffron-900 shadow-sm">
              <span className="text-xs font-black text-saffron-700 dark:text-saffron-400 uppercase tracking-wide block mb-1">
                सरकार मित्र (आवाज सहाय्यक):
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed">
                "{currentStep.assistantSpeech}"
              </p>
              {currentStep.assistantConfirm && (
                <p className="mt-2 text-sm font-bold text-amber-800 dark:text-amber-300 pt-2 border-t border-slate-100 dark:border-slate-700">
                  {currentStep.assistantConfirm}
                </p>
              )}
            </div>
          </div>

          {/* Citizen's Simulated Speech Bubble */}
          <div className="flex items-start gap-3 justify-end animate-fadeIn">
            <div className="flex-1 max-w-xl bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-2xl rounded-tr-none border-2 border-emerald-400 dark:border-emerald-700 shadow-sm text-right">
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide block mb-1">
                {selectedPersona.name_mr} (सिम्युलेटेड भाषण):
              </span>
              <p className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-100 leading-relaxed">
                "{currentStep.userSpeech}"
              </p>
              {currentStep.userConfirm && (
                <p className="mt-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                  ✓ {currentStep.userConfirm}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow">
              {selectedPersona.avatar}
            </div>
          </div>

          {/* Live Highlight Tag */}
          {currentStep.highlight && (
            <div className="text-center pt-1">
              <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-black rounded-full border border-amber-300">
                ★ {currentStep.highlight}
              </span>
            </div>
          )}

        </div>

        {/* Audio Waveform Animation (Simulated / Live) */}
        <VoiceWaveVisualizer 
          isListening={false}
          isSpeaking={isPlaying && !isAudioMuted}
          interimText={currentStep.userSpeech}
        />

        {/* Final PDF Preview Step Trigger */}
        {currentStep.screen === 'pdf_preview' && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl space-y-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-black text-emerald-900 dark:text-emerald-200 text-base">
                  पूर्व-अर्ज सारांश (Pre-Application Summary) तयार आहे!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  मसुदा क्रमांक: <strong className="font-mono">SM-DRAFT-849201</strong> (Draft, not a government registration number)
                </p>
              </div>
            </div>

            <p className="text-xs text-red-700 dark:text-red-300 font-bold bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-red-200 dark:border-red-800">
              महत्त्वाची सूचना: ही सरकार मित्रने तयार केलेली पूर्व-अर्ज सारांश पत्रिका आहे. हा अधिकृत शासकीय दस्तऐवज नाही.
            </p>

            <button
              onClick={handleDownloadDemoPDF}
              className="w-full py-3 px-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-base rounded-xl shadow-md flex items-center justify-center gap-2 min-h-[50px] transition-transform active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>{pdfDownloaded ? 'पुन्हा PDF डाऊनलोड करा' : 'डेमो PDF डाऊनलोड करा (Download Sample PDF)'}</span>
            </button>
          </div>
        )}

        {/* Player Controls Bar */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left Playback Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              className="py-2.5 px-4 bg-saffron-600 hover:bg-saffron-700 text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow min-h-[46px]"
              aria-label={isPlaying ? 'डेमो थांबवा' : 'डेमो सुरू करा'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isPlaying ? 'थांबवा (Pause)' : 'सुरू करा (Play)'}</span>
            </button>

            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="p-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 disabled:opacity-40 min-h-[46px] min-w-[46px] flex items-center justify-center"
              title="मागील पायरी"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNextStep}
              disabled={currentStepIndex === selectedPersona.steps.length - 1}
              className="p-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 disabled:opacity-40 min-h-[46px] min-w-[46px] flex items-center justify-center"
              title="पुढील पायरी"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleRestart}
              className="p-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 min-h-[46px] min-w-[46px] flex items-center justify-center"
              title="सुरुवातीपासून पहा"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Right Speed & Audio Controls */}
          <div className="flex items-center gap-2">
            
            {/* Speed Toggle */}
            <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 text-xs font-bold">
              {[1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-2 transition-colors min-h-[44px] ${
                    playbackSpeed === spd 
                      ? 'bg-saffron-600 text-white font-black' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Mute Audio Toggle */}
            <button
              onClick={() => {
                if (!isAudioMuted) stopSpeaking();
                setIsAudioMuted(prev => !prev);
              }}
              className={`p-2.5 border rounded-xl min-h-[46px] min-w-[46px] flex items-center justify-center transition-colors ${
                isAudioMuted
                  ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
              title={isAudioMuted ? 'आवाज सुरू करा' : 'आवाज बंद करा'}
            >
              {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-saffron-600" />}
            </button>

            {/* Switch to Live App Action */}
            <button
              onClick={handleExitToLiveApp}
              className="py-2.5 px-3.5 bg-civic-900 hover:bg-civic-950 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow min-h-[46px]"
            >
              <span>स्वतः अर्ज करा</span>
              <ArrowRight className="w-3.5 h-3.5 text-saffron-400" />
            </button>

          </div>
        </div>

      </div>

      {/* Helpful Civic Instruction Box */}
      <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
        <HelpCircle className="w-5 h-5 text-saffron-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            हा डेमो कसा काम करतो?
          </p>
          <p>
            हा डेमो कोणत्याही मायक्रोफोन परवानगीशिवाय चालतो. यामध्ये नागरिक काय बोलतात (मराठीत) आणि सहाय्यक कसा प्रतिसाद देतो, नियम-आधारित पात्रता कशी तपासली जाते व शेवटी पूर्व-अर्ज सारांश कसा तयार होतो हे थेट ९० सेकंदात पाहता येते.
          </p>
        </div>
      </div>

    </div>
  );
}
