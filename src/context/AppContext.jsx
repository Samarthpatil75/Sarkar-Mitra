import React, { createContext, useContext, useState, useEffect } from 'react';
import uiTranslations from '../data/uiTranslations.json';
import schemesData from '../data/schemes.json';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Theme state with local storage or system preference
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bolu_ya_theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // UI Language toggle: 'mr' (default) or 'en'
  const [uiLang, setUiLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bolu_ya_lang') || 'mr';
    }
    return 'mr';
  });

  // Low bandwidth mode: text-first, minimal animations, audio on-demand
  const [lowBandwidth, setLowBandwidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bolu_ya_low_bw') === 'true';
    }
    return false;
  });

  // Font Size scaling: 'normal' | 'large' | 'xlarge'
  const [fontSize, setFontSizeState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('sarkar_mitra_font_size') || 'normal';
      }
    } catch (e) {
      console.warn('LocalStorage error reading font size:', e);
    }
    return 'normal';
  });

  const increaseFontSize = () => {
    setFontSizeState(prev => {
      const next = prev === 'normal' ? 'large' : 'xlarge';
      try {
        localStorage.setItem('sarkar_mitra_font_size', next);
      } catch (e) {}
      showToast(next === 'xlarge' ? 'अक्षरांचा आकार खूप मोठा केला (A++)' : 'अक्षरांचा आकार मोठा केला (A+)', 'info');
      return next;
    });
  };

  const decreaseFontSize = () => {
    setFontSizeState(prev => {
      const next = prev === 'xlarge' ? 'large' : 'normal';
      try {
        localStorage.setItem('sarkar_mitra_font_size', next);
      } catch (e) {}
      showToast('अक्षरांचा आकार सामान्य केला (A-)', 'info');
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'xlarge') {
      root.style.fontSize = '18.5px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '17.2px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [fontSize]);

  // One-time Microphone check dialog state
  const [isMicCheckOpen, setIsMicCheckOpen] = useState(false);
  const openMicCheck = () => setIsMicCheckOpen(true);
  const closeMicCheck = () => setIsMicCheckOpen(false);

  // First-launch welcome banner state
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return !localStorage.getItem('sarkar_mitra_welcomed');
      }
    } catch (e) {
      return true;
    }
    return true;
  });

  const dismissWelcomeModal = () => {
    setShowWelcomeModal(false);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sarkar_mitra_welcomed', 'true');
      }
    } catch (e) {}
  };

  // Active Screen: 'home' | 'conversation' | 'eligibility' | 'documents' | 'form' | 'accuracy' | 'about' | 'demo'
  const [activeScreen, setActiveScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('demo') === '1' || window.location.hash.includes('demo')) {
        return 'demo';
      }
    }
    return 'home';
  });

  // Currently selected or focused scheme
  const [selectedScheme, setSelectedScheme] = useState(() => {
    return schemesData.schemes[0]; // default to Ladki Bahin
  });

  // Conversation history for the chat screen
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text_mr: 'नमस्कार! मी "सरकार मित्र" – तुमचा मराठी आवाज सहाय्यक. मी तुम्हाला लाडकी बहीण, पीएम किसान, आयुष्यमान भारत किंवा रेशन कार्ड योजनेची माहिती, पात्रता व अर्ज भरण्यास मदत करू शकतो. बोला, काय माहिती हवी आहे?',
      timestamp: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Flash notification / toast message
  const [toast, setToast] = useState(null);

  // Apply dark mode class to html document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('bolu_ya_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bolu_ya_lang', uiLang);
  }, [uiLang]);

  useEffect(() => {
    localStorage.setItem('bolu_ya_low_bw', lowBandwidth);
  }, [lowBandwidth]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setUiLang(prev => prev === 'mr' ? 'en' : 'mr');
  };

  const toggleLowBandwidth = () => {
    setLowBandwidth(prev => !prev);
    showToast(!lowBandwidth ? 'कमी डेटा मोड सुरू झाला (ऑडिओ फक्त दाबावर वाजेल)' : 'सामान्य डेटा मोड सुरू झाला');
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const addMessage = (message) => {
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' }),
        ...message
      }
    ]);
  };

  const t = (key) => {
    const langDict = uiTranslations[uiLang] || uiTranslations.mr;
    return langDict[key] || uiTranslations.mr[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        uiLang,
        setUiLang,
        toggleLanguage,
        lowBandwidth,
        toggleLowBandwidth,
        activeScreen,
        setActiveScreen,
        selectedScheme,
        setSelectedScheme,
        messages,
        setMessages,
        addMessage,
        toast,
        showToast,
        t,
        schemes: schemesData.schemes,
        officialNotice: schemesData.notice,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        isMicCheckOpen,
        openMicCheck,
        closeMicCheck,
        showWelcomeModal,
        dismissWelcomeModal
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
