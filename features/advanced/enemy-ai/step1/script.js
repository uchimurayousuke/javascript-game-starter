"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

class Enemy {
  constructor() { this.x = 160; this.direction = 1; this.state = "巡回"; }
  update(playerX) {
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
  enemy.update(playerX);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("敵: " + enemy.state, 180, 100);
  ctx.fillStyle = "#d85e59"; ctx.fillRect(enemy.x - 15, 200, 30, 30);
  ctx.fillStyle = "#3984c6"; ctx.fillRect(playerX - 15, 200, 30, 30);
  ctx.fillStyle = "#26334a"; ctx.fillText("敵が巡回", 150, 320);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
