// Centralized configuration for assets + behavior.
// Alignment is made explicit here so it's easy to reason about.
export const CONFIG = {
    // --- Core toggles ---
    ENABLE_PHYSICS: true,
    ENABLE_AUDIO: true,
    // --- Movement ---
    MOVE_SPEED: 6.5,
    // --- Gaussian Splats (angles in RADIANS) ---
    // Change these URLs to use your own splat and collision files
    SPLAT: {
      URL: "https://japanese-room.s3.ap-northeast-1.amazonaws.com/JapaneseRoom.spz",
      SCALE: 3,
      POSITION: [0, 0, -6],
      ROTATION_EULER: [0, 0, 0]
    },
    // --- Collision GLB (aligned to SPLAT) ---
    ENV: {
      GLB_URL: null,
      APPLY_SPLAT_SPACE: true,
      FIXED_ROT_EULER: [0, Math.PI, 0],
      FIXED_OFFSET: [0, 0, 0],
      VISIBLE_IN_DEBUG: false,
      RESTITUTION: 0.6
    },
    // --- Spark renderer tuning ---
    SPARK: {
      MAX_STD_DEV: Math.sqrt(5),
      MAX_PIXEL_RADIUS: 128,
      CLIP_XY: 1.0,
      MIN_ALPHA: 1.0 / 255.0,
      SORT: { RADIAL: true, DISTANCE: 0.012, COORIENT: 0.995, SORT32: false },
      STOCHASTIC: false
    },
    // --- Adaptive DPR ---
    DYNAMIC_DPR: {
      ENABLED: true,
      MIN: 1.0,
      MAX: 1.5,
      DROP_MS: 20,
      RAISE_MS: 14,
      INTERVAL_S: 0.5,
      STEP: 0.1
    },
    // --- Physics (Rapier) ---
    PHYSICS: {
      GRAVITY: { x: 0, y: -30, z: 0 },
      FIXED_FPS: 60,
      MAX_STEPS_PER_FRAME: 3,
      SOLVER_ITERATIONS: 2,
      FRICTION_ITERATIONS: 2,
      PREDICTION_DISTANCE: 0.01,
      // Player capsule — realistic human proportions for proper view height
      PLAYER_RADIUS: 0.3,            // More realistic shoulder width
      PLAYER_HALF_HEIGHT: 0.9,       // Taller for proper human height (1.8m total)
      KCC_OFFSET: 0.08,
      MAX_SLOPE_CLIMB_DEG: 50,
      MIN_SLOPE_SLIDE_DEG: 55,
      AUTOSTEP_MAX_HEIGHT: 0.6,
      AUTOSTEP_MIN_WIDTH: 0.25,
      SNAP_TO_GROUND: 0.6
    }
  };