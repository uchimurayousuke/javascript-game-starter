# 見本データの更新

教材の章とその出典は `chapters.json` に登録されています。`sources` の `index.html` と `style.css` は、学習者が教材の手順でコピー・準備するファイルを指します。見本ゲームの表示上の名前だけを合わせるために、教材で指示していない変更を参照元にしないでください。`script.js` はその章の終了時点の見本です。

見本や登録内容を変更した場合は、リポジトリのルートで次を実行し、`references.js` を更新して差分とテストを確認してください。

```text
node tutorial/compare/build-references.cjs
node --test tests/chapter-compare.test.cjs
```

教材を見る人は、この操作やNodeのインストールをする必要はありません。比較ページは生成済みの `references.js` を同じフォルダーから読み、ネットワークを使いません。
