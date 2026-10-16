/**
 * Bolu Ya - Speech Recognition Service
 * 
 * Uses Browser Web Speech API (SpeechRecognition / webkitSpeechRecognition) with lang="mr-IN".
 * Includes debouncing and session state isolation to prevent duplicate utterances and lagging.
 * 
 * ============================================================================
 * PLUG-IN ARCHITECTURE FOR BHASHINI / WHISPER:
 * To swap browser Web Speech API for Bhashini ASR or Whisper:
 * 1. Implement transcribeAudioBlob(blob) using:
 *    - Bhashini ASR endpoint: https://dhruva-api.bhashini.gov.in/services/inference/pipeline
 *      (Config: sourceLanguage: "mr", serviceId: "bhashini/asr")
 *    - Or Whisper API: formData.append('file', audioBlob); formData.append('model', 'whisper-1'); formData.append('language', 'mr');
 * 2. Replace startRecording() to use MediaRecorder and stream/send audio chunks.
 * ============================================================================
 */

class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.hasDispatchedFinal = false;
    this.onStartCallback = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;
    this.lastInterim = '';

    this.init();
  }

  init() {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // Capture discrete utterances for conversational UX
      this.recognition.interimResults = true;
      this.recognition.lang = 'mr-IN'; // Marathi (India)
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.hasDispatchedFinal = false;
        this.lastInterim = '';
        if (this.onStartCallback) this.onStartCallback();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0] ? item[0].transcript : '';
          if (item.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        this.lastInterim = interimTranscript;

        if (finalTranscript.trim()) {
          this.hasDispatchedFinal = true;
          this.lastInterim = ''; // Clear interim so onend does not re-process
        }

        if (this.onResultCallback) {
          this.onResultCallback({
            interim: interimTranscript,
            final: finalTranscript.trim(),
            confidence: event.results[0] && event.results[0][0] ? event.results[0][0].confidence : 0.85
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        const pendingInterim = (!this.hasDispatchedFinal && this.lastInterim.trim().length > 1) 
          ? this.lastInterim.trim() 
          : '';
        this.lastInterim = '';
        
        if (this.onEndCallback) {
          this.onEndCallback(pendingInterim);
        }
      };
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
    }
  }

  isSupported() {
    return !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
  }

  start({ onStart, onResult, onError, onEnd } = {}) {
    if (!this.recognition) {
      this.init();
    }
    if (!this.recognition) {
      if (onError) onError('not_supported');
      return false;
    }

    this.onStartCallback = onStart;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;
    this.hasDispatchedFinal = false;
    this.lastInterim = '';

    try {
      if (this.isListening) {
        this.recognition.abort();
      }
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      // If already started or aborting, give it a tiny reset
      if (err.name === 'InvalidStateError') {
        try {
          this.recognition.abort();
          setTimeout(() => {
            try { this.recognition.start(); } catch (e) { /* ignore */ }
          }, 150);
          return true;
        } catch (e) {
          /* ignore */
        }
      }
      if (onError) onError(err.message || 'start_failed');
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
    }
    this.isListening = false;
  }

  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (err) {
        console.warn('Error aborting speech recognition:', err);
      }
    }
    this.isListening = false;
    this.hasDispatchedFinal = false;
    this.lastInterim = '';
  }
}

export const speechRecognizer = new SpeechRecognitionService();
export default speechRecognizer;
