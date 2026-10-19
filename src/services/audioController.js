/**
 * Sarkar Mitra - Central Audio Controller
 * 
 * The single source of truth for all Text-to-Speech (TTS) playback in Sarkar Mitra.
 * All screen components, wizard questions, Q&A answers, replay buttons, and checklists
 * route through this controller.
 * 
 * Features:
 * - Sentence chunking with generation counter to eliminate Chrome's 15s freeze and zombie chunks.
 * - 100ms post-cancel delay so Chrome does not swallow subsequent utterances.
 * - Resumes audio queue before cancelling to prevent stuck Web Speech API states.
 * - Global listeners for tab visibilitychange, beforeunload, pagehide, and Escape key.
 * - Reactive subscription mechanism for UI components (Stop button, waveforms, etc.).
 * - Preserves echo-prevention cooldown and debouncing contracts.
 */

function splitIntoSentenceChunks(text, maxChunkLen = 140) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  if (!clean) return [];

  // Split on Devanagari purnaviram (।, ॥), standard punctuation (.?!;\n)
  const rawSentences = clean.split(/(?<=[।॥.?!;\n])\s+/);
  const chunks = [];

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxChunkLen) {
      chunks.push(trimmed);
    } else {
      // Split on clauses: comma, dash, colon, quote
      const clauses = trimmed.split(/(?<=[,،,–—:\-"'’‘])\s+/);
      let current = '';
      for (const clause of clauses) {
        if (!clause.trim()) continue;
        if ((current + ' ' + clause).trim().length <= maxChunkLen) {
          current = current ? `${current} ${clause}` : clause;
        } else {
          if (current) chunks.push(current.trim());
          if (clause.length <= maxChunkLen) {
            current = clause;
          } else {
            // Words fallback if a single clause exceeds maxChunkLen
            const words = clause.split(/\s+/);
            let sub = '';
            for (const w of words) {
              if ((sub + ' ' + w).trim().length <= maxChunkLen) {
                sub = sub ? `${sub} ${w}` : w;
              } else {
                if (sub) chunks.push(sub.trim());
                sub = w;
              }
            }
            if (sub && sub.trim()) chunks.push(sub.trim());
            current = '';
          }
        }
      }
      if (current && current.trim()) chunks.push(current.trim());
    }
  }

  return chunks.length > 0 ? chunks : [clean];
}

class AudioController {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.selectedVoice = null;
    this._isSpeaking = false;
    this._currentId = null;
    this._lastSpoken = null; // { text, id, options }
    this._wasStoppedByUser = false;
    this.generation = 0;
    this.subscribers = new Set();
    this.chunkTimeout = null;
    this.watchdogTimer = null;
    this.currentUtterance = null;

    this.loadVoices();

    if (this.synth && typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };

      // Automatic stopping on tab switch (visibilitychange)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this._isSpeaking) {
          this.stop({ userInitiated: false, reason: 'visibilitychange' });
        }
      });

      // Automatic stopping on page unload / hide
      window.addEventListener('beforeunload', () => {
        this.stop({ userInitiated: false, reason: 'beforeunload' });
      });
      window.addEventListener('pagehide', () => {
        this.stop({ userInitiated: false, reason: 'pagehide' });
      });

      // Keyboard shortcut: Escape key stops audio immediately
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this._isSpeaking) {
          this.stop({ userInitiated: true, reason: 'escape' });
        }
      });
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

  get isSpeaking() {
    return this._isSpeaking;
  }

  get currentId() {
    return this._currentId;
  }

  get lastSpoken() {
    return this._lastSpoken;
  }

  get wasStoppedByUser() {
    return this._wasStoppedByUser;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.subscribers.add(listener);
    // Provide initial state immediately
    listener(this._getState());
    return () => {
      this.subscribers.delete(listener);
    };
  }

  _getState() {
    return {
      isSpeaking: this._isSpeaking,
      currentId: this._currentId,
      lastSpoken: this._lastSpoken,
      wasStoppedByUser: this._wasStoppedByUser
    };
  }

  _notify(meta = {}) {
    const state = { ...this._getState(), ...meta };
    this.subscribers.forEach(cb => {
      try {
        cb(state);
      } catch (err) {
        console.error('Error in audioController subscriber:', err);
      }
    });
  }

  _clearTimers() {
    if (this.chunkTimeout) {
      clearTimeout(this.chunkTimeout);
      this.chunkTimeout = null;
    }
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  /**
   * Stops any ongoing speech immediately.
   * Cancels synth, clears queued chunks, increments generation, and resets isSpeaking.
   */
  stop({ userInitiated = false, reason = '', clearLastSpoken = false } = {}) {
    // Increment generation counter so all future chunks of any previous speech run are instantly aborted
    this.generation++;
    this._clearTimers();

    const wasActive = this._isSpeaking;

    if (this.synth) {
      try {
        // Resume first in case Chromium's audio queue was paused
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.cancel();
      } catch (e) {
        console.warn('Error in speechSynthesis.cancel:', e);
      }
    }

    this._isSpeaking = false;
    this._currentId = null;
    this.currentUtterance = null;
    if (typeof window !== 'undefined') {
      window.__sarkar_mitra_active_utterance = null;
    }

    if (userInitiated) {
      this._wasStoppedByUser = true;
    }

    if (clearLastSpoken) {
      this._lastSpoken = null;
    }

    this._notify({ userInitiated, reason, wasSpeaking: wasActive });
    return wasActive;
  }

  /**
   * Speaks text using sentence-level chunking and Chrome utterance protection.
   * Replaces any existing speech (never overlaps).
   */
  async speak(text, { 
    id = null, 
    rate = 0.95, 
    lang = 'mr-IN', 
    onStart, 
    onEnd, 
    onError, 
    force = false, 
    lowBandwidth = false 
  } = {}) {
    if (!this.synth || !text || !text.trim()) {
      if (onEnd) onEnd();
      return;
    }

    // In low bandwidth mode, don't auto-speak unless explicitly forced by clicking replay/play
    if (lowBandwidth && !force) {
      if (onEnd) onEnd();
      return;
    }

    // Capture and increment generation counter for this specific speak invocation
    const currentGen = ++this.generation;
    this._clearTimers();

    // Cancel any active speech
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      this.synth.cancel();
    } catch (e) {
      console.warn('Speech cancellation error:', e);
    }

    // 100ms delay between cancel() and speak() so Chrome doesn't swallow the new utterance
    await new Promise(resolve => setTimeout(resolve, 100));

    // If another speak() or stop() was called during the 100ms delay, abort
    if (this.generation !== currentGen) {
      return;
    }

    // Save as last spoken text for replay
    this._lastSpoken = {
      text,
      id,
      options: { id, rate, lang, force: true, lowBandwidth: false }
    };
    this._wasStoppedByUser = false;
    this._currentId = id;
    this._isSpeaking = true;
    this._notify({ started: true });

    if (onStart) {
      try {
        onStart();
      } catch (err) {
        console.error('Error in onStart callback:', err);
      }
    }

    // Split text into short, natural sentence chunks
    const chunks = splitIntoSentenceChunks(text);
    if (chunks.length === 0) {
      this._isSpeaking = false;
      this._currentId = null;
      this._notify();
      if (onEnd) onEnd();
      return;
    }

    if (!this.selectedVoice) {
      this.loadVoices();
    }

    // Sequentially play chunks
    let chunkIndex = 0;

    const playNextChunk = () => {
      // Verify generation: if cancelled or replaced, abort immediately
      if (this.generation !== currentGen) {
        return;
      }

      if (chunkIndex >= chunks.length) {
        this._isSpeaking = false;
        this._currentId = null;
        this.currentUtterance = null;
        this._notify({ completed: true });
        if (onEnd) onEnd();
        return;
      }

      const chunkText = chunks[chunkIndex];
      chunkIndex++;

      try {
        const utterance = new SpeechSynthesisUtterance(chunkText);
        this.currentUtterance = utterance;
        if (typeof window !== 'undefined') {
          window.__sarkar_mitra_active_utterance = utterance;
        }

        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
          utterance.lang = this.selectedVoice.lang || lang;
        } else {
          utterance.lang = lang;
        }

        utterance.rate = Number(rate) || 0.95;
        utterance.pitch = 1.0;

        // Safety watchdog per chunk
        const wordCount = chunkText.split(/\s+/).length;
        const estimatedMs = Math.max(3000, (wordCount / 2) * 1000 + 2500);

        this._clearTimers();
        this.watchdogTimer = setTimeout(() => {
          if (this.generation === currentGen && this._isSpeaking) {
            console.warn('Watchdog timed out on chunk, advancing to next chunk.');
            playNextChunk();
          }
        }, estimatedMs);

        utterance.onend = () => {
          if (this.generation !== currentGen) return;
          this._clearTimers();
          // Short 50ms pause between sentences for natural cadence
          this.chunkTimeout = setTimeout(() => {
            if (this.generation === currentGen) {
              playNextChunk();
            }
          }, 50);
        };

        utterance.onerror = (event) => {
          if (this.generation !== currentGen) return;
          console.warn('Speech synthesis utterance error on chunk:', event);
          this._clearTimers();
          // If error was not an intentional cancel, continue to next chunk or finish
          if (event.error === 'canceled' || event.error === 'interrupted') {
            return;
          }
          if (chunkIndex >= chunks.length) {
            this._isSpeaking = false;
            this._currentId = null;
            this._notify();
            if (onError) onError(event);
            if (onEnd) onEnd();
          } else {
            playNextChunk();
          }
        };

        // Resume if paused
        if (this.synth.paused) {
          this.synth.resume();
        }

        this.synth.speak(utterance);
      } catch (err) {
        console.error('Exception during utterance play:', err);
        if (this.generation === currentGen) {
          this._clearTimers();
          this._isSpeaking = false;
          this._currentId = null;
          this._notify();
          if (onError) onError(err);
          if (onEnd) onEnd();
        }
      }
    };

    playNextChunk();
  }

  /**
   * Replays the last spoken message if available
   */
  replayLast() {
    if (!this._lastSpoken || !this._lastSpoken.text) return false;
    this.speak(this._lastSpoken.text, {
      ...this._lastSpoken.options,
      force: true
    });
    return true;
  }
}

export const audioController = new AudioController();
export default audioController;
