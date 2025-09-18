# レンダリング（Three.js と Gaussian Splats / Spark）

## SparkRenderer と SplatMesh
- Spark の ESM を import map 経由で使用。
- `SparkRenderer` を作成して `scene` に追加。描画は Three.js のレンダラに統合。
- `SplatMesh` を用いて `.spz`（Spark 互換フォーマット）を読み込みます。

```js
// splats.js
import { SplatMesh } from '@sparkjsdev/spark';

export async function loadSplat({ url, scale=1, position=[0,0,0], rotationEuler=[0,0,0], onLoad } = {}) {
  const splats = new SplatMesh({ url, onLoad: () => onLoad && onLoad(splats) });
  splats.scale.setScalar(scale);
  splats.position.fromArray(position);
  splats.rotation.set(...rotationEuler);
  // キャプチャ座標系補正（上下反転補正）
  splats.rotateX(Math.PI);
  return splats;
}
```

## `main.js` 側の初期化ポイント
- `renderer.outputColorSpace = THREE.SRGBColorSpace` と影の有効化
- `SparkRenderer({ maxStdDev, maxPixelRadius, clipXY, view: { sortRadial, sortDistance, ... } })`
- `addBasicLights(scene)` などでベースライティングを追加

## チューニング指針
- 解像度: `renderer.setPixelRatio(Math.min(1.5, devicePixelRatio))`。重い場合は上限を 1.0 〜 1.25 に下げる。
- Spark ソート: `sortDistance` を下げると軽くなるが、前後関係が崩れる場合あり。
- `maxPixelRadius`: 小さくすると負荷減、粒子が粗くなる。
- `clipXY`: 1.0〜1.2 程度。視界端のアーティファクト抑制に関与。

## 環境メッシュ（GLB）とライティング
- 必要に応じて GLB を読み込み、`setupMaterialsForLighting()` で物理ベースの見た目に調整。
- `CONFIG.ENV.APPLY_SPLAT_SPACE` が有効な場合、Splat のスケール/位置/回転に合わせて環境メッシュを整列し、オフセットや回転補正を追加適用。

## トラブルシュート
- 真っ黒／透明: Splat URL の CORS 失敗、`.spz` 破損、CDN 未到達。
- 粒子が粗い: `maxPixelRadius` を上げる、DPR 上限を上げる（パフォーマンスと相談）。
- ソート破綻: `sortRadial`/`sortDistance` の値を強める。
