"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let x, y, dx, dy, paddleX;
const radius = 10, paddleWidth = 110, paddleY = 410;
let left = false, right = false, score, over;

function start() {
  x = 400; y = 225; dx = 4; dy = 4; paddleX = 345;
  score = 0; over = false; left = false; right = false;
}

function update() {
  if (over) return;
  if (left) paddleX -= 7;
  if (right) paddleX += 7;
  paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, paddleX));
  x += dx; y += dy;
  if (x <= radius || x >= canvas.width - radius) dx = -dx;
  if (y <= radius) dy = -dy;
  if (dy > 0 && y + radius >= paddleY && y - radius <= paddleY + 14 &&
      x + radius >= paddleX && x - radius <= paddleX + paddleWidth) {
    y = paddleY - radius; dy = -dy; score++;
  }
  if (y - radius > canvas.height) over = true;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2269b4";
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#26334a";
  ctx.fillRect(paddleX, paddleY, paddleWidth, 14);
  ctx.font = "24px sans-serif";
  ctx.fillText("はね返した回数: " + score, 20, 35);
  if (over) ctx.fillText("ゲームオーバー！ R キーでもう一度", 180, 225);
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
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") start();
});
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
