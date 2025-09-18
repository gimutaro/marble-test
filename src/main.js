import * as THREE from "three";
import { CONFIG } from "./config.js";
import { loadSplat } from "./components/Splats.js";
import { setupFirstPersonControls } from "./components/Controls.js";
import { addBasicLights, setupMaterialsForLighting } from "./components/utils.js";
import { addStaticTrimesh } from "./components/Physics.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SimpleAudio } from "./components/Audio.js";
import { PhysicsManager } from "./components/PhysicsManager.js";
import { SparkRenderer } from "@sparkjsdev/spark";
import { CharacterManager, CHARACTER_TEMPLATES } from "./components/CharacterManager.js";
import { CharacterInteractionManager } from "./components/CharacterInteractionManager.js";
import { ChatInterface } from "./components/ChatInterface.js";
import { UIManager } from "./managers/UIManager.js";
import { AudioManager } from "./managers/AudioManager.js";

// ===== Scene / Renderer =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
const DPR_MAX = Math.min(1.5, window.devicePixelRatio);
renderer.setPixelRatio(DPR_MAX);
renderer.outputColorSpace = THREE.SRGBColorSpace;
// Enable shadows for better model lighting
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Spark
const spark = new SparkRenderer({
  renderer,
  maxStdDev: Math.sqrt(5),
  maxPixelRadius: 256,
  clipXY: 1.2,
  view: { stochastic: false, sortRadial: true, sortDistance: 0.006, sortCoorient: 0.997, sort32: false }
});
scene.add(spark);
addBasicLights(scene);

// ===== Managers / Controls =====
const physicsManager = new PhysicsManager(CONFIG);
const {
  controls,
  update: updateControls,
  dispose: disposeControls,
  getMoveVectorWorld
} = setupFirstPersonControls(camera, document.body, { moveSpeed: CONFIG.MOVE_SPEED });
// Initialize managers - UIManager first, then AudioManager
const uiManagerTemp = new UIManager(camera, controls, null); // Temporary, will be updated
const audioManager = new AudioManager(uiManagerTemp);
// Update UIManager with AudioManager reference
uiManagerTemp.audioManager = audioManager;
const uiManager = uiManagerTemp;
const characterInteractionManager = new CharacterInteractionManager(camera, controls);
const characterManager = new CharacterManager(scene, physicsManager, characterInteractionManager);
const chatInterface = new ChatInterface(controls);
// Make AudioManager globally available for components that need it
window.audioManager = audioManager;
// Provide scene to physics for projectile visuals
physicsManager.setScene(scene);
// Simple character setup - easy to modify for your game
characterManager.registerCharactersForLevel('default', [
  {
    id: 'character_1',
    ...CHARACTER_TEMPLATES.spacesuit_male,
    position: [-1.5, 2.0, -25.0], 
    rotation: [0, Math.PI * 0.25, 0]
  },
  {
    id: 'character_2', 
    ...CHARACTER_TEMPLATES.scifi_female,
    position: [3.2, 2.0, -22.5], 
    rotation: [0, Math.PI * -0.15, 0]
  }
]);

// ===== Scene Loading =====
let splat = null;
let envMesh = null;
let physicsInitialized = false;
async function loadScene() {
  // Set initial camera position
  camera.position.set(-2.81, 1.04, -17.14);
  camera.rotation.set(0.14, -0.598, 0.08);
  // Load splat scene
  const newSplat = await loadSplat({
    url: CONFIG.SPLAT.URL,
    scale: CONFIG.SPLAT.SCALE,
    position: CONFIG.SPLAT.POSITION,
    rotationEuler: CONFIG.SPLAT.ROTATION_EULER,
    onLoad: () => { uiManager.hideLoading(); }
  });
  scene.add(newSplat);
  splat = newSplat;
  window.splat = newSplat;
  // Load environment collision mesh
  if (CONFIG.ENV.GLB_URL) {
    const gltf = await new GLTFLoader().loadAsync(CONFIG.ENV.GLB_URL);
    envMesh = gltf.scene;
    setupMaterialsForLighting(envMesh, 1.0);
    if (CONFIG.ENV.APPLY_SPLAT_SPACE) {
      envMesh.scale.set(CONFIG.SPLAT.SCALE, CONFIG.SPLAT.SCALE, CONFIG.SPLAT.SCALE);
      envMesh.position.fromArray(CONFIG.SPLAT.POSITION);
      envMesh.rotation.set(...CONFIG.SPLAT.ROTATION_EULER);
      const fixedRotation = new THREE.Euler(...CONFIG.ENV.FIXED_ROT_EULER);
      envMesh.rotation.x += fixedRotation.x;
      envMesh.rotation.y += fixedRotation.y;
      envMesh.rotation.z += fixedRotation.z;
      const fixedOffset = new THREE.Vector3(...CONFIG.ENV.FIXED_OFFSET);
      envMesh.position.add(fixedOffset);
    }
    envMesh.visible = CONFIG.ENV.VISIBLE_IN_DEBUG;
    scene.add(envMesh);
    if (CONFIG.ENABLE_PHYSICS && physicsManager?.world) {
      envMesh.traverse((node) => {
        if (node.isMesh && node.geometry) addStaticTrimesh(physicsManager.world, node, CONFIG.ENV.RESTITUTION);
      });
    }
  }
  // Initialize physics
  if (!physicsInitialized) {
    physicsInitialized = await physicsManager.initialize(camera, envMesh);
  }
  
  // Load basic ambient audio (non-blocking)
  if (CONFIG.ENABLE_AUDIO) {
    audioManager.loadSound('ambience', 'https://play.rosebud.ai/assets/big-room-ambience.mp3?j4Fn')
      .then(() => {
        // Only start playing if audio is already initialized
        if (audioManager.isInitialized()) {
          const volume = uiManager.muted ? 0 : 0.25;
          audioManager.playLoop('ambience', { volume });
        }
      })
      .catch(error => {
        console.warn('Failed to load ambient audio:', error);
      });
  }
  
  // Spawn characters
  await characterManager.spawnCharactersForLevel('default');
}
// ===== Initialize Scene =====
uiManager.showLoading();
await loadScene();
// Listen for UI visibility changes from UIManager
window.addEventListener('uiVisibilityChanged', (event) => {
  const visible = event.detail.visible;
  characterInteractionManager.setUIVisible(visible);
  chatInterface.setUIVisible(visible);
});
// ===== Loop & resize =====

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const DPR_MAX = Math.min(1.5, window.devicePixelRatio);
  renderer.setPixelRatio(DPR_MAX);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}
let resizeTimeout;
function debouncedResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(onResize, 50);
}
window.addEventListener("resize", debouncedResize);
let last = performance.now();
let nextShootAllowedAt = 0;
const SHOOT_COOLDOWN_S = 0.25;
renderer.setAnimationLoop((t) => {
  const dt = Math.min((t - last) / 1000, 1 / 30);
  last = t;
  
  // Update all systems
  updateControls(dt);
  uiManager.updateCameraInfo();
  uiManager.updateWASDHighlighting();
  if (physicsManager) physicsManager.update(dt, camera, { isLocked: controls.isLocked, getMoveVectorWorld });

  // Spacebar to shoot ball (uses Controls.consumeJump to respect UI typing/chat)
  if (controls.consumeJump && controls.consumeJump()) {
    const now = performance.now() / 1000;
    if (now >= nextShootAllowedAt) {
      nextShootAllowedAt = now + SHOOT_COOLDOWN_S;
      physicsManager.spawnBallFromCamera(camera, controls.controls || controls, {
        speed: 22,
        radius: 0.12,
        ttl: 6.0,
        offset: 0.8,
        color: 0xffaa00
      });
    }
  }
  
  // Update character systems
  characterManager.update(dt);
  characterInteractionManager.update(dt);
  
  renderer.render(scene, camera);
});

// ===== Cleanup =====
function cleanup() {
  disposeControls?.();
  uiManager?.dispose();
  audioManager?.dispose();
  characterManager?.dispose();
  characterInteractionManager?.dispose();
  chatInterface?.dispose();
}
window.addEventListener("beforeunload", cleanup);