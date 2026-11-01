"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let x, y, dx, dy, paddleX;
const radius = 10, paddleWidth = 110, paddleY = 410;

function start() {
  x = 400; y = 225; dx = 4; dy = 4; paddleX = 345;
}

function update() {
  x += dx; y += dy;
  if (x <= radius || x >= canvas.width - radius) dx = -dx;
  if (y <= radius) dy = -dy;
  if (y >= canvas.height - radius) dy = -dy;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2269b4";
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#26334a";
  ctx.fillRect(paddleX, paddleY, paddleWidth, 14);
}


function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
