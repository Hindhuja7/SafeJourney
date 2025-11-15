/**
 * Voice Guidance Service
 * Text-to-speech for turn-by-turn navigation instructions
 */

export class VoiceGuidance {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      language: options.language || 'en-US',
      rate: options.rate || 1.0,
      pitch: options.pitch || 1.0,
      volume: options.volume !== undefined ? options.volume : 1.0,
      ...options
    };
    
    this.synth = null;
    this.currentUtterance = null;
    this.queue = [];
    this.isSpeaking = false;
    
    this.initialize();
  }

  initialize() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.available = true;
    } else {
      this.available = false;
      console.warn('Speech Synthesis API not available');
    }
  }

  /**
   * Speak an instruction
   * @param {string} text - Text to speak
   * @param {Object} options - Override default options
   */
  speak(text, options = {}) {
    if (!this.available || !this.options.enabled) {
      console.log('Voice guidance disabled or unavailable');
      return;
    }

    if (!text || text.trim() === '') {
      return;
    }

    // Cancel any current speech
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = options.language || this.options.language;
    utterance.rate = options.rate !== undefined ? options.rate : this.options.rate;
    utterance.pitch = options.pitch !== undefined ? options.pitch : this.options.pitch;
    utterance.volume = options.volume !== undefined ? options.volume : this.options.volume;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.currentUtterance = utterance;
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (options.onEnd) options.onEnd();
      
      // Process queue
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this.speak(next.text, next.options);
      }
    };

    utterance.onerror = (error) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.error('Speech synthesis error:', error);
      if (options.onError) options.onError(error);
      
      // Process queue even on error
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this.speak(next.text, next.options);
      }
    };

    try {
      this.synth.speak(utterance);
    } catch (error) {
      console.error('Error speaking:', error);
      this.isSpeaking = false;
    }
  }

  /**
   * Queue an instruction to speak after current one finishes
   */
  queueInstruction(text, options = {}) {
    this.queue.push({ text, options });
  }

  /**
   * Cancel current speech
   */
  cancel() {
    if (this.synth && this.isSpeaking) {
      try {
        this.synth.cancel();
      } catch (error) {
        console.error('Error canceling speech:', error);
      }
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.queue = [];
  }

  /**
   * Stop all speech and clear queue
   */
  stop() {
    this.cancel();
    this.clearQueue();
  }

  /**
   * Format instruction text for voice
   */
  formatInstruction(instruction, distanceToTurn) {
    if (!instruction) return '';
    
    let text = '';
    
    // Add distance prefix if significant
    if (distanceToTurn && distanceToTurn > 50) {
      if (distanceToTurn < 1000) {
        text += `In ${Math.round(distanceToTurn)} meters, `;
      } else {
        text += `In ${(distanceToTurn / 1000).toFixed(1)} kilometers, `;
      }
    } else if (distanceToTurn && distanceToTurn <= 50) {
      text += 'Now ';
    }
    
    // Add instruction type
    switch (instruction.type) {
      case 'turn-left':
        text += 'turn left';
        break;
      case 'turn-right':
        text += 'turn right';
        break;
      case 'u-turn':
        text += 'make a U-turn';
        break;
      case 'continue':
        text += 'continue straight';
        break;
      case 'arrive':
        text += 'You have arrived at your destination';
        break;
      case 'start':
        text += 'Navigation started';
        break;
      default:
        text += instruction.text || '';
    }
    
    // Add safety warning if needed
    if (instruction.safetyWarning) {
      text += `. ${instruction.safetyWarning}`;
    }
    
    return text;
  }

  /**
   * Speak a navigation instruction
   */
  speakInstruction(instruction, distanceToTurn) {
    const text = this.formatInstruction(instruction, distanceToTurn);
    this.speak(text);
  }

  /**
   * Enable voice guidance
   */
  enable() {
    this.options.enabled = true;
  }

  /**
   * Disable voice guidance
   */
  disable() {
    this.stop();
    this.options.enabled = false;
  }

  /**
   * Check if voice guidance is enabled
   */
  isEnabled() {
    return this.options.enabled && this.available;
  }

  /**
   * Check if currently speaking
   */
  isCurrentlySpeaking() {
    return this.isSpeaking;
  }

  /**
   * Get available voices
   */
  getVoices() {
    if (!this.available) return [];
    return this.synth.getVoices();
  }

  /**
   * Set voice
   */
  setVoice(voiceName) {
    const voices = this.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      this.options.voice = voice;
    }
  }

  /**
   * Update options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
}

