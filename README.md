# JavaScript ゲーム制作ひな型

HTML・CSS・JavaScript を学ぶ人が、自分のゲームを作り始めるための最小限のひな型です。`index.html` をブラウザで開くと、空のゲーム画面が表示されます。インストールやビルドは必要ありません。

## 用意しているもの

- 横800 × 縦450の Canvas（絵を描く場所。画面幅に合わせて縮小表示）
- 最初に1回呼ばれる `start()`
- 画面を1回描き直すたびに呼ばれる `update()` と `draw()`
- `requestAnimationFrame` を使うゲームループ

## 自分で作るもの

一番上のフォルダーにあるひな型には、キャラクター、操作、得点、勝敗条件、タイトル画面、画像や音など、ゲーム固有の要素は入れていません。必要なものを少しずつ追加してください。

## ルートのファイル構成

| ファイル | 役割 |
| --- | --- |
| `index.html` | Canvas を配置し、CSS と JavaScript を読み込む |
| `style.css` | Canvas の表示位置と大きさを決める |
| `script.js` | `start()`・`update()`・`draw()` にゲームの処理を書く |

まずは `script.js` の `draw()` に図形を描き、次に `update()` でその位置を変えると、動きを確認できます。変更したらブラウザを再読み込みしてください。

## ステップ別チュートリアル

[教材を読むページ](tutorial/index.html)と、各段階のゲームを動かすページを分けています。描画 → 更新 → 入力 → 当たり判定 → クリアと再挑戦の5段階で、「コインキャッチ」を作ります。

ゲームのファイルをまとめたリポジトリをダウンロードするかクローンしたら、パソコンに保存した `tutorial/index.html` をブラウザで開いてください。空のひな型を自分の作業用フォルダーへコピーし、教材のコードを順番に書き足したり、書き換えたりして進めます。各ステップに、編集位置、必要なコード、コードの意味、動作確認、小さな練習があります。GitHub 上のリンクを開くと HTML のコードが表示されます。ゲームを動かすときはパソコンに保存したファイルを開きます。

| 入口 | 用途 |
| --- | --- |
| [tutorial/index.html](tutorial/index.html) | 教材を読む。ゲームは埋め込んでいません |
| [tutorial/README.md](tutorial/README.md) | 教材と制作物のファイル構成を確認する |
| [最初の制作物](tutorial/01-draw/index.html) | 描画だけを追加した Canvas を開く |
| [完成したゲーム](tutorial/05-game/index.html) | 左右キーでコインを集めて遊ぶ |

各段階の制作物には独立した `index.html`・`style.css`・`script.js` がそろっています。制作物のページに教材の見出し・編集指示・ステップ移動はありません。依存ライブラリ、インストール、ビルド、開発用サーバーは不要です。

## ゲームの制作例

[制作例の一覧](examples/index.html)には、初心者向けから上級者向けまでのゲームと作り方があります。パソコンに保存した `examples/index.html` をブラウザで開くと、各教材と完成版へ進めます。

初心者向けは、次の5本です。

- [クリックで的あて](examples/target/tutorial.html)：クリックした位置と的の距離を調べます。
- [ボールをはね返すゲーム](examples/bounce/tutorial.html)：板を動かし、ボールをはね返します。
- [タイミングストップ](examples/timing/tutorial.html)：動く線を目標の範囲で止めます。
- [タイピングゲーム](examples/typing/tutorial.html)：英字や短い単語を、正確に速く打ちます。
- [ヒントで数あて](examples/number-guess/tutorial.html)：大小のヒントを使い、かくれた数を探します。

中級者向けは、次の5本です。

- [ブロックくずし](examples/breakout/tutorial.html)：ボールを当ててブロックを消します。
- [シンプルなシューティング](examples/shooting/tutorial.html)：弾を飛ばして敵を倒します。
- [スネークゲーム](examples/snake/tutorial.html)：マス目を進み、食べ物を取って体を伸ばします。
- [神経衰弱](examples/memory/tutorial.html)：2枚のカードをめくり、同じ文字の組を探します。
- [小さなお店の経営ゲーム](examples/shop/tutorial.html)：商品を仕入れて売り、3日間の所持金を増やします。

上級者向けは、次の5本です。

- [横スクロールのジャンプアクション](examples/platformer/tutorial.html)：地形を進み、ゴールを目指します。
- [クリックで脱出ゲーム](examples/escape/tutorial.html)：番号の謎と持ち物を使って部屋から脱出します。
- [タワーディフェンス](examples/tower-defense/tutorial.html)：タワーを置き、3回の敵の波を防ぎます。
- [小さなカードバトル](examples/card-battle/tutorial.html)：攻撃・防御・回復のカードで敵と戦います。
- [周回タイムアタック](examples/racing/tutorial.html)：車で4地点を順に通り、2周のタイムを記録します。

[横スクロールゲームの発展課題](examples/platformer/extensions/tutorial.html)では、基本の6段階を終えた後に、「敵を踏んで倒す」「ダッシュする」「中間ポイントから再挑戦する」の3つを追加します。各課題に、目標、ヒント、具体的なコードの変更手順、動作の確かめ方と独立した見本があります。
