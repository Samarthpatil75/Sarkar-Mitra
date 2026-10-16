/**
 * Bolu Ya - Speech Synthesis (Text-to-Speech) Service
 * 
 * Uses Browser Web SpeechSynthesis API with preferred Marathi ('mr-IN') voice,
 * with graceful fallbacks (e.g. Hindi or default Devanagari TTS engine).
 * Includes memory-retention guards against Chromium garbage-collection drops
 * and queue unfreezing mechanisms.
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
    this.currentUtterance = null;
    this.watchdogTimer = null;
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

  clearWatchdog() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  stop() {
    this.clearWatchdog();
    if (this.synth) {
      try {
        // Resume first in case Chromium's audio queue was paused
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.cancel();
      } catch (e) {
        console.warn('Error cancelling speech synthesis:', e);
      }
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
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
      // Retain reference on instance and window to prevent Chromium GC bug
      this.currentUtterance = utterance;
      if (typeof window !== 'undefined') {
        window.__bolu_ya_active_utterance = utterance;
      }

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

      const handleSpeechComplete = () => {
        this.clearWatchdog();
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();

        // Safety watchdog: estimate speech duration based on word count + buffer
        const wordCount = text.split(/\s+/).length;
        const estimatedMs = Math.max(4000, (wordCount / 2.5) * 1000 + 3000);
        this.clearWatchdog();
        this.watchdogTimer = setTimeout(() => {
          if (this.isSpeaking) {
            console.warn('Speech synthesis watchdog triggered, resetting state.');
            this.stop();
            handleSpeechComplete();
          }
        }, estimatedMs);
      };

      utterance.onend = () => {
        handleSpeechComplete();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        this.clearWatchdog();
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onError) onError(e);
        if (onEnd) onEnd();
      };

      // Unpause queue if stuck before speaking
      if (this.synth.paused) {
        this.synth.resume();
      }

      this.synth.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis failure:', err);
      this.clearWatchdog();
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onError) onError(err);
      if (onEnd) onEnd();
    }
  }
}

export const speechSynthesizer = new SpeechSynthesisService();
export default speechSynthesizer;
