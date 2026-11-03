"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const keys = {};
let focused = true;
const limitEnemies = 60, limitBullets = 100, limitGems = 80;
class Enemy {
  constructor(x, y, kind = "normal") {
    this.x = x; this.y = y; this.kind = kind; this.radius = kind === "boss" ? 28 : 14; this.hp = kind === "boss" ? 12 : kind === "fast" ? 1 : 2; this.speed = kind === "boss" ? 35 : kind === "fast" ? 78 : 48;
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
    this.enemies.push(new Enemy(x, y, Math.random() < 0.35 ? "fast" : "normal"));
  }
  shoot() {
    if (!this.enemies.length || this.bullets.length >= limitBullets) return;
    let target = this.enemies[0], best = Infinity;
    for (const enemy of this.enemies) {
      const distance = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (distance < best) { best = distance; target = enemy; }
    }
    const dx = target.x - this.player.x, dy = target.y - this.player.y, distance = Math.hypot(dx, dy);
    const angle = distance > 0 ? Math.atan2(dy, dx) : 0;
    for (const offset of [-0.25, 0, 0.25]) {
      if (this.bullets.length < limitBullets) this.bullets.push(new Bullet(this.player.x, this.player.y, Math.cos(angle + offset) * 300, Math.sin(angle + offset) * 300));
    }
  }
  update() {
    const now = performance.now(), elapsed = Math.max(0, (now - this.last) / 1000);
    this.last = now;
    if (this.state !== "playing" || !focused || document.hidden) return;
    const dt = Math.min(elapsed, 0.05);
    this.elapsed += dt;
    if (this.elapsed >= 60) { this.elapsed = 60; this.state = "clear"; return; }
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
    this.shotTimer -= dt;
    if (this.shotTimer <= 0) { this.shoot(); this.shotTimer = this.interval; }
    const deadEnemies = new Set(), deadBullets = new Set();
    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      if (bullet.life <= 0 || bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 450) { deadBullets.add(bullet); continue; }
      for (const enemy of this.enemies) {
        if (deadEnemies.has(enemy) || Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) > enemy.radius + 4) continue;
        enemy.hp -= this.damage; deadBullets.add(bullet);
        if (enemy.hp <= 0) {
          deadEnemies.add(enemy);
          if (this.gems.length < limitGems) this.gems.push(new Gem(enemy.x, enemy.y));
        }
        break;
      }
    }
    this.bullets = this.bullets.filter(bullet => !deadBullets.has(bullet));
    this.enemies = this.enemies.filter(enemy => !deadEnemies.has(enemy));
    this.gems = this.gems.filter(gem => {
      if (Math.hypot(gem.x - this.player.x, gem.y - this.player.y) > 20) return true;
      this.xp++; return false;
    });
    if (this.xp >= this.level * 3) { this.xp -= this.level * 3; this.level++; this.state = "choice"; }
  }
  choose(number) {
    if (this.state !== "choice") return;
    if (number === "1") this.damage++;
    else if (number === "2") this.interval = Math.max(0.2, this.interval - 0.1);
    else if (number === "3") this.player.hp = Math.min(5, this.player.hp + 1);
    else return;
    this.state = "playing"; this.last = performance.now();
  }
  draw() {
    ctx.fillStyle = "#eaf5e6"; ctx.fillRect(0, 0, 800, 450);
    ctx.fillStyle = "#146bb5"; ctx.beginPath(); ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2); ctx.fill();
    for (const enemy of this.enemies) { ctx.fillStyle = enemy.kind === "boss" ? "#8b5ab4" : enemy.kind === "fast" ? "#da8518" : "#e45f6a"; ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2); ctx.fill(); }

    ctx.fillStyle = "#f2a900"; for (const bullet of this.bullets) { ctx.beginPath(); ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#56aa74"; for (const gem of this.gems) ctx.fillRect(gem.x - 5, gem.y - 5, 10, 10);
    ctx.fillStyle = "#1f3d5b"; ctx.font = "18px sans-serif";
    ctx.fillText("体力 " + this.player.hp + "　レベル " + this.level + "　経験 " + this.xp + " / " + (this.level * 3), 18, 28);
    ctx.fillText("生存 " + Math.floor(this.elapsed) + " / 60秒", 18, 54);
    ctx.fillText("矢印キー / WASD：移動", 18, 435);
    if (this.state === "choice") { ctx.fillStyle = "#fff8e8"; ctx.fillRect(170, 140, 460, 150); ctx.fillStyle = "#1f3d5b"; ctx.fillText("レベルアップ！ 1：攻撃  2：速さ  3：回復", 190, 210); }
    if (this.state === "clear" || this.state === "over") { ctx.fillStyle = "#fff8e8"; ctx.fillRect(200, 155, 400, 125); ctx.fillStyle = "#1f3d5b"; ctx.fillText(this.state === "clear" ? "60秒生き残った！" : "体力がなくなった", 240, 205); ctx.fillText("Spaceで再挑戦", 240, 245); }
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
  if (!event.repeat && game.state === "choice") game.choose(key);
  if (!event.repeat && (game.state === "over" || game.state === "clear") && event.code === "Space") { event.preventDefault(); start(); }
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
