import React, { useState } from 'react';
import { 
  Volume2, 
  Wifi, 
  WifiOff, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  HelpCircle, 
  CheckSquare, 
  FileText, 
  MessageSquare, 
  Home, 
  BarChart2, 
  Languages 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';

export default function Navbar() {
  const { 
    theme, 
    toggleTheme, 
    uiLang, 
    toggleLanguage, 
    lowBandwidth, 
    toggleLowBandwidth, 
    activeScreen, 
    setActiveScreen,
    t 
  } = useApp();

  const { isSpeaking, stopSpeaking } = useSpeech();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'conversation', label: t('nav_conversation'), icon: MessageSquare },
    { id: 'eligibility', label: t('nav_eligibility'), icon: CheckSquare },
    { id: 'documents', label: t('nav_documents'), icon: FileText },
    { id: 'form', label: t('nav_form'), icon: FileText },
    { id: 'accuracy', label: t('nav_accuracy'), icon: BarChart2 },
    { id: 'about', label: t('nav_about'), icon: HelpCircle },
  ];

  const handleNavClick = (id) => {
    setActiveScreen(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-saffron-500 shadow-sm transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left focus:outline-none focus:ring-4 focus:ring-saffron-400 rounded-lg p-1 group"
          aria-label="बोलू या मुख्य पान"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-saffron-600 to-civic-800 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-2xl tracking-tighter">बो</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-civic-950 dark:text-white tracking-wide">
                बोलू या <span className="text-saffron-600 dark:text-saffron-400 text-lg font-bold">| Bolu Ya</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-saffron-100 dark:bg-saffron-950/60 text-saffron-800 dark:text-saffron-300 rounded-full border border-saffron-300">
                मराठी-First
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              बोला, सरकारी योजना समजून घ्या.
            </p>
          </div>
        </button>

        {/* Accessibility & Mode Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Speaking Audio Stop Indicator */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1.5 px-3 py-2 bg-saffron-500 hover:bg-saffron-600 text-white text-sm font-semibold rounded-full animate-pulse min-h-[48px] focus:ring-4 focus:ring-saffron-300"
              aria-label="आवाज थांबवा"
              title="आवाज थांबवा"
            >
              <Volume2 className="w-5 h-5" />
              <span className="hidden md:inline">थांबवा</span>
            </button>
          )}

          {/* Low Bandwidth Toggle */}
          <button
            onClick={toggleLowBandwidth}
            className={`p-2.5 rounded-xl border flex items-center gap-1 min-h-[48px] min-w-[48px] justify-center transition-colors focus:ring-4 focus:ring-saffron-400 ${
              lowBandwidth 
                ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950/70 dark:border-amber-600 dark:text-amber-200' 
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            aria-label={lowBandwidth ? 'कमी डेटा मोड सुरू आहे' : 'सामान्य डेटा मोड'}
            title={lowBandwidth ? 'कमी डेटा मोड (चालू)' : 'कमी डेटा मोड चालू करा'}
          >
            {lowBandwidth ? <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" /> : <Wifi className="w-5 h-5" />}
            <span className="hidden lg:inline text-xs font-semibold">
              {lowBandwidth ? 'कमी डेटा' : 'डेटा'}
            </span>
          </button>

          {/* Language Toggle (UI Labels: mr/en) */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm min-h-[48px] min-w-[48px] flex items-center gap-1 text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-saffron-400 transition-colors"
            aria-label="भाषा बदला (मराठी / English)"
            title="UI भाषा बदला"
          >
            <Languages className="w-4 h-4 text-saffron-600" />
            <span>{uiLang === 'mr' ? 'English' : 'मराठी'}</span>
          </button>

          {/* Dark / Light Mode */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 min-h-[48px] min-w-[48px] flex items-center justify-center focus:ring-4 focus:ring-saffron-400 transition-colors"
            aria-label={theme === 'dark' ? 'प्रकाश मोड लावा' : 'गडद मोड लावा'}
            title={theme === 'dark' ? 'प्रकाश मोड' : 'गडद मोड'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Mobile Navigation Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 min-h-[48px] min-w-[48px] flex items-center justify-center focus:ring-4 focus:ring-saffron-400 transition-colors"
            aria-label="मेनू उघडा"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Sub-navigation Pills */}
      <nav className="hidden md:flex border-t border-slate-200 dark:border-slate-800 px-4 py-2 bg-slate-50/80 dark:bg-slate-900/50 overflow-x-auto justify-center gap-2" aria-label="मुख्य नेव्हिगेशन">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-saffron-500 ${
                isActive
                  ? 'bg-civic-900 text-white dark:bg-saffron-600 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2 shadow-xl animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-left transition-colors min-h-[48px] ${
                  isActive
                    ? 'bg-saffron-500 text-white'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
