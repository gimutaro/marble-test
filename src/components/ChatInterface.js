import { ChatAIClass } from './ChatAI.js';

export class ChatInterface {  
  constructor(controls = null) {  
    this.controls = controls; // Store reference to pointer lock controls  
    this.currentCharacter = null;  
    this.chatAI = null;  
    this.isVisible = false;  
    this.isWaitingForResponse = false;  
      
    // Chat history persistence per character  
    this.chatHistories = new Map(); // characterId -> { messages: [], chatAI: ChatAIClass }  
    this.hasGreeted = new Set(); // Track which characters we've already greeted  
      
    // Create and inject chat UI  
    this.createChatUI();  
    this.setupEventListeners();  
  }  
    
  createChatUI() {  
    // Create chat interface HTML structure (uses centralized CSS)  
    const chatInterface = document.createElement('div');  
    chatInterface.id = 'chat-interface';  
    chatInterface.className = 'chat-interface';  
    chatInterface.innerHTML = `  
      <div class="chat-header">  
        <h3 id="chat-character-name">Character</h3>  
        <button id="chat-close-btn" class="chat-close-btn">×</button>  
      </div>  
      <div class="chat-messages" id="chat-messages"></div>  
      <div class="chat-input-container">  
        <textarea id="chat-input" class="chat-input" placeholder="Type your message..." rows="1"></textarea>  
        <button id="chat-send-btn" class="chat-send-btn">Send</button>  
      </div>  
    `;  
      
    document.body.appendChild(chatInterface);  
      
    // Store element references  
    this.chatElement = chatInterface;  
    this.characterNameElement = document.getElementById('chat-character-name');  
    this.messagesElement = document.getElementById('chat-messages');  
    this.inputElement = document.getElementById('chat-input');  
    this.sendButton = document.getElementById('chat-send-btn');  
    this.closeButton = document.getElementById('chat-close-btn');  
  }  
    
  setupEventListeners() {  
    // Listen for chat start events  
    window.addEventListener('startChat', (event) => {  
      this.openChat(event.detail);  
    });  
      
    // Close chat button  
    this.closeButton.addEventListener('click', () => {  
      this.closeChat();  
    });  
      
    // Send message button  
    this.sendButton.addEventListener('click', () => {  
      this.sendMessage();  
    });  
      
    // Enter key to send (Shift+Enter for new line)  
    this.inputElement.addEventListener('keydown', (event) => {  
      if (event.key === 'Enter' && !event.shiftKey) {  
        event.preventDefault();  
        this.sendMessage();  
      }  
    });  
      
    // Auto-resize textarea  
    this.inputElement.addEventListener('input', () => {  
      this.autoResizeTextarea();  
    });  
      
    // Prevent mobile viewport jumping on focus  
    this.inputElement.addEventListener('focus', (event) => {  
      if (document.body.classList.contains('is-mobile')) {  
        // Store current scroll position  
        const scrollY = window.scrollY;  
          
        // Restore scroll position after focus  
        setTimeout(() => {  
          window.scrollTo(0, scrollY);  
        }, 10);  
      }  
    });  
      
    // Escape key to close chat  
    window.addEventListener('keydown', (event) => {  
      if (event.key === 'Escape' && this.isVisible) {  
        this.closeChat();  
      }  
    });  
  }  
    
  /**  
   * Open chat interface with character  
   * @param {Object} characterDetail - Character data from proximity system  
   */  
  async openChat(characterDetail) {  
    this.currentCharacter = characterDetail;  
    this.characterNameElement.textContent = characterDetail.character.name || 'Character';  
      
    // Store current viewport position before any focus changes  
    const currentScrollY = window.scrollY;  
      
    // Release pointer lock to allow UI interaction  
    if (this.controls && this.controls.isLocked) {  
      this.controls.unlock();  
    }  
      
    const characterId = characterDetail.characterId;  
    const characterType = characterDetail.character.characterType || 'witch';  
      
    // Check if we have existing chat history for this character  
    if (this.chatHistories.has(characterId)) {  
      // Restore existing chat  
      const history = this.chatHistories.get(characterId);  
      this.chatAI = history.chatAI;  
      this.restoreMessages(history.messages);  
        
      // Show the chat interface  
      this.chatElement.classList.add('visible');  
      this.isVisible = true;  
        
    } else {  
      // Initialize new chat for this character - pass full character data instead of just type  
      this.chatAI = new ChatAIClass(characterDetail.character);  
      this.messagesElement.innerHTML = '';  
        
      // Create new history entry  
      this.chatHistories.set(characterId, {  
        messages: [],  
        chatAI: this.chatAI  
      });  
        
      // Show the chat interface  
      this.chatElement.classList.add('visible');  
      this.isVisible = true;  
        
      // Only trigger wave animation and greeting for first-time interactions  
      if (!this.hasGreeted.has(characterId)) {  
        // Trigger wave animation for the character  
        if (characterDetail.characterInstance && characterDetail.characterInstance.triggerWave) {  
          characterDetail.characterInstance.triggerWave();  
        }  
          
        // Show typing indicator while getting initial greeting  
        this.showTypingIndicator();  
          
        try {  
          // Get AI-generated initial greeting  
          const greeting = await this.chatAI.getInitialGreeting();  
            
          // Remove typing indicator  
          this.hideTypingIndicator();  
            
          // Add character's AI-generated greeting message  
          this.addMessage('character', greeting);  
            
        } catch (error) {  
          console.error('Error getting initial greeting:', error);  
          this.hideTypingIndicator();  
            
          // Fallback to a generic greeting if AI fails  
          const characterName = characterDetail.character.name || 'Character';  
          const fallbackGreeting = `Hello there! I'm ${characterName}.`;  
          this.addMessage('character', fallbackGreeting);  
        }  
          
        // Mark this character as greeted  
        this.hasGreeted.add(characterId);  
      }  
    }  
      
    // Focus on input with viewport protection on mobile  
    setTimeout(() => {  
      // Store scroll position before focus  
      const scrollY = window.scrollY;  
        
      this.inputElement.focus();  
        
      // Prevent mobile scroll-to-input behavior  
      if (document.body.classList.contains('is-mobile')) {  
        // Restore scroll position immediately  
        window.scrollTo(0, scrollY);  
          
        // Also prevent any delayed scroll attempts  
        setTimeout(() => {  
          window.scrollTo(0, scrollY);  
        }, 100);  
      }  
    }, 300);  
      
    console.log(`Opened chat with ${characterDetail.character.name || 'Character'}`);  
  }  
    
  /**  
   * Close chat interface  
   */  
  closeChat() {  
    // Save current messages to history before closing  
    if (this.currentCharacter && this.chatAI) {  
      const characterId = this.currentCharacter.characterId;  
      const messages = this.getCurrentMessages();  
        
      this.chatHistories.set(characterId, {  
        messages: messages,  
        chatAI: this.chatAI  
      });  
    }  
      
    this.chatElement.classList.remove('visible');  
    this.isVisible = false;  
    this.currentCharacter = null;  
    this.chatAI = null;  
    this.isWaitingForResponse = false;  
      
    // Clear input and blur it to prevent mobile keyboard issues  
    this.inputElement.value = '';  
    this.inputElement.blur(); // Important: remove focus  
    this.autoResizeTextarea();  
      
    // On mobile, set up simple re-engagement when user touches screen again  
    if (document.body.classList.contains('is-mobile')) {  
      // Restore scroll position to top of game  
      window.scrollTo(0, 0);  
        
      // Clear any active touches that might interfere  
      if (this.controls && this.controls._touchStates) {  
        this.controls._touchStates.clear();  
        this.controls._activeCameraTouch = null;  
      }  
        
      // Set up one-time listener to re-engage controls when user touches screen  
      this.setupTouchReengagement();  
    }  
      
    console.log('Chat closed');  
  }  
    
  /**  
   * Send user message  
   */  
  async sendMessage() {  
    const message = this.inputElement.value.trim();  
    if (!message || this.isWaitingForResponse || !this.chatAI) return;  
      
    // Add user message to chat  
    this.addMessage('user', message);  
      
    // Clear input  
    this.inputElement.value = '';  
    this.autoResizeTextarea();  
      
    // Show typing indicator  
    this.showTypingIndicator();  
    this.isWaitingForResponse = true;  
    this.updateSendButton();  
      
    try {  
      // Get AI response  
      const response = await this.chatAI.getResponseWithHistory(message);  
        
      // Remove typing indicator  
      this.hideTypingIndicator();  
        
      // Add AI response to chat  
      this.addMessage('character', response);  
        
    } catch (error) {  
      console.error('Error getting AI response:', error);  
      this.hideTypingIndicator();  
      this.addMessage('character', "I seem to be having trouble thinking right now. Could you try asking again?");  
    } finally {  
      this.isWaitingForResponse = false;  
      this.updateSendButton();  
    }  
  }  
    
  /**  
   * Add message to chat  
   * @param {string} sender - 'user' or 'character'  
   * @param {string} text - Message text  
   */  
  addMessage(sender, text) {  
    const messageElement = document.createElement('div');  
    messageElement.className = `chat-message ${sender}`;  
    messageElement.textContent = text;  
      
    this.messagesElement.appendChild(messageElement);  
    this.scrollToBottom();  
  }  
    
  /**  
   * Get current messages from the chat display  
   * @returns {Array} Array of message objects  
   */  
  getCurrentMessages() {  
    const messages = [];  
    const messageElements = this.messagesElement.querySelectorAll('.chat-message:not(.typing)');  
      
    messageElements.forEach(element => {  
      const sender = element.classList.contains('user') ? 'user' : 'character';  
      const text = element.textContent;  
      messages.push({ sender, text });  
    });  
      
    return messages;  
  }  
    
  /**  
   * Restore messages from history  
   * @param {Array} messages - Array of message objects  
   */  
  restoreMessages(messages) {  
    this.messagesElement.innerHTML = '';  
      
    messages.forEach(message => {  
      const messageElement = document.createElement('div');  
      messageElement.className = `chat-message ${message.sender}`;  
      messageElement.textContent = message.text;  
      this.messagesElement.appendChild(messageElement);  
    });  
      
    this.scrollToBottom();  
  }  
    
  /**  
   * Show typing indicator  
   */  
  showTypingIndicator() {  
    const typingElement = document.createElement('div');  
    typingElement.className = 'chat-message typing';  
    typingElement.id = 'typing-indicator';  
      
    const typingContent = document.createElement('div');  
    typingContent.className = 'typing-indicator';  
    typingContent.innerHTML = `  
      <span class="typing-dot"></span>  
      <span class="typing-dot"></span>  
      <span class="typing-dot"></span>  
    `;  
      
    typingElement.appendChild(typingContent);  
    this.messagesElement.appendChild(typingElement);  
    this.scrollToBottom();  
  }  
    
  /**  
   * Hide typing indicator  
   */  
  hideTypingIndicator() {  
    const typingElement = document.getElementById('typing-indicator');  
    if (typingElement) {  
      typingElement.remove();  
    }  
  }  
    
  /**  
   * Auto-resize textarea based on content  
   */  
  autoResizeTextarea() {  
    this.inputElement.style.height = 'auto';  
    this.inputElement.style.height = Math.min(this.inputElement.scrollHeight, 80) + 'px';  
  }  
    
  /**  
   * Update send button state  
   */  
  updateSendButton() {  
    this.sendButton.disabled = this.isWaitingForResponse;  
    this.sendButton.textContent = this.isWaitingForResponse ? 'Sending...' : 'Send';  
  }  
    
  /**  
   * Scroll messages to bottom  
   */  
  scrollToBottom() {  
    setTimeout(() => {  
      this.messagesElement.scrollTop = this.messagesElement.scrollHeight;  
    }, 10);  
  }  
    
  /**  
   * Check if chat is currently open  
   * @returns {boolean}  
   */  
  isOpen() {  
    return this.isVisible;  
  }  
    
  /**  
   * Toggle UI visibility (for UI hide/show system)  
   * @param {boolean} visible - Whether UI should be visible  
   */  
  setUIVisible(visible) {  
    if (!visible && this.isVisible) {  
      this.closeChat();  
    }  
  }  
    
  /**  
   * Cleanup and dispose of the chat interface  
   */  
  dispose() {  
    // Remove UI elements  
    if (this.chatElement) {  
      this.chatElement.remove();  
    }  
      
    // Clear all references  
    this.chatHistories.clear();  
    this.hasGreeted.clear();  
    this.currentCharacter = null;  
    this.chatAI = null;  
    this.isVisible = false;  
  }  
    
  /**  
   * Set up touch re-engagement after chat closes on mobile  
   * This waits for the user to touch the screen, then re-engages controls  
   */  
  setupTouchReengagement() {  
    if (!document.body.classList.contains('is-mobile')) return;  
      
    // Capture controls reference to avoid scope issues  
    const controls = this.controls;  
      
    // Create a simple overlay hint  
    const reengageHint = document.createElement('div');  
    reengageHint.style.cssText = `  
      position: fixed;  
      top: 50%;  
      left: 50%;  
      transform: translate(-50%, -50%);  
      background: rgba(0,0,0,0.85);  
      color: \#fff;  
      padding: 12px 18px;  
      border-radius: 10px;  
      border: 1px solid rgba(124,58,237,0.4);  
      font: 14px 'Monocraft', ui-monospace, monospace;  
      backdrop-filter: blur(8px);  
      z-index: 1300;  
      pointer-events: none;  
      opacity: 0;  
      transition: opacity 0.3s ease;  
    `;  
    reengageHint.textContent = 'Tap to resume game controls';  
    document.body.appendChild(reengageHint);  
      
    // Show hint after a brief delay  
    setTimeout(() => {  
      reengageHint.style.opacity = '1';  
    }, 100);  
      
    // One-time touch handler to re-engage controls  
    const handleReengage = (event) => {  
      // Only handle touches on the game canvas area, not UI elements  
      const target = event.target;  
      const isUIElement = target.closest('.chat-interface, \#portal-hint, \#character-hint, \#mobile-controls, \#camera-info, \#audio-control');  
        
      if (!isUIElement) {  
        event.preventDefault();  
        event.stopPropagation();  
          
        // Remove the hint  
        reengageHint.remove();  
          
        // Clear any lingering touch states  
        if (controls && controls._touchStates) {  
          controls._touchStates.clear();  
          controls._activeCameraTouch = null;  
        }  
          
        // Force re-enable page scroll blocking  
        document.body.style.overflow = 'hidden';  
        document.body.style.touchAction = 'none';  
        document.documentElement.style.touchAction = 'none';  
          
        // Re-engage controls with multiple attempts  
        if (controls) {  
          controls.lock();  
            
          // Second attempt after slight delay to ensure it sticks  
          setTimeout(() => {  
            if (!controls.isLocked) {  
              controls.lock();  
            }  
            // Force re-add touch listeners as backup  
            if (controls._addMobileTouchListeners) {  
              controls._addMobileTouchListeners();  
            }  
          }, 50);  
        }  
          
        // Remove this one-time listener  
        document.removeEventListener('touchstart', handleReengage, true);  
        document.removeEventListener('click', handleReengage, true);  
          
        console.log('Touch controls re-engaged after chat close');  
      }  
    };  
      
    // Add listeners for both touch and click (capture phase to handle first)  
    document.addEventListener('touchstart', handleReengage, true);  
    document.addEventListener('click', handleReengage, true);  
      
    // Auto-remove hint and handlers after 10 seconds if user doesn't interact  
    setTimeout(() => {  
      if (reengageHint.parentNode) {  
        reengageHint.remove();  
        document.removeEventListener('touchstart', handleReengage, true);  
        document.removeEventListener('click', handleReengage, true);  
          
        // Auto re-engage controls if user didn't manually do it  
        if (controls && !controls.isLocked) {  
          controls.lock();  
          setTimeout(() => {  
            if (!controls.isLocked) {  
              controls.lock();  
            }  
            if (controls._addMobileTouchListeners) {  
              controls._addMobileTouchListeners();  
            }  
          }, 50);  
        }  
      }  
    }, 10000);  
  }  
}