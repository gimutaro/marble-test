import * as THREE from "three";  
import { initRapier, createPlayerController, addStaticTrimesh } from "./Physics.js";

export class PhysicsManager {  
  constructor(config) {  
    this.config = config;  
    this.rapier = null;  
    this.world = null;  
    this.playerCharacterController = null;  
    this.playerCollider = null;  
      
    // Physics constants for fly mode (no gravity/jumping needed)  
    this.fixedTimeStep = 1 / config.PHYSICS.FIXED_FPS;  
    this.physicsAccumulator = 0;  

    // Scene reference (set from caller) and projectiles store
    this.scene = null;  
    this.projectiles = [];  
  }  
    
  async initialize(camera, envMesh) {  
    if (!this.config.ENABLE_PHYSICS) return false;  
      
    const init = await initRapier(this.config.PHYSICS);  
    this.rapier = init.RAPIER;  
    this.world = init.world;

    // Create player controller  
    const { collider, characterController } = createPlayerController(  
      this.world,   
      this.rapier,   
      this.config.PHYSICS  
    );  
    this.playerCollider = collider;  
    this.playerCharacterController = characterController;  
      
    if (this.playerCharacterController.setApplyImpulsesToDynamicBodies) {  
      this.playerCharacterController.setApplyImpulsesToDynamicBodies(true);  
    }  
    if (this.playerCharacterController.setCharacterMass) {  
      this.playerCharacterController.setCharacterMass(85.0);  
    }  
    // Set initial position accounting for proper capsule height  
    const initialPos = camera.position.clone();  
    initialPos.y -= 0.7; // Position capsule center so camera is at eye level  
    this.playerCollider.setTranslation(initialPos);

    // Add environment collision  
    if (envMesh) {  
      envMesh.traverse((n) => {  
        if (n.isMesh && n.geometry) {  
          addStaticTrimesh(this.world, n, this.config.ENV.RESTITUTION);  
        }  
      });  
    }  
      
    return true;  
  }  
    
  update(deltaTime, camera, controls) {  
    if (!this.world) return;  
      
    this.physicsAccumulator += deltaTime;  
    let steps = 0;  
      
    while (this.physicsAccumulator >= this.fixedTimeStep && steps < this.config.PHYSICS.MAX_STEPS_PER_FRAME) {  
      // Character controller movement  
      if (this.playerCharacterController && controls.isLocked) {  
        this._updatePlayerMovement(camera, controls);  
      }

      this.world.step();  
      this.physicsAccumulator -= this.fixedTimeStep;  
      steps++;  
    }  

    // Sync projectile meshes once per frame after stepping
    if (this.projectiles.length > 0) {  
      this._updateProjectiles(deltaTime);  
    }  
  }  
    
  _updatePlayerMovement(camera, controls) {  
    const wishDir = controls.getMoveVectorWorld();  
    const speed = this.config.MOVE_SPEED;  
      
    // Use original fly controls - no gravity, full 3D movement  
    const translation = {  
      x: wishDir.x * speed * this.fixedTimeStep,  
      y: wishDir.y * speed * this.fixedTimeStep, // Use direct Y input from controls  
      z: wishDir.z * speed * this.fixedTimeStep  
    };  
    // Use character controller only for collision detection  
    this.playerCharacterController.computeColliderMovement(this.playerCollider, translation);  
    const corrected = this.playerCharacterController.computedMovement();  
      
    // Apply the collision-corrected movement  
    const newPos = this.playerCollider.translation();  
    newPos.x += corrected.x;   
    newPos.y += corrected.y;   
    newPos.z += corrected.z;  
    this.playerCollider.setTranslation(newPos);  
    // Update camera to match collider position at proper eye level  
    camera.position.set(  
      newPos.x,   
      newPos.y + 0.7, // Position camera at realistic eye level (about 0.2m below top of capsule)  
      newPos.z  
    );  
  }  
    
  isGrounded() {  
    // Always return false for fly mode - no ground interaction needed  
    return false;  
  }  

  // ----- Public helpers -----
  setScene(scene) {  
    this.scene = scene;  
  }  

  /**
   * Spawn a small dynamic sphere and shoot it forward from camera.
   * @param {THREE.PerspectiveCamera} camera
   * @param {Object} controls - must provide getDirection(v:THREE.Vector3)
   * @param {{speed?:number,radius?:number,ttl?:number,offset?:number,color?:number}} [options]
   */
  spawnBallFromCamera(camera, controls, options = {}) {  
    if (!this.world || !this.rapier) return null;  
    const radius = options.radius ?? 0.12;  
    const speed = options.speed ?? 22;  
    const ttl = options.ttl ?? 6.0;  
    const muzzleOffset = options.offset ?? 0.8;  
    const color = options.color ?? 0xffaa00;  

    const forward = new THREE.Vector3();  
    controls.getDirection(forward).normalize();  
    const origin = camera.position.clone().addScaledVector(forward, muzzleOffset);  

    return this._spawnProjectile({  
      radius,  
      origin,  
      linvel: { x: forward.x * speed, y: forward.y * speed, z: forward.z * speed },  
      ttl,  
      color  
    });  
  }  

  /**
   * Low-level projectile spawner using Rapier.
   * @param {{radius:number,origin:THREE.Vector3,linvel:{x:number,y:number,z:number},ttl:number,color:number}} p
   */
  _spawnProjectile(p) {  
    const RAPIER = this.rapier;  
    if (!RAPIER || !this.world) return null;  

    // Create dynamic rigid body
    const rbDesc = RAPIER.RigidBodyDesc.dynamic()  
      .setTranslation(p.origin.x, p.origin.y, p.origin.z)  
      .setCanSleep(true)  
      .setLinearDamping(0.05);  
    const body = this.world.createRigidBody(rbDesc);  
    body.setLinvel(p.linvel, true);  

    // Sphere collider
    const colDesc = RAPIER.ColliderDesc.ball(p.radius)  
      .setRestitution(0.6)  
      .setFriction(0.8)  
      .setDensity(1.0);  
    this.world.createCollider(colDesc, body);  

    // Visual mesh
    const geom = new THREE.SphereGeometry(p.radius, 16, 16);  
    const mat = new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color & 0x222222, roughness: 0.5, metalness: 0.1 });  
    const mesh = new THREE.Mesh(geom, mat);  
    mesh.castShadow = true;  
    mesh.receiveShadow = true;  
    mesh.position.copy(p.origin);  
    if (this.scene) this.scene.add(mesh);  

    const projectile = { body, mesh, ttl: p.ttl };  
    this.projectiles.push(projectile);  
    return projectile;  
  }  

  _updateProjectiles(dt) {  
    // Update transforms and clean up expired/out-of-bounds projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {  
      const pr = this.projectiles[i];  
      pr.ttl -= dt;  

      const t = pr.body.translation();  
      const r = pr.body.rotation();  
      pr.mesh.position.set(t.x, t.y, t.z);  
      if (r && typeof r.x === 'number') {  
        pr.mesh.quaternion.set(r.x, r.y, r.z, r.w);  
      }  

      const outOfBounds = t.y < -50 || Math.abs(t.x) > 500 || Math.abs(t.z) > 500;  
      if (pr.ttl <= 0 || outOfBounds) {  
        if (this.scene && pr.mesh.parent) this.scene.remove(pr.mesh);  
        pr.mesh.geometry?.dispose?.();  
        pr.mesh.material?.dispose?.();  
        this.world.removeRigidBody(pr.body);  
        this.projectiles.splice(i, 1);  
      }  
    }  
  }  
}