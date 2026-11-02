"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

class Player {
  constructor(x, color) { this.x = x; this.y = 225; this.color = color; }
  draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 16, 0, Math.PI * 2); ctx.fill(); }
}
class Ball {
  constructor() { this.x = 400; this.y = 225; this.vx = 0; this.vy = 0; }
  draw() { ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI * 2); ctx.fill(); }
}
class Game {
  constructor() {
    this.player = new Player(200, "#3984c6"); this.rival = new Player(600, "#d85e59");
    this.ball = new Ball(); this.score = 0; this.opponentScore = 0; this.state = "playing"; this.cooldown = 0;
    this.keys = {};
  }
  resetPositions() {
    this.player.x = 200; this.player.y = 225; this.rival.x = 600; this.rival.y = 225; this.ball = new Ball(); this.cooldown = 0;
  }
  kick(player, power) {
    const dx = this.ball.x - player.x, dy = this.ball.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 32) {
      const direction = distance === 0 ? (player === this.player ? 1 : -1) : dx / distance;
      this.ball.vx = direction * power; this.ball.vy = distance === 0 ? 0 : dy / distance * power;
      return true;
    }
    return false;
  }
  update() {
    if (this.state !== "playing") return;
    const p = this.player;
    let dx = (this.keys.ArrowRight ? 1 : 0) - (this.keys.ArrowLeft ? 1 : 0);
    let dy = (this.keys.ArrowDown ? 1 : 0) - (this.keys.ArrowUp ? 1 : 0);
    const length = Math.hypot(dx, dy) || 1; dx /= length; dy /= length;
    const speed = 2.5;
    p.x = Math.max(66, Math.min(734, p.x + dx * speed));
    p.y = Math.max(76, Math.min(374, p.y + dy * speed));
    const r = this.rival, ball = this.ball;
    const rx = ball.x - r.x, ry = ball.y - r.y, distance = Math.hypot(rx, ry) || 1;
    if (distance > 24) { const speed = 0.8; r.x += rx / distance * speed; r.y += ry / distance * speed; }
    if (this.cooldown > 0) this.cooldown--;
    if (distance <= 28 && this.cooldown === 0) {
      ball.vx = -5; ball.vy = (ball.y - r.y) * 0.1; this.cooldown = 50;
    }
    const b = this.ball;
    b.x += b.vx; b.y += b.vy; b.vx *= 0.99; b.vy *= 0.99;
    if (b.y < 68) { b.y = 68; b.vy = Math.abs(b.vy); }
    if (b.y > 382) { b.y = 382; b.vy = -Math.abs(b.vy); }
    const inGoal = b.y - 8 >= 170 && b.y + 8 <= 280;
    if ((b.x + 8 < 50 || b.x - 8 > 750) && inGoal) {
      if (b.x + 8 < 50) this.opponentScore++; else this.score++;
      if (this.score >= 3 || this.opponentScore >= 3) { this.state = this.score >= 3 ? "clear" : "over"; this.keys = {}; }
      this.resetPositions(); return;
    }
    if (!inGoal) {
      if (b.x < 58) { b.x = 58; b.vx = Math.abs(b.vx); }
      if (b.x > 742) { b.x = 742; b.vx = -Math.abs(b.vx); }
    }
  }
}
let game;

function start() {
  game = new Game();
}

function update() {
  game.update();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#6ca96c"; ctx.fillRect(50, 60, 700, 330);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(49, 60, 2, 110); ctx.fillRect(49, 280, 2, 110);
  ctx.fillRect(749, 60, 2, 110); ctx.fillRect(749, 280, 2, 110);
  ctx.strokeStyle = "#26334a"; ctx.lineWidth = 3;
  ctx.strokeRect(30, 170, 20, 110); ctx.strokeRect(750, 170, 20, 110);
  game.player.draw(); game.rival.draw(); game.ball.draw();
  ctx.fillStyle = "#26334a"; ctx.font = "20px sans-serif";
  ctx.fillText("自分 " + game.score + " - " + game.opponentScore + " 相手", 300, 35);
  ctx.fillText("矢印: 移動　Space: シュート　R: 再開", 180, 430);
  if (game.state !== "playing") ctx.fillText(game.state === "clear" ? "勝ち！ Rで再開" : "負け。Rで再開", 320, 220);
}

window.addEventListener("keydown", event => {
  const key = event.key;
  if (!event.repeat && key.toLowerCase() === "r") { start(); return; }
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(key)) event.preventDefault();
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Shift"].includes(key)) game.keys[key] = true;
  if (key === " " && !event.repeat && game.state === "playing") game.kick(game.player, 6);
});
window.addEventListener("keyup", event => {
  game.keys[event.key] = false;
});
window.addEventListener("blur", () => { game.keys = {}; });

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
