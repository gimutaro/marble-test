import * as THREE from "three";  
import RAPIER from "@rapier3d-compat"; // CDN compat build (WASM inlined). :contentReference[oaicite:4]{index=4}  
export async function initRapier(physicsConfig) {  
  await RAPIER.init(); // per compat guide  
  const world = new RAPIER.World(physicsConfig.GRAVITY);  
  // Solver tuning  
  world.integrationParameters.numSolverIterations = physicsConfig.SOLVER_ITERATIONS;  
  world.integrationParameters.numAdditionalFrictionIterations = physicsConfig.FRICTION_ITERATIONS;  
  world.integrationParameters.predictionDistance = physicsConfig.PREDICTION_DISTANCE;  
  return { RAPIER, world };  
}  
// ----- Player KCC -----  
export function createPlayerController(world, RAPIER, physicsConfig) {  
  const {  
    PLAYER_RADIUS, PLAYER_HALF_HEIGHT,  
    KCC_OFFSET, MAX_SLOPE_CLIMB_DEG, MIN_SLOPE_SLIDE_DEG,  
    AUTOSTEP_MAX_HEIGHT, AUTOSTEP_MIN_WIDTH, SNAP_TO_GROUND  
  } = physicsConfig;  
  // Capsule collider used by the controller  
  const colliderDesc = RAPIER.ColliderDesc.capsule(PLAYER_HALF_HEIGHT, PLAYER_RADIUS);  
  const collider = world.createCollider(colliderDesc);  
  // Kinematic Character Controller (move & slide)  
  const cc = world.createCharacterController(KCC_OFFSET);  
  cc.setMaxSlopeClimbAngle(MAX_SLOPE_CLIMB_DEG * Math.PI / 180);  
  cc.setMinSlopeSlideAngle(MIN_SLOPE_SLIDE_DEG * Math.PI / 180);  
  cc.enableAutostep(AUTOSTEP_MAX_HEIGHT, AUTOSTEP_MIN_WIDTH, true);  
  cc.enableSnapToGround(SNAP_TO_GROUND);  
  // ✅ Let the character push dynamic bodies (cubes)  
  cc.setApplyImpulsesToDynamicBodies(true);  
  cc.setCharacterMass(90.0); // feels weighty enough to shove boxes  
  return { collider, characterController: cc };  
}

/** Create a fixed trimesh collider from a THREE.Mesh or BufferGeometry. */  
export function addStaticTrimesh(world, node, restitution = 0.6) {  
  const geom = node.isMesh ? node.geometry : node;  
  if (!geom || !geom.attributes?.position) return;

  const g = geom.clone();  
  node.updateWorldMatrix(true, false);  
  g.applyMatrix4(node.matrixWorld);

  const vertices = new Float32Array(g.attributes.position.array);  
  const indexAttr = g.index;  
  let indices;  
  if (indexAttr) indices = new Uint32Array(indexAttr.array);  
  else { indices = new Uint32Array(g.attributes.position.count); for (let i=0;i<indices.length;i++) indices[i]=i; }

  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());  
  const col = RAPIER.ColliderDesc.trimesh(vertices, indices).setRestitution(restitution);  
  world.createCollider(col, body);  
}

// ----- Simple fixed box helper (pressure plate colliders, etc.) -----  
export function addFixedBox(world, RAPIER, { position, halfExtents, restitution = 0.0, friction = 1.0 }) {  
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z));  
  const col = RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z)  
    .setRestitution(restitution)  
    .setFriction(friction);  
  world.createCollider(col, body);  
  return body;  
}