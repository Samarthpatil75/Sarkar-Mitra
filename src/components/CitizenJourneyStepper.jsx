import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Lock, Sparkles, UserCheck, FileText, FileCheck, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function CitizenJourneyStepper({ currentStage }) {
  const { 
    activeScreen, 
    setActiveScreen, 
    selectedScheme, 
    maxReachedStep = 1,
    unlockStep 
  } = useApp();

  const { speak, stopSpeaking } = useSpeech();

  const steps = [
    { 
      id: 'scheme', 
      step: 1, 
      screen: 'home', 
      label: '१. योजना निवड', 
      shortLabel: '१. योजना', 
      icon: Sparkles,
      announcement: 'आता पायरी १: योजना निवड.' 
    },
    { 
      id: 'eligibility', 
      step: 2, 
      screen: 'eligibility', 
      label: '२. पात्रता', 
      shortLabel: '२. पात्रता', 
      icon: UserCheck,
      announcement: 'आता पायरी २: पात्रता तपासणी.' 
    },
    { 
      id: 'documents', 
      step: 3, 
      screen: 'documents', 
      label: '३. कागदपत्रे', 
      shortLabel: '३. कागदपत्रे', 
      icon: FileText,
      announcement: 'आता पायरी ३: कागदपत्रे.' 
    },
    { 
      id: 'form', 
      step: 4, 
      screen: 'form', 
      label: '४. अर्ज', 
      shortLabel: '४. अर्ज', 
      icon: FileCheck,
      announcement: 'आता पायरी ४: अर्ज.' 
    },
  ];

  // Resolve current active step index (1-based)
  const getCurrentStep = () => {
    if (currentStage) {
      switch (currentStage) {
        case 'scheme': case 'home': return 1;
        case 'eligibility': return 2;
        case 'documents': return 3;
        case 'form': return 4;
        default: return 1;
      }
    }
    switch (activeScreen) {
      case 'home': return 1;
      case 'eligibility': return 2;
      case 'documents': return 3;
      case 'form': return 4;
      default: return Math.min(Math.max(1, maxReachedStep), 4);
    }
  };

  const currentStep = getCurrentStep();

  // Track previous step to speak announcement only on step change
  const prevStepRef = useRef(null);

  useEffect(() => {
    // If not first render and step actually changed, announce spoken step
    if (prevStepRef.current !== null && prevStepRef.current !== currentStep) {
      const stepObj = steps.find(s => s.step === currentStep);
      if (stepObj && stepObj.announcement) {
        speak(stepObj.announcement);
      }
    }
    prevStepRef.current = currentStep;
  }, [currentStep, speak]);

  const handleStepClick = (step) => {
    // Tappable only if already reached
    if (step.step > maxReachedStep) {
      return;
    }
    if (step.screen === activeScreen && step.step === currentStep) {
      return;
    }
    stopSpeaking();
    setActiveScreen(step.screen);
  };

  return (
    <nav 
      aria-label="नागरिक एकात्मिक ४-पायरी प्रवास (4-Step Citizen Journey)"
      className="w-full bg-slate-50/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 shadow-xs px-2 sm:px-4 py-2 transition-colors"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-saffron-600 animate-pulse flex-shrink-0"></span>
          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
            नागरिक प्रवास:
          </span>
          {selectedScheme && (
            <span className="inline-block px-2 py-0.5 text-xs font-bold bg-saffron-100 dark:bg-saffron-950/80 text-saffron-900 dark:text-saffron-300 rounded-md truncate max-w-[200px] sm:max-w-xs border border-saffron-300 dark:border-saffron-800">
              {selectedScheme.name_mr.split(' ')[0]} {selectedScheme.name_mr.split(' ')[1] || ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 dark:text-slate-400 font-bold">
          <span>पायरी {currentStep} / ४</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            (केवळ गाठलेल्या पायऱ्या उघडता येतात)
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-4 gap-1.5 sm:gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isReached = step.step <= maxReachedStep;
          const isCurrent = step.step === currentStep;
          const isDone = step.step < currentStep && isReached;

          let btnClass = '';
          if (isCurrent) {
            btnClass = 'bg-saffron-600 hover:bg-saffron-700 text-white border-saffron-600 shadow-md ring-2 ring-saffron-400/80 font-black cursor-pointer';
          } else if (isDone) {
            btnClass = 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-bold cursor-pointer';
          } else if (isReached) {
            // Reached in a past step but current is before it (e.g. user went back)
            btnClass = 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200 font-bold cursor-pointer';
          } else {
            // Not reached yet - disabled and locked
            btnClass = 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-55 cursor-not-allowed';
          }

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step)}
              disabled={!isReached}
              aria-disabled={!isReached}
              aria-current={isCurrent ? 'step' : undefined}
              title={
                !isReached
                  ? `पायरी ${step.step}: आधी मागील पायऱ्या पूर्ण करा (Locked)`
                  : isCurrent
                  ? `पायरी ${step.step}: सध्याची पायरी (${step.label})`
                  : `पायरी ${step.step} वर जा (${step.label})`
              }
              className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition-all min-h-[44px] sm:min-h-[48px] border text-left ${btnClass}`}
            >
              <div className="flex-shrink-0">
                {isCurrent ? (
                  <Icon className="w-4 h-4 text-white animate-pulse" />
                ) : isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : isReached ? (
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="hidden sm:inline text-xs sm:text-sm font-extrabold truncate block">
                  {step.label}
                </span>
                <span className="sm:hidden text-xs font-bold truncate block">
                  {step.shortLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
