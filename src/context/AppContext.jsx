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

  // Active Screen: 'home' | 'conversation' | 'eligibility' | 'documents' | 'form' | 'accuracy' | 'about'
  const [activeScreen, setActiveScreen] = useState('home');

  // Currently selected or focused scheme
  const [selectedScheme, setSelectedScheme] = useState(() => {
    return schemesData.schemes[0]; // default to Ladki Bahin
  });

  // Conversation history for the chat screen
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text_mr: 'नमस्कार! मी "बोलू या" – तुमचा मराठी आवाज सहाय्यक. मी तुम्हाला लाडकी बहीण, पीएम किसान, आयुष्यमान भारत किंवा रेशन कार्ड योजनेची माहिती, पात्रता व अर्ज भरण्यास मदत करू शकतो. बोला, काय माहिती हवी आहे?',
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
        officialNotice: schemesData.notice
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
