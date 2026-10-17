import React from 'react';
import { CheckCircle2, ChevronRight, FileCheck, FileText, Sparkles, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CitizenJourneyStepper({ currentStage }) {
  // currentStage: 'scheme' (1) | 'eligibility' (2) | 'documents' (3) | 'form' (4)
  const { setActiveScreen, selectedScheme } = useApp();

  const steps = [
    { id: 'scheme', screen: 'home', label: '१. योजना निवड', icon: Sparkles },
    { id: 'eligibility', screen: 'eligibility', label: '२. पात्रता तपासणी', icon: UserCheck },
    { id: 'documents', screen: 'documents', label: '३. कागदपत्रे यादी', icon: FileText },
    { id: 'form', screen: 'form', label: '४. अर्ज व PDF', icon: FileCheck },
  ];

  const getStageIndex = (stage) => {
    switch (stage) {
      case 'scheme': return 0;
      case 'eligibility': return 1;
      case 'documents': return 2;
      case 'form': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <nav 
      aria-label="नागरिक एकात्मिक प्रवास (End-to-End Citizen Journey)"
      className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-sm mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-saffron-600 animate-pulse"></span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
            नागरिक प्रवास (End-to-End Journey):
          </span>
          {selectedScheme && (
            <span className="hidden md:inline px-2 py-0.5 text-xs font-bold bg-saffron-100 dark:bg-saffron-950 text-saffron-800 dark:text-saffron-300 rounded-md">
              {selectedScheme.name_mr.split(' ')[0]} {selectedScheme.name_mr.split(' ')[1] || ''}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          पायरी {currentIndex + 1} / ४
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={step.id}
              onClick={() => setActiveScreen(step.screen)}
              className={`p-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all min-h-[48px] text-left border ${
                isCurrent
                  ? 'bg-saffron-50 dark:bg-saffron-950/70 border-saffron-500 text-saffron-900 dark:text-saffron-200 shadow-sm ring-2 ring-saffron-300 dark:ring-saffron-800'
                  : isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-80'
              }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-saffron-600 dark:text-saffron-400 animate-bounce' : 'text-slate-400'}`} />
                )}
              </div>
              <span className="truncate">{step.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
