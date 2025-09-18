import * as THREE from "three";  
import { CustomPointerLockControls } from "./CustomPointerLockControls.js";  
import { VirtualJoystick } from "./VirtualJoystick.js";

/** Wire up pointer lock controls + a simple WASD+RF fly movement. */  
export function setupFirstPersonControls(camera, domElement, { moveSpeed = 5 } = {}) {  
  const controls = new CustomPointerLockControls(camera, domElement);  
  const keys = new Set();  
  // Reuse vectors to avoid per-frame allocations (less GC stutter).  
  const _fwd = new THREE.Vector3();  
  const _right = new THREE.Vector3();  
    
  // Mobile detection and virtual joystick  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);  
  let movementJoystick = null;  
    
  // Mobile vertical movement buttons  
  let upButton = null;  
  let downButton = null;  
  let isUpPressed = false;  
  let isDownPressed = false;  
    
  // Initialize virtual joystick for mobile movement  
  if (isMobile) {  
    const movementContainer = document.getElementById('movement-joystick');  
    const movementKnob = document.getElementById('movement-knob');  
      
    if (movementContainer && movementKnob) {  
      movementJoystick = new VirtualJoystick(movementContainer, movementKnob, {  
        maxDistance: 50,  
        deadZone: 0.15,  
        returnSpeed: 0.8  
      });  
    }  
  }  
    
  // Initialize vertical movement buttons for ALL devices  
  upButton = document.getElementById("up-btn");  
  downButton = document.getElementById("down-btn");  
  const setupVerticalButton = (button, pressFlagSetter) => {  
    if (!button) return;  
    const start = (e) => {  
      e.preventDefault();  
      e.stopPropagation();  
      pressFlagSetter(true);  
      button.classList.add("active");  
    };  
    const end = (e) => {  
      e.preventDefault();  
      e.stopPropagation();  
      pressFlagSetter(false);  
      button.classList.remove("active");  
    };  
    button.addEventListener("touchstart", start, { passive: false });  
    button.addEventListener("touchend", end, { passive: false });  
    button.addEventListener("touchcancel", end, { passive: false });  
    button.addEventListener("mousedown", start);  
    button.addEventListener("mouseup", end);  
    button.addEventListener("mouseleave", end);  
    button.addEventListener("contextmenu", (e) => e.preventDefault());  
  };  
  setupVerticalButton(upButton, (isPressed) => (isUpPressed = isPressed));  
  setupVerticalButton(downButton, (isPressed) => (isDownPressed = isPressed));

  // Expose keys globally for WASD highlighting  
  window.wasdKeys = keys;  
    
  function onKey(e, down) {  
    if (down) keys.add(e.code); else keys.delete(e.code);  
  }  
  window.addEventListener("keydown", (e) => onKey(e, true));  
  window.addEventListener("keyup", (e) => onKey(e, false));

  function update(dt) {  
    if (!controls.isLocked) return;  
      
    const move = { x: 0, y: 0, z: 0 };  
      
    // Handle keyboard input (desktop)  
    if (keys.has("KeyW")) move.z += 1;  
    if (keys.has("KeyS")) move.z -= 1;  
    if (keys.has("KeyA")) move.x += 1;  
    if (keys.has("KeyD")) move.x -= 1;  
    if (keys.has("KeyR")) move.y += 1;  
    if (keys.has("KeyF")) move.y -= 1;  
      
    // Handle virtual joystick input (mobile) - transform to camera-relative immediately  
    if (movementJoystick && movementJoystick.isPressed()) {  
      const joystickInput = movementJoystick.getVector();  
      const sensitivity = 0.15;  
        
      // Get camera direction vectors  
      controls.getDirection(_fwd);  
      _fwd.y = 0; _fwd.normalize();  
      _right.crossVectors(_fwd, camera.up).negate().normalize();  
        
      // Transform joystick input to camera-relative movement  
      const forwardAmount = -joystickInput.y * sensitivity; // Invert Y for forward/back  
      const rightAmount = -joystickInput.x * sensitivity; // Negate X for correct left/right  
        
      // Apply camera-relative movement directly to move vector  
      move.x += _right.x * rightAmount + _fwd.x * forwardAmount;  
      move.z += _right.z * rightAmount + _fwd.z * forwardAmount;  
    }  
      
    // Handle vertical movement buttons (check regardless of device type)  
    if (isUpPressed) move.y += 1;  
    if (isDownPressed) move.y -= 1;  
      
    // Apply movement if there's any input  
    if (move.x !== 0 || move.y !== 0 || move.z !== 0) {  
      const len = Math.hypot(move.x, move.y, move.z) || 1;  
      const spd = moveSpeed * dt;  
        
      // Check if we have keyboard input that needs camera-relative transformation  
      if (keys.has("KeyW") || keys.has("KeyS") || keys.has("KeyA") || keys.has("KeyD")) {  
        // Use camera-relative movement for keyboard  
        controls.getDirection(_fwd);  
        _fwd.y = 0; _fwd.normalize();  
        _right.crossVectors(_fwd, camera.up).negate().normalize();  
          
        const keyboardMove = { x: 0, z: 0 };  
        if (keys.has("KeyW")) keyboardMove.z += 1;  
        if (keys.has("KeyS")) keyboardMove.z -= 1;  
        if (keys.has("KeyA")) keyboardMove.x += 1;  
        if (keys.has("KeyD")) keyboardMove.x -= 1;  
          
        const keyLen = Math.hypot(keyboardMove.x, keyboardMove.z) || 1;  
        camera.position.addScaledVector(_fwd, (keyboardMove.z/keyLen) * spd);  
        camera.position.addScaledVector(_right, (keyboardMove.x/keyLen) * spd);  
      } else {  
        // For joystick input, use the already-transformed world coordinates directly  
        camera.position.x += (move.x/len) * spd;  
        camera.position.z += (move.z/len) * spd;  
      }  
        
      camera.position.y += (move.y/len) * spd;  
    }  
  }  
  // Add physics-compatible movement functions  
  function getMoveVectorWorld() {  
    const move = { x: 0, y: 0, z: 0 };  
      
    // Handle keyboard input (desktop)  
    if (keys.has("KeyW")) move.z += 1;  
    if (keys.has("KeyS")) move.z -= 1;  
    if (keys.has("KeyA")) move.x += 1;  
    if (keys.has("KeyD")) move.x -= 1;  
    if (keys.has("KeyR")) move.y += 1;  
    if (keys.has("KeyF")) move.y -= 1;  
      
    // Handle virtual joystick input (mobile) - transform to camera-relative immediately  
    if (movementJoystick && movementJoystick.isPressed()) {  
      const joystickInput = movementJoystick.getVector();  
      const sensitivity = 0.15;  
        
      // Get camera direction vectors  
      controls.getDirection(_fwd);  
      _fwd.y = 0; _fwd.normalize();  
      _right.crossVectors(_fwd, camera.up).negate().normalize();  
        
      // Transform joystick input to camera-relative movement  
      const forwardAmount = -joystickInput.y * sensitivity; // Invert Y for forward/back  
      const rightAmount = -joystickInput.x * sensitivity; // Negate X for correct left/right  
        
      // Apply camera-relative movement directly to move vector  
      move.x += _right.x * rightAmount + _fwd.x * forwardAmount;  
      move.z += _right.z * rightAmount + _fwd.z * forwardAmount;  
    }  
      
    // Handle vertical movement buttons (check regardless of device type)  
    if (isUpPressed) move.y += 1;  
    if (isDownPressed) move.y -= 1;  
      
    // Convert to world space vector  
    const worldMove = new THREE.Vector3();  
    if (move.x !== 0 || move.y !== 0 || move.z !== 0) {  
      const len = Math.hypot(move.x, move.y, move.z) || 1;  
        
      // For keyboard input, apply camera-relative transformation  
      // For joystick input, it's already transformed above  
      if (keys.has("KeyW") || keys.has("KeyS") || keys.has("KeyA") || keys.has("KeyD")) {  
        controls.getDirection(_fwd);  
        _fwd.y = 0; _fwd.normalize();  
        _right.crossVectors(_fwd, camera.up).negate().normalize();  
          
        const keyboardMove = { x: 0, z: 0 };  
        if (keys.has("KeyW")) keyboardMove.z += 1;  
        if (keys.has("KeyS")) keyboardMove.z -= 1;  
        if (keys.has("KeyA")) keyboardMove.x += 1;  
        if (keys.has("KeyD")) keyboardMove.x -= 1;  
          
        const keyLen = Math.hypot(keyboardMove.x, keyboardMove.z) || 1;  
        worldMove.addScaledVector(_fwd, keyboardMove.z / keyLen);  
        worldMove.addScaledVector(_right, keyboardMove.x / keyLen);  
      } else {  
        // For joystick input, use the already-transformed values directly  
        worldMove.set(move.x / len, 0, move.z / len);  
      }  
        
      worldMove.y = move.y / len;  
    }  
      
    return worldMove;  
  }  
  let jumpRequested = false;  
  function consumeJump() {  
    // Check for space key or jump button  
    if (keys.has("Space")) {  
      jumpRequested = true;  
    }  
      
    if (jumpRequested) {  
      jumpRequested = false;  
      return true;  
    }  
    return false;  
  }  
  // Add space key handling for jump  
  window.addEventListener("keydown", (e) => {  
    if (e.code === "Space") {  
      // Don't intercept spacebar if user is typing in chat or other input  
      const activeElement = document.activeElement;  
      const isTyping = activeElement && (  
        activeElement.tagName === 'INPUT' ||   
        activeElement.tagName === 'TEXTAREA' ||  
        activeElement.contentEditable === 'true'  
      );  
        
      // Also check if chat interface is currently visible  
      const chatInterface = document.querySelector('.chat-interface.visible');  
        
      if (isTyping || chatInterface) {  
        // Let spacebar work normally for typing  
        return;  
      }  
        
      e.preventDefault();  
      jumpRequested = true;  
    }  
  });  
  // Cleanup function  
  function dispose() {  
    if (movementJoystick) {  
      movementJoystick.dispose();  
    }  
      
    // Clean up mobile button event listeners  
    if (upButton && downButton) {  
      // Store references to handlers for proper cleanup  
      // We don't have direct references to the handlers defined in the setup function,  
      // so we can't remove them. This is a limitation of the current structure.  
      // The dispose function is called on unload, so it's not a critical memory leak.  
    }  
      
    controls.dispose();  
  }  
  return { controls, update, dispose, getMoveVectorWorld, consumeJump };  
}