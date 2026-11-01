"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let products, money, revenue, selected, message, day, phase, state;

function start() {
  products = [
    {name: "パン", cost: 20, price: 35, stock: 0, soldToday: 0},
    {name: "ジュース", cost: 15, price: 25, stock: 0, soldToday: 0},
    {name: "りんご", cost: 10, price: 18, stock: 0, soldToday: 0}
  ];
  money = 100;
  revenue = 0;
  selected = 0;
  day = 1;
  phase = "buy";
  state = "playing";
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
  ctx.fillText("日: " + day + " / 3  所持金: " + money + "  売上: " + revenue, 125, 50);
  ctx.fillText("→", 85, 145 + selected * 55);
  if (state === "playing") {
    if (phase === "buy") {
      ctx.fillText("仕入れ中: Bで1個 / Enterで販売へ", 125, 95);
    } else {
      ctx.fillText("販売中: Sで1個 / Enterで次の日へ", 125, 95);
    }
    ctx.fillText("1商品につき1日3個まで売れます", 125, 330);
  } else {
    ctx.fillText("R キーでもう一度", 125, 330);
  }
  ctx.fillText(message, 125, 380);
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  const key = event.key.toLowerCase();
  if (state !== "playing") {
    if (key === "r") start();
    return;
  }
  if (key >= "1" && key <= "3" && key.length === 1) {
    selected = Number(key) - 1;
    message = products[selected].name + "を選んだ";
  } else if (key === "b" && phase === "buy") {
    const item = products[selected];
    if (money >= item.cost) {
      money -= item.cost;
      item.stock++;
      message = item.name + "を1個仕入れた";
    } else {
      message = "お金が足りません";
    }
  } else if (key === "s" && phase === "sell") {
    const item = products[selected];
    if (item.stock <= 0) {
      message = "在庫がありません";
    } else if (item.soldToday >= 3) {
      message = "今日はこの商品を3個売りました";
    } else {
      item.stock--;
      item.soldToday++;
      money += item.price;
      revenue += item.price;
      message = item.name + "を1個売った";
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (phase === "buy") {
      phase = "sell";
      message = "Sで売ろう。売れるのは1商品3個まで";
    } else if (day === 3) {
      if (money >= 160) {
        state = "clear";
        message = "目標達成！ 所持金 " + money;
      } else {
        state = "over";
        message = "目標に届かなかった。所持金 " + money;
      }
    } else {
      day++;
      phase = "buy";
      for (const item of products) item.soldToday = 0;
      message = "次の日。Bで仕入れよう";
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
