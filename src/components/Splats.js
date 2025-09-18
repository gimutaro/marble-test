import * as THREE from "three";  
import { SplatMesh } from "@sparkjsdev/spark"; // Spark ESM build via CDN  
// Spark docs show this exact CDN pattern + API. :contentReference[oaicite:3]{index=3}

export async function loadSplat({ url, scale=1, position=[0,0,0], rotationEuler=[0,0,0], onLoad } = {}) {  
  const splats = new SplatMesh({  
    url,  
    onLoad: () => onLoad && onLoad(splats)  
  });  
    
  // Step 1: Apply base transforms identical to what mesh will get  
  splats.scale.setScalar(scale); // ✅ CORRECT - Splats require uniform scaling  
  splats.position.fromArray(position);  
  splats.rotation.set(...rotationEuler);  
    
  // Step 2: Only the SPLAT gets upright correction (180° flip to correct upside-down capture)  
  splats.rotateX(Math.PI); // ✅ CORRECT - Only splat gets flipped upright  
    
  return splats;  
}

/** Optional helper for ray-picking splats using THREE.Raycaster (Spark supports .raycast). */  
export function pickSplatAt(canvas, camera, objects, onHit) {  
  const ray = new THREE.Raycaster();  
  const v2 = new THREE.Vector2();  
  canvas.addEventListener("click", (e) => {  
    v2.set((e.clientX / canvas.clientWidth) * 2 - 1, -(e.clientY / canvas.clientHeight) * 2 + 1);  
    ray.setFromCamera(v2, camera);  
    const hits = ray.intersectObjects(objects, true);  
    const hit = hits.find(h => h.object instanceof SplatMesh);  
    if (hit && onHit) onHit(hit);  
  });  
}