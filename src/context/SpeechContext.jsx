import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import speechRecognizer from '../services/speechRecognition';
import audioController from '../services/audioController';
import { parseIntent } from '../services/intentParser';
import { isStopIntent } from '../services/marathiVoiceMatcher';
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
  const [isSpeaking, setIsSpeaking] = useState(() => audioController.isSpeaking);
  const [currentId, setCurrentId] = useState(() => audioController.currentId);
  const [lastSpoken, setLastSpoken] = useState(() => audioController.lastSpoken);
  const [wasStoppedByUser, setWasStoppedByUser] = useState(() => audioController.wasStoppedByUser);

  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [micStatus, setMicStatus] = useState('idle'); // 'idle' | 'listening' | 'denied' | 'unsupported' | 'processing'
  const [errorMessage, setErrorMessage] = useState(null);

  // Subscribe to central audioController state changes
  useEffect(() => {
    const unsubscribe = audioController.subscribe((state) => {
      setIsSpeaking(state.isSpeaking);
      setCurrentId(state.currentId);
      setLastSpoken(state.lastSpoken);
      setWasStoppedByUser(state.wasStoppedByUser);

      if (state.userInitiated && state.wasSpeaking) {
        showToast('आवाज थांबवला', 'info');
      }
    });

    return () => unsubscribe();
  }, [showToast]);

  // Speech speed control: 'slow' | 'normal' | 'fast' (saved in localStorage inside try/catch)
  const [speechSpeed, setSpeechSpeedState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('sarkar_mitra_speech_speed') || 'normal';
      }
    } catch (e) {
      console.warn('LocalStorage read error for speech speed:', e);
    }
    return 'normal';
  });

  const setSpeechSpeed = useCallback((newSpeed) => {
    setSpeechSpeedState(newSpeed);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sarkar_mitra_speech_speed', newSpeed);
      }
    } catch (e) {
      console.warn('LocalStorage write error for speech speed:', e);
    }
    const label = newSpeed === 'slow' ? 'हळू' : newSpeed === 'fast' ? 'जलद' : 'सामान्य';
    showToast(`आवाजाची गती: ${label}`, 'info');
  }, [showToast]);

  // Auto-speak answers toggle: 'उत्तर ऐका' (persisted in localStorage inside try/catch)
  const [autoSpeakAnswers, setAutoSpeakAnswersState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sarkar_mitra_auto_speak');
        return saved !== null ? saved === 'true' : true;
      }
    } catch (e) {
      console.warn('LocalStorage read error for auto speak:', e);
    }
    return true;
  });

  const setAutoSpeakAnswers = useCallback((val) => {
    setAutoSpeakAnswersState(val);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sarkar_mitra_auto_speak', String(val));
      }
    } catch (e) {
      console.warn('LocalStorage write error for auto speak:', e);
    }
    showToast(val ? 'उत्तर ऐकणे (आवाज) सुरू केले' : 'उत्तर ऐकणे (आवाज) बंद केले', 'info');
  }, [showToast]);

  const getSpeedMultiplier = useCallback((speed) => {
    if (speed === 'slow') return 0.78;
    if (speed === 'fast') return 1.25;
    return 0.95; // normal
  }, []);

  // Active custom input handler hook for wizard screens (e.g. eligibility or form filling)
  const screenVoiceHandlerRef = useRef(null);

  // Anti-lag, anti-echo & debouncing references
  const isSpeakingRef = useRef(false);
  isSpeakingRef.current = isSpeaking;
  const hasProcessedFinalInSessionRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  const lastProcessedTimeRef = useRef(0);
  const cooldownTimerRef = useRef(null);

  // Speech support flags
  const isSpeechSupported = speechRecognizer.isSupported();
  const isTtsSupported = audioController.isSupported();

  // Stop speaking wrapper
  const stopSpeaking = useCallback((options = {}) => {
    audioController.stop(options);
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Replay last spoken utterance
  const replayLastAudio = useCallback(() => {
    return audioController.replayLast();
  }, []);

  // Automatic stopping when screen/route changes
  useEffect(() => {
    stopSpeaking({ reason: 'route_change' });
  }, [activeScreen, stopSpeaking]);

  // Automatic stopping when lowBandwidth mode changes
  useEffect(() => {
    stopSpeaking({ reason: 'setting_change' });
  }, [lowBandwidth, stopSpeaking]);

  // Register screen-specific voice handler (for wizard step answers like "होय", "28", "नाही")
  const registerVoiceHandler = useCallback((handler) => {
    screenVoiceHandlerRef.current = handler;
    return () => {
      if (screenVoiceHandlerRef.current === handler) {
        screenVoiceHandlerRef.current = null;
      }
    };
  }, []);

  // Central speak method routing to audioController
  const speak = useCallback((text, options = {}) => {
    if (!text) return;

    // Immediately stop listening so mic doesn't hear the speaker output (echo guard)
    speechRecognizer.abort();
    setIsListening(false);
    setMicStatus('idle');

    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const speedRate = options.rate || getSpeedMultiplier(speechSpeed);

    audioController.speak(text, {
      id: options.id || null,
      lowBandwidth,
      force: options.force || false,
      rate: speedRate,
      lang: options.lang || 'mr-IN',
      onStart: () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        if (options.onStart) options.onStart();
      },
      onEnd: () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);

        // Cooldown delay (350ms) to ensure speaker hardware is silent before accepting mic input
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => {
          if (options.onEnd) options.onEnd();
        }, 350);
      },
      onError: (err) => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        console.warn('TTS error:', err);
        if (options.onError) options.onError(err);
      }
    });
  }, [lowBandwidth, speechSpeed, getSpeedMultiplier]);

  // Process text entered either via voice or manual typing box
  const processInput = useCallback((rawText) => {
    if (!rawText || !rawText.trim()) return;
    const text = rawText.trim();

    // Debounce rapid duplicate calls (650ms window)
    const now = Date.now();
    if (now - lastProcessedTimeRef.current < 650 && lastProcessedTextRef.current === text) {
      return;
    }
    lastProcessedTimeRef.current = now;
    lastProcessedTextRef.current = text;

    // 1. Spoken stop command: recognize Marathi and English stop words ("थांब", "थांबा", "बंद कर", "पुरे", "stop", "shut up")
    // When heard, stop playback immediately and DO NOT treat it as an answer to any question
    if (isStopIntent(text)) {
      stopSpeaking({ userInitiated: true, reason: 'spoken_command' });
      setMicStatus('idle');
      return;
    }

    // 2. Echo guard: if device is actively speaking, drop spurious microphone reflections
    if (isSpeakingRef.current) {
      console.warn('Dropped microphone input received while assistant was speaking (echo prevention):', text);
      return;
    }

    // 3. Check if an active wizard screen has registered a step-level handler
    if (screenVoiceHandlerRef.current) {
      const handled = screenVoiceHandlerRef.current(text);
      if (handled) {
        setMicStatus('idle');
        return;
      }
    }

    // 4. Default global NLP intent parser
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
      action: parsed.action,
      options: parsed.options || null,
      follow_ups: parsed.follow_ups || null,
      source_gr: parsed.source_gr || null,
      last_verified: parsed.last_verified || null,
      verified: parsed.verified !== undefined ? parsed.verified : true,
      topic: parsed.topic || null,
      topic_key: parsed.topic_key || null,
      hasEligibilityAction: parsed.hasEligibilityAction || false,
      action_label_mr: parsed.action_label_mr || null,
      action_screen: parsed.action_screen || null,
      isPrivacyWarning: parsed.isPrivacyWarning || false
    };

    addMessage(assistantMsg);

    // Speak reply aloud only if autoSpeakAnswers is enabled and not low bandwidth
    if (autoSpeakAnswers) {
      speak(parsed.reply_mr, { id: assistantMsg.id });
    }

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
    setMicStatus('idle');
  }, [selectedScheme, addMessage, speak, stopSpeaking, setActiveScreen, activeScreen, setSelectedScheme, autoSpeakAnswers]);

  const startListening = useCallback(() => {
    if (!isSpeechSupported) {
      showToast(t('speech_unsupported'), 'warning');
      setMicStatus('unsupported');
      return;
    }

    // Stop speaking immediately before starting to listen to prevent echo
    stopSpeaking();

    setInterimTranscript('');
    setFinalTranscript('');
    setErrorMessage(null);
    hasProcessedFinalInSessionRef.current = false;

    const started = speechRecognizer.start({
      onStart: () => {
        setIsListening(true);
        setMicStatus('listening');
        hasProcessedFinalInSessionRef.current = false;
      },
      onResult: ({ interim, final }) => {
        setInterimTranscript(interim);
        if (final && final.trim()) {
          hasProcessedFinalInSessionRef.current = true;
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
        // ONLY process interim if no final result was dispatched during this recognition session
        if (!hasProcessedFinalInSessionRef.current && lastInterim && lastInterim.trim().length > 1) {
          hasProcessedFinalInSessionRef.current = true;
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

  // Mic tap handler:
  // If assistant is speaking -> stop immediately, and turn on mic after 350ms cooldown
  // If mic is active -> stop listening
  // Otherwise -> start listening
  const toggleListening = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking({ userInitiated: true });
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = setTimeout(() => {
        startListening();
      }, 350);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isSpeaking, isListening, stopSpeaking, startListening, stopListening]);

  return (
    <SpeechContext.Provider
      value={{
        isListening,
        isSpeaking,
        currentId,
        lastSpoken,
        wasStoppedByUser,
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
        stop: stopSpeaking,
        replayLastAudio,
        processInput,
        registerVoiceHandler,
        speechSpeed,
        setSpeechSpeed,
        autoSpeakAnswers,
        setAutoSpeakAnswers,
        audioController
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
