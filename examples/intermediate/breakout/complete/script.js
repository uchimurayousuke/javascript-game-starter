"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let x, y, dx, dy, paddleX;
const radius = 10, paddleWidth = 110, paddleY = 410;
let left = false, right = false, bricks, score, state;

function start() {
  x = 400; y = 225; dx = 4; dy = 4; paddleX = 345;
  left = false; right = false; score = 0; state = "playing";
  bricks = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      bricks.push({ x: 80 + col * 80, y: 55 + row * 30, alive: true });
    }
  }
}

function update() {
  if (state !== "playing") return;
  if (left) paddleX -= 7;
  if (right) paddleX += 7;
  paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, paddleX));
  x += dx; y += dy;
  if (x <= radius || x >= canvas.width - radius) dx = -dx;
  if (y <= radius) dy = -dy;
  if (dy > 0 && y + radius >= paddleY && y - radius <= paddleY + 14 &&
      x + radius >= paddleX && x - radius <= paddleX + paddleWidth) {
    y = paddleY - radius; dy = -dy;
  }
  for (const brick of bricks) {
    if (brick.alive && x + radius >= brick.x && x - radius <= brick.x + 70 &&
        y + radius >= brick.y && y - radius <= brick.y + 20) {
      brick.alive = false; dy = -dy; score++; break;
    }
  }
  if (score === bricks.length) state = "clear";
  if (y - radius > canvas.height) state = "over";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2269b4";
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#26334a";
  ctx.fillRect(paddleX, paddleY, paddleWidth, 14);
  for (const brick of bricks) {
    if (brick.alive) {
      ctx.fillStyle = "#ec8055";
      ctx.fillRect(brick.x, brick.y, 70, 20);
    }
  }
  ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif";
  ctx.fillText("こわした数: " + score + " / " + bricks.length, 20, 35);
  if (state === "clear") ctx.fillText("クリア！ R キーでもう一度", 210, 225);
  if (state === "over") ctx.fillText("ゲームオーバー！ R キーでもう一度", 180, 225);
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
