"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let targetX, targetY, score, endTime, targetDX;
const radius = 35;

function start() {
  targetX = 400;
  targetY = 225;
  targetDX = 2;
  score = 0;
  endTime = performance.now() + 20000;
}

function update() {
  if (performance.now() >= endTime) return;
  targetX += targetDX;
  if (targetX <= radius) {
    targetX = radius;
    targetDX = 2;
  } else if (targetX >= canvas.width - radius) {
    targetX = canvas.width - radius;
    targetDX = -2;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e34b5f";
  ctx.beginPath();
  ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
  ctx.fill();
  const seconds = Math.max(0, Math.ceil((endTime - performance.now()) / 1000));
  ctx.fillStyle = "#26334a";
  ctx.font = "24px sans-serif";
  ctx.fillText("得点: " + score + "  残り: " + seconds + "秒", 20, 35);
  if (seconds === 0) ctx.fillText("終了！ R キーでもう一度", 220, 225);
}

canvas.addEventListener("click", (event) => {
  if (performance.now() >= endTime) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  if (Math.hypot(x - targetX, y - targetY) <= radius) {
    score++;
    targetX = radius + Math.random() * (canvas.width - radius * 2);
    targetY = radius + Math.random() * (canvas.height - radius * 2);
  }
});
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
