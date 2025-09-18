import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Character {
  constructor(scene, physicsManager, characterData) {
    this.scene = scene;
    this.physicsManager = physicsManager;
    this.characterData = characterData;
    this.object3D = new THREE.Group();
    this.mixer = null;
    this.actions = {};
    this.isLoaded = false;
    this.isInteractable = true;

    // Default transforms
    const [px, py, pz] = characterData.position || [0, 0, 0];
    const [rx, ry, rz] = characterData.rotation || [0, 0, 0];
    this.object3D.position.set(px, py, pz);
    this.object3D.rotation.set(rx, ry, rz);

    scene.add(this.object3D);
    this._loadModel();
  }

  async _loadModel() {
    const url = this.characterData.modelUrl;
    if (!url) return;
    try {
      const gltf = await new GLTFLoader().loadAsync(url);
      const model = gltf.scene;
      model.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = true;
          n.receiveShadow = true;
        }
      });
      this.object3D.add(model);
      if (gltf.animations?.length) {
        this.mixer = new THREE.AnimationMixer(model);
        for (const clip of gltf.animations) {
          this.actions[clip.name] = this.mixer.clipAction(clip);
        }
        // Try to play an idle if it exists
        const idle = this.actions['Idle'] || this.actions['idle'];
        if (idle) idle.play();
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn('Failed to load character model:', err);
    }
  }

  update(deltaTime) {
    if (this.mixer) this.mixer.update(deltaTime);
  }

  getDistanceTo(position) {
    return this.object3D.position.distanceTo(position);
  }

  triggerWave() {
    const wave = this.actions['Wave'] || this.actions['wave'];
    if (wave) {
      wave.reset().fadeIn(0.1).play();
      setTimeout(() => wave.fadeOut(0.2), 1500);
    }
  }

  dispose() {
    if (this.object3D?.parent) this.object3D.parent.remove(this.object3D);
    this.mixer = null;
    this.actions = {};
    this.isLoaded = false;
  }
}


