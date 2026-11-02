"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let cards, selected, firstIndex, secondIndex, closeAt, pairs, state, previewUntil, turns, endAt, finishedAt;

function start() {
  cards = [
    {letter: "A", open: false, matched: false}, {letter: "B", open: false, matched: false},
    {letter: "C", open: false, matched: false}, {letter: "D", open: false, matched: false},
    {letter: "B", open: false, matched: false}, {letter: "A", open: false, matched: false},
    {letter: "D", open: false, matched: false}, {letter: "C", open: false, matched: false}
  ];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const card = cards[i];
    cards[i] = cards[j];
    cards[j] = card;
  }

  selected = 0;
  firstIndex = -1;
  secondIndex = -1;
  closeAt = 0;
  pairs = 0;
  turns = 0;
  state = "playing";
  previewUntil = performance.now() + 2000;
  endAt = previewUntil + 60000;
  finishedAt = null;
}

function expired() {
  if (state === "playing" && performance.now() >= endAt) { state = "over"; finishedAt = endAt; }
  return state !== "playing";
}

function update() {
  if (expired()) return;
  if (closeAt !== 0 && performance.now() >= closeAt) {
    cards[firstIndex].open = false;
    cards[secondIndex].open = false;
    firstIndex = -1;
    secondIndex = -1;
    closeAt = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < cards.length; i++) {
    const x = 160 + (i % 4) * 120;
    const y = 90 + Math.floor(i / 4) * 130;
    ctx.fillStyle = "#447ab5";
    if (cards[i].open || cards[i].matched || performance.now() < previewUntil) ctx.fillStyle = "#f8dc8b";
    ctx.fillRect(x, y, 100, 110);
    ctx.fillStyle = "#26334a";
    ctx.font = "34px sans-serif";
    if (cards[i].open || cards[i].matched || performance.now() < previewUntil) ctx.fillText(cards[i].letter, x + 38, y + 68);
  }
  const x = 160 + (selected % 4) * 120;
  const y = 90 + Math.floor(selected / 4) * 130;
  ctx.strokeStyle = "#bd542f";
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 4, y - 4, 108, 118);
  ctx.fillStyle = "#26334a";
  ctx.font = "22px sans-serif";
  ctx.fillText("そろった組: " + pairs + " / 4", 300, 50);
  const seconds = Math.max(0, Math.ceil((endAt - Math.max(finishedAt === null ? performance.now() : finishedAt, previewUntil)) / 1000));
  ctx.fillText("残り: " + seconds + "秒", 30, 50);
  if (performance.now() < previewUntil) ctx.fillText("2秒間おぼえよう", 290, 365);
  else if (state === "clear") {
    let rating = "もう一度挑戦";
    if (turns <= 6) rating = "すばらしい";
    else if (turns <= 10) rating = "よくできた";
    ctx.fillText("比較 " + turns + "回：" + rating, 260, 365);
  } else ctx.fillText("比較: " + turns + "回", 300, 365);
  if (state === "clear") {
    ctx.fillText("全部そろった！ R でもう一度", 220, 390);
  } else if (state === "over") {
    ctx.fillText("時間切れ！ R でもう一度", 220, 390);
  } else {
    ctx.fillText("クリックか左右・Enter / R でやり直す", 150, 390);
  }
}

function turnCard() {
  if (expired()) return;
  if (performance.now() < previewUntil || closeAt !== 0 || cards[selected].matched || cards[selected].open) return;
  cards[selected].open = true;
  if (firstIndex === -1) {
    firstIndex = selected;
    return;
  }
  secondIndex = selected;
  turns++;
  if (cards[firstIndex].letter === cards[secondIndex].letter) {
    cards[firstIndex].matched = true;
    cards[secondIndex].matched = true;
    firstIndex = -1;
    secondIndex = -1;
    pairs++;
    if (pairs === 4) { state = "clear"; finishedAt = performance.now(); }
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
  if (expired() || closeAt !== 0 || performance.now() < previewUntil) return;
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

canvas.addEventListener("click", (event) => {
  if (expired() || closeAt !== 0 || performance.now() < previewUntil) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  for (let i = 0; i < cards.length; i++) {
    const left = 160 + (i % 4) * 120;
    const top = 90 + Math.floor(i / 4) * 130;
    if (x >= left && x < left + 100 && y >= top && y < top + 110) {
      if (cards[i].matched || cards[i].open) return;
      selected = i;
      turnCard();
      return;
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
