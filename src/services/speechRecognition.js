/**
 * Bolu Ya - Speech Recognition Service
 * 
 * Uses Browser Web Speech API (SpeechRecognition / webkitSpeechRecognition) with lang="mr-IN".
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
    this.onStartCallback = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;
    this.lastInterim = '';

    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
        this.lastInterim = '';
        if (this.onStartCallback) this.onStartCallback();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        this.lastInterim = interimTranscript;

        if (this.onResultCallback) {
          this.onResultCallback({
            interim: interimTranscript,
            final: finalTranscript.trim(),
            confidence: event.results[0] ? event.results[0][0].confidence : 0.85
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
        if (this.onEndCallback) {
          this.onEndCallback(this.lastInterim);
        }
      };
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
    }
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
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

    try {
      if (this.isListening) {
        this.recognition.stop();
      }
      this.recognition.start();
      return true;
    } catch (err) {
      console.error('Error starting speech recognition:', err);
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
  }
}

export const speechRecognizer = new SpeechRecognitionService();
export default speechRecognizer;
