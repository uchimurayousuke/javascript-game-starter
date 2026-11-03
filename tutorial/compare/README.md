# 見本データの更新

教材のステップとその出典は `chapters.json` に登録されています。`sources` の `index.html` と `style.css` は、学習者が教材の手順でコピー・準備するファイルを指します。見本ゲームの表示上の名前だけを合わせるために、教材で指示していない変更を参照元にしないでください。`script.js` はそのステップの終了時点の見本です。`stepLabel` と `expectations` は教材の見出しと「保存後の確認」から記録し、練習問題は修正版の動きを記録します。教材を変更したら、これらの説明も教材と照合してください。

見本や登録内容を変更した場合は、リポジトリのルートで次を実行し、`references.js` を更新して差分とテストを確認してください。

```text
node tutorial/compare/build-references.cjs
node --test tests/chapter-compare.test.cjs
```

教材を見る人は、この操作やNodeのインストールをする必要はありません。比較ページは生成済みの `references.js` を同じフォルダーから読み、ネットワークを使いません。
