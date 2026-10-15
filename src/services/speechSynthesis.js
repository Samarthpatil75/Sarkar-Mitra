/**
 * Bolu Ya - Speech Synthesis (Text-to-Speech) Service
 * 
 * Uses Browser Web SpeechSynthesis API with preferred Marathi ('mr-IN') voice,
 * with graceful fallbacks (e.g. Hindi or default Devanagari TTS engine).
 * 
 * ============================================================================
 * PLUG-IN ARCHITECTURE FOR BHASHINI TTS:
 * To swap browser speech synthesis for Bhashini Marathi TTS:
 * 1. Post request to Bhashini TTS pipeline:
 *    POST https://dhruva-api.bhashini.gov.in/services/inference/pipeline
 *    {
 *      "pipelineTasks": [{
 *        "taskType": "tts",
 *        "config": {
 *          "language": { "sourceLanguage": "mr" },
 *          "gender": "female"
 *        }
 *      }],
 *      "inputData": { "input": [{ "source": text }] }
 *    }
 * 2. Play base64 audio response:
 *    const audio = new Audio("data:audio/wav;base64," + base64Audio);
 *    audio.play();
 * ============================================================================
 */

class SpeechSynthesisService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.loadVoices();

    if (this.synth && typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    
    // Look for Marathi voice first
    const marathiVoice = this.voices.find(v => 
      v.lang.toLowerCase().includes('mr') || 
      v.name.toLowerCase().includes('marathi')
    );

    // If Marathi is not installed, fallback to Hindi voice (handles Devanagari phonology well)
    const hindiVoice = this.voices.find(v => 
      v.lang.toLowerCase().includes('hi') || 
      v.name.toLowerCase().includes('hindi')
    );

    // Fallback to Indian English or default
    const indianVoice = this.voices.find(v => 
      v.lang.toLowerCase().includes('en-in')
    );

    this.selectedVoice = marathiVoice || hindiVoice || indianVoice || this.voices[0] || null;
  }

  isSupported() {
    return !!(typeof window !== 'undefined' && window.speechSynthesis);
  }

  getVoiceName() {
    if (!this.selectedVoice) return 'सिस्टम आवाज (डिफॉल्ट)';
    return `${this.selectedVoice.name} (${this.selectedVoice.lang})`;
  }

  hasMarathiVoice() {
    return this.voices.some(v => 
      v.lang.toLowerCase().includes('mr') || 
      v.name.toLowerCase().includes('marathi')
    );
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        console.warn('Error cancelling speech synthesis:', e);
      }
    }
    this.isSpeaking = false;
  }

  speak(text, { onStart, onEnd, onError, lowBandwidth = false, force = false } = {}) {
    if (!this.synth || !text) {
      if (onEnd) onEnd();
      return;
    }

    // In low bandwidth mode, don't auto-speak unless explicitly forced by clicking the replay button
    if (lowBandwidth && !force) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.stop(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (!this.selectedVoice) {
        this.loadVoices();
      }

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang;
      } else {
        utterance.lang = 'mr-IN';
      }

      // Slightly slower pace for elderly and rural listeners
      utterance.rate = 0.90;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        this.isSpeaking = false;
        if (onError) onError(e);
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis failure:', err);
      this.isSpeaking = false;
      if (onError) onError(err);
      if (onEnd) onEnd();
    }
  }
}

export const speechSynthesizer = new SpeechSynthesisService();
export default speechSynthesizer;
