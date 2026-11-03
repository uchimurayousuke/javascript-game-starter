"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let hp; let immuneUntil;

function start() {
  hp = 3; immuneUntil = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("体力: " + hp, 230, 100);
  if (performance.now() >= immuneUntil || Math.floor(performance.now() / 200) % 2 === 0)
  ctx.fillRect(300, 160, 120, 100);
  ctx.fillText("X: ダメージ　R: 最初から", 150, 320);
}

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.repeat) return;
  if (event.key.toLowerCase() === "x") { const now = performance.now(); if (now >= immuneUntil && hp > 0) { hp -= 1; immuneUntil = now + 1000; } }
  if (event.key.toLowerCase() === "r") start();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
