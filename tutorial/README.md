# コインキャッチの教材と制作物

教材は [index.html](index.html) で読みます。ゲームのファイルをまとめたリポジトリをパソコンにダウンロードするか、クローンして保存し、`tutorial/index.html` をブラウザで開いてください。HTML・CSS・JavaScript だけで動き、インストールやサーバーは不要です。

教材にはゲームを埋め込んでいません。各段階のゲームを別ページで開くリンクと、その段階の `script.js` 全体を開くリンクがあります。

## 自分で書き進める

1. 保存したリポジトリの `template/` にある `index.html`・`style.css`・`script.js` を、自分の作業用フォルダーへコピーします。
2. 教材の「準備」で、コピー先の HTML と CSS を整えます。
3. STEP 01 から順番に、コピー先の `script.js` へコードを追加・置換します。
4. 保存して自分の `index.html` を再読み込みし、制作物の見本と比べます。

各 STEP は「目標」「編集するファイルと場所」「追加または置換するコード」「コードの意味」「保存・再読み込み後の確認」「小さな練習」で構成しています。コードをどこに追加するか、関数のどこからどこまでを置き換えるかも書いています。練習で変えた値は次の段階に進む前に元に戻します。

## 制作物を実行する

制作物の HTML は、絵を描くための場所である Canvas だけを置いています。ゲームの操作案内や結果表示は Canvas の中に描きます。教材の見出し、編集指示、ステップ移動は含めません。

| 段階 | ゲームを開く | JavaScript 全体 | 確認できるもの |
| --- | --- | --- | --- |
| 01 描画 | [01-draw/index.html](01-draw/index.html) | [script.js](01-draw/script.js) | コイン、受け皿、文字 |
| 02 更新 | [02-update/index.html](02-update/index.html) | [script.js](02-update/script.js) | コインの落下と再登場 |
| 03 入力 | [03-input/index.html](03-input/index.html) | [script.js](03-input/script.js) | 左右キーの操作と画面端での停止 |
| 04 判定 | [04-collision/index.html](04-collision/index.html) | [script.js](04-collision/script.js) | 当たり判定と得点 |
| 05 完成 | [05-game/index.html](05-game/index.html) | [script.js](05-game/script.js) | 5枚でクリア、3回のミスで終了、Space で再挑戦 |

各フォルダーの3ファイルは、その段階での完成見本です。ほかの段階の CSS や JavaScript を使わないので、それぞれの `index.html` を直接開けます。操作にはパソコンのキーボードを使います。

## 教材を保守する人向けの確認

Node.js がある環境では、リポジトリのルートで次を実行できます。ゲームを開くときに Node.js は必要ありません。

```sh
node --test tests/tutorial.test.cjs
```

この確認では教材に載せたコードを空のひな型へ順に書き足したり書き換えたりして、各段階の HTML・CSS・JavaScript と同じになるかを確かめます。教材と制作物の分離、ローカルリンク、JavaScript の構文も確認します。
