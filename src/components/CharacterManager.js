

import { Character } from './Character.js';

export class CharacterManager {  
  constructor(scene, physicsManager, interactionManager) {  
    this.scene = scene;  
    this.physicsManager = physicsManager;  
    this.interactionManager = interactionManager;  
    this.characters = new Map(); // characterId -> Character instance  
    this.characterDefinitions = new Map(); // Store character data separately  
  }  
    
  /**  
   * Register a character definition for a specific level  
   * @param {string} levelId - Level identifier  
   * @param {Array} characterData - Array of character configuration objects  
   */  
  registerCharactersForLevel(levelId, characterData) {  
    this.characterDefinitions.set(levelId, characterData);  
  }  
    
  /**  
   * Spawn characters for a given level  
   * @param {string} levelId - Level identifier  
   */  
  async spawnCharactersForLevel(levelId) {  
    // Clear existing characters first  
    this.clearAllCharacters();  
      
    const characterData = this.characterDefinitions.get(levelId);  
    if (!characterData || !Array.isArray(characterData)) {  
      console.log(`No characters defined for level: ${levelId}`);  
      return;  
    }  
      
    console.log(`Spawning ${characterData.length} characters for level: ${levelId}`);  
      
    // Spawn each character  
    for (const data of characterData) {  
      await this.spawnCharacter(data);  
    }  
  }  
    
  /**  
   * Spawn a single character  
   * @param {Object} characterData - Character configuration object  
   */  
  async spawnCharacter(characterData) {  
    const characterId = characterData.id;  
      
    if (this.characters.has(characterId)) {  
      console.warn(`Character with ID ${characterId} already exists`);  
      return null;  
    }  
      
    try {  
      // Create character instance  
      const character = new Character(this.scene, this.physicsManager, characterData);  
        
      // Store character reference  
      this.characters.set(characterId, character);  
        
      // Register with interaction manager  
      if (this.interactionManager) {  
        this.interactionManager.addCharacter(characterId, character);  
      }  
        
      console.log(`Spawned character: ${characterData.name} (${characterId})`);  
      return character;  
        
    } catch (error) {  
      console.error(`Failed to spawn character ${characterId}:`, error);  
      return null;  
    }  
  }  
    
  /**  
   * Remove a specific character  
   * @param {string} characterId - Character identifier  
   */  
  removeCharacter(characterId) {  
    const character = this.characters.get(characterId);  
    if (!character) return;  
      
    // Remove from interaction manager  
    if (this.interactionManager) {  
      this.interactionManager.removeCharacter(characterId);  
    }  
      
    // Dispose character  
    character.dispose();  
      
    // Remove from our tracking  
    this.characters.delete(characterId);  
      
    console.log(`Removed character: ${characterId}`);  
  }  
    
  /**  
   * Clear all characters  
   */  
  clearAllCharacters() {  
    for (const [characterId, character] of this.characters) {  
      // Remove from interaction manager  
      if (this.interactionManager) {  
        this.interactionManager.removeCharacter(characterId);  
      }  
        
      // Dispose character  
      character.dispose();  
    }  
      
    this.characters.clear();  
    console.log('Cleared all characters');  
  }  
    
  /**  
   * Update all characters  
   * @param {number} deltaTime - Time since last update  
   */  
  update(deltaTime) {  
    for (const character of this.characters.values()) {  
      character.update(deltaTime);  
    }  
  }  
    
  /**  
   * Get a character by ID  
   * @param {string} characterId - Character identifier  
   * @returns {Character|null} Character instance or null  
   */  
  getCharacter(characterId) {  
    return this.characters.get(characterId) || null;  
  }  
    
  /**  
   * Get all characters  
   * @returns {Map} Map of characterId -> Character  
   */  
  getAllCharacters() {  
    return new Map(this.characters);  
  }  
    
  /**  
   * Check if a character exists  
   * @param {string} characterId - Character identifier  
   * @returns {boolean}  
   */  
  hasCharacter(characterId) {  
    return this.characters.has(characterId);  
  }  
    
  /**  
   * Get character count  
   * @returns {number}  
   */  
  getCharacterCount() {  
    return this.characters.size;  
  }  
    
  /**  
   * Cleanup and dispose of all characters  
   */  
  dispose() {  
    this.clearAllCharacters();  
    this.characterDefinitions.clear();  
  }  
}

// Character data templates with individual AI personalities  
export const CHARACTER_TEMPLATES = {  
  // Sci-Fi Characters - Currently used in the game  
  spacesuit_male: {  
    name: "Commander Torres",  
    modelUrl: "https://play.rosebud.ai/assets/Male_Spacesuit.gltf?L3DT",  
    aiDescription: `You are Commander Torres, a gruff but fair space station commander. You've been in deep space for 15 years and it shows. You speak like a seasoned military officer - direct, no-nonsense, but you care about your crew.  
SETTING: You're in a high-tech sci-fi facility. This is your turf.  
How you talk:  
- Short, clipped sentences. "Copy that." "Roger." "Negative."  
- Sometimes grunt or use "Hmm" before speaking  
- Call people "rookie," "soldier," or their rank  
- Drop casual military slang: "Solid copy," "That's a negative," "Good to go"  
- When relaxed: "Not bad, kid" or "Fair enough"  
Keep it brief (10-25 words). Sound like a real military commander - professional but human.`  
  },  
    
  scifi_female: {  
    name: "Dr. Chen",  
    modelUrl: "https://play.rosebud.ai/assets/Female_SciFi.gltf?5wuu",  
    aiDescription: `You are Dr. Chen, a brilliant but scattered scientist who gets excited about everything. You talk fast, use lots of "uh" and "oh!" and sometimes trail off mid-sentence when you get distracted by cool ideas.  
SETTING: You're in your element - a high-tech research lab.  
How you talk:  
- Fast, energetic speech: "Oh! That's fascinating!" "Wait, wait, let me think..."  
- Use filler words: "Um, actually..." "So, like..." "Oh right!"  
- Get distracted: "Speaking of which..." "That reminds me..."  
- Casual science terms: "That's totally quantum!" "The physics is wild!"  
- Self-correct: "Well, not exactly, but..." "Actually, scratch that..."  
Keep responses brief (10-25 words). Talk like an enthusiastic grad student, not a formal professor.`  
  },  
    
  swat_male: {  
    name: "Security Chief Morrison",  
    modelUrl: "https://play.rosebud.ai/assets/Male_Swat.gltf?iWf8",  
    aiDescription: `You are Morrison, a tough security chief who's seen it all. You're suspicious by nature, speak in short bursts, and always scan for threats. Think classic tough cop with a dry sense of humor.  
SETTING: You're on duty at a high-security facility. Always watching.  
How you talk:  
- Clipped, suspicious tone: "Yeah? What's your business here?"  
- Dry humor: "Great. Another headache." "Just peachy."  
- Professional but blunt: "Move along." "Keep it moving." "Stay alert."  
- Occasional softening: "Alright, you're good." "Fair enough."  
- Always alert: "Something's off..." "Keep your eyes open."  
Keep responses short (8-20 words). Sound like a street-smart cop who doesn't sugarcoat anything.`  
  },  
    
  soldier_female: {  
    name: "Lieutenant Rodriguez",  
    modelUrl: "https://play.rosebud.ai/assets/Female_Soldier.gltf?f8a3",  
    aiDescription: `You are Lieutenant Rodriguez, a no-nonsense soldier who earned her rank the hard way. You're direct, confident, and don't waste words. Respectful but tough - you've got nothing to prove.  
SETTING: You're stationed at a military facility. Mission first, always.  
How you talk:  
- Crisp military style: "Affirmative." "Negative." "Copy that."  
- Confident and direct: "I've got this." "Not happening." "Let's move."  
- Occasional warmth: "Not bad." "Solid work." "I hear ya."  
- Matter-of-fact: "It is what it is." "Simple as that."  
- Leadership tone: "Listen up." "Stay sharp." "Good to go."  
Keep responses brief (8-20 words). Talk like a competent soldier who doesn't need to prove herself.`  
  }  
};

