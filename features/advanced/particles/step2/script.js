"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let particles;

function start() {
  particles = [];
}

function update() {
  for (const p of particles) { p.x += p.dx; p.y += p.dy; p.dy += 0.1; }

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "26px sans-serif";
  ctx.fillText("クリックで粒を出す　R: 消す", 160, 70);
  ctx.fillStyle = "#e79548";
  for (const p of particles) ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
}

canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  particles.push({x, y, dx: (Math.random() - 0.5) * 4, dy: -3, life: 30});
});
window.addEventListener("keydown", event => { if (!event.repeat && event.key.toLowerCase() === "r") start(); });

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
