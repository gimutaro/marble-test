# プロジェクト開発ガイド（guides）

このフォルダは、本プロジェクトを開発・拡張するために必要な事前知識と実践手順を、トピック別の Markdown でまとめたガイドブックです。個々のファイルは独立して読めるように構成されています。

## 目次（ToC）

1. [ローカル環境セットアップ](./01-setup.md)
2. [アーキテクチャ概要](./02-architecture.md)
3. [レンダリング（Three.js と Gaussian Splat/Spark）](./03-rendering-splats.md)
4. [物理挙動と操作（Rapier・PointerLock・仮想スティック）](./04-physics-and-controls.md)
5. [モバイル入力と UI（UIManager）](./05-mobile-and-ui.md)
6. [オーディオシステム（AudioManager）](./06-audio.md)
7. [キャラクターと会話（CharacterManager／ChatInterface）](./07-characters-and-chat.md)
8. [設定とチューニング（config.js）](./08-config-and-tuning.md)
9. [デバッグ・パフォーマンス・トラブルシュート](./09-debugging-performance-troubleshooting.md)
10. [デプロイとアセット配信（CORS/HTTPS）](./10-deployment-and-assets.md)

## 読み方のヒント

- 実装の出発点は `index.html` と `main.js` です。そこから各マネージャやコンポーネントに分岐します。
- 参照するファイルの場所はブランチによって `src/` 配下またはリポジトリ直下にある場合があります。最終的には `index.html` の import を真実として確認してください。
- 値の変更は極力 `config.js` で集中管理されます。まずは `config.js` を読み、必要に応じて各ガイドで詳細を参照してください。
