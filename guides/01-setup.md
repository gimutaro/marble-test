# ローカル環境セットアップ

このプロジェクトはブラウザ上で動作する Three.js + Spark（Gaussian Splats）+ Rapier 互換ビルドを用いたインタラクティブ体験です。開発開始前に以下を満たしてください。

## 必要要件
- 最新の Chromium/Chrome, Edge, または Firefox（WebGL2 推奨）
- ローカル静的サーバ（どれか1つ）
  - Python: `python3 -m http.server 8000`
  - Node: `npx http-server -p 8000 -c-1` または `npx serve -p 8000`
- ネットワーク接続（CDN から `three`, `@sparkjsdev/spark`, `@rapier3d-compat` を取得）

## 起動手順（最短）
1. プロジェクトルートでサーバを起動
   ```bash
   python3 -m http.server 8000
   # もしくは
   npx http-server -p 8000 -c-1
   ```
2. ブラウザで `http://localhost:8000/index.html` を開く
3. 画面指示に従いクリックしてプレイ開始（Pointer Lock の許可が必要）

## import map と CDN
`index.html` の `<script type="importmap">` で `three`, `three/addons`, `@sparkjsdev/spark`, `@rapier3d-compat` を CDN から読み込みます。社内ネットワーク等で CDN がブロックされていると起動できません。

- `navigator.clipboard` は `localhost` または HTTPS で動作します。
- モバイル端末では自動再生が制限されるため、必ずユーザー操作（タップ）により音声を解放します（`UIManager.handleStartPanel` 参照）。

## アセット（Gaussian Splat など）
- `config.js` の `CONFIG.SPLAT.URL` に外部ホストの `.spz`（Spark 互換）を指定します。CORS を許可してください。
- 同一オリジンに置くと最も安定します（`/public/assets/...` 等）。

## よくあるつまずき
- 画面が真っ黒: CDN 未到達、Splat URL 404、WebGL 失敗。DevTools の Network/Console を確認。
- クリックしても操作できない: Pointer Lock 取得前。初回クリックでロック、`Esc` で解除。
- クリップボードエラー: HTTPS でないか `localhost` 以外。`localhost` で実行。

## ディレクトリに関する注意
ブランチによって `src/` 配下や直下の構成差分があります。`index.html` の `<script src="...">` と各 import の実パスを確認して合わせてください。
