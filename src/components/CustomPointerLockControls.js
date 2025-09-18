import * as THREE from 'three';

export class CustomPointerLockControls extends THREE.EventDispatcher {  
  constructor(camera, domElement) {  
    super();  
      
    this.camera = camera;  
    this.domElement = domElement;  
    this.enabled = true;  
      
    // Internal state  
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');  
    this._PI_2 = Math.PI / 2;  
      
  // Mobile touch state - support multiple simultaneous touches  
  this._isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);  
  this._touchStates = new Map(); // Track multiple touch points by touch ID  
  this._activeCameraTouch = null; // Which touch ID is controlling camera  
      
    // Bind event handlers  
    this._onPointerLockChange = this._onPointerLockChange.bind(this);  
    this._onPointerLockError = this._onPointerLockError.bind(this);  
    this._onMouseMove = this._onMouseMove.bind(this);  
    this._onContextMenu = this._onContextMenu.bind(this);  
    this._onTouchStart = this._onTouchStart.bind(this);  
    this._onTouchMove = this._onTouchMove.bind(this);  
    this._onTouchEnd = this._onTouchEnd.bind(this);  
      
    // Set up DOM element styles and initial event listeners  
    this._setupDOMStyles();  
    this._addStaticEventListeners();  
  }  
    
  _setupDOMStyles() {  
    if (this.domElement) {  
      this.domElement.style.touchAction = 'none';  
      this.domElement.style.userSelect = 'none';  
      this.domElement.style.webkitUserSelect = 'none';  
    }  
  }  
    
  _addStaticEventListeners() {  
    if (this.domElement) {  
      this.domElement.addEventListener('contextmenu', this._onContextMenu);  
        
      // Add touch event listeners for mobile  
      if (this._isMobile) {  
        this._addMobileTouchListeners();  
      }  
    }  
  }  
    
  _addMobileTouchListeners() {  
    if (this.domElement && this._isMobile) {  
      // Remove existing listeners first to avoid duplicates  
      this._removeMobileTouchListeners();  
        
      // Ensure page scrolling is disabled  
      document.body.style.overflow = 'hidden';  
      document.body.style.touchAction = 'none';  
      document.documentElement.style.touchAction = 'none';  
        
      // Add touch event listeners with proper options  
      this.domElement.addEventListener('touchstart', this._onTouchStart, { passive: false });  
      this.domElement.addEventListener('touchmove', this._onTouchMove, { passive: false });  
      this.domElement.addEventListener('touchend', this._onTouchEnd, { passive: false });  
      this.domElement.addEventListener('touchcancel', this._onTouchEnd, { passive: false });  
        
      console.log('Mobile touch listeners added and page scrolling disabled');  
    }  
  }  
    
  _removeMobileTouchListeners() {  
    if (this.domElement && this._isMobile) {  
      this.domElement.removeEventListener('touchstart', this._onTouchStart);  
      this.domElement.removeEventListener('touchmove', this._onTouchMove);  
      this.domElement.removeEventListener('touchend', this._onTouchEnd);  
    }  
  }  
    
  _addPointerLockEventListeners() {  
    if (this.domElement) {  
      this.domElement.ownerDocument.addEventListener('pointerlockchange', this._onPointerLockChange);  
      this.domElement.ownerDocument.addEventListener('pointerlockerror', this._onPointerLockError);  
    }  
  }  
    
  _addMouseMoveListener() {  
    if (this.domElement) {  
      this.domElement.ownerDocument.addEventListener('mousemove', this._onMouseMove);  
    }  
  }  
    
  _cleanup() {  
    if (!this.domElement) return;  
      
    // Reset DOM element styles  
    this.domElement.style.touchAction = '';  
    this.domElement.style.userSelect = '';  
    this.domElement.style.webkitUserSelect = '';  
      
    // Remove all event listeners  
    this.domElement.removeEventListener('contextmenu', this._onContextMenu);  
    this.domElement.ownerDocument.removeEventListener('pointerlockchange', this._onPointerLockChange);  
    this.domElement.ownerDocument.removeEventListener('pointerlockerror', this._onPointerLockError);  
    this.domElement.ownerDocument.removeEventListener('mousemove', this._onMouseMove);  
      
    // Remove touch event listeners  
    if (this._isMobile) {  
      this._removeMobileTouchListeners();  
    }  
  }  
    
  lock() {  
    if (!this.enabled || !this.domElement) return;  
      
    // On mobile, skip pointer lock and just enable touch controls  
    if (this._isMobile) {  
      // Clear any existing touch states first  
      this._touchStates.clear();  
      this._activeCameraTouch = null;  
        
      // Force disable page scrolling  
      document.body.style.overflow = 'hidden';  
      document.body.style.touchAction = 'none';  
      document.documentElement.style.touchAction = 'none';  
        
      // Re-add touch event listeners in case they were removed during unlock  
      this._addMobileTouchListeners();  
        
      // Dispatch lock event  
      this.dispatchEvent({ type: 'lock' });  
      return;  
    }  
      
    // Set up pointer lock event listeners for desktop  
    this._addPointerLockEventListeners();  
      
    // Request pointer lock with essential retry logic  
    const lockPromise = this.domElement.requestPointerLock();  
    if (lockPromise) {  
      lockPromise.catch(error => {  
        // Retry for SecurityError when user exits lock too quickly (essential for relock)  
        if (error.name === 'SecurityError' && !this.isLocked && this.enabled) {  
          setTimeout(() => this.lock(), 100);  
        } else {  
          this._cleanup();  
          // Don't dispatch unlock event on failure to avoid UI confusion  
        }  
      });  
    }  
  }  
    
  unlock() {  
    if (!this.domElement) return;  
      
    try {  
    this.domElement.ownerDocument.exitPointerLock();  
    } catch (error) {  
      // Silently handle exit errors  
    }  
      
    // Clear mobile touch states  
    this._touchStates.clear();  
    this._activeCameraTouch = null;  
      
    this._cleanup();  
  }  
    
  _onPointerLockChange() {  
    const isPointerLockActive = this.domElement &&   
                               this.domElement.ownerDocument.pointerLockElement === this.domElement;  
      
    if (isPointerLockActive) {  
      this._addMouseMoveListener();  
      this.dispatchEvent({ type: 'lock' });  
    } else {  
      this._cleanup();  
      this.dispatchEvent({ type: 'unlock' });  
    }  
  }  
    
  _onPointerLockError() {  
    // Handle pointer lock errors silently - no console logging  
    this._cleanup();  
    // Don't dispatch unlock event on failure to avoid UI confusion  
  }  
    
  _onMouseMove(event) {  
    if (!this.enabled || !this.isLocked) return;  
      
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;  
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;  
      
    this._euler.setFromQuaternion(this.camera.quaternion);  
      
    this._euler.y -= movementX * 0.002;  
    this._euler.x -= movementY * 0.002;  
      
    // Clamp vertical rotation to prevent over-rotation  
    this._euler.x = Math.max(-this._PI_2, Math.min(this._PI_2, this._euler.x));  
      
    this.camera.quaternion.setFromEuler(this._euler);  
      
    this.dispatchEvent({ type: 'change' });  
  }  
    
  _onContextMenu(event) {  
    event.preventDefault();  
  }  
    
  _onTouchStart(event) {  
    if (!this.enabled) return;  
      
    // Handle multiple touches  
    for (let i = 0; i < event.touches.length; i++) {  
      const touch = event.touches[i];  
      const touchId = touch.identifier;  
        
      // Skip touches that are over the movement joystick or vertical buttons  
      if (this._isTouchOverJoystick(touch) || this._isTouchOverVerticalButtons(touch)) {  
        continue;  
      }  
        
      // If we don't have an active camera touch, use this one  
      if (this._activeCameraTouch === null) {  
        event.preventDefault();  
          
        this._activeCameraTouch = touchId;  
        this._touchStates.set(touchId, {  
          isActive: true,  
          startX: touch.clientX,  
          startY: touch.clientY,  
          lastX: touch.clientX,  
          lastY: touch.clientY  
        });  
        break; // Only need one touch for camera control  
      }  
    }  
  }  
    
  _onTouchMove(event) {  
    if (!this.enabled || this._activeCameraTouch === null) return;  
      
    // Find the touch that's controlling the camera  
    let cameraTouch = null;  
    for (let i = 0; i < event.touches.length; i++) {  
      const touch = event.touches[i];  
      if (touch.identifier === this._activeCameraTouch) {  
        cameraTouch = touch;  
        break;  
      }  
    }  
      
    if (!cameraTouch) return;  
      
    // Check if the camera touch moved over the joystick or vertical buttons (end camera control if so)  
    if (this._isTouchOverJoystick(cameraTouch) || this._isTouchOverVerticalButtons(cameraTouch)) {  
      this._endCameraTouch(this._activeCameraTouch);  
      return;  
    }  
      
    const touchState = this._touchStates.get(this._activeCameraTouch);  
    if (!touchState || !touchState.isActive) return;  
      
    event.preventDefault();  
      
    const movementX = cameraTouch.clientX - touchState.lastX;  
    const movementY = cameraTouch.clientY - touchState.lastY;  
      
    touchState.lastX = cameraTouch.clientX;  
    touchState.lastY = cameraTouch.clientY;  
      
    // Apply camera rotation with touch sensitivity  
    this._euler.setFromQuaternion(this.camera.quaternion);  
      
    this._euler.y -= movementX * 0.005; // Slightly higher sensitivity for touch  
    this._euler.x -= movementY * 0.005;  
      
    // Clamp vertical rotation to prevent over-rotation  
    this._euler.x = Math.max(-this._PI_2, Math.min(this._PI_2, this._euler.x));  
      
    this.camera.quaternion.setFromEuler(this._euler);  
      
    this.dispatchEvent({ type: 'change' });  
  }  
    
  _onTouchEnd(event) {  
    if (!this.enabled) return;  
    event.preventDefault();  
      
    // Check if any of the ended touches was our camera touch  
    for (let i = 0; i < event.changedTouches.length; i++) {  
      const touch = event.changedTouches[i];  
      const touchId = touch.identifier;  
        
      if (touchId === this._activeCameraTouch) {  
        this._endCameraTouch(touchId);  
        break;  
      }  
    }  
  }  
    
  _endCameraTouch(touchId) {  
    if (this._activeCameraTouch === touchId) {  
      this._activeCameraTouch = null;  
    }  
    this._touchStates.delete(touchId);  
  }  
  get isLocked() {  
    // On mobile, consider controls "locked" when enabled  
    if (this._isMobile) {  
      return this.enabled;  
    }  
      
    return this.domElement &&   
           this.domElement.ownerDocument.pointerLockElement === this.domElement;  
  }  
    
  getDirection(v) {  
    // Get the camera's forward direction vector  
    this.camera.getWorldDirection(v);  
    return v;  
  }  
    
  getObject() {  
    return this.camera;  
  }  
    
  _isTouchOverJoystick(touch) {  
    // Check if the touch point is over the movement joystick  
    const joystickElement = document.getElementById('movement-joystick');  
    if (!joystickElement) return false;  
      
    const rect = joystickElement.getBoundingClientRect();  
    const touchX = touch.clientX;  
    const touchY = touch.clientY;  
      
    return touchX >= rect.left &&   
           touchX <= rect.right &&   
           touchY >= rect.top &&   
           touchY <= rect.bottom;  
  }  
    
  _isTouchOverVerticalButtons(touch) {  
    // Check both individual buttons to be more precise  
    const upBtn = document.getElementById('up-btn');  
    const downBtn = document.getElementById('down-btn');  
      
    if (!upBtn || !downBtn) return false;  
      
    const touchX = touch.clientX;  
    const touchY = touch.clientY;  
      
    // Check up button  
    const upRect = upBtn.getBoundingClientRect();  
    const overUpBtn = touchX >= upRect.left && touchX <= upRect.right &&   
                      touchY >= upRect.top && touchY <= upRect.bottom;  
      
    // Check down button    
    const downRect = downBtn.getBoundingClientRect();  
    const overDownBtn = touchX >= downRect.left && touchX <= downRect.right &&   
                        touchY >= downRect.top && touchY <= downRect.bottom;  
      
    return overUpBtn || overDownBtn;  
  }  
    
  dispose() {  
    this.unlock();  
    this._cleanup();  
  }  
}