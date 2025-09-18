# デプロイとアセット配信（CORS/HTTPS）

## 静的ホスティング
- 任意の静的ホスティング（GitHub Pages, Netlify, Vercel, CloudFront+S3 など）で配信可能。
- `index.html` は CDN に依存するため、オンライン環境が前提。社内ネットワークの場合はミラーを検討。

## CORS 設定
- Gaussian Splat（`.spz`）、音源（`.mp3` など）、GLB を外部ドメインに置く場合は CORS を許可。
  - S3 の例: バケット CORS に `GET` を許可し、`Origin` を `*` または配信元に限定。
- 可能なら同一オリジンに配置して CORS 問題を回避。

## HTTPS と権限
- クリップボード、Pointer Lock、Audio の挙動は HTTPS/ユーザー操作要件の影響を受けます。
- 本番配信では HTTPS を必須とし、`Content-Type` を正しく設定（`.spz` は `application/octet-stream` 等）。

## ビルドなし配信の注意
- 本プロジェクトは原則ビルド不要ですが、import map と拡張子を正確に保つ必要があります。
- ルート相対/相対パスが環境に依存するため、`<script src="./src/main.js">` のような参照先が実ファイルと一致しているか確認。

## キャッシュ戦略
- 開発では `-c-1`（キャッシュ無効）で配信、またはクエリでキャッシュバスターを付与。
- 本番ではアセットにハッシュ付きファイル名 or 長期キャッシュ + import map でのバージョン更新を検討。
