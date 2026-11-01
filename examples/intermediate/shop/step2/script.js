"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let products, money, selected, message;

function start() {
  products = [
    {name: "パン", cost: 20, price: 35, stock: 0, soldToday: 0},
    {name: "ジュース", cost: 15, price: 25, stock: 0, soldToday: 0},
    {name: "りんご", cost: 10, price: 18, stock: 0, soldToday: 0}
  ];
  money = 100;
  selected = 0;
  message = "1〜3で商品を選び、Bで仕入れ";
}

function update() {
}

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
  ctx.fillText("→", 85, 145 + selected * 55);
  ctx.fillText(message, 125, 355);
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.key >= "1" && event.key <= "3" && event.key.length === 1) {
    selected = Number(event.key) - 1;
  } else if (event.key.toLowerCase() === "b") {
    const item = products[selected];
    if (money >= item.cost) {
      money -= item.cost;
      item.stock++;
      message = item.name + "を1個仕入れた";
    } else {
      message = "お金が足りません";
    }
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
