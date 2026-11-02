"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

class Player {
  constructor() { this.x = 1; this.y = 1; this.dx = 1; this.dy = 0; this.hp = 10; this.maxHp = 10; }
}
class NPC {
  constructor(x, y, name) { this.x = x; this.y = y; this.name = name; }
  draw() {
    ctx.fillStyle = "#d2985f"; ctx.fillRect(60 + this.x * 60 + 8, 40 + this.y * 60 + 8, 44, 44);
    ctx.fillStyle = "#26334a"; ctx.font = "18px sans-serif"; ctx.fillText("人", 60 + this.x * 60 + 20, 40 + this.y * 60 + 37);
  }
}
class Game {
  constructor() {
    this.player = new Player(); this.npc = new NPC(2, 1, "住人");
    this.quest = 0; this.hasItem = false; this.key = false; this.state = "playing";
    this.message = "住人に話しかけよう";
  }
  blocked(x, y) {
    if (x <= 0 || y <= 0 || x >= 6 || y >= 4) return true;
    if ((x === 2 && y === 1) || (x === 5 && y === 1 && !this.hasItem && !this.key) || (x === 5 && y === 3)) return true;
    return false;
  }
  move(dx, dy) {
    if (this.state !== "playing") return;
    const p = this.player; p.dx = dx; p.dy = dy;
    if (!this.blocked(p.x + dx, p.y + dy)) { p.x += dx; p.y += dy; }
  }
  interact() {
    const x = this.player.x + this.player.dx, y = this.player.y + this.player.dy;
    if (x === this.npc.x && y === this.npc.y) {
      this.message = "住人: 宝を探してくれませんか？";
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
  const p = game.player;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) {
    ctx.fillStyle = x === 0 || y === 0 || x === 6 || y === 4 ? "#66727c" : "#dcecca";
    ctx.fillRect(60 + x * 60, 40 + y * 60, 58, 58);
  }
  game.npc.draw();
  if (!game.hasItem && !game.key) {
    ctx.fillStyle = "#e7bd40"; ctx.fillRect(60 + 5 * 60 + 12, 40 + 60 + 12, 36, 36);
    ctx.fillStyle = "#26334a"; ctx.font = "18px sans-serif"; ctx.fillText("宝", 60 + 5 * 60 + 20, 40 + 60 + 37);
  }
  ctx.fillStyle = "#76583c"; ctx.fillRect(60 + 5 * 60 + 8, 40 + 3 * 60 + 5, 44, 48);
  ctx.fillStyle = "#ffffff"; ctx.font = "18px sans-serif"; ctx.fillText("扉", 60 + 5 * 60 + 20, 40 + 3 * 60 + 37);
  ctx.fillStyle = "#3475b4"; ctx.fillRect(60 + p.x * 60 + 8, 40 + p.y * 60 + 8, 44, 44);
  ctx.fillStyle = "#26334a"; ctx.font = "20px sans-serif";
  ctx.fillText("青: 自分 / 茶: 住人 / 黄: 宝", 500, 65);
  ctx.fillText("矢印: 移動 / Space: 調べる", 500, 100);
  ctx.fillText("HP " + p.hp + " / " + p.maxHp, 500, 135);
  ctx.fillText(game.message, 60, 390);
  if (game.state === "clear") ctx.fillText("クリア！ Rで再開", 500, 330);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  const directions = {arrowleft: [-1,0], arrowright: [1,0], arrowup: [0,-1], arrowdown: [0,1]};
  if (directions[key]) { event.preventDefault(); game.move(...directions[key]); }
  else if (key === " " && game.state === "playing") { event.preventDefault(); game.interact(); }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
