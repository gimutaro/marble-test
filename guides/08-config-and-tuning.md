# 設定とチューニング（config.js）

`config.js` の `CONFIG` はプロジェクトの主要な動作と品質を一元管理します。

```js
export const CONFIG = {
  ENABLE_PHYSICS: true,
  ENABLE_AUDIO: true,
  MOVE_SPEED: 6.5,
  SPLAT: { URL, SCALE, POSITION, ROTATION_EULER },
  ENV: { GLB_URL, APPLY_SPLAT_SPACE, FIXED_ROT_EULER, FIXED_OFFSET, VISIBLE_IN_DEBUG, RESTITUTION },
  SPARK: { MAX_STD_DEV, MAX_PIXEL_RADIUS, CLIP_XY, MIN_ALPHA, SORT, STOCHASTIC },
  DYNAMIC_DPR: { ENABLED, MIN, MAX, DROP_MS, RAISE_MS, INTERVAL_S, STEP },
  PHYSICS: { ...KCC/ワールド設定 }
};
```

## 主要項目
- **SPLAT**: Gaussian Splat の URL とトランスフォーム。
- **ENV**: 環境 GLB の当たり判定・整列・表示。
- **SPARK**: Splats の描画品質。`MAX_PIXEL_RADIUS` と `SORT` が性能に影響。
- **DYNAMIC_DPR**: デバイスピクセル比の自動調整。負荷に応じて `MIN..MAX` を可変にする戦略（実装箇所に依存）。
- **PHYSICS**: 重力、固定ステップ、KCC 設定（スロープ、オートステップ、スナップ、高さ/半径など）。

## チューニングのコツ
- フレーム落ち: `MAX_PIXEL_RADIUS` を下げる、DPR 上限を 1.25 程度へ、`SORT.DISTANCE` を弱める。
- コリジョン抜け: `PREDICTION_DISTANCE` やソルバ反復回数を上げる。固定ステップを下げすぎない。
- 目線の高さ: `PLAYER_HALF_HEIGHT` とカメラの `y` オフセット（`PhysicsManager` 側）を調整。
- 弾みすぎ/滑りすぎ: `ENV.RESTITUTION`/`collider.setFriction()` を見直す。

## 変更手順
1. 変更対象を `config.js` で更新。
2. 必要に応じて `main.js` や各 Manager の該当箇所を確認（依存ロジックがある場合）。
3. レンダリング/物理/入力/オーディオの各ガイドを参照して副作用を把握。
