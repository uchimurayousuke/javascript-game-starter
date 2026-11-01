"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let playerX, left = false, right = false;
const playerY = 400, playerWidth = 40;
let bullets, firing = false, cooldown;

function start() {
  playerX = 380; left = false; right = false;
  bullets = []; firing = false; cooldown = 0;
}

function update() {
  if (left) playerX -= 6;
  if (right) playerX += 6;
  playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));
  if (cooldown > 0) cooldown--;
  if (firing && cooldown === 0) {
    bullets.push({ x: playerX + playerWidth / 2 - 3, y: playerY });
    cooldown = 12;
  }
  for (const bullet of bullets) bullet.y -= 8;
  bullets = bullets.filter((bullet) => bullet.y + 12 >= 0);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2269b4";
  ctx.fillRect(playerX, playerY, playerWidth, 22);
  ctx.fillStyle = "#edaa27";
  for (const bullet of bullets) ctx.fillRect(bullet.x, bullet.y, 6, 12);
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
  if (event.code === "Space") { event.preventDefault(); firing = true; }
});
window.addEventListener("keyup", (event) => {
  if (event.code === "Space") firing = false;
});
window.addEventListener("blur", () => { firing = false; });
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
