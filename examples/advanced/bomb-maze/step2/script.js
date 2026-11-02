"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

class Player {
  constructor() { this.x = 1; this.y = 1; }
}
class Bomb {
  constructor(x, y, now) { this.x = x; this.y = y; this.due = now + 2000; }
}
class Enemy {
  constructor() { this.x = 4; this.y = 1; this.alive = true; this.direction = 1; this.nextMove = performance.now() + 500; }
}
class Game {
  constructor() {
    this.player = new Player(); this.enemy = new Enemy(); this.boxes = new Set(["3,1"]);
    this.bombs = []; this.flames = []; this.state = "playing"; this.message = "出口を目指そう";
  }
  wall(x, y) { return x <= 0 || x >= 8 || y <= 0 || y >= 6 || (x === 3 && y === 2); }
  key(x, y) { return x + "," + y; }
  move(dx, dy) {
    if (this.state !== "playing") return;
    const x = this.player.x + dx, y = this.player.y + dy;
    if (this.wall(x, y) || this.boxes.has(this.key(x, y)) || this.bombs.some(b => b.x === x && b.y === y)) return;
    this.player.x = x; this.player.y = y;
  }
  plant() {
    if (this.state !== "playing" || this.bombs.length >= 1 || this.bombs.some(b => b.x === this.player.x && b.y === this.player.y)) return;
    this.bombs.push(new Bomb(this.player.x, this.player.y, performance.now()));
  }
  update() {
    if (this.state !== "playing") return;
    const now = performance.now();
    const due = this.bombs.filter(b => now >= b.due).sort((a, b) => a.due - b.due);
    this.bombs = this.bombs.filter(b => now < b.due);
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
  ctx.font = "20px sans-serif";
  for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) {
    ctx.fillStyle = game.wall(x, y) ? "#62717b" : "#e2edd8"; ctx.fillRect(60 + x * 45, 50 + y * 45, 43, 43);
    if (game.boxes.has(game.key(x, y))) { ctx.fillStyle = "#aa7048"; ctx.fillRect(66 + x * 45, 56 + y * 45, 31, 31); ctx.fillStyle = "#ffffff"; ctx.fillText("箱", 71 + x * 45, 79 + y * 45); }
  }
  if (game.player.x !== 7 || game.player.y !== 5) { ctx.fillStyle = "#26334a"; ctx.fillText("出口", 60 + 7 * 45, 50 + 5 * 45 + 28); }
  for (const b of game.bombs) { ctx.fillStyle = "#26334a"; ctx.fillRect(67 + b.x * 45, 57 + b.y * 45, 29, 29); ctx.fillStyle = "#ffffff"; ctx.fillText("B", 75 + b.x * 45, 79 + b.y * 45); }
  ctx.fillStyle = "#397ab4"; ctx.fillRect(66 + game.player.x * 45, 56 + game.player.y * 45, 31, 31);
  ctx.fillStyle = "#ffffff"; ctx.fillText("自", 71 + game.player.x * 45, 79 + game.player.y * 45);
  ctx.fillStyle = "#26334a"; ctx.fillText("矢印: 移動 / R: 再開", 480, 100);
  ctx.fillText("B: 爆弾（2秒後）", 480, 140);
  ctx.fillText(game.message, 480, 340);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  game.update();
  const directions = {arrowleft: [-1,0], arrowright: [1,0], arrowup: [0,-1], arrowdown: [0,1]};
  if (directions[key]) { event.preventDefault(); game.move(...directions[key]); }
  else if (key === "b") game.plant();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
