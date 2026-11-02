"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let x, previous, delta;

function start() {
  x = 100; previous = null; delta = 0;
}

function update() {
  const now = performance.now();
  if (previous === null) { previous = now; delta = 0; return; }
  delta = Math.max(0, (now - previous) / 1000); previous = now;

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif";
  ctx.fillText("1回の経過秒: " + delta.toFixed(3), 100, 100);
  ctx.fillText("x: " + x.toFixed(1) + " / 速さ: 120px/秒", 100, 150);
  ctx.fillRect(x - 20, 220, 40, 40);
  ctx.fillText("R: 最初から", 100, 360);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }

});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
