"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let state, startedAt, x;

function start() {
  state = "ready"; startedAt = 0; x = 100;
}

function update() {
  if (state === "countdown" && performance.now() - startedAt >= 3000) state = "playing";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "30px sans-serif";
  if (state === "ready") ctx.fillText("Enterで開始", 280, 170);
  else if (state === "countdown") ctx.fillText(String(Math.max(1, 3 - Math.floor((performance.now() - startedAt) / 1000))), 390, 170);
  else { ctx.fillText("スタート！", 300, 170); ctx.fillRect(x, 240, 40, 40); }
  ctx.fillText("R: はじめから", 280, 390);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (event.key === "Enter" && state === "ready") { startedAt = performance.now(); state = "countdown"; }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
