import { SimpleAudio } from '../components/Audio.js';
import { CONFIG } from '../config.js';
export class AudioManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.audio = new SimpleAudio();
    this.audioInitialized = false;
    this.currentAmbienceTrack = null;
    
    this.setupEventListeners();
    this.setupAudioInitialization();
  }
  
  setupEventListeners() {
    // Listen for audio initialization completion
    window.addEventListener('audioInitialized', () => {
      this.audioInitialized = true;
    });
  }
  
  setupAudioInitialization() {
    if (!CONFIG.ENABLE_AUDIO) return;
    
    const initAudio = async () => {
      if (!this.audioInitialized) {
        await this.audio.initOnce();
        this.audioInitialized = true;
        window.dispatchEvent(new CustomEvent('audioInitialized'));
      }
    };
    
    // Set up audio initialization triggers
    window.addEventListener("click", initAudio, { once: true });
    window.addEventListener("keydown", initAudio, { once: true });
    window.addEventListener("touchstart", initAudio, { once: true });
  }
  
  /**
   * Initialize audio system (called from UI interactions)
   */
  async initOnce() {
    if (!this.audioInitialized) {
      await this.audio.initOnce();
      this.audioInitialized = true;
      
      // Additional mobile check - ensure context is actually running
      if (this.audio.ctx) {
        console.log('AudioManager initialized, context state:', this.audio.ctx.state);
        if (this.audio.ctx.state !== 'running') {
          console.warn('Audio context is not running after initialization, state:', this.audio.ctx.state);
        }
      }
      
      window.dispatchEvent(new CustomEvent('audioInitialized'));
    }
  }
  
  /**
   * Check if audio is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.audioInitialized;
  }
  
  /**
   * Get the underlying audio instance
   * @returns {SimpleAudio}
   */
  getAudio() {
    return this.audio;
  }
  
  /**
   * Get current ambience track name
   * @returns {string|null}
   */
  getCurrentAmbienceTrack() {
    return this.currentAmbienceTrack;
  }
  
  /**
   * Stop current ambience track
   */
  stopCurrentAmbience() {
    if (this.currentAmbienceTrack) {
      this.audio.stopLoop(this.currentAmbienceTrack);
      this.currentAmbienceTrack = null;
    }
  }
  
  /**
   * Set mute state for all audio
   * @param {boolean} muted - Whether audio should be muted
   */
  setMuted(muted) {
    this.audio.setMuted(muted);
  }
  
  /**
   * Play a one-shot sound effect
   * @param {string} soundName - Name of the sound to play
   * @param {Object} options - Audio options (volume, rate, etc.)
   * @returns {Object|null} - Audio handle or null
   */
  playOneShot(soundName, options = {}) {
    return this.audio.playOneShot(soundName, options);
  }
  
  /**
   * Load multiple sounds at once
   * @param {Object} soundMap - Map of sound names to URLs
   */
  async loadSounds(soundMap) {
    await this.audio.loadMany(soundMap);
  }
  
  /**
   * Load a single sound
   * @param {string} name - Sound name
   * @param {string} url - Sound URL
   */
  async loadSound(name, url) {
    // Don't wait for audio initialization - just load the sound data
    return await this.audio.load(name, url);
  }
  
  /**
   * Start or ensure a looping track
   * @param {string} name - Track name
   * @param {Object} options - Audio options
   * @returns {Object|null} - Audio handle or null
   */
  playLoop(name, options = {}) {
    return this.audio.playLoop(name, options);
  }
  
  /**
   * Stop a looping track
   * @param {string} name - Track name
   */
  stopLoop(name) {
    this.audio.stopLoop(name);
  }
  
  /**
   * Set volume for a looping track
   * @param {string} name - Track name
   * @param {number} volume - Volume level (0-1)
   */
  setLoopVolume(name, volume) {
    this.audio.setLoopVolume(name, volume);
  }
  
  /**
   * Cleanup and dispose
   */
  dispose() {
    this.stopCurrentAmbience();
    this.audioInitialized = false;
  }
}

