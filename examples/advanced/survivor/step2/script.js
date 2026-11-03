"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const keys = {};
let focused = true;
const limitEnemies = 60, limitBullets = 100, limitGems = 80;
class Enemy {
  constructor(x, y) {
    this.x = x; this.y = y; this.radius = 14; this.hp = 2; this.speed = 48;
  }
}
class Bullet {
  constructor(x, y, vx, vy) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = 2; }
}
class Gem {
  constructor(x, y) { this.x = x; this.y = y; }
}
class Game {
  constructor() {
    this.player = {x:400, y:225, radius:15, hp:5, speed:160, invincible:0};
    this.enemies = []; this.bullets = []; this.gems = [];
    this.spawnTimer = 0; this.shotTimer = 0; this.elapsed = 0; this.last = performance.now();
    this.level = 1; this.xp = 0; this.damage = 1; this.interval = 0.6; this.state = "playing";
  }
  spawn() {
    if (this.enemies.length >= limitEnemies) return;
    const edge = Math.floor(Math.random() * 4);
    const x = edge === 0 ? 10 : edge === 1 ? 790 : 20 + Math.random() * 760;
    const y = edge === 2 ? 10 : edge === 3 ? 440 : 20 + Math.random() * 410;
    this.enemies.push(new Enemy(x, y));
  }
  update() {
    const now = performance.now(), elapsed = Math.max(0, (now - this.last) / 1000);
    this.last = now;
    if (this.state !== "playing" || !focused || document.hidden) return;
    const dt = Math.min(elapsed, 0.05);
    const dx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
    const dy = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
    const length = Math.hypot(dx, dy) || 1;
    this.player.x = Math.max(15, Math.min(785, this.player.x + dx / length * this.player.speed * dt));
    this.player.y = Math.max(15, Math.min(435, this.player.y + dy / length * this.player.speed * dt));
    this.player.invincible = Math.max(0, this.player.invincible - dt);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) { this.spawn(); this.spawnTimer = 1; }
    for (const enemy of this.enemies) {
      const ex = this.player.x - enemy.x, ey = this.player.y - enemy.y, distance = Math.hypot(ex, ey);
      if (distance > 0) { enemy.x += ex / distance * enemy.speed * dt; enemy.y += ey / distance * enemy.speed * dt; }
      if (distance <= enemy.radius + this.player.radius && this.player.invincible <= 0) {
        this.player.hp--; this.player.invincible = 1;
        if (this.player.hp <= 0) { this.state = "over"; return; }
      }
    }
  }
  draw() {
    ctx.fillStyle = "#eaf5e6"; ctx.fillRect(0, 0, 800, 450);
    ctx.fillStyle = "#146bb5"; ctx.beginPath(); ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e45f6a"; for (const enemy of this.enemies) { ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2); ctx.fill(); }

    ctx.fillStyle = "#f2a900"; for (const bullet of this.bullets) { ctx.beginPath(); ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#56aa74"; for (const gem of this.gems) ctx.fillRect(gem.x - 5, gem.y - 5, 10, 10);
    ctx.fillStyle = "#1f3d5b"; ctx.font = "18px sans-serif";
    ctx.fillText("体力 " + this.player.hp + "　レベル " + this.level + "　経験 " + this.xp + " / " + (this.level * 3), 18, 28);
    ctx.fillText("矢印キー / WASD：移動", 18, 435);
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
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d"].includes(key)) { keys[key] = true; if (key.startsWith("Arrow")) event.preventDefault(); }
});
window.addEventListener("keyup", event => { const key = event.key.length === 1 ? event.key.toLowerCase() : event.key; keys[key] = false; });
window.addEventListener("blur", () => { focused = false; for (const key of Object.keys(keys)) keys[key] = false; game.last = performance.now(); });
window.addEventListener("focus", () => { focused = true; game.last = performance.now(); });
document.addEventListener("visibilitychange", () => { for (const key of Object.keys(keys)) keys[key] = false; game.last = performance.now(); });
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
