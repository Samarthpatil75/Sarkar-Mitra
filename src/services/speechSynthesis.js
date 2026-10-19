/**
 * Sarkar Mitra - Speech Synthesis Service Adapter
 * 
 * Re-routes all speech synthesis calls through the central `audioController.js` singleton.
 * Ensures single source of truth across the entire application.
 */

import audioController from './audioController';

class SpeechSynthesisAdapter {
  constructor() {
    this.controller = audioController;
  }

  isSupported() {
    return this.controller.isSupported();
  }

  getVoiceName() {
    if (!this.controller.selectedVoice) return 'सिस्टम आवाज (डिफॉल्ट)';
    return `${this.controller.selectedVoice.name} (${this.controller.selectedVoice.lang})`;
  }

  hasMarathiVoice() {
    return this.controller.voices.some(v => 
      v.lang.toLowerCase().includes('mr') || 
      v.name.toLowerCase().includes('marathi')
    );
  }

  get isSpeaking() {
    return this.controller.isSpeaking;
  }

  stop(options) {
    return this.controller.stop(options);
  }

  speak(text, options = {}) {
    return this.controller.speak(text, options);
  }
}

export const speechSynthesizer = new SpeechSynthesisAdapter();
export default speechSynthesizer;
