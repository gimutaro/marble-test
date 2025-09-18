# キャラクターと会話（CharacterManager／ChatInterface）

## キャラクターの登録とスポーン
- `main.js` で `CharacterManager` を生成し、`registerCharactersForLevel(levelId, characters)` によりレベル単位でキャラを登録します。
- 各キャラクターはテンプレート（`CHARACTER_TEMPLATES`）に `position`, `rotation` などを付与して指定。
- `spawnCharactersForLevel(levelId)` で実体化。

## 近接検知とインタラクション
- `CharacterInteractionManager` がカメラ位置を参照し、一定距離で「話しかける」ヒントや `startChat` イベントを発火する設計。
- `UIManager` の UI 状態に応じてヒント表示のオン/オフを同期可能。

## 会話 UI（ChatInterface）
- 初期化時に DOM へチャット UI を挿入。
- `window.addEventListener('startChat', ...)` を購読し、対象キャラの情報でチャットを開く。
- 履歴はキャラごとに保持（再オープン時に復元）。
- 送信: Enter（Shift+Enter で改行）。送信中はボタンを無効化、タイピングインジケータを表示。
- `ChatAIClass` を通じて AI 応答を取得（初回挨拶を含む）。失敗時はフォールバック挨拶。

## フォーカスとモバイル対策
- チャットを開くと Pointer Lock を解除して UI 操作可能に。
- モバイルではキーボード表示によるスクロールジャンプを軽減するため、フォーカス時/閉鎖時にスクロールを制御し、再エンゲージ（`controls.lock()` 再取得）を支援。

## 統合ポイント
- `uiVisibilityChanged` で UI を隠す場合、`ChatInterface.setUIVisible(false)` によりチャットを閉じる。
- `CharacterManager.update(dt)` と `CharacterInteractionManager.update(dt)` はメインループで毎フレーム呼び出し。
