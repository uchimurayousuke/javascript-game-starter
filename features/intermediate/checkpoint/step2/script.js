"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let x, saved, keys;

function start() {
  x = 80; saved = 80; keys = {};
}

function update() {
  const old = x;
  x += (keys.ArrowRight ? 3 : 0) - (keys.ArrowLeft ? 3 : 0);
  x = Math.max(20, Math.min(780, x));
  if (old < 400 && x >= 400 && saved < 420) saved = 420;

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#dce8ef"; ctx.fillRect(30, 190, 740, 70);
  ctx.fillStyle = "#3f9b68"; ctx.fillRect(398, 180, 4, 90);
  ctx.fillStyle = "#397ab4"; ctx.fillRect(x - 15, 210, 30, 30);
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText("位置: " + x + " / 戻る位置: " + saved, 100, 100);
  ctx.fillText("←→: 移動 / R: 戻る / N: 最初から", 100, 350);
}

window.addEventListener("keydown", event => {
  if (event.repeat && event.key.toLowerCase() !== "r") return;
  const key = event.key.toLowerCase();
  if (key === "n") { start(); return; }
  if (key === "r" && !event.repeat) { x = saved; keys = {}; return; }
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); keys[event.key] = true; }
});
window.addEventListener("keyup", event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") keys[event.key] = false; });
window.addEventListener("blur", () => { keys = {}; });

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
