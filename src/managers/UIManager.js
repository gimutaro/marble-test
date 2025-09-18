

import { loadMuteState, saveMuteState } from '../utils/persistence.js';

export class UIManager {
  constructor(camera, controls, audioManager) {
    this.camera = camera;
    this.controls = controls;
    this.audioManager = audioManager;
    
    // UI state
    this.isAudioMuted = loadMuteState();
    this.previousVolumes = new Map();
    this.currentAmbienceTrack = null;
    this.hasStarted = false;
    
    // Device detection
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (matchMedia("(hover: none) and (pointer: coarse)").matches && "ontouchstart" in window);
    
    // UI element references
    this.getUIElements();
    this.setupEventListeners();
    this.initializeUI();
  }
  
  getUIElements() {
    // Start UI elements
    this.gamePanel = document.getElementById("panel");
    this.uiPanel = document.getElementById("ui");
    this.loadingEl = document.getElementById("loading");
    this.canvasHint = document.getElementById("canvas-hint");
    this.crosshair = document.getElementById("crosshair");
    
    // Audio control
    this.audioControl = document.getElementById("audio-control");
    this.muteBtn = document.getElementById("mute-btn");
    
    // Camera info
    this.cameraInfoEl = document.getElementById("camera-info");
    this.camXEl = document.getElementById("cam-x");
    this.camYEl = document.getElementById("cam-y");
    this.camZEl = document.getElementById("cam-z");
    this.camRxEl = document.getElementById("cam-rx");
    this.camRyEl = document.getElementById("cam-ry");
    this.camRzEl = document.getElementById("cam-rz");
    this.copyBtn = document.getElementById("copy-camera-btn");
    this.hideUIBtn = document.getElementById("hide-ui-btn");
    this.showUIFab = document.getElementById("show-ui-fab");
    
    // WASD controls
    this.desktopWASDControls = document.getElementById("desktop-wasd-controls");
    
    // Mobile button references
    this.upBtn = document.getElementById("up-btn");
    this.downBtn = document.getElementById("down-btn");
  }
  
  setupEventListeners() {
    // Start panel (click anywhere to play)
    this.uiPanel?.addEventListener("click", (e) => this.handleStartPanel(e));
    this.uiPanel?.addEventListener("touchstart", (e) => this.handleStartPanel(e), { passive: false });
    
    // Controls lock/unlock events
    this.controls.addEventListener("lock", () => this.onControlsLock());
    this.controls.addEventListener("unlock", () => this.onControlsUnlock());
    
    // Audio control
    this.muteBtn?.addEventListener("click", () => this.toggleAudioMute());
    this.muteBtn?.addEventListener("touchstart", (e) => { 
      e.preventDefault(); 
      this.toggleAudioMute(); 
    }, { passive: false });
    
    // Camera info controls
    this.copyBtn?.addEventListener("click", () => this.copyCoordinates());
    this.copyBtn?.addEventListener("touchstart", (e) => { 
      e.preventDefault(); 
      this.copyCoordinates(); 
    });
    this.hideUIBtn?.addEventListener("click", () => this.toggleUI());
    this.hideUIBtn?.addEventListener("touchstart", (e) => { 
      e.preventDefault(); 
      this.toggleUI(); 
    });
    this.showUIFab?.addEventListener("click", () => this.toggleUI(false));
    this.showUIFab?.addEventListener("touchstart", (e) => { 
      e.preventDefault(); 
      this.toggleUI(false); 
    });
    
    // Canvas click for pointer lock
    const renderer = document.querySelector('canvas');
    renderer?.addEventListener("click", () => {
      if (this.hasStarted && !this.controls.isLocked && !this.isMobile) {
        this.controls.lock();
      }
    });
    
    // Window focus handling
    window.addEventListener("focus", () => {
      if (this.hasStarted && !this.controls.isLocked && !this.isMobile) {
        this.canvasHint.classList.add("visible");
        const renderer = document.querySelector('canvas');
        renderer?.classList.add("clickable");
      }
    });
    
    // Keyboard shortcuts
    window.addEventListener("keydown", (e) => this.handleKeyboardShortcuts(e));
  }
  
  initializeUI() {
    // Apply device class
    document.body.classList.toggle("is-mobile", this.isMobile);
    
    // Initialize button text based on device
    if (this.isMobile) {
      if (this.copyBtn) this.copyBtn.innerHTML = "Copy";
      if (this.hideUIBtn) this.hideUIBtn.innerHTML = "Hide UI";
    }
    
    // Apply persisted mute state on startup
    this.updateAudioMuteUI();
    
    // Hide camera info by default on desktop (already hidden in HTML with class)
    // On mobile it's completely hidden via CSS
  }
  
  async handleStartPanel(e) {
    e.preventDefault();
    
    // Initialize audio if needed - especially important on mobile
    if (this.audioManager && !this.audioManager.isInitialized()) {
      try {
        console.log('Initializing audio on user interaction...');
        await this.audioManager.initOnce();
        
        // Force a test sound on mobile to ensure audio is working
        if (this.isMobile) {
          // Create a brief, silent test to "unlock" audio on mobile
          const audio = this.audioManager.getAudio();
          if (audio.ctx && audio.ctx.state === 'running') {
            // Create a very brief, quiet test tone to unlock audio
            const oscillator = audio.ctx.createOscillator();
            const gainNode = audio.ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audio.ctx.destination);
            
            // Very quiet and brief
            gainNode.gain.setValueAtTime(0.001, audio.ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audio.ctx.currentTime + 0.1);
            
            oscillator.frequency.setValueAtTime(440, audio.ctx.currentTime);
            oscillator.start(audio.ctx.currentTime);
            oscillator.stop(audio.ctx.currentTime + 0.1);
            
            console.log('Mobile audio unlock test completed');
          }
        }
        
        // Try to start ambient audio if it's loaded
        if (this.audioManager.isInitialized()) {
          try {
            const volume = this.isAudioMuted ? 0 : 0.25;
            this.audioManager.playLoop('ambience', { volume });
          } catch (error) {
            console.warn('Failed to start ambient audio:', error);
          }
        }
      } catch (error) {
        console.warn('Audio initialization failed:', error);
      }
    }
    
    if (this.isMobile) {
      this.uiPanel.style.display = "none";
      this.canvasHint.classList.remove("visible");
      this.crosshair.classList.add("visible");
      const renderer = document.querySelector('canvas');
      renderer?.classList.remove("clickable");
      this.hasStarted = true;
      this.controls.lock();
    } else {
      this.controls.lock();
    }
  }
  
  onControlsLock() {
    this.uiPanel.style.display = "none";
    this.canvasHint.classList.remove("visible");
    this.crosshair.classList.add("visible");
    const renderer = document.querySelector('canvas');
    renderer?.classList.remove("clickable");
    if (!this.hasStarted) this.hasStarted = true;
  }
  
  onControlsUnlock() {
    this.crosshair.classList.remove("visible");
    const renderer = document.querySelector('canvas');
    
    // After first start, show "Click to resume" when unlocked
    if (this.hasStarted && !this.isMobile) {
      this.canvasHint.classList.add("visible");
      renderer?.classList.add("clickable");
    } else if (!this.hasStarted) {
      this.uiPanel.style.display = "";
    }
  }
  
  updateCameraInfo() {
    if (!this.camXEl) return;
    
    this.camXEl.textContent = this.camera.position.x.toFixed(2);
    this.camYEl.textContent = this.camera.position.y.toFixed(2);
    this.camZEl.textContent = this.camera.position.z.toFixed(2);
    this.camRxEl.textContent = this.camera.rotation.x.toFixed(3);
    this.camRyEl.textContent = this.camera.rotation.y.toFixed(3);
    this.camRzEl.textContent = this.camera.rotation.z.toFixed(3);
  }
  
  async copyCoordinates() {
    if (!this.camXEl) return;
    
    const txt = `Camera Position: [${parseFloat(this.camXEl.textContent)}, ${parseFloat(
      this.camYEl.textContent
    )}, ${parseFloat(this.camZEl.textContent)}]
Camera Rotation: [${parseFloat(this.camRxEl.textContent)}, ${parseFloat(this.camRyEl.textContent)}, ${parseFloat(
      this.camRzEl.textContent
    )}]`;
    
    const showSuccess = () => {
      this.copyBtn.textContent = "Copied!";
      setTimeout(() => (this.copyBtn.innerHTML = this.isMobile ? 'Copy' : 'Copy <kbd>Ctrl</kbd>+<kbd>C</kbd>'), 1200);
    };
    
    const showFailure = () => {
      this.copyBtn.textContent = "Failed!";
      setTimeout(() => (this.copyBtn.innerHTML = this.isMobile ? 'Copy' : 'Copy <kbd>Ctrl</kbd>+<kbd>C</kbd>'), 1200);
    };
    
    // Modern clipboard API (preferred)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(txt);
        showSuccess();
        return;
      } catch (err) {
        // It might fail due to permissions, try the fallback
      }
    }
    
    // Fallback for older browsers and non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = txt;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      showSuccess();
    } catch (err) {
      showFailure();
    } finally {
      document.body.removeChild(textArea);
    }
  }
  
  toggleUI(forceState) {
    // On mobile, camera info is always hidden via CSS, so this only affects desktop
    if (this.isMobile) {
      // On mobile, just toggle camera coordinates (which are already hidden via CSS)
      // This is mainly for consistency in button behavior
      const shouldBeHidden = forceState !== undefined ? forceState : !this.cameraInfoEl.classList.contains("hidden");
      
      // Only hide camera info on mobile (other UI stays visible)
      this.cameraInfoEl.classList.toggle("hidden", shouldBeHidden);
      
      const hideButtonText = "Hide Coordinates";
      const showButtonText = "Show Coordinates";
      this.hideUIBtn.innerHTML = shouldBeHidden ? showButtonText : hideButtonText;
      return;
    }
    
    // Desktop behavior - only hide camera coordinates, keep essential UI visible
    const hidden = forceState !== undefined ? forceState : this.cameraInfoEl.classList.contains("hidden");
    const shouldBeHidden = forceState !== undefined ? forceState : !hidden;
    
    // Only toggle camera info visibility - keep other UI elements always visible
    this.cameraInfoEl.classList.toggle("hidden", shouldBeHidden);
    
    // Don't hide essential UI elements (audio control, WASD, canvas hint, crosshair)
    // These should always remain visible for proper functionality
    
    // Update button text to reflect what's actually being hidden
    const hideButtonText = 'Hide Coordinates <kbd>Ctrl</kbd>+<kbd>H</kbd>';
    const showButtonText = 'Show Coordinates <kbd>Ctrl</kbd>+<kbd>H</kbd>';
    this.hideUIBtn.innerHTML = shouldBeHidden ? showButtonText : hideButtonText;
  }
  
  restoreUIVisibility() {
    // Canvas hint: only visible when unlocked and not on mobile and has started
    if (this.controls.isLocked || this.isMobile || !this.hasStarted) {
      this.canvasHint.classList.remove("visible");
    } else if (this.hasStarted) {
      this.canvasHint.classList.add("visible");
    }
    
    // Crosshair: only visible when controls are locked
    if (this.controls.isLocked) {
      this.crosshair.classList.add("visible");
    } else {
      this.crosshair.classList.remove("visible");
    }
  }
  
  updateWASDHighlighting() {
    if (!this.controls.isLocked) return;
    
    // Get all WASD key elements
    const wasdKeys = document.querySelectorAll('.wasd-key[data-key]');
    
    wasdKeys.forEach(keyEl => {
      const keyCode = keyEl.getAttribute('data-key');
      const isPressed = window.wasdKeys && window.wasdKeys.has(keyCode);
      keyEl.classList.toggle('active', isPressed);
    });
  }
  
  toggleAudioMute() {
    this.isAudioMuted = !this.isAudioMuted;
    
    // Save the new mute state to localStorage
    saveMuteState(this.isAudioMuted);
    
    // Set global mute state in audio system (affects all new SFX)
    if (this.audioManager) {
      this.audioManager.setMuted(this.isAudioMuted);
      
      // Handle current ambient track
      const currentTrack = this.audioManager.getCurrentAmbienceTrack();
      if (currentTrack) {
        const audio = this.audioManager.getAudio();
        const handle = audio.activeLoops.get(currentTrack);
        if (handle) {
          if (this.isAudioMuted) {
            // Store original volume before muting
            handle.originalVolume = handle.gain.gain.value;
            this.previousVolumes.set(currentTrack, handle.gain.gain.value);
            this.audioManager.setLoopVolume(currentTrack, 0);
          } else {
            // Restore original volume
            const v = this.previousVolumes.get(currentTrack) || 0.35;
            this.audioManager.setLoopVolume(currentTrack, v);
            handle.originalVolume = v;
          }
        }
      }
    }
    
    this.updateAudioMuteUI();
  }
  
  updateAudioMuteUI() {
    this.muteBtn?.classList.toggle("muted", this.isAudioMuted);
    this.muteBtn?.classList.toggle("playing", !this.isAudioMuted);
    
    // Set initial audio system state
    if (this.audioManager) {
      this.audioManager.setMuted(this.isAudioMuted);
    }
  }
  
  setCurrentAmbienceTrack(trackName) {
    this.currentAmbienceTrack = trackName;
  }
  
  showLoading() {
    this.loadingEl.style.display = "block";
  }
  
  hideLoading() {
    this.loadingEl.style.display = "none";
  }
  
  handleKeyboardShortcuts(e) {
    // Only handle shortcuts when Ctrl is pressed and not on mobile
    if (!e.ctrlKey || this.isMobile) return;
    
    switch (e.code) {
      case "KeyC":
        e.preventDefault();
        this.copyCoordinates();
        this.flashButton(this.copyBtn);
        break;
      case "KeyH":
        e.preventDefault();
        this.toggleUI();
        this.flashButton(this.hideUIBtn);
        break;
    }
  }
  
  flashButton(button, duration = 200) {
    if (!button) return;
    button.style.transform = "scale(0.95)";
    button.style.filter = "brightness(1.2)";
    setTimeout(() => {
      button.style.transform = "";
      button.style.filter = "";
    }, duration);
  }
  
  // Getters for state
  get muted() {
    return this.isAudioMuted;
  }
  
  get started() {
    return this.hasStarted;
  }
  
  dispose() {
    // Remove any event listeners that need cleanup
    // Most are handled by removing DOM elements
  }
}

