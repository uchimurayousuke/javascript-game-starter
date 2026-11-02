"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const width = 6, height = 5;
class Unit {
  constructor(x, y, side, kind) {
    this.x = x; this.y = y; this.side = side; this.kind = kind; this.hp = 6; this.maxHp = 6;
    this.moved = false; this.acted = false;
  }
  draw() {
    ctx.fillStyle = this.side === "ally" ? "#3984c6" : "#d85e59";
    ctx.fillRect(60 + this.x * 60 + 8, 45 + this.y * 60 + 8, 44, 44);
    ctx.fillStyle = "#ffffff"; ctx.font = "16px sans-serif";
    ctx.fillText(String(this.hp), 60 + this.x * 60 + 24, 45 + this.y * 60 + 36);
    if (this.side === "ally" && this.kind !== "sword") ctx.fillText(this.kind === "archer" ? "弓" : "回", 60 + this.x * 60 + 8, 45 + this.y * 60 + 22);
  }
}
class Game {
  constructor() {
    this.units = [new Unit(1, 1, "ally", "sword"), new Unit(1, 3, "ally", "sword"),
      new Unit(4, 1, "enemy", "sword"), new Unit(4, 3, "enemy", "sword")];
    this.selected = null; this.state = "playing"; this.message = "青い味方を選ぼう";
  }
  at(x, y) { return this.units.find(u => u.hp > 0 && u.x === x && u.y === y); }
  wall(x, y) { return x < 0 || x >= width || y < 0 || y >= height; }
  cost(x, y) { return 1; }
  reachable(unit, targetX, targetY) {
    const queue = [{x: unit.x, y: unit.y, cost: 0}], best = new Map();
    const limit = 1;
    while (queue.length) {
      queue.sort((a, b) => a.cost - b.cost);
      const p = queue.shift(), id = p.x + "," + p.y;
      if (best.has(id) && best.get(id) <= p.cost) continue;
      best.set(id, p.cost);
      if (p.x === targetX && p.y === targetY) return p.cost > 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const x = p.x + dx, y = p.y + dy, cost = p.cost + this.cost(x, y);
        if (cost <= limit && !this.wall(x, y) && !this.at(x, y)) queue.push({x, y, cost});
      }
    }
    return false;
  }
  click(x, y) {
    if (this.state !== "playing" || this.wall(x, y)) return;
    const target = this.at(x, y), unit = this.selected;
    if (target && target.side === "ally") { this.selected = target; this.message = "味方を選択"; return; }
    if (!unit || unit.hp <= 0) return;
    if (target && target.side === "enemy" && !unit.acted) {
      const distance = Math.abs(unit.x - x) + Math.abs(unit.y - y);
      const range = 1;
      if (distance <= range) {
        target.hp = Math.max(0, target.hp - 2); unit.acted = true; this.message = "攻撃した";
      }
      return;
    }
    if (!target && !unit.moved && this.reachable(unit, x, y)) {
      unit.x = x; unit.y = y; unit.moved = true; this.message = "移動した";
    }
  }
}
let game;

function start() {
  game = new Game();
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    ctx.fillStyle = game.wall(x, y) ? "#65717e" : game.cost(x, y) === 2 ? "#8bb56e" : "#e7eedf";
    ctx.fillRect(60 + x * 60, 45 + y * 60, 58, 58);
  }
  for (const unit of game.units) if (unit.hp > 0) unit.draw();
  if (game.selected && game.selected.hp > 0) { ctx.strokeStyle = "#edb73e"; ctx.lineWidth = 4; ctx.strokeRect(60 + game.selected.x * 60 + 4, 45 + game.selected.y * 60 + 4, 52, 52); }
  ctx.fillStyle = "#26334a"; ctx.font = "19px sans-serif";
  ctx.fillText("青: 味方 / 赤: 敵 / 数字: HP", 440, 75);
  ctx.fillText("クリック: 選択・移動・攻撃", 440, 110);
  ctx.fillText("R: 再開", 440, 145);
  if (game.selected) ctx.fillText("移動 " + (game.selected.moved ? "済" : "可") + " / 行動 " + (game.selected.acted ? "済" : "可"), 440, 250);
  ctx.fillText(game.message, 60, 390);
}

canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) * canvas.width / rect.width - 60) / 60);
  const y = Math.floor(((event.clientY - rect.top) * canvas.height / rect.height - 45) / 60);
  game.click(x, y);
});
window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
