"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const path = [{x: 100, y: 300}, {x: 300, y: 300}, {x: 300, y: 100}, {x: 700, y: 100}];

class Enemy {
  constructor() {
    this.x = path[0].x;
    this.y = path[0].y;
    this.nextPoint = 1;
    this.hp = 2;
    this.alive = true;
    this.reached = false;
  }

  update() {
    if (!this.alive) return;
    const target = path[this.nextPoint];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 2) {
      this.x = target.x;
      this.y = target.y;
      this.nextPoint++;
      if (this.nextPoint === path.length) {
        this.reached = true;
        this.alive = false;
      }
    } else {
      this.x += dx / distance * 2;
      this.y += dy / distance * 2;
    }
  }

  draw() {
    ctx.fillStyle = "#db6258";
    ctx.fillRect(this.x - 12, this.y - 12, 24, 24);
  }
}

let enemies;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  enemies = [new Enemy()];
}

// 毎フレーム呼ばれます。
function update() {
  for (const enemy of enemies) enemy.update();
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d9c8a4";
  ctx.fillRect(100, 285, 200, 30);
  ctx.fillRect(285, 100, 30, 200);
  ctx.fillRect(300, 85, 400, 30);
  ctx.fillStyle = "#24354a";
  ctx.font = "18px sans-serif";
  ctx.fillText("入口", 80, 345);
  ctx.fillText("ゴール", 670, 70);
  for (const enemy of enemies) if (enemy.alive) enemy.draw();
  ctx.fillStyle = "#24354a";
  ctx.font = "21px sans-serif";
  ctx.fillText("敵が道の点を順に進みます", 100, 45);
}

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
