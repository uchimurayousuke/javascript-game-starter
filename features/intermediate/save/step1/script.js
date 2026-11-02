"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const storageKey = "game-example-best-v1";
let score, best, message;

function start() {
  score = 0; best = 0; message = "Spaceで得点";
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  ctx.fillText("得点 " + score + " / ベスト " + best, 160, 120);
  ctx.fillText(message, 160, 180);
  ctx.fillText("Space: 得点 / R: 最初から", 160, 360);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  if (event.key === " ") { event.preventDefault(); score = Math.min(9999, score + 1); best = Math.max(best, score); }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
