"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const messages = ["こんにちは", "気をつけて", "またね"];
let index; let shown, lastAt;

function start() {
  index = 0; shown = 0; lastAt = performance.now();
}

function update() {
  const now = performance.now();
  const count = Math.floor((now - lastAt) / 100);
  if (count > 0) {
    shown = Math.min(messages[index].length, shown + count);
    lastAt += count * 100;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText(messages[index].slice(0, shown), 180, 180);
  ctx.fillText("Space: 文字送り　R: 最初から", 180, 300);
}

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.code === "Space") event.preventDefault();
  if (event.repeat) return;
  if (event.code === "Space") {
    if (shown < messages[index].length) shown = messages[index].length;
    else if (index < messages.length - 1) { index += 1; shown = 0; lastAt = performance.now(); }

  }
  if (event.key.toLowerCase() === "r") start();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
