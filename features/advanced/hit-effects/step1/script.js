"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let effectStart, until;

function start() {
  effectStart = 0; until = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  const now = performance.now();
  const active = now < until;
  if (!active || Math.floor((now - effectStart) / 200) % 2 === 0) {
    ctx.fillStyle = "#d85e59"; ctx.fillRect(300, 150, 100, 100);
  }
  ctx.fillStyle = "#26334a"; ctx.fillText("Space: ヒット　R: 最初から", 160, 330);
}

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.code === "Space") event.preventDefault();
  if (event.repeat) return;
  if (event.code === "Space") { effectStart = performance.now(); until = effectStart + 600; }
  if (event.key.toLowerCase() === "r") start();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
