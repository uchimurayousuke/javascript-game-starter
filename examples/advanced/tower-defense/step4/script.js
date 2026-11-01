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

class Tower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.cooldown = 0;
  }

  draw() {
    ctx.fillStyle = "#3f78a9";
    ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
  }

  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }
    for (const enemy of enemies) {
      const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (enemy.alive && distance <= 120) {
        bullets.push(new Bullet(this.x, this.y, enemy));
        this.cooldown = 30;
        return;
      }
    }
  }

}

class Bullet {
  constructor(x, y, target) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.active = true;
  }

  update() {
    if (!this.target.alive) {
      this.active = false;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 8) {
      this.target.hp--;
      if (this.target.hp <= 0) this.target.alive = false;
      this.active = false;
    } else {
      this.x += dx / distance * 8;
      this.y += dy / distance * 8;
    }
  }

  draw() {
    ctx.fillStyle = "#edb73e";
    ctx.fillRect(this.x - 4, this.y - 4, 8, 8);
  }
}

const spots = [{x: 300, y: 250}, {x: 400, y: 150}, {x: 600, y: 200},
  {x: 220, y: 220}, {x: 500, y: 200}];

let enemies, towers, money, bullets;

function start() {
  enemies = [new Enemy()];
  towers = [];
  money = 60;
  bullets = [];
}

function update() {
  for (const enemy of enemies) enemy.update();
  for (const tower of towers) tower.update();
  for (const bullet of bullets) bullet.update();
  bullets = bullets.filter(bullet => bullet.active);
}

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
  for (const spot of spots) {
    ctx.strokeStyle = "#3f78a9";
    ctx.lineWidth = 2;
    ctx.strokeRect(spot.x - 20, spot.y - 20, 40, 40);
  }
  for (const tower of towers) tower.draw();
  for (const enemy of enemies) if (enemy.alive) enemy.draw();
  for (const bullet of bullets) bullet.draw();
  ctx.fillStyle = "#24354a";
  ctx.font = "21px sans-serif";
  ctx.fillText("枠をクリックしてタワーを置く / 所持金: " + money, 70, 45);
}

function pointFromClick(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height
  };
}

canvas.addEventListener("click", (event) => {

  const point = pointFromClick(event);
  for (const spot of spots) {
    if (point.x >= spot.x - 20 && point.x < spot.x + 20 &&
        point.y >= spot.y - 20 && point.y < spot.y + 20) {
      if (towers.some(tower => tower.x === spot.x && tower.y === spot.y)) return;
      if (money < 20) return;
      money -= 20;
      towers.push(new Tower(spot.x, spot.y));
      return;
    }
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
