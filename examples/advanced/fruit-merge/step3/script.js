"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const radii = [18, 24, 31, 39, 48, 60];
const colors = ["#e76c72", "#f3a447", "#f7d65e", "#84b86a", "#75b8dc", "#bb86c8"];
const leftWall = 70, rightWall = 570, floorY = 410, dangerY = 110;
const maxFruits = 40;
const keys = {};
class Fruit {
  constructor(x, y, level) {
    this.x = x; this.y = y; this.level = level;
    this.radius = radii[level]; this.vx = 0; this.vy = 0; this.age = 0;
  }
  draw() {
    ctx.fillStyle = colors[this.level]; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1f3d5b"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(String(this.level + 1), this.x, this.y + 6); ctx.textAlign = "left";
  }
}

class Game {
  constructor() {
    this.fruits = []; this.aim = 320; this.nextLevel = 0; this.cooldown = 0;
    this.score = 0; this.state = "playing"; this.dangerFrames = 0;
  }
  drop() {
    if (this.state !== "playing" || this.cooldown > 0 || this.fruits.length >= maxFruits) return;
    this.fruits.push(new Fruit(this.aim, 75, this.nextLevel));
    this.nextLevel = Math.floor(Math.random() * 2); this.cooldown = 30;
  }
  update() {
    if (this.state !== "playing") return;
    this.aim = Math.max(leftWall + 24, Math.min(rightWall - 24, this.aim + ((keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0)) * 4));
    if (this.cooldown > 0) this.cooldown--;
    for (const fruit of this.fruits) fruit.age++;
    for (let sub = 0; sub < 4; sub++) {
      for (const fruit of this.fruits) {
        fruit.vy = Math.min(9, fruit.vy + 0.22 / 4);
        fruit.x += fruit.vx / 4; fruit.y += fruit.vy / 4;
        if (fruit.x - fruit.radius < leftWall) { fruit.x = leftWall + fruit.radius; fruit.vx = Math.abs(fruit.vx) * 0.25; }
        if (fruit.x + fruit.radius > rightWall) { fruit.x = rightWall - fruit.radius; fruit.vx = -Math.abs(fruit.vx) * 0.25; }
        if (fruit.y + fruit.radius > floorY) { fruit.y = floorY - fruit.radius; fruit.vy = -Math.abs(fruit.vy) * 0.12; fruit.vx *= 0.96; }
      }
      for (let pass = 0; pass < 3; pass++) {
        this.resolvePairs();
        for (const fruit of this.fruits) {
          fruit.x = Math.max(leftWall + fruit.radius, Math.min(rightWall - fruit.radius, fruit.x));
          fruit.y = Math.min(floorY - fruit.radius, fruit.y);
        }
      }
    }
  }
  resolvePairs() {
    const removed = new Set(), added = [];
    for (let i = 0; i < this.fruits.length; i++) {
      const a = this.fruits[i];
      if (removed.has(a)) continue;
      for (let j = i + 1; j < this.fruits.length; j++) {
        const b = this.fruits[j];
        if (removed.has(b)) continue;
        const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy), total = a.radius + b.radius;
        if (distance >= total) continue;
        const nx = distance > 0 ? dx / distance : 1, ny = distance > 0 ? dy / distance : 0;
        const overlap = total - distance;
        a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2; b.y += ny * overlap / 2;
        const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (relative < 0) {
          const impulse = -relative * 0.55;
          a.vx -= impulse * nx; a.vy -= impulse * ny;
          b.vx += impulse * nx; b.vy += impulse * ny;
        }
      }
    }
    if (removed.size) this.fruits = this.fruits.filter(item => !removed.has(item)).concat(added);
  }
  draw() {
    ctx.fillStyle = "#eaf5fb"; ctx.fillRect(leftWall, 45, rightWall - leftWall, floorY - 45);
    ctx.strokeStyle = "#1f3d5b"; ctx.lineWidth = 3; ctx.strokeRect(leftWall, 45, rightWall - leftWall, floorY - 45);
    ctx.fillStyle = "#a53737"; ctx.fillRect(leftWall, dangerY, rightWall - leftWall, 2);
    this.fruits.forEach(fruit => fruit.draw());
    ctx.fillStyle = "#1f3d5b"; ctx.font = "20px sans-serif";
    ctx.fillText("フルーツ合体", 590, 65); ctx.fillText("得点：" + this.score, 590, 100);
    ctx.font = "16px sans-serif";
    ctx.fillText("← →：位置", 590, 150); ctx.fillText("Space：落とす", 590, 178);
    ctx.fillStyle = "#146bb5"; ctx.beginPath(); ctx.arc(this.aim, 50, 5, 0, Math.PI * 2); ctx.fill();
  }
}
let game;

function start() {
  for (const key of Object.keys(keys)) keys[key] = false;
  game = new Game();
}

function update() {
  game.update();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  game.draw();
}

window.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") { keys[event.key] = true; event.preventDefault(); }
  if (event.code === "Space" && !event.repeat) { event.preventDefault(); game.drop(); }
});
window.addEventListener("keyup", event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") keys[event.key] = false; });
window.addEventListener("blur", () => { keys.ArrowLeft = false; keys.ArrowRight = false; });
canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  if (x < leftWall || x > rightWall) return;
  game.aim = Math.max(leftWall + 24, Math.min(rightWall - 24, x)); game.drop();
});
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
