"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let cards;

function start() {
  cards = [
    {letter: "A", open: false, matched: false}, {letter: "B", open: false, matched: false},
    {letter: "C", open: false, matched: false}, {letter: "D", open: false, matched: false},
    {letter: "B", open: false, matched: false}, {letter: "A", open: false, matched: false},
    {letter: "D", open: false, matched: false}, {letter: "C", open: false, matched: false}
  ];
}

function update() {
}

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
  ctx.fillStyle = "#26334a";
  ctx.font = "22px sans-serif";
  ctx.fillText("8枚のカードを並べます", 270, 390);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
