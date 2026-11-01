"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let cards, selected;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  cards = [
    {letter: "A", open: false, matched: false}, {letter: "B", open: false, matched: false},
    {letter: "C", open: false, matched: false}, {letter: "D", open: false, matched: false},
    {letter: "B", open: false, matched: false}, {letter: "A", open: false, matched: false},
    {letter: "D", open: false, matched: false}, {letter: "C", open: false, matched: false}
  ];
  selected = 0;
}

// 毎フレーム呼ばれます。
function update() {
  // キー入力は keydown で受け取ります。
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < cards.length; i++) {
    const x = 160 + (i % 4) * 120;
    const y = 90 + Math.floor(i / 4) * 130;
    ctx.fillStyle = "#447ab5";
    if (cards[i].open || cards[i].matched) ctx.fillStyle = "#f8dc8b";
    ctx.fillRect(x, y, 100, 110);
    ctx.fillStyle = "#26334a";
    ctx.font = "34px sans-serif";
    if (cards[i].open || cards[i].matched) ctx.fillText(cards[i].letter, x + 38, y + 68);
  }
  const x = 160 + (selected % 4) * 120;
  const y = 90 + Math.floor(selected / 4) * 130;
  ctx.strokeStyle = "#bd542f";
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 4, y - 4, 108, 118);
  ctx.fillStyle = "#26334a";
  ctx.font = "22px sans-serif";
  ctx.fillText("左右で選び、Enter でめくる", 220, 390);
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.key === "ArrowRight") {
    selected = (selected + 1) % cards.length;
    event.preventDefault();
  } else if (event.key === "ArrowLeft") {
    selected = (selected + cards.length - 1) % cards.length;
    event.preventDefault();
  } else if (event.key === "Enter") {
    cards[selected].open = !cards[selected].open;
    event.preventDefault();
  }
});

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
