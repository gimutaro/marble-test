import * as THREE from 'three';

// Basic lighting setup for the scene
export function addBasicLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 10, 7.5);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 0.1;
  dir.shadow.camera.far = 100;
  scene.add(dir);

  const fill = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
  fill.position.set(0, 20, 0);
  scene.add(fill);
}

// Ensure models use lighting-friendly materials and enable shadows
export function setupMaterialsForLighting(root, envIntensity = 1.0) {
  if (!root) return;
  root.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;

      const material = node.material;
      if (Array.isArray(material)) {
        material.forEach((m) => applyMaterialFixes(m, envIntensity));
      } else if (material) {
        applyMaterialFixes(material, envIntensity);
      }
    }
  });
}

function applyMaterialFixes(material, envIntensity) {
  // If it's not a standard/physical material, keep it but try to enable lighting where possible
  if ('envMapIntensity' in material) {
    material.envMapIntensity = envIntensity;
  }
  if ('needUpdate' in material) {
    material.needsUpdate = true;
  }
}


