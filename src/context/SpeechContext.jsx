import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import speechRecognizer from '../services/speechRecognition';
import speechSynthesizer from '../services/speechSynthesis';
import { parseIntent, detectScheme } from '../services/intentParser';
import { useApp } from './AppContext';

const SpeechContext = createContext();

export function SpeechProvider({ children }) {
  const {
    lowBandwidth,
    activeScreen,
    setActiveScreen,
    selectedScheme,
    setSelectedScheme,
    addMessage,
    showToast,
    t
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [micStatus, setMicStatus] = useState('idle'); // 'idle' | 'listening' | 'denied' | 'unsupported' | 'processing'
  const [errorMessage, setErrorMessage] = useState(null);

  // Active custom input handler hook for wizard screens (e.g. eligibility or form filling)
  const screenVoiceHandlerRef = useRef(null);

  // Speech support flags
  const isSpeechSupported = speechRecognizer.isSupported();
  const isTtsSupported = speechSynthesizer.isSupported();

  // Register screen-specific voice handler (for wizard step answers like "होय", "28", "नाही")
  const registerVoiceHandler = useCallback((handler) => {
    screenVoiceHandlerRef.current = handler;
    return () => {
      if (screenVoiceHandlerRef.current === handler) {
        screenVoiceHandlerRef.current = null;
      }
    };
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!text) return;
    setIsSpeaking(true);
    speechSynthesizer.speak(text, {
      lowBandwidth,
      force: options.force || false,
      onStart: () => {
        setIsSpeaking(true);
        if (options.onStart) options.onStart();
      },
      onEnd: () => {
        setIsSpeaking(false);
        if (options.onEnd) options.onEnd();
      },
      onError: (err) => {
        setIsSpeaking(false);
        console.warn('TTS error:', err);
        if (options.onError) options.onError(err);
      }
    });
  }, [lowBandwidth]);

  const stopSpeaking = useCallback(() => {
    speechSynthesizer.stop();
    setIsSpeaking(false);
  }, []);

  // Process text entered either via voice or manual typing box
  const processInput = useCallback((rawText) => {
    if (!rawText || !rawText.trim()) return;
    const text = rawText.trim();

    // Check if an active wizard screen has registered a step-level handler
    if (screenVoiceHandlerRef.current) {
      const handled = screenVoiceHandlerRef.current(text);
      if (handled) {
        return;
      }
    }

    // Default global NLP intent parser
    const parsed = parseIntent(text, selectedScheme);

    // Add user message to conversation history
    addMessage({
      sender: 'user',
      text_mr: text
    });

    // Update selected scheme if recognized
    if (parsed.scheme) {
      setSelectedScheme(parsed.scheme);
    }

    // Prepare assistant response
    const assistantMsg = {
      sender: 'assistant',
      text_mr: parsed.reply_mr,
      scheme: parsed.scheme || selectedScheme,
      link: parsed.link,
      link_text: parsed.link_text,
      action: parsed.action
    };

    addMessage(assistantMsg);

    // Speak reply aloud (unless low bandwidth mode is on and not forced)
    speak(parsed.reply_mr);

    // Perform navigation actions based on intent
    if (parsed.action === 'navigate_eligibility') {
      setActiveScreen('eligibility');
    } else if (parsed.action === 'navigate_documents') {
      setActiveScreen('documents');
    } else if (parsed.action === 'navigate_form') {
      setActiveScreen('form');
    } else if (parsed.action === 'navigate_home') {
      setActiveScreen('home');
    } else if (parsed.action === 'navigate_about') {
      setActiveScreen('about');
    } else {
      // If we are currently on Home and user asked something conversational, take them to conversation screen
      if (activeScreen === 'home') {
        setActiveScreen('conversation');
      }
    }
  }, [selectedScheme, addMessage, speak, setActiveScreen, activeScreen, setSelectedScheme]);

  const startListening = useCallback(() => {
    if (!isSpeechSupported) {
      showToast(t('speech_unsupported'), 'warning');
      setMicStatus('unsupported');
      return;
    }

    // Stop speaking before starting to listen to prevent echo
    stopSpeaking();

    setInterimTranscript('');
    setFinalTranscript('');
    setErrorMessage(null);

    const started = speechRecognizer.start({
      onStart: () => {
        setIsListening(true);
        setMicStatus('listening');
      },
      onResult: ({ interim, final }) => {
        setInterimTranscript(interim);
        if (final) {
          setFinalTranscript(final);
          setInterimTranscript('');
          setIsListening(false);
          setMicStatus('processing');
          processInput(final);
        }
      },
      onError: (error) => {
        setIsListening(false);
        if (error === 'not-allowed') {
          setMicStatus('denied');
          setErrorMessage(t('mic_denied_warning'));
          showToast(t('mic_denied_warning'), 'error');
        } else if (error === 'no-speech') {
          setMicStatus('idle');
        } else {
          setMicStatus('idle');
          console.warn('Speech recognition warning:', error);
        }
      },
      onEnd: (lastInterim) => {
        setIsListening(false);
        if (micStatus === 'listening') {
          setMicStatus('idle');
        }
        // If there was an interim phrase that didn't fire final
        if (lastInterim && lastInterim.trim().length > 1) {
          processInput(lastInterim.trim());
        }
      }
    });

    if (!started) {
      setIsListening(false);
      setMicStatus('idle');
    }
  }, [isSpeechSupported, showToast, t, stopSpeaking, processInput, micStatus]);

  const stopListening = useCallback(() => {
    speechRecognizer.stop();
    setIsListening(false);
    setMicStatus('idle');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening]);

  return (
    <SpeechContext.Provider
      value={{
        isListening,
        isSpeaking,
        interimTranscript,
        finalTranscript,
        micStatus,
        errorMessage,
        isSpeechSupported,
        isTtsSupported,
        startListening,
        stopListening,
        toggleListening,
        speak,
        stopSpeaking,
        processInput,
        registerVoiceHandler
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
}
