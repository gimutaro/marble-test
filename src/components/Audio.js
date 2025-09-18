export class SimpleAudio {  
  constructor() {  
    this.ctx = null;  
    this.buffers = new Map();  
    this.activeLoops = new Map(); // name -> { src, gain }  
    this.isMuted = false; // Global mute state for all audio  
  }

  async initOnce() {  
    if (this.ctx) {  
      // If context exists but is suspended (common on mobile), resume it  
      if (this.ctx.state === 'suspended') {  
        try {  
          await this.ctx.resume();  
          console.log('Audio context resumed successfully');  
        } catch (error) {  
          console.warn('Failed to resume audio context:', error);  
        }  
      }  
      return;  
    }  
      
    // Create new audio context  
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();  
      
    // On mobile, the context often starts in suspended state and needs to be resumed  
    if (this.ctx.state === 'suspended') {  
      try {  
        await this.ctx.resume();  
        console.log('Audio context created and resumed successfully');  
      } catch (error) {  
        console.warn('Failed to resume new audio context:', error);  
      }  
    }  
      
    console.log('Audio context initialized, state:', this.ctx.state);  
      
    // Decode any previously loaded raw audio data  
    await this.decodeStoredAudio();  
  }  
    
  async decodeStoredAudio() {  
    if (!this.ctx) return;  
      
    for (const [name, data] of this.buffers.entries()) {  
      if (data.raw && !data.decoded) {  
        try {  
          const buf = await this.ctx.decodeAudioData(data.raw.slice()); // slice to avoid detached buffer  
          this.buffers.set(name, { raw: data.raw, decoded: buf });  
          console.log(`Decoded stored audio: ${name}`);  
        } catch (error) {  
          console.warn(`Failed to decode stored audio ${name}:`, error);  
        }  
      }  
    }  
  }

  async load(name, url) {  
    // Fetch audio data regardless of context state  
    const res = await fetch(url);  
    const ab = await res.arrayBuffer();  
      
    // If context isn't initialized yet, store the raw data  
    if (!this.ctx) {  
      this.buffers.set(name, { raw: ab, decoded: null });  
      return;  
    }  
      
    try {  
      // Decode if context is available  
      const buf = await this.ctx.decodeAudioData(ab);  
      this.buffers.set(name, { raw: ab, decoded: buf });  
    } catch (error) {  
      // Store raw data if decoding fails (context not ready)  
      this.buffers.set(name, { raw: ab, decoded: null });  
    }  
  }

  async loadMany(mapNameToUrl = {}) {  
    const entries = Object.entries(mapNameToUrl).filter(([, u]) => !!u);  
    await Promise.all(entries.map(([name, url]) => this.load(name, url)));  
  }

  /** One-shot SFX (makes a fresh node each call). */  
  playOneShot(name, { volume = 0.5, rate = 1.0 } = {}) {  
    const data = this.buffers.get(name);  
    if (!this.ctx || !data || !data.decoded) return null;  
      
    // Check global mute state - if muted, don't play SFX  
    if (this.isMuted) return null;  
      
    const src = this.ctx.createBufferSource();  
    const gain = this.ctx.createGain();  
    src.buffer = data.decoded;  
    src.playbackRate.value = rate;  
    src.connect(gain);  
    gain.connect(this.ctx.destination);  
    gain.gain.value = volume;  
    src.start();  
    src.onended = () => {  
      try { src.disconnect(); gain.disconnect(); } catch {}  
    };  
    return { src, gain };  
  }

  /** Start/ensure a named looping track (e.g., ambience). */  
  playLoop(name, { volume = 0.4 } = {}) {  
    if (this.activeLoops.has(name)) return this.activeLoops.get(name);  
    const data = this.buffers.get(name);  
    if (!this.ctx || !data || !data.decoded) return null;  
    const src = this.ctx.createBufferSource();  
    const gain = this.ctx.createGain();  
    src.buffer = data.decoded;  
    src.loop = true; // looped playback via AudioBufferSourceNode.loop. :contentReference[oaicite:1]{index=1}  
    src.connect(gain);  
    gain.connect(this.ctx.destination);  
    // Apply mute state to new loops  
    gain.gain.value = this.isMuted ? 0 : volume;  
    src.start();  
    const handle = { src, gain };  
    this.activeLoops.set(name, handle);  
    return handle;  
  }

  stopLoop(name) {  
    const h = this.activeLoops.get(name);  
    if (!h) return;  
    try { h.src.stop(); h.src.disconnect(); h.gain.disconnect(); } catch {}  
    this.activeLoops.delete(name);  
  }

  setLoopVolume(name, volume) {  
    const h = this.activeLoops.get(name);  
    if (h) h.gain.gain.value = volume;  
  }  
  /** Set global mute state for all audio */  
  setMuted(muted) {  
    this.isMuted = muted;  
      
    // Apply mute state to all active loops  
    for (const [name, handle] of this.activeLoops) {  
      if (handle && handle.gain) {  
        handle.gain.gain.value = muted ? 0 : (handle.originalVolume || 0.4);  
      }  
    }  
  }  
  /** Get current mute state */  
  getMuted() {  
    return this.isMuted;  
  }  
}