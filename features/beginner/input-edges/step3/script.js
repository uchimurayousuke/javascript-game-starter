"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let count; let x, left, right;

function start() {
  count = 0; x = 400; left = false; right = false;
}

function update() {
  x = Math.max(20, Math.min(780, x + (Number(right) - Number(left)) * 3));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("1回押し: " + count, 200, 120);
  ctx.fillRect(x - 15, 200, 30, 30);
  ctx.fillText("Space: 数える　左右: 移動　R: 最初から", 100, 320);
}

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.code === "Space" || event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault();
  if (event.repeat) return;
  if (event.code === "Space") { count += 1; }
  if (event.key === "ArrowLeft") { left = true; }
  if (event.key === "ArrowRight") { right = true; }
  if (event.key.toLowerCase() === "r") start();
});
window.addEventListener("keyup", event => {
  if (event.key === "ArrowLeft") left = false;
  if (event.key === "ArrowRight") right = false;
});
window.addEventListener("blur", () => { left = false; right = false; });

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
