"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

class Enemy {
  constructor() { this.x = 160; this.direction = 1; this.state = "巡回"; }
  update(playerX) {
    if (Math.abs(playerX - this.x) <= 100) {
      this.state = "追跡";
      const difference = playerX - this.x;
      this.x += Math.sign(difference) * Math.min(2, Math.abs(difference));
      return;
    }
    this.state = "巡回";
    if (this.x > 320) { this.x = Math.max(320, this.x - 2); this.direction = -1; return; }
    if (this.x < 160) { this.x = Math.min(160, this.x + 2); this.direction = 1; return; }
    this.x += this.direction * 2;
    if (this.x >= 320) { this.x = 320; this.direction = -1; }
    if (this.x <= 160) { this.x = 160; this.direction = 1; }
  }
}
let enemy, playerX, left, right;

function start() {
  enemy = new Enemy(); playerX = 480; left = false; right = false;
}

function update() {
  playerX = Math.max(20, Math.min(780, playerX + (Number(right) - Number(left)) * 3));
  enemy.update(playerX);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("敵: " + enemy.state, 180, 100);
  ctx.fillStyle = "#d85e59"; ctx.fillRect(enemy.x - 15, 200, 30, 30);
  ctx.fillStyle = "#3984c6"; ctx.fillRect(playerX - 15, 200, 30, 30);
  ctx.fillStyle = "#26334a"; ctx.fillText("左右: 移動　R: 最初から", 150, 320);
}

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault();
  if (event.repeat) return;
  if (event.key === "ArrowLeft") { left = true; }
  if (event.key === "ArrowRight") { right = true; }
  if (event.key.toLowerCase() === "r") start();
});
window.addEventListener("keyup", event => {
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
