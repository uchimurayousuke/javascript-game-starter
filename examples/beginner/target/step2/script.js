"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let targetX, targetY, score;
const radius = 35;

function start() {
  targetX = 400;
  targetY = 225;
  score = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e34b5f";
  ctx.beginPath();
  ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#26334a";
  ctx.font = "24px sans-serif";
  ctx.fillText("得点: " + score, 20, 35);
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  if (Math.hypot(x - targetX, y - targetY) <= radius) {
    score++;
    targetX = radius + Math.random() * (canvas.width - radius * 2);
    targetY = radius + Math.random() * (canvas.height - radius * 2);
  }
});
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
start();
gameLoop();
