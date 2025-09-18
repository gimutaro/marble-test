import * as THREE from 'three';

export class VirtualJoystick {
  constructor(containerElement, knobElement, options = {}) {
    this.container = containerElement;
    this.knob = knobElement;
    this.options = {
      maxDistance: 50, // Maximum distance from center
      returnSpeed: 0.8, // How fast knob returns to center
      deadZone: 0.1,   // Minimum threshold for input
      ...options
    };
    
    // State
    this.isActive = false;
    this.centerX = 0;
    this.centerY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    
    // Normalized output values (-1 to 1)
    this.normalizedX = 0;
    this.normalizedY = 0;
    
    // Bind event handlers
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    
    this._setupEvents();
    this._calculateCenter();
  }
  
  _setupEvents() {
    // Touch events
    this.container.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.container.addEventListener('touchend', this._onTouchEnd, { passive: false });
    this.container.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    
    // Also handle mouse events for testing on desktop
    this.container.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.container.addEventListener('mousemove', this._onMouseMove.bind(this));
    this.container.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this._onMouseUp.bind(this));
  }
  
  _calculateCenter() {
    const rect = this.container.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
  }
  
  _onTouchStart(event) {
    event.preventDefault();
    this.isActive = true;
    this._calculateCenter();
    
    const touch = event.touches[0];
    this._updatePosition(touch.clientX, touch.clientY);
  }
  
  _onTouchMove(event) {
    if (!this.isActive) return;
    event.preventDefault();
    
    const touch = event.touches[0];
    this._updatePosition(touch.clientX, touch.clientY);
  }
  
  _onTouchEnd(event) {
    event.preventDefault();
    this.isActive = false;
    this._returnToCenter();
  }
  
  _onMouseDown(event) {
    event.preventDefault();
    this.isActive = true;
    this._calculateCenter();
    this._updatePosition(event.clientX, event.clientY);
  }
  
  _onMouseMove(event) {
    if (!this.isActive) return;
    event.preventDefault();
    this._updatePosition(event.clientX, event.clientY);
  }
  
  _onMouseUp(event) {
    event.preventDefault();
    this.isActive = false;
    this._returnToCenter();
  }
  
  _updatePosition(clientX, clientY) {
    // Calculate distance from center
    this.deltaX = clientX - this.centerX;
    this.deltaY = clientY - this.centerY;
    
    // Limit to max distance
    const distance = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);
    if (distance > this.options.maxDistance) {
      const ratio = this.options.maxDistance / distance;
      this.deltaX *= ratio;
      this.deltaY *= ratio;
    }
    
    // Update knob position
    this.knob.style.transform = `translate(-50%, -50%) translate(${this.deltaX}px, ${this.deltaY}px)`;
    
    // Calculate normalized values
    this.normalizedX = this.deltaX / this.options.maxDistance;
    this.normalizedY = this.deltaY / this.options.maxDistance;
    
    // Apply dead zone
    if (Math.abs(this.normalizedX) < this.options.deadZone) this.normalizedX = 0;
    if (Math.abs(this.normalizedY) < this.options.deadZone) this.normalizedY = 0;
  }
  
  _returnToCenter() {
    // Immediate return for more responsive feel
    const animate = () => {
      if (this.isActive) return; // Don't animate if active again
      
      // Much faster return speed for responsive feeling
      this.deltaX *= 0.3; // Faster than the configurable returnSpeed
      this.deltaY *= 0.3;
      
      // Update knob position
      this.knob.style.transform = `translate(-50%, -50%) translate(${this.deltaX}px, ${this.deltaY}px)`;
      
      // Update normalized values
      this.normalizedX = this.deltaX / this.options.maxDistance;
      this.normalizedY = this.deltaY / this.options.maxDistance;
      
      // Apply dead zone
      if (Math.abs(this.normalizedX) < this.options.deadZone) this.normalizedX = 0;
      if (Math.abs(this.normalizedY) < this.options.deadZone) this.normalizedY = 0;
      
      // Snap to center much sooner for immediate response
      if (Math.abs(this.deltaX) > 1.0 || Math.abs(this.deltaY) > 1.0) {
        requestAnimationFrame(animate);
      } else {
        // Immediate snap to center and zero out values
        this.deltaX = 0;
        this.deltaY = 0;
        this.normalizedX = 0;
        this.normalizedY = 0;
        this.knob.style.transform = 'translate(-50%, -50%)';
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  // Public methods to get input values
  getX() {
    return this.normalizedX;
  }
  
  getY() {
    return this.normalizedY;
  }
  
  getVector() {
    return { x: this.normalizedX, y: this.normalizedY };
  }
  
  // Check if joystick is being used
  isPressed() {
    return this.isActive || Math.abs(this.normalizedX) > 0 || Math.abs(this.normalizedY) > 0;
  }
  
  // Cleanup
  dispose() {
    this.container.removeEventListener('touchstart', this._onTouchStart);
    this.container.removeEventListener('touchmove', this._onTouchMove);
    this.container.removeEventListener('touchend', this._onTouchEnd);
    this.container.removeEventListener('touchcancel', this._onTouchEnd);
    this.container.removeEventListener('mousedown', this._onMouseDown);
    this.container.removeEventListener('mousemove', this._onMouseMove);
    this.container.removeEventListener('mouseup', this._onMouseUp);
    this.container.removeEventListener('mouseleave', this._onMouseUp);
  }
}