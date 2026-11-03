"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let items; let nextSpawn;

function start() {
  items = []; nextSpawn = performance.now() + 1000;
}

function update() {
  const now = performance.now();
  if (now >= nextSpawn) { if (items.length < 10) items.push({born: performance.now()}); nextSpawn = now + 1000; }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("数: " + items.length + " / 10", 200, 90);
  for (let i = 0; i < items.length; i++) {
    ctx.fillStyle = "#4b8191"; ctx.fillRect(100 + i * 55, 180, 40, 40);
  }
  ctx.fillStyle = "#26334a"; ctx.fillText("Space: 追加　R: 最初から", 140, 320);
}

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.code === "Space") event.preventDefault();
  if (event.repeat) return;
  if (event.code === "Space") { if (items.length < 10) items.push({born: performance.now()}); }
  if (event.key.toLowerCase() === "r") start();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
