/**
 * Sarkar Mitra - Central Audio Controller
 * 
 * The single source of truth for all Text-to-Speech (TTS) playback in Sarkar Mitra.
 * All screen components, wizard questions, Q&A answers, replay buttons, and checklists
 * route through this controller.
 * 
 * Features:
 * - Generation counter that only allows newer speech to supersede older speech.
 * - Automatic stop() never cancels a newly started speak() generation.
 * - First-load autoplay rule: handles browser autoplay restrictions gracefully by
 *   attempting immediate speech and, if blocked (not-allowed or no onstart within 1s),
 *   queuing the welcome message to speak automatically on the very first touch/click.
 * - Sentence chunking to eliminate Chrome's 15s freeze and zombie chunks.
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
    
    // Generation counters
    this.generation = 0;
    this.activeGen = 0;
    this.stoppedGen = 0;

    this.subscribers = new Set();
    this.chunkTimeout = null;
    this.watchdogTimer = null;
    this.currentUtterance = null;

    // First-load autoplay queue & interaction handling
    this.hasUserInteracted = false;
    this.pendingWelcomeUtterance = null;
    this.welcomeStarted = false;

    this.loadVoices();

    if (this.synth && typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };

      // Set up global first-interaction listeners for autoplay unlock
      this._setupInteractionListeners();

      // Automatic stopping on tab switch (visibilitychange)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this._isSpeaking) {
          console.debug('[audioController] stop: tab hidden');
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

  _setupInteractionListeners() {
    if (typeof window === 'undefined') return;
    const events = ['pointerdown', 'touchstart', 'keydown', 'click'];
    this._firstInteractionHandler = () => {
      this.hasUserInteracted = true;
      this._removeInteractionListeners();

      // If welcome was blocked by browser autoplay, play it now on first interaction!
      if (this.pendingWelcomeUtterance) {
        const pending = this.pendingWelcomeUtterance;
        this.pendingWelcomeUtterance = null;
        console.debug('[audioController] First interaction detected. Playing queued welcome utterance:', pending.text);
        this.speak(pending.text, { ...pending.options, force: true, isWelcome: false });
      }
    };

    events.forEach(evt => {
      window.addEventListener(evt, this._firstInteractionHandler, { capture: true, passive: true });
    });
  }

  _removeInteractionListeners() {
    if (typeof window === 'undefined' || !this._firstInteractionHandler) return;
    const events = ['pointerdown', 'touchstart', 'keydown', 'click'];
    events.forEach(evt => {
      window.removeEventListener(evt, this._firstInteractionHandler, { capture: true });
    });
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();

    // Look for Marathi voice first
    const marathiVoice = this.voices.find(v => 
      v.lang.toLowerCase().includes('mr') || 
      v.name.toLowerCase().includes('marathi')
    );

    // Fallback to Hindi voice (handles Devanagari phonology well)
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
   * Stops ongoing speech.
   * If userInitiated is true, cancels everything immediately.
   * If userInitiated is false (e.g. unmount, route-change), only cancels if no newer speak()
   * has been called, ensuring background cleanups do NOT kill freshly started question speech.
   */
  stop({ userInitiated = false, reason = '', clearLastSpoken = false, targetGen = null } = {}) {
    // User-initiated stop (e.g. tapping "आवाज थांबवा", mic button, or Escape key)
    if (userInitiated) {
      this.stoppedGen = this.generation;
      this.pendingWelcomeUtterance = null;
      this._clearTimers();

      const wasActive = this._isSpeaking;

      if (this.synth) {
        try {
          if (this.synth.paused) this.synth.resume();
          this.synth.cancel();
        } catch (e) {
          console.warn('Error in speechSynthesis.cancel:', e);
        }
      }

      this._isSpeaking = false;
      this._currentId = null;
      this.currentUtterance = null;
      this._wasStoppedByUser = true;
      if (clearLastSpoken) this._lastSpoken = null;

      console.debug(`[audioController] audio stopped by user (reason: "${reason}", stoppedGen: ${this.stoppedGen})`);
      this._notify({ userInitiated: true, reason, wasSpeaking: wasActive });
      return wasActive;
    }

    // Automatic stop (route_change, component unmount, etc.)
    // Only cancel audio that started BEFORE a new speak() was called.
    const genToCancel = targetGen !== null ? targetGen : this.activeGen;

    // If a new speak() generation was already created, do NOT cancel it!
    if (this.generation > genToCancel) {
      console.debug(`[audioController] automatic stop ("${reason}") ignored: newer speak gen ${this.generation} > target ${genToCancel}`);
      return false;
    }

    this.stoppedGen = this.generation;
    this._clearTimers();

    const wasActive = this._isSpeaking;

    if (this.synth) {
      try {
        if (this.synth.paused) this.synth.resume();
        this.synth.cancel();
      } catch (e) {
        console.warn('Error in speechSynthesis.cancel:', e);
      }
    }

    this._isSpeaking = false;
    this._currentId = null;
    this.currentUtterance = null;

    console.debug(`[audioController] audio stopped automatically (reason: "${reason}")`);
    this._notify({ userInitiated: false, reason, wasSpeaking: wasActive });
    return wasActive;
  }

  /**
   * Speaks text using sentence-level chunking and Chrome utterance protection.
   * Automatically supersedes any previous utterance without clipping new speech.
   */
  async speak(text, { 
    id = null, 
    rate = 0.95, 
    lang = 'mr-IN', 
    onStart, 
    onEnd, 
    onError, 
    force = false, 
    lowBandwidth = false,
    isWelcome = false 
  } = {}) {
    if (!this.synth || !text || !text.trim()) {
      if (onEnd) onEnd();
      return;
    }

    // In low bandwidth mode, don't auto-speak unless explicitly forced
    if (lowBandwidth && !force) {
      console.debug('[audioController] speak blocked: lowBandwidth mode active');
      if (onEnd) onEnd();
      return;
    }

    // If this is a duplicate welcome message and welcome already started, ignore
    if (isWelcome && this.welcomeStarted) {
      console.debug('[audioController] speak skipped: welcome already played');
      if (onEnd) onEnd();
      return;
    }

    // Capture and increment generation counter for this specific speak invocation
    const currentGen = ++this.generation;
    this.activeGen = currentGen;
    console.debug(`[audioController] speak requested (gen ${currentGen}): "${text.slice(0, 50)}..."`);

    this._clearTimers();

    // Check if browser was actively speaking
    const wasSpeaking = this._isSpeaking || (this.synth.speaking || this.synth.pending);

    // Cancel older audio
    try {
      if (this.synth.paused) this.synth.resume();
      this.synth.cancel();
    } catch (e) {
      console.warn('Speech cancellation error:', e);
    }

    // If audio was actively speaking, give Chrome a brief 60ms to flush pipeline
    if (wasSpeaking) {
      await new Promise(resolve => setTimeout(resolve, 60));
    }

    // Verify generation: if a newer speak() or user stop occurred during cooldown, abort
    if (this.generation !== currentGen || this.stoppedGen >= currentGen) {
      console.debug(`[audioController] speak gen ${currentGen} aborted before playback: newer gen ${this.generation} or stoppedGen ${this.stoppedGen}`);
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

    // First-load autoplay watchdog:
    // If this is the welcome message and onstart doesn't fire within 1s, browser blocked autoplay
    let hasChunkStarted = false;
    let autoplayWatchdog = null;

    if (isWelcome && !this.hasUserInteracted) {
      autoplayWatchdog = setTimeout(() => {
        if (!hasChunkStarted && this.generation === currentGen && !this.hasUserInteracted) {
          console.debug('[audioController] Autoplay watchdog: onstart did not fire within 1s. Queuing welcome for first interaction.');
          this.pendingWelcomeUtterance = { text, options: { id, rate, lang, force: true } };
          this._isSpeaking = false;
          this._notify();
        }
      }, 1000);
    }

    // Sequentially play chunks
    let chunkIndex = 0;

    const playNextChunk = () => {
      // Verify generation: if superseded or stopped, abort immediately
      if (this.generation !== currentGen || this.stoppedGen >= currentGen) {
        console.debug(`[audioController] chunk aborted: gen ${currentGen} (current: ${this.generation}, stoppedGen: ${this.stoppedGen})`);
        return;
      }

      if (chunkIndex >= chunks.length) {
        this._isSpeaking = false;
        this._currentId = null;
        this.currentUtterance = null;
        if (autoplayWatchdog) clearTimeout(autoplayWatchdog);
        console.debug(`[audioController] speak completed (gen ${currentGen})`);
        this._notify({ completed: true });
        if (onEnd) onEnd();
        return;
      }

      const chunkText = chunks[chunkIndex];
      chunkIndex++;

      try {
        const utterance = new SpeechSynthesisUtterance(chunkText);
        this.currentUtterance = utterance;

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
          if (this.generation === currentGen && this._isSpeaking && this.stoppedGen < currentGen) {
            console.warn('[audioController] Watchdog timed out on chunk, advancing to next chunk.');
            playNextChunk();
          }
        }, estimatedMs);

        utterance.onstart = () => {
          if (this.generation !== currentGen || this.stoppedGen >= currentGen) return;
          hasChunkStarted = true;
          if (autoplayWatchdog) {
            clearTimeout(autoplayWatchdog);
            autoplayWatchdog = null;
          }
          if (isWelcome) {
            this.welcomeStarted = true;
            this.pendingWelcomeUtterance = null;
            this._removeInteractionListeners();
          }
          console.debug(`[audioController] speak started (gen ${currentGen}, chunk ${chunkIndex}/${chunks.length})`);
          if (onStart && chunkIndex === 1) {
            try { onStart(); } catch (err) {}
          }
        };

        utterance.onend = () => {
          if (this.generation !== currentGen || this.stoppedGen >= currentGen) return;
          this._clearTimers();
          // Short 40ms pause between sentences for natural cadence
          this.chunkTimeout = setTimeout(() => {
            if (this.generation === currentGen && this.stoppedGen < currentGen) {
              playNextChunk();
            }
          }, 40);
        };

        utterance.onerror = (event) => {
          if (this.generation !== currentGen || this.stoppedGen >= currentGen) return;
          this._clearTimers();

          // Handle browser autoplay restriction (not-allowed)
          if (event.error === 'not-allowed') {
            console.debug('[audioController] speak blocked by browser autoplay (not-allowed).');
            if (autoplayWatchdog) clearTimeout(autoplayWatchdog);
            if (isWelcome && !this.welcomeStarted) {
              console.debug('[audioController] Queued welcome for first user interaction.');
              this.pendingWelcomeUtterance = { text, options: { id, rate, lang, force: true } };
            }
            this._isSpeaking = false;
            this._notify();
            if (onError) onError(event);
            return;
          }

          if (event.error === 'canceled' || event.error === 'interrupted') {
            return;
          }

          console.warn('[audioController] Speech utterance error on chunk:', event);

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
        console.error('[audioController] Exception during utterance play:', err);
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
    console.debug('[audioController] Replaying last spoken message:', this._lastSpoken.text.slice(0, 40));
    this.speak(this._lastSpoken.text, {
      ...this._lastSpoken.options,
      force: true
    });
    return true;
  }
}

export const audioController = new AudioController();
export default audioController;
