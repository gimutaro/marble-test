# オーディオシステム（AudioManager）

## 目的
- 環境音（ループ）と効果音（単発）の再生管理
- グローバルミュート、音量管理、モバイルのオーディオ解放（ユーザー操作必須）

## 初期化フロー（例）
- `main.js` で `UIManager` を仮に先に作成し、`AudioManager` を注入してから参照を更新。
- `UIManager.handleStartPanel()` で初回クリック/タップ時に `audioManager.initOnce()` を呼び、モバイルでの自動再生制限を解除するための無音テストトーンを発生。

## 環境音のロードと再生
```js
// 例: main.js
if (CONFIG.ENABLE_AUDIO) {
  audioManager.loadSound('ambience', 'https://example.com/ambience.mp3')
    .then(() => {
      if (audioManager.isInitialized()) {
        const volume = uiManager.muted ? 0 : 0.25;
        audioManager.playLoop('ambience', { volume });
      }
    });
}
```

## ミュート永続化
- `UIManager` は `loadMuteState()/saveMuteState()` を用いてローカルに保存。
- ミュート切替時は現在のループ音量を記憶し、解除時に復元します。

## ベストプラクティス
- 音源は HTTPS/CORS 設定済みの CDN または同一オリジンに配置。
- ループ BGM は `gain` ノードで音量フェードを行うと自然な切替に。
- モバイルではユーザー操作の直後に再生開始（ブラウザ制限回避）。
