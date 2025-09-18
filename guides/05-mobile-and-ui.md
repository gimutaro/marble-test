# モバイル入力と UI（UIManager）

## 概要
- モバイル検出: `UIManager` は `navigator.userAgent` と `matchMedia('(hover: none) and (pointer: coarse)')` を併用。
- モバイル時は `body.is-mobile` を付与し、`#mobile-controls`（仮想スティック + 上下ボタン）を使用。
- デスクトップは Pointer Lock を使い、クリックでロック、`Esc` で解除。

## UIManager の責務
- スタート UI（クリックして開始）、キャンバスのクリックヒント、クロスヘア表示の制御
- カメラ座標の表示/コピー（`Ctrl+C`）とトグル（`Ctrl+H`）
- オーディオのミュート/アンミュート、状態の永続化（`persistence.js` 経由）
- WASD インジケータのアクティブ表示更新

## 仮想スティック（`VirtualJoystick.js`）
- `maxDistance`, `deadZone`, `returnSpeed` を持つ円形ノブで、`getVector()` により `{-1..1}` の正規化入力を返す。
- `control.js` 側でカメラ相対（前方/右）に変換して移動ベクトルへ合成。
- 指を離したときは素早くセンターに戻し、残留入力を低減。

## キーバインドと操作
- デスクトップ: `W/A/S/D` 水平、`R/F` 上下、マウスで視点。`Ctrl+C` で座標コピー、`Ctrl+H` でカメラ座標 UI 切替。
- モバイル: 左下の仮想スティックで移動、右下の `↑/↓` ボタンで上下。画面ドラッグで視点。

## 実装フック
- `UIManager.handleStartPanel()` は初回操作でオーディオ初期化（モバイルの自動再生制限対応）を実施。
- `uiVisibilityChanged` を購読して `ChatInterface` や近接 UI と状態を同期させる設計が可能。

## よくある課題
- フォーカス喪失で Pointer Lock が解除: `UIManager` が解除時にヒントを表示し、再クリック誘導。
- モバイルのキーボード表示によるスクロールジャンプ: `ChatInterface` がフォーカス時にスクロール位置を復元。
