"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let products, money;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  products = [
    {name: "パン", cost: 20, price: 35, stock: 0, soldToday: 0},
    {name: "ジュース", cost: 15, price: 25, stock: 0, soldToday: 0},
    {name: "りんご", cost: 10, price: 18, stock: 0, soldToday: 0}
  ];
  money = 100;
}

// 毎フレーム呼ばれます。
function update() {
  // この段階ではまだ売買しません。
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "22px sans-serif";
  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    const line = (i + 1) + ": " + item.name + " 仕入 " + item.cost + " / 売値 " + item.price + " / 在庫 " + item.stock;
    ctx.fillText(line, 125, 145 + i * 55);
  }
  ctx.fillText("所持金: " + money, 125, 70);
  ctx.fillText("3つの商品を並べます", 125, 355);
}

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
