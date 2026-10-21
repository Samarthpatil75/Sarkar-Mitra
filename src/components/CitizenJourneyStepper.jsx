import React, { useEffect, useRef } from 'react';
import { Check, Sparkles, UserCheck, FileText, FileCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function CitizenJourneyStepper({ currentStage }) {
  const { 
    activeScreen, 
    setActiveScreen, 
    selectedScheme, 
    maxReachedStep = 1
  } = useApp();

  const { speak, stopSpeaking } = useSpeech();

  // Show ONLY after the user has chosen a scheme or started the wizard, NEVER on plain home screen or info screens
  const journeyScreens = ['eligibility', 'documents', 'form'];
  if (!journeyScreens.includes(activeScreen)) {
    return null;
  }

  const steps = [
    { 
      id: 'scheme', 
      step: 1, 
      screen: 'home', 
      label: 'योजना निवड', 
      shortLabel: 'योजना', 
      icon: Sparkles,
      announcement: 'आता पायरी १: योजना निवड.' 
    },
    { 
      id: 'eligibility', 
      step: 2, 
      screen: 'eligibility', 
      label: 'पात्रता तपासणी', 
      shortLabel: 'पात्रता', 
      icon: UserCheck,
      announcement: 'आता पायरी २: पात्रता तपासणी.' 
    },
    { 
      id: 'documents', 
      step: 3, 
      screen: 'documents', 
      label: 'कागदपत्रे', 
      shortLabel: 'कागदपत्रे', 
      icon: FileText,
      announcement: 'आता पायरी ३: कागदपत्रे.' 
    },
    { 
      id: 'form', 
      step: 4, 
      screen: 'form', 
      label: 'अर्ज भरणे', 
      shortLabel: 'अर्ज', 
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
        default: return 2;
      }
    }
    switch (activeScreen) {
      case 'home': return 1;
      case 'eligibility': return 2;
      case 'documents': return 3;
      case 'form': return 4;
      default: return Math.min(Math.max(2, maxReachedStep), 4);
    }
  };

  const currentStep = getCurrentStep();
  const currentStepObj = steps.find(s => s.step === currentStep) || steps[1];

  // Track previous step to speak announcement only on step change
  const prevStepRef = useRef(null);

  useEffect(() => {
    if (prevStepRef.current !== null && prevStepRef.current !== currentStep) {
      if (currentStepObj && currentStepObj.announcement) {
        speak(currentStepObj.announcement);
      }
    }
    prevStepRef.current = currentStep;
  }, [currentStep, currentStepObj, speak]);

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

  // Extract short scheme name for compact chip
  const schemeNameChip = selectedScheme 
    ? `${selectedScheme.name_mr.split(' ')[0]} ${selectedScheme.name_mr.split(' ')[1] || ''}`.trim()
    : 'योजना';

  return (
    <nav 
      aria-label="नागरिक ४-पायरी प्रवास"
      className="w-full bg-slate-100/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 transition-colors"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        
        {/* Left: Scheme Name Chip + Compact "पायरी २ / ४ · पात्रता" */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block px-2 py-0.5 text-xs font-black bg-saffron-100 dark:bg-saffron-950/90 text-saffron-900 dark:text-saffron-200 rounded-md border border-saffron-300 dark:border-saffron-700 truncate max-w-[130px] sm:max-w-xs shrink-0">
            {schemeNameChip}
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
            पायरी {currentStep} / ४ · {currentStepObj.shortLabel}
          </span>
        </div>

        {/* Right: 4 Interactive Dots (Reached = Tappable, Locked = Looks Disabled) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" role="list">
          {steps.map((step) => {
            const isReached = step.step <= maxReachedStep;
            const isCurrent = step.step === currentStep;
            const isDone = step.step < currentStep && isReached;

            let dotClass = '';
            if (isCurrent) {
              dotClass = 'w-7 h-7 sm:w-8 sm:h-8 bg-saffron-600 text-white font-black ring-2 ring-saffron-300 dark:ring-saffron-800 shadow-sm';
            } else if (isDone) {
              dotClass = 'w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer';
            } else if (isReached) {
              dotClass = 'w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-400 font-bold cursor-pointer';
            } else {
              // Locked: Looks disabled, no text needed
              dotClass = 'w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 font-bold opacity-45 cursor-not-allowed';
            }

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step)}
                disabled={!isReached}
                aria-disabled={!isReached}
                aria-current={isCurrent ? 'step' : undefined}
                title={
                  !isReached
                    ? `पायरी ${step.step}: ${step.label} (अपूर्ण)`
                    : isCurrent
                    ? `सध्याची पायरी: ${step.label}`
                    : `पायरी ${step.step} वर जा (${step.label})`
                }
                className={`rounded-full flex items-center justify-center text-xs transition-all ${dotClass}`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                ) : (
                  <span>{step.step}</span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </nav>
  );
}
