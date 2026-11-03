# ひな型ZIPの更新

`my-game.zip` には、`template` の `index.html`・`style.css`・`script.js` をルートに収めています。改行はLFにそろえ、日時とファイル属性を固定しています。

元のひな型を更新したときは、リポジトリのルートで次を実行し、ZIPとテストを確認してください。Pythonは保守者がZIPを作り直すときだけ必要です。

```text
python downloads/build-template-zip.py
node --test tests/starter-download.test.cjs
```

教材を読む人は、生成済みのZIPを使えるため、Pythonやビルドの操作は必要ありません。
