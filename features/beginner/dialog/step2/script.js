"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const messages = ["こんにちは", "気をつけて", "またね"];
let index;

function start() {
  index = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText(messages[index], 180, 180);
  ctx.fillText("Space: 次へ", 180, 300);
}

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.code === "Space") event.preventDefault();
  if (event.repeat) return;
  if (event.code === "Space") { index = Math.min(index + 1, messages.length - 1); }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
