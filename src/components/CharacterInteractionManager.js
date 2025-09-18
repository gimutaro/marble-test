

import * as THREE from "three";

export class CharacterInteractionManager {  
  constructor(camera, controls) {  
    this.camera = camera;  
    this.controls = controls;  
    this.characters = new Map(); // characterId -> Character instance  
    this.activeCharacters = []; // Array of {character, characterId, distance}  
      
    // Interaction state  
    this.nearestCharacter = null;  
    this.interactionRange = 3.2; // Adjusted for a more balanced interaction distance  
    this.lastInteractionState = new Map(); // Track previous states for sound/animation  
      
    // UI elements for character interaction hints  
    this.createInteractionUI();  
      
    // Event listeners  
    this.setupEventListeners();  
  }  
    
  createInteractionUI() {  
    // Create character interaction hint (uses centralized CSS)  
    const characterHint = document.createElement('div');  
    characterHint.id = 'character-hint';  
    characterHint.className = 'character-hint game-hint';  
    characterHint.innerHTML = `  
      <span id="character-hint-text">Talk to Character — Press <span class="key">T</span></span>  
    `;  
      
    document.body.appendChild(characterHint);  
      
    this.characterHint = characterHint;  
    this.characterHintText = document.getElementById('character-hint-text');  
  }  
    
  setupEventListeners() {  
    // T key to interact with characters (desktop) - only when chat is not open  
    window.addEventListener('keydown', (e) => {  
      if (e.code === 'KeyT') {  
        // Check if chat is currently open - if so, don't intercept T key  
        const chatInterface = document.querySelector('.chat-interface.visible');  
        if (!chatInterface) {  
          this.tryInteractWithCharacter();  
        }  
      }  
    });  
      
    // Mobile tap on hint to interact  
    this.characterHint.addEventListener('click', (e) => {  
      e.preventDefault();  
      this.tryInteractWithCharacter();  
    });  
      
    this.characterHint.addEventListener('touchstart', (e) => {  
      e.preventDefault();  
      e.stopPropagation();  
      this.tryInteractWithCharacter();  
    }, { passive: false });  
  }  
    
  /**  
   * Register a character for proximity detection  
   * @param {string} characterId - Unique identifier for the character  
   * @param {Character} character - Character instance  
   */  
  addCharacter(characterId, character) {  
    this.characters.set(characterId, character);  
    console.log(`Registered character: ${characterId} (${character.characterData.name})`);  
  }  
    
  /**  
   * Remove a character from proximity detection  
   * @param {string} characterId - Character identifier to remove  
   */  
  removeCharacter(characterId) {  
    this.characters.delete(characterId);  
    this.lastInteractionState.delete(characterId);  
    console.log(`Unregistered character: ${characterId}`);  
  }  
    
  /**  
   * Update proximity detection and interaction states  
   * @param {number} deltaTime - Time since last update  
   */  
  update(deltaTime) {  
    if (!this.controls.isLocked || this.characters.size === 0) {  
      this.hideCharacterHint();  
      return;  
    }  
      
    // Find all characters within extended detection range  
    this.activeCharacters = [];  
    const playerPosition = this.camera.position;  
    const detectionRange = this.interactionRange * 1.8; // Wider detection for smooth transitions  
      
    for (const [characterId, character] of this.characters) {  
      if (!character.isLoaded || !character.isInteractable) continue;  
        
      const distance = character.getDistanceTo(playerPosition);  
      if (distance <= detectionRange) {  
        this.activeCharacters.push({  
          character,  
          characterId,  
          distance  
        });  
      }  
    }  
      
    // Sort by distance (closest first)  
    this.activeCharacters.sort((a, b) => a.distance - b.distance);  
      
    // Handle nearest character interaction  
    const nearest = this.activeCharacters.length > 0 ? this.activeCharacters[0] : null;  
      
    if (nearest && nearest.distance <= this.interactionRange) {  
      // Player is in interaction range of a character  
      if (this.nearestCharacter?.characterId !== nearest.characterId) {  
        // Changed to a different character or newly in range  
        this.nearestCharacter = nearest;  
        this.updateCharacterHint(nearest);  
        this.triggerCharacterAttention(nearest);  
      }  
    } else {  
      // No character in interaction range  
      if (this.nearestCharacter) {  
        this.nearestCharacter = null;  
        this.hideCharacterHint();  
      }  
    }  
  }  
    
  /**  
   * Update the character interaction hint UI  
   * @param {Object} characterInfo - Object containing character, characterId, distance  
   */  
  updateCharacterHint(characterInfo) {  
    if (!characterInfo) {  
      this.hideCharacterHint();  
      return;  
    }  
      
    const characterName = characterInfo.character.characterData.name;  
    const isMobile = document.body.classList.contains('is-mobile');  
      
    this.characterHintText.innerHTML = `Talk to ${characterName} — ${  
      isMobile ? 'Tap to chat' : 'Press <span class="key">T</span>'  
    }`;  
      
    this.characterHint.classList.add('visible');  
  }  
    
  /**  
   * Hide the character interaction hint  
   */  
  hideCharacterHint() {  
    this.characterHint.classList.remove('visible');  
  }  
    
  /**  
   * Trigger character attention (wave animation)  
   * @param {Object} characterInfo - Object containing character info  
   */  
  triggerCharacterAttention(characterInfo) {  
    const { character, characterId } = characterInfo;  
      
    // Check if we've already triggered attention for this character recently  
    const lastAttention = this.lastInteractionState.get(characterId) || 0;  
    const now = Date.now();  
      
    // Only trigger wave if it's been more than 10 seconds since last attention  
    if (now - lastAttention > 10000) {  
      character.triggerWave();  
      this.lastInteractionState.set(characterId, now);  
        
      // Play attention sound if available  
      if (window.audioManager && window.audioManager.isInitialized()) {  
        try {  
          window.audioManager.playOneShot('character_attention', { volume: 0.1 });  
        } catch (error) {  
          // Sound not available, continue without it  
        }  
      }  
    }  
  }  
    
  /**  
   * Try to interact with the nearest character  
   */  
  tryInteractWithCharacter() {  
    if (!this.nearestCharacter) return;  
      
    const { character, characterId } = this.nearestCharacter;  
      
    // Dispatch custom event for chat system to handle  
    const chatEvent = new CustomEvent('startChat', {  
      detail: {  
        character: character.characterData,  
        characterId: characterId,  
        characterInstance: character  
      }  
    });  
      
    window.dispatchEvent(chatEvent);  
      
    // Hide the hint since chat is opening  
    this.hideCharacterHint();  
      
    console.log(`Starting chat with ${character.characterData.name}`);  
  }  
    
  /**  
   * Get the currently nearest character  
   * @returns {Object|null} Character info object or null  
   */  
  getNearestCharacter() {  
    return this.nearestCharacter;  
  }  
    
  /**  
   * Check if any character is in interaction range  
   * @returns {boolean}  
   */  
  hasCharacterInRange() {  
    return this.nearestCharacter !== null;  
  }  
    
  /**  
   * Toggle UI visibility (for UI hide/show system)  
   * @param {boolean} visible - Whether UI should be visible  
   */  
  setUIVisible(visible) {  
    this.characterHint.classList.toggle('hidden', !visible);  
  }  
    
  /**  
   * Cleanup and dispose of the interaction manager  
   */  
  dispose() {  
    // Remove UI elements  
    if (this.characterHint) {  
      this.characterHint.remove();  
    }  
      
    // Clear all references  
    this.characters.clear();  
    this.activeCharacters = [];  
    this.nearestCharacter = null;  
    this.lastInteractionState.clear();  
  }  
}

