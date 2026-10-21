import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SpeechProvider, useSpeech } from './context/SpeechContext';
import Navbar from './components/Navbar';
import PersistentMicBar from './components/PersistentMicBar';

import HomeScreen from './screens/HomeScreen';
import ConversationScreen from './screens/ConversationScreen';
import EligibilityScreen from './screens/EligibilityScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import VoiceFormScreen from './screens/VoiceFormScreen';
import AboutHelpScreen from './screens/AboutHelpScreen';
import AccuracyTestScreen from './screens/AccuracyTestScreen';
import DemoScreen from './screens/DemoScreen';
import FirstLaunchWelcomeModal from './components/FirstLaunchWelcomeModal';
import MicCheckModal from './components/MicCheckModal';

function MainApp() {
  const { activeScreen, toast, isOffline } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-warmbg-light dark:bg-warmbg-dark selection:bg-saffron-200 selection:text-saffron-900 transition-colors">
      
      {/* Offline Notice Banner (Visible when offline) */}
      {isOffline && (
        <aside 
          role="alert" 
          aria-live="assertive"
          className="bg-red-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-2 border-b-2 border-red-800 shadow-md sticky top-0 z-50 animate-fadeIn"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
          <span>🔴 ऑफलाइन — आवाज ओळख बंद, बटणे वापरा</span>
        </aside>
      )}
      
      {/* Demo Mode Ribbon (Always visible when in demo mode) */}
      {activeScreen === 'demo' && (
        <aside 
          aria-label="डेमो मोड सूचना"
          className="bg-amber-400 text-slate-950 px-4 py-2 text-center text-[14px] font-black tracking-wide flex items-center justify-center gap-2 border-b-2 border-amber-500 shadow-sm sticky top-0 z-50"
        >
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          <span>🟡 डेमो मोड (Demo Mode) • सिम्युलेटेड प्रात्यक्षिक डेटा • Not real user data</span>
        </aside>
      )}

      {/* Accessibility Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-saffron-600 text-white font-bold rounded-xl shadow-lg"
      >
        मुख्य मजकुराकडे जा (Skip to main content)
      </a>

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 pt-4 sm:pt-6">
        {activeScreen === 'home' && <HomeScreen />}
        {activeScreen === 'demo' && <DemoScreen />}
        {activeScreen === 'conversation' && <ConversationScreen />}
        {activeScreen === 'eligibility' && <EligibilityScreen />}
        {activeScreen === 'documents' && <DocumentsScreen />}
        {activeScreen === 'form' && <VoiceFormScreen />}
        {activeScreen === 'accuracy' && <AccuracyTestScreen />}
        {activeScreen === 'about' && <AboutHelpScreen />}
      </main>

      {/* Persistent Bottom Voice / Mic Bar */}
      <PersistentMicBar />

      {/* First Launch Spoken Welcome Modal */}
      <FirstLaunchWelcomeModal />

      {/* One-Time Microphone Check Modal */}
      <MicCheckModal />

      {/* Toast Notification */}
      {toast && (
        <div 
          role="status" 
          aria-live="polite"
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl font-bold text-sm max-w-sm border animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : toast.type === 'warning'
              ? 'bg-amber-500 text-white border-amber-600'
              : toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-slate-900 text-white border-slate-700 dark:bg-white dark:text-slate-900'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SpeechProvider>
        <MainApp />
      </SpeechProvider>
    </AppProvider>
  );
}
