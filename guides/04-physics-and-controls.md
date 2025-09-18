# 物理挙動と操作（Rapier・PointerLock・仮想スティック）

## 物理（Rapier 互換ビルド）
- `Physics.js`
  - `initRapier()`: `RAPIER.init()` 後に `World` を生成し、ソルバ/予測距離などを設定。
  - `createPlayerController()`: カプセルコライダ + Kinematic Character Controller（KCC）を生成し、傾斜・オートステップ・スナップなどを設定。
  - `addStaticTrimesh()`: THREE のメッシュ/ジオメトリから固定トライメッシュコライダを生成。
- `PhysicsManager.js`
  - `initialize(camera, envMesh)`: ワールドと KCC を用意し、環境コリジョンを登録。カメラ位置とカプセル中心の整合（例: `y - 0.7`）。
  - `update(dt, camera, controls)`: 固定タイムステップで `world.step()` を進め、`computeColliderMovement()` の補正を反映してカメラ追従。

## 操作（First Person Controls）
- `control.js`
  - `setupFirstPersonControls(camera, dom, { moveSpeed })` をエクスポート。
  - 入力: キーボード `W/A/S/D` 水平、`R/F` 垂直。Space はジャンプ予約（実装フック）。
  - モバイル: `VirtualJoystick` による移動（カメラ相対へ変換）、`#up-btn` / `#down-btn` の垂直移動。
  - `getMoveVectorWorld()`: 物理用のカメラ相対ベクトルを算出し、`PhysicsManager` が使用。

## 代表的な設定値（`config.js` → `PHYSICS`）
- `PLAYER_RADIUS`, `PLAYER_HALF_HEIGHT`: カプセル寸法（視点の高さに影響）。
- `MAX_SLOPE_CLIMB_DEG`, `MIN_SLOPE_SLIDE_DEG`: 登坂可能角・滑落角。
- `AUTOSTEP_*`: 低い段差を乗り越える挙動。
- `FIXED_FPS`, `MAX_STEPS_PER_FRAME`: 固定ステップの安定性と負荷のトレードオフ。

## ベストプラクティス
- 入力→物理→描画の順で更新（本プロジェクトでは `controls.update → physics.update → render`）。
- カメラの `y` とカプセル中心の差分を一定に保ち、段差で視点が跳ねないようにする。
- モバイルでは `touchstart` を使い、`passive: false` でスクロールを抑止。
