# アーキテクチャ概要

本プロジェクトは「レンダリング」「入力/制御」「物理」「UI」「キャラクター/会話」を明確に分離した構成です。

## エントリポイント
- `index.html`: 画面要素（ローディング、クロスヘア、WASD インジケータ、モバイル操作 UI）と import map。
- `main.js`: Three.js の `Scene/Camera/Renderer`、SparkRenderer、各 Manager/Controls の初期化、ゲームループ、リサイズ処理。

## 主要モジュール
- `config.js`: すべてのチューニング値を集中管理（SPLAT、ENV、SPARK、DYNAMIC_DPR、PHYSICS、MOVE_SPEED 等）。
- レンダリング
  - `splats.js`（または `components/Splats.js`）: `loadSplat()` で Spark の `SplatMesh` を読み込み、姿勢補正（`rotateX(Math.PI)`）やスケール/位置/回転を適用。
  - SparkRenderer: ソート/ピクセル半径/アルファ閾値などを設定し `scene.add(spark)`。
- 入力/制御
  - `control.js`（または `components/Controls.js`）: `setupFirstPersonControls()` で Pointer Lock + WASD/RF + モバイル仮想スティックを統合。`getMoveVectorWorld()` を物理へ提供。
  - `Virtualjoystick.js`: タッチ/マウスの円形ノブから正規化ベクトルを取得。
- 物理
  - `Physics.js`: Rapier 互換ビルドの初期化、Kinematic Character Controller（KCC）、静的トライメッシュ作成ヘルパ。
  - `PhysicsManager.js`: ワールド/コントローラの生成、固定タイムステップ更新、コリジョン補正を反映してカメラを追従。
- UI
  - `UIManager.js`: ローディング表示、Pointer Lock 取得/解除、カメラ座標表示、WASD ハイライト、ミュート制御、ショートカット（Ctrl+C/H）。
- キャラクター/会話
  - `CharacterManager.js` / `CharacterInteractionManager.js`: レベルごとの登録/スポーン、近接検知、`startChat` イベントの発火。
  - `ChatInterface.js`: 会話 UI、`ChatAIClass` との連携、履歴保持、タイピング表示。

## データフロー（抜粋）
1. `main.js` が `UIManager`, `AudioManager`, `PhysicsManager`, `CharacterManager`, `ChatInterface` を初期化。
2. ループで `controls.update(dt) → physicsManager.update(dt, camera, controls)` → 各 Manager `update(dt)` → `renderer.render`。
3. 近接すると `CharacterInteractionManager` が `window.dispatchEvent(new CustomEvent('startChat', ...))` を想定、`ChatInterface` が購読。
4. `UIManager` は `uiVisibilityChanged` を発火/購読して UI と会話を同期。

## 注意点
- フォルダ構成はブランチにより `src/components` / `components` / 直下が混在することがあります。`index.html` と import パスを突き合わせてください。
- クリップボードや音声 API はブラウザの権限/文脈（HTTPS/ジェスチャ）に影響を受けます。
