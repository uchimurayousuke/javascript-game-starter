"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let cards, selected, firstIndex, secondIndex, closeAt, pairs, state;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  cards = [
    {letter: "A", open: false, matched: false}, {letter: "B", open: false, matched: false},
    {letter: "C", open: false, matched: false}, {letter: "D", open: false, matched: false},
    {letter: "B", open: false, matched: false}, {letter: "A", open: false, matched: false},
    {letter: "D", open: false, matched: false}, {letter: "C", open: false, matched: false}
  ];
  selected = 0;
  firstIndex = -1;
  secondIndex = -1;
  closeAt = 0;
  pairs = 0;
  state = "playing";
}

// 毎フレーム呼ばれます。
function update() {
  if (closeAt !== 0 && performance.now() >= closeAt) {
    cards[firstIndex].open = false;
    cards[secondIndex].open = false;
    firstIndex = -1;
    secondIndex = -1;
    closeAt = 0;
  }
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
  ctx.fillText("そろった組: " + pairs + " / 4", 300, 50);
  if (state === "clear") {
    ctx.fillText("全部そろった！ R でもう一度", 220, 390);
  } else {
    ctx.fillText("左右で選び、Enter でめくる / R でやり直す", 150, 390);
  }
}

function turnCard() {
  if (closeAt !== 0 || cards[selected].matched || cards[selected].open) return;
  cards[selected].open = true;
  if (firstIndex === -1) {
    firstIndex = selected;
    return;
  }
  secondIndex = selected;
  if (cards[firstIndex].letter === cards[secondIndex].letter) {
    cards[firstIndex].matched = true;
    cards[secondIndex].matched = true;
    firstIndex = -1;
    secondIndex = -1;
    pairs++;
    if (pairs === 4) state = "clear";
  } else {
    closeAt = performance.now() + 1000;
  }
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.key.toLowerCase() === "r") {
    start();
    return;
  }
  if (state !== "playing" || closeAt !== 0) return;
  if (event.key === "ArrowRight") {
    selected = (selected + 1) % cards.length;
    event.preventDefault();
  } else if (event.key === "ArrowLeft") {
    selected = (selected + cards.length - 1) % cards.length;
    event.preventDefault();
  } else if (event.key === "Enter") {
    turnCard();
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
