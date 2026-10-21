import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX,
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
  Languages,
  PlayCircle,
  Mic,
  Smartphone,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSpeech } from '../context/SpeechContext';
import CitizenJourneyStepper from './CitizenJourneyStepper';

export default function Navbar() {
  const { 
    theme, 
    toggleTheme, 
    uiLang, 
    toggleLanguage, 
    lowBandwidth, 
    setLowBandwidthMode, 
    activeScreen, 
    setActiveScreen,
    fontSize,
    setFontSize,
    openMicCheck,
    isAppInstalled,
    installPWA,
    t 
  } = useApp();

  const { 
    stopSpeaking, 
    speechSpeed,
    setSpeechSpeed,
    autoSpeakAnswers,
    setAutoSpeakAnswers
  } = useSpeech();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // 5 Main Navigation Items (Demo, Accuracy, About moved to ☰ menu)
  const navItems = [
    { id: 'home', label: t('nav_home') || 'मुख्य पान', shortLabel: 'मुख्य', icon: Home },
    { id: 'conversation', label: t('nav_conversation') || 'संभाषण', shortLabel: 'संभाषण', icon: MessageSquare },
    { id: 'eligibility', label: t('nav_eligibility') || 'पात्रता', shortLabel: 'पात्रता', icon: CheckSquare },
    { id: 'documents', label: t('nav_documents') || 'कागदपत्रे', shortLabel: 'कागदपत्रे', icon: FileText },
    { id: 'form', label: t('nav_form') || 'फॉर्म भरा', shortLabel: 'अर्ज', icon: FileText },
  ];

  const handleNavClick = (id) => {
    stopSpeaking();
    setActiveScreen(id);
    setMenuOpen(false);
  };

  const handleLanguageToggle = () => {
    stopSpeaking();
    toggleLanguage();
  };

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        if (menuButtonRef.current) {
          menuButtonRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // Focus trap for accessibility when menu is open
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      const focusableElements = menuRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };

      const currentMenuRef = menuRef.current;
      currentMenuRef.addEventListener('keydown', handleTabKey);
      return () => {
        currentMenuRef.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-saffron-500 shadow-xs transition-colors">
        {/* Row 1: Slim Header (At most 4 visible controls on mobile) */}
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
          
          {/* 1. Brand Logo + Name (Left) */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-4 focus:ring-saffron-400 rounded-xl p-1 group min-h-[48px]"
            aria-label="सरकार मित्र मुख्य पान"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-saffron-600 to-civic-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <span className="font-black text-xl tracking-tighter">स</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-civic-950 dark:text-white tracking-tight truncate leading-none">
                सरकार मित्र <span className="text-saffron-600 dark:text-saffron-400 font-extrabold text-xs sm:text-sm">| Sarkar Mitra</span>
              </h1>
            </div>
          </button>

          {/* Right Controls: Exactly 3 buttons (Total 4 in header: Brand, Lang, Theme, Menu) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* 2. Language Toggle (मराठी / English) */}
            <button
              type="button"
              onClick={handleLanguageToggle}
              className="px-2.5 sm:px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-black text-xs sm:text-sm min-h-[48px] min-w-[48px] flex items-center justify-center gap-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-saffron-400 transition-colors"
              aria-label="भाषा बदला (मराठी / English)"
              title="UI भाषा बदला"
            >
              <Languages className="w-4 h-4 text-saffron-600 shrink-0" />
              <span className="text-xs sm:text-sm font-extrabold">{uiLang === 'mr' ? 'English' : 'मराठी'}</span>
            </button>

            {/* 3. Theme Toggle (Sun / Moon) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 min-h-[48px] min-w-[48px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-saffron-400 transition-colors"
              aria-label={theme === 'dark' ? 'प्रकाश मोड लावा' : 'गडद मोड लावा'}
              title={theme === 'dark' ? 'प्रकाश मोड' : 'गडद मोड'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {/* 4. ☰ Menu Button */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(prev => !prev)}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[48px] min-w-[48px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-saffron-400 transition-colors cursor-pointer"
              aria-label="मेनू"
              aria-expanded={menuOpen}
              title="मेनू आणि सेटिंग्ज"
            >
              {menuOpen ? <X className="w-6 h-6 text-red-600" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Row 2: Main Navigation Bar (5 Items: मुख्य, संभाषण, पात्रता, कागदपत्रे, फॉर्म भरा) */}
        <nav 
          className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-1 sm:px-4 py-1"
          aria-label="मुख्य नेव्हिगेशन"
        >
          <div className="max-w-5xl mx-auto grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all min-h-[48px] text-center focus:outline-none focus:ring-2 focus:ring-saffron-500 cursor-pointer ${
                    isActive
                      ? 'bg-civic-900 text-white dark:bg-saffron-600 shadow-sm font-black'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 font-bold'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[11px] sm:text-sm font-extrabold tracking-tight truncate">
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Row 3: Journey Progress Strip (Shown only after scheme chosen / wizard started, never on plain home) */}
        <CitizenJourneyStepper />
      </header>

      {/* ☰ Slide-over Drawer (Desktop) & Bottom Sheet (Mobile) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer / Bottom Sheet Container */}
          <div 
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="मेनू आणि सेटिंग्ज"
            className="relative z-10 w-full md:w-96 max-w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-auto max-h-[90vh] md:max-h-full md:h-full self-end md:self-stretch rounded-t-3xl md:rounded-none border-t-2 md:border-t-0 md:border-l-2 border-saffron-500 overflow-hidden animate-slideUp md:animate-slideLeft"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-saffron-500 flex items-center justify-center text-white font-black text-sm">
                  स
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  मेनू आणि सेटिंग्ज
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors"
                aria-label="मेनू बंद करा"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Body - 4 Grouped Sections */}
            <div className="p-4 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">

              {/* Group 1: वाचन आणि आवाज */}
              <section aria-labelledby="heading-reading-voice" className="space-y-3">
                <h3 id="heading-reading-voice" className="text-xs font-black text-saffron-800 dark:text-saffron-400 uppercase tracking-wider px-1">
                  वाचन आणि आवाज
                </h3>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  
                  {/* 1.1 A- / A+ Text Size */}
                  <div className="flex items-center justify-between min-h-[48px]">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      अक्षरांचा आकार (Text Size)
                    </span>
                    <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => setFontSize('normal')}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg min-h-[44px] min-w-[44px] transition-colors ${
                          fontSize === 'normal'
                            ? 'bg-saffron-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title="सामान्य आकार"
                      >
                        A
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontSize('large')}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg min-h-[44px] min-w-[44px] transition-colors ${
                          fontSize === 'large'
                            ? 'bg-saffron-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title="मोठा आकार"
                      >
                        A+
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontSize('xlarge')}
                        className={`px-3 py-2 text-xs font-extrabold rounded-lg min-h-[44px] min-w-[44px] transition-colors ${
                          fontSize === 'xlarge'
                            ? 'bg-saffron-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title="खूप मोठा आकार"
                      >
                        A++
                      </button>
                    </div>
                  </div>

                  {/* 1.2 आवाजाचा वेग (हळू / सामान्य / जलद) */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        आवाजाचा वेग (Speech Speed)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'slow', label: '🐢 हळू' },
                        { id: 'normal', label: '🗣️ सामान्य' },
                        { id: 'fast', label: '⚡ जलद' }
                      ].map((spd) => (
                        <button
                          key={spd.id}
                          type="button"
                          onClick={() => setSpeechSpeed(spd.id)}
                          className={`py-2 px-2 rounded-xl text-xs font-extrabold min-h-[48px] flex items-center justify-center transition-all ${
                            speechSpeed === spd.id
                              ? 'bg-saffron-600 text-white shadow-sm ring-2 ring-saffron-300 dark:ring-saffron-900'
                              : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {spd.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 1.3 "उत्तर ऐका" On/Off Switch (Default ON) */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => setAutoSpeakAnswers(!autoSpeakAnswers)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors min-h-[48px] text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {autoSpeakAnswers ? (
                          <Volume2 className="w-5 h-5 text-saffron-600 shrink-0" />
                        ) : (
                          <VolumeX className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            उत्तर ऐका (Auto-read)
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            प्रश्ने व उत्तरे आपोआप आवाजात ऐका
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs rounded-full font-black ${
                        autoSpeakAnswers 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {autoSpeakAnswers ? 'चालू' : 'बंद'}
                      </span>
                    </button>
                  </div>

                  {/* 1.4 माइक तपासा */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openMicCheck();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-saffron-100/60 dark:hover:bg-slate-700/50 transition-colors min-h-[48px] text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Mic className="w-5 h-5 text-saffron-600 group-hover:scale-110 transition-transform shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            माइक तपासा (Mic Check)
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            "नमस्कार" बोलून आवाजाची चाचणी घ्या
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-saffron-700 dark:text-saffron-400">
                        तपासा 👉
                      </span>
                    </button>
                  </div>

                </div>
              </section>

              {/* Group 2: डेटा आणि अॅप */}
              <section aria-labelledby="heading-data-app" className="space-y-3">
                <h3 id="heading-data-app" className="text-xs font-black text-saffron-800 dark:text-saffron-400 uppercase tracking-wider px-1">
                  डेटा आणि अॅप
                </h3>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  
                  {/* 2.1 कमी डेटा मोड Switch */}
                  <button
                    type="button"
                    onClick={() => setLowBandwidthMode(!lowBandwidth)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors min-h-[48px] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {lowBandwidth ? (
                        <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
                      ) : (
                        <Wifi className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          कमी डेटा मोड (Low Bandwidth)
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          कमी इंटरनेट वापरासाठी अॅनिमेशन मर्यादित करा
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs rounded-full font-black ${
                      lowBandwidth 
                        ? 'bg-amber-500 text-slate-950 font-black' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {lowBandwidth ? 'चालू' : 'बंद'}
                    </span>
                  </button>

                  {/* 2.2 होम स्क्रीनवर जोडा (PWA Install Button - only when available) */}
                  {!isAppInstalled && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          installPWA();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-saffron-600 to-amber-600 text-white min-h-[48px] text-left cursor-pointer shadow-sm hover:from-saffron-700 hover:to-amber-700 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Smartphone className="w-5 h-5 text-white shrink-0" />
                          <div>
                            <div className="text-sm font-black leading-tight">
                              होम स्क्रीनवर जोडा
                            </div>
                            <div className="text-xs text-amber-100">
                              मोबाईलवर ॲपप्रमाणे वापरा
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-xs bg-white/20 rounded-md font-bold">
                          इन्स्टॉल
                        </span>
                      </button>
                    </div>
                  )}

                </div>
              </section>

              {/* Group 3: मदत */}
              <section aria-labelledby="heading-help" className="space-y-3">
                <h3 id="heading-help" className="text-xs font-black text-saffron-800 dark:text-saffron-400 uppercase tracking-wider px-1">
                  मदत
                </h3>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  
                  {/* 3.1 डेमो पहा */}
                  <button
                    type="button"
                    onClick={() => handleNavClick('demo')}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors min-h-[48px] text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <PlayCircle className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          डेमो पहा (Live Demo)
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          ९० सेकंदांचे स्वयंचलित प्रात्यक्षिक
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      सुरू करा 👉
                    </span>
                  </button>

                  {/* 3.2 माहिती व मदत */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => handleNavClick('about')}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors min-h-[48px] text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <HelpCircle className="w-5 h-5 text-civic-700 dark:text-civic-400 group-hover:scale-110 transition-transform shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            माहिती व मदत (About & Help)
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            GR संदर्भ, वापरण्याच्या सूचना व संपर्क
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        पहा 👉
                      </span>
                    </button>
                  </div>

                </div>
              </section>

              {/* Group 4: स्वयंसेवकांसाठी */}
              <section aria-labelledby="heading-volunteers" className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <h3 id="heading-volunteers" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-2">
                  स्वयंसेवकांसाठी
                </h3>

                <button
                  type="button"
                  onClick={() => handleNavClick('accuracy')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-left transition-colors min-h-[48px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      अचूकता चाचणी (Accuracy Test)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    चाचणी घ्या →
                  </span>
                </button>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
