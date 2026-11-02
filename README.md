# JavaScript ゲーム制作ひな型

HTML・CSS・JavaScript を学ぶ人が、自分のゲームを作り始めるための最小限のひな型です。`template/index.html` をブラウザで開くと、空のゲーム画面が表示されます。インストールやビルドは必要ありません。

## 用意しているもの

- 横800 × 縦450の Canvas（絵を描く場所。画面幅に合わせて縮小表示）
- 最初に1回呼ばれる `start()`
- 画面を1回描き直すたびに呼ばれる `update()` と `draw()`
- `requestAnimationFrame` を使うゲームループ

## 自分で作るもの

`template/` にあるひな型には、キャラクター、操作、得点、勝敗条件、タイトル画面、画像や音など、ゲーム固有の要素は入れていません。必要なものを少しずつ追加してください。

ひな型と制作例のコードにはコメントを入れず、処理の説明は教材の「コードの意味」にまとめています。

## フォルダー構成

| 場所 | 役割 |
| --- | --- |
| [template/](template/index.html) | 共通のスタート地点。3ファイルを作業用フォルダーへコピーする |
| [tutorial/](tutorial/index.html) | コインキャッチの教材と5段階の見本 |
| [examples/index.html](examples/index.html) | 制作例の一覧。教材と完成版を開く |
| [features/index.html](features/index.html) | メニューや保存など、共通機能の教材と見本 |
| `examples/beginner/` | 初心者向けの7ゲーム |
| `examples/intermediate/` | 中級者向けの9ゲーム |
| `examples/advanced/` | 上級者向けの11ゲームと発展課題 |

`template/` の3ファイルは [index.html](template/index.html)、[style.css](template/style.css)、[script.js](template/script.js) です。ゲームを作るときは3つとも自分の作業用フォルダーにコピーし、元のひな型を残します。まずコピー先の `script.js` の `draw()` に図形を描き、次に `update()` で位置を変えると、動きを確認できます。変更したらコピー先の `index.html` を再読み込みしてください。

## ステップ別チュートリアル

[教材を読むページ](tutorial/index.html)と、各段階のゲームを動かすページを分けています。描画 → 更新 → 入力 → 当たり判定 → クリアと再挑戦の5段階で、「コインキャッチ」を作ります。

ゲームのファイルをまとめたリポジトリをダウンロードするかクローンしたら、パソコンに保存した `tutorial/index.html` をブラウザで開いてください。`template/` の3ファイルを自分の作業用フォルダーへコピーし、教材のコードを順番に書き足したり、書き換えたりして進めます。各ステップに、編集位置、必要なコード、コードの意味、動作確認、小さな練習があります。GitHub 上のリンクを開くと HTML のコードが表示されます。ゲームを動かすときはパソコンに保存したファイルを開きます。

| 入口 | 用途 |
| --- | --- |
| [tutorial/index.html](tutorial/index.html) | 教材を読む。ゲームは埋め込んでいません |
| [tutorial/README.md](tutorial/README.md) | 教材と制作物のファイル構成を確認する |
| [最初の制作物](tutorial/01-draw/index.html) | 描画だけを追加した Canvas を開く |
| [完成したゲーム](tutorial/05-game/index.html) | 左右キーでコインを集めて遊ぶ |

各段階の制作物には独立した `index.html`・`style.css`・`script.js` がそろっています。制作物のページに教材の見出し・編集指示・ステップ移動はありません。依存ライブラリ、インストール、ビルド、開発用サーバーは不要です。

## ゲームの制作例

[制作例の一覧](examples/index.html)には、初心者向けから上級者向けまでのゲームと作り方があります。パソコンに保存した `examples/index.html` をブラウザで開くと、各教材と完成版へ進めます。

初心者向けは、次の7本です。

- [クリックで的あて](examples/beginner/target/tutorial.html)：クリックした位置と的の距離を調べます。
- [ボールをはね返すゲーム](examples/beginner/bounce/tutorial.html)：板を動かし、ボールをはね返します。
- [タイミングストップ](examples/beginner/timing/tutorial.html)：動く線を目標の範囲で止めます。
- [タイピングゲーム](examples/beginner/typing/tutorial.html)：英字や短い単語を、正確に速く打ちます。
- [ヒントで数あて](examples/beginner/number-guess/tutorial.html)：大小のヒントを使い、かくれた数を探します。

- [3択クイズ](examples/beginner/quiz/tutorial.html)：配列の問題を表示し、選択肢と正解を比べます。
- [選択肢の冒険](examples/beginner/story/tutorial.html)：選択した番号で物語の場面と結末を変えます。

中級者向けは、次の9本です。

- [ブロックくずし](examples/intermediate/breakout/tutorial.html)：ボールを当ててブロックを消します。
- [シンプルなシューティング](examples/intermediate/shooting/tutorial.html)：弾を飛ばして敵を倒します。
- [スネークゲーム](examples/intermediate/snake/tutorial.html)：マス目を進み、食べ物を取って体を伸ばします。
- [神経衰弱](examples/intermediate/memory/tutorial.html)：2枚のカードをめくり、同じ文字の組を探します。
- [小さなお店の経営ゲーム](examples/intermediate/shop/tutorial.html)：商品を仕入れて売り、3日間の所持金を増やします。

- [箱押しパズル](examples/intermediate/sokoban/tutorial.html)：壁と箱を調べ、箱を目標まで押します。
- [マインスイーパー](examples/intermediate/minesweeper/tutorial.html)：周囲の爆弾を数え、安全なマスを開きます。

- [リズムゲーム](examples/intermediate/rhythm/tutorial.html)：決まったタイミングでキーを押し、判定と得点を学びます。
- [お絵かきロジック](examples/intermediate/nonogram/tutorial.html)：行と列のヒントを見てマスを塗ります。

上級者向けは、次の11本です。

- [横スクロールのジャンプアクション](examples/advanced/platformer/tutorial.html)：地形を進み、ゴールを目指します。
- [クリックで脱出ゲーム](examples/advanced/escape/tutorial.html)：番号の謎と持ち物を使って部屋から脱出します。
- [タワーディフェンス](examples/advanced/tower-defense/tutorial.html)：タワーを置き、3回の敵の波を防ぎます。
- [小さなカードバトル](examples/advanced/card-battle/tutorial.html)：攻撃・防御・回復のカードで敵と戦います。
- [周回タイムアタック](examples/advanced/racing/tutorial.html)：車で4地点を順に通り、2周のタイムを記録します。

- [落ちものパズル](examples/advanced/falling-blocks/tutorial.html)：クラスで盤面と図形を作り、行をそろえます。
- [探索RPG](examples/advanced/quest-rpg/tutorial.html)：クラスで人物と依頼を作り、宝と鍵を探します。
- [マス目の戦術ゲーム](examples/advanced/tactics/tutorial.html)：味方を選んで移動し、敵と交互に戦います。
- [1対1サッカー](examples/advanced/soccer/tutorial.html)：選手とボールを動かし、先に3点を目指します。

- [3つそろえるパズル](examples/advanced/match3/tutorial.html)：隣を交換し、同じ印を3つ以上そろえます。
- [爆弾迷路アクション](examples/advanced/bomb-maze/tutorial.html)：爆風で箱を壊して敵を倒し、出口へ進みます。

[横スクロールゲームの発展課題](examples/advanced/platformer/extensions/tutorial.html)では、基本の6段階を終えた後に、「敵を踏んで倒す」「ダッシュする」「中間ポイントから再挑戦する」の3つを追加します。各課題に、目標、ヒント、具体的なコードの変更手順、動作の確かめ方と独立した見本があります。

コインキャッチと制作例の各ゲームには、基本完成版から進む発展編があります。各発展編は3段階で機能を追加し、段階ごとの見本と発展編の完成版を用意しています。[コインキャッチの発展編](tutorial/extensions/tutorial.html)または[制作例の一覧](examples/index.html)から開けます。

[共通機能の一覧](features/index.html)には、タイトル、遊び方、カウント、結果、ステージ選択、一時停止、難易度、音、保存、暗転、粒、タッチ操作の作例に加え、画像やゲームの基本処理を学ぶ作例があり、全部で24作例です。各機能は3段階で作り、自分のゲームへ組み込む方法も説明します。

[画像と共通機能の作例](features/index.html)では、画像の差し替え、位置と大きさ、体力バー、背景、当たり判定、ボタン、中間地点、アニメーション、反転と回転、経過時間、カメラも学べます。画像を使う見本は、3ファイルと `assets/` を一緒にコピーしてください。
