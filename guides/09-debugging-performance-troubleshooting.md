# デバッグ・パフォーマンス・トラブルシュート

## デバッグの基本
- DevTools → Console/Network/Performance/Memory を活用
- 例外の多発は `try/catch` で握りつぶさず、警告と回復フローを実装
- `window` へ主要マネージャを一時的にぶら下げて手動操作（例: `window.audioManager`）

## よくある症状と対処
- 画面が真っ黒
  - CDN 未到達、Splat URL 404/CORS、WebGL コンテキスト失敗
  - `index.html` の import map と実際の import パスを再確認
- 操作不能
  - Pointer Lock 未取得。初回クリックを要求、`Esc` 後はキャンバスクリックで再ロック
- 音が鳴らない
  - モバイルの自動再生制限。`UIManager.handleStartPanel()` で初期化が走るか確認
  - 音源 URL の CORS/HTTPS を確認

## パフォーマンス最適化
- 解像度/DPR
  - `renderer.setPixelRatio` の上限を 1.0〜1.25 に下げる
  - DYNAMIC_DPR を導入する場合は `requestAnimationFrame` ごとのフレーム時間を監視
- Spark の粒子
  - `MAX_PIXEL_RADIUS` を下げる、`sortDistance` を弱める
- 物理
  - `FIXED_FPS` を 60、`MAX_STEPS_PER_FRAME` を 2〜3 に抑える
  - 複雑なトライメッシュの数を減らす／単純化する
- GC 抑制
  - 更新ループ内でのオブジェクト再生成を避け、ワークベクトルを再利用

## 計測の目安
- 16.7ms（60fps）を超えるフレームが連続する場合、DPR と Spark 設定を優先調整
- 物理時間が 3〜5ms を超える場合、コライダ数/形状の削減を検討

## チェックリスト
- [ ] `index.html` の import map/CDN が到達可能
- [ ] `CONFIG.SPLAT.URL` が有効で CORS 許可済み
- [ ] Pointer Lock の取得/解除フローが想定通り
- [ ] 音声はユーザー操作後に初期化される
- [ ] デバイス判定で `body.is-mobile` が適切に付与
