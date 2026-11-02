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
  ctx.fillText("ユニットを表示", 440, 110);
  ctx.fillText("", 440, 145);
  ctx.fillText(game.message, 60, 390);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
