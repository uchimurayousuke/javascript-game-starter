"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let products, money, revenue, selected, message, day, phase, state;

function start() {
  products = [
    {name: "パン", basePrice: 35, cost: 20, price: 35, stock: 0, soldToday: 0},
    {name: "ジュース", basePrice: 25, cost: 15, price: 25, stock: 0, soldToday: 0},
    {name: "りんご", basePrice: 18, cost: 10, price: 18, stock: 0, soldToday: 0}
  ];
  money = 100;
  revenue = 0;
  selected = 0;
  day = 1;
  phase = "buy";
  state = "playing";
  setDemand();
  message = "需要を見て1〜3で選び、Bで仕入れ";
}

function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "22px sans-serif";
  ctx.fillText("日: " + day + " / 3  所持金: " + money + "  売上: " + revenue, 80, 45);
  if (state === "playing" && phase === "buy") {
    ctx.fillText("仕入れ: B / 売値: ↑↓ / 販売: Enter", 80, 82);
  } else if (state === "playing") {
    ctx.fillText("販売終了。Enterで次へ", 80, 82);
  } else {
    ctx.fillText("R キーでもう一度", 80, 82);
  }
  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    const y = 120 + i * 75;
    ctx.fillStyle = "#e5d3b0";
    ctx.fillRect(80, y + 45, 625, 8);
    if (i === 0) {
      ctx.fillStyle = "#c58b42";
      ctx.fillRect(112, y + 15, 38, 28);
      ctx.beginPath();
      ctx.arc(131, y + 15, 19, Math.PI, 0);
      ctx.fill();
    } else if (i === 1) {
      ctx.fillStyle = "#55a4c7";
      ctx.fillRect(115, y + 7, 32, 36);
      ctx.fillStyle = "#f5f7e9";
      ctx.fillRect(121, y + 19, 20, 9);
      ctx.fillStyle = "#355a75";
      ctx.fillRect(123, y + 2, 16, 5);
    } else {
      ctx.fillStyle = "#d65b50";
      ctx.beginPath();
      ctx.arc(131, y + 25, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#416a47";
      ctx.fillRect(129, y + 3, 5, 8);
    }
    ctx.fillStyle = "#26334a";
    if (i === selected) ctx.fillText("→", 78, y + 32);
    ctx.fillText((i + 1) + ": " + item.name + " 仕入 " + item.cost + " / 売値 " + item.price, 170, y + 18);
    ctx.fillText("在庫 " + item.stock + " / 今日の需要 " + effectiveDemand(item) + " / 販売 " + item.soldToday, 170, y + 45);
  }
  let eventText = "今日は通常の日";
  if (day === 2) eventText = "今日はパンの需要が1増える日";
  if (day === 3) eventText = "今日はジュースの需要が1増える日";
  ctx.fillText(eventText, 80, 350);
  ctx.fillText(message, 80, 385);
}

function setDemand() {
  for (const item of products) {
    item.demand = Math.floor(Math.random() * 3) + 1;
    item.soldToday = 0;
  }
  if (day === 2) products[0].demand++;
  if (day === 3) products[1].demand++;
}

function effectiveDemand(item) {
  let demand = item.demand;
  if (item.price < item.basePrice) demand++;
  if (item.price > item.basePrice) demand--;
  return Math.max(0, demand);
}

function sellToday() {
  for (const item of products) {
    const sold = Math.min(item.stock, effectiveDemand(item));
    item.stock -= sold;
    item.soldToday = sold;
    const income = sold * item.price;
    money += income;
    revenue += income;
  }
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  const key = event.key.toLowerCase();
  if (state !== "playing") {
    if (key === "r") start();
    return;
  }
  if (key >= "1" && key <= "3" && key.length === 1 && phase === "buy") {
    selected = Number(key) - 1;
    message = products[selected].name + "を選んだ";
  } else if ((event.key === "ArrowUp" || event.key === "ArrowDown") && phase === "buy") {
    event.preventDefault();
    const item = products[selected];
    const change = event.key === "ArrowUp" ? 5 : -5;
    item.price = Math.max(item.basePrice - 5, Math.min(item.basePrice + 5, item.price + change));
    message = item.name + "の売値を " + item.price + " にした";
  } else if (key === "b" && phase === "buy") {
    const item = products[selected];
    if (money >= item.cost) {
      money -= item.cost;
      item.stock++;
      message = item.name + "を1個仕入れた";
    } else {
      message = "お金が足りません";
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (phase === "buy") {
      sellToday();
      phase = "sell";
      message = "販売しました。売れ残りは翌日に持ち越します";
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
      setDemand();
      message = "次の日。需要を見て仕入れよう";
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
