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
    this.units = [new Unit(1, 1, "ally", "healer"), new Unit(1, 3, "ally", "archer"),
      new Unit(4, 1, "enemy", "sword"), new Unit(4, 3, "enemy", "sword")];
    this.selected = null; this.state = "playing"; this.message = "青い味方を選ぼう"; this.healing = false;
  }
  at(x, y) { return this.units.find(u => u.hp > 0 && u.x === x && u.y === y); }
  wall(x, y) { return x < 0 || x >= width || y < 0 || y >= height || (x === 2 && (y === 1 || y === 3)); }
  cost(x, y) { return x === 1 && y === 2 ? 2 : 1; }
  reachable(unit, targetX, targetY) {
    const queue = [{x: unit.x, y: unit.y, cost: 0}], best = new Map();
    const limit = 2;
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
  enemyStep(unit) {
    const queue = [{x: unit.x, y: unit.y, first: null}], visited = new Set();
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i], id = p.x + "," + p.y;
      if (visited.has(id)) continue;
      visited.add(id);
      if (this.units.some(u => u.side === "ally" && u.hp > 0 && Math.abs(u.x - p.x) + Math.abs(u.y - p.y) === 1)) return p.first;
      for (const [dx, dy] of [[-1,0],[0,-1],[0,1],[1,0]]) {
        const x = p.x + dx, y = p.y + dy;
        if (!this.wall(x, y) && !this.at(x, y)) queue.push({x, y, first: p.first || {x, y}});
      }
    }
    return null;
  }
  endTurn() {
    if (this.state !== "playing") return;
    for (const enemy of this.units.filter(u => u.side === "enemy" && u.hp > 0)) {
      const step = this.enemyStep(enemy);
      if (step) { enemy.x = step.x; enemy.y = step.y; }
      const target = this.units.find(u => u.side === "ally" && u.hp > 0 && Math.abs(u.x - enemy.x) + Math.abs(u.y - enemy.y) === 1);
      if (target) target.hp = Math.max(0, target.hp - 2);
    }
    for (const ally of this.units.filter(u => u.side === "ally")) { ally.moved = false; ally.acted = false; }
    this.selected = null; this.healing = false;
    this.message = "味方の番";
    if (this.units.every(u => u.side !== "ally" || u.hp === 0)) { this.state = "over"; this.message = "味方が倒れた"; }
  }
  click(x, y) {
    if (this.state !== "playing" || this.wall(x, y)) return;
    const target = this.at(x, y), unit = this.selected;
    if (this.healing && unit && unit.hp > 0 && !unit.acted && target && target.side === "ally" && target !== unit && Math.abs(unit.x - x) + Math.abs(unit.y - y) === 1) {
      target.hp = Math.min(target.maxHp, target.hp + 2); unit.acted = true; this.healing = false; this.message = "味方を2回復"; return;
    }
    if (target && target.side === "ally") { this.selected = target; this.healing = false; this.message = "味方を選択"; return; }
    if (!unit || unit.hp <= 0) return;
    if (target && target.side === "enemy" && !unit.acted) {
      const distance = Math.abs(unit.x - x) + Math.abs(unit.y - y);
      const range = unit.kind === "archer" ? 2 : 1;
      if (distance <= range) {
        target.hp = Math.max(0, target.hp - 2); unit.acted = true; this.message = "攻撃した";
        if (this.units.every(u => u.side !== "enemy" || u.hp === 0)) { this.state = "clear"; this.message = "勝利！"; }
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
  ctx.fillText("Enter: 敵の番 / R: 再開", 440, 145);
  ctx.fillText("弓:射程2 / 回復役: H→味方", 440, 180);
  ctx.fillText("森は移動力2 / 灰色は壁", 440, 215);
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
  if (key === "enter") game.endTurn();
  if (key === "h" && game.state === "playing" && game.selected && game.selected.kind === "healer" && !game.selected.acted) { game.healing = true; game.message = "隣の味方を選ぶ"; }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
