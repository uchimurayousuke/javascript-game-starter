"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let state, x, startedAt;

function start() {
  state = "playing"; x = 100; startedAt = performance.now();
}

function update() {
  if (state !== "playing") return;
  x += 2; if (x > 700) x = 100;
  if (performance.now() - startedAt >= 10000) state = "over";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  ctx.fillText("残り " + Math.max(0, Math.ceil((10000 - (performance.now() - startedAt)) / 1000)) + "秒", 60, 80);
  ctx.fillRect(x, 200, 40, 40);
  ctx.fillText(state === "paused" ? "停止中　P: 再開" : state === "over" ? "時間切れ　R: 再開" : "P: 一時停止", 200, 350);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (event.key.toLowerCase() === "p") {
    if (state === "playing") state = "paused";
    else if (state === "paused") state = "playing";
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
