"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let playerX, left = false, right = false;
const playerY = 400, playerWidth = 40;

function start() {
  playerX = 380; left = false; right = false;
}

function update() {
  if (left) playerX -= 6;
  if (right) playerX += 6;
  playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2269b4";
  ctx.fillRect(playerX, playerY, playerWidth, 22);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault();
  if (event.key === "ArrowLeft") left = true;
  if (event.key === "ArrowRight") right = true;
});
window.addEventListener("keyup", (event) => {
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
