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
  draw() {
    ctx.fillStyle = "#eaf5fb"; ctx.fillRect(leftWall, 45, rightWall - leftWall, floorY - 45);
    ctx.strokeStyle = "#1f3d5b"; ctx.lineWidth = 3; ctx.strokeRect(leftWall, 45, rightWall - leftWall, floorY - 45);
    ctx.fillStyle = "#a53737"; ctx.fillRect(leftWall, dangerY, rightWall - leftWall, 2);
    this.fruits.forEach(fruit => fruit.draw());
    ctx.fillStyle = "#1f3d5b"; ctx.font = "20px sans-serif";
    ctx.fillText("フルーツ合体", 590, 65); ctx.fillText("得点：" + this.score, 590, 100);
    ctx.font = "16px sans-serif";
  }
}
let game;

function start() {
  for (const key of Object.keys(keys)) keys[key] = false;
  game = new Game();
  game.fruits.push(new Fruit(240, 250, 0), new Fruit(330, 250, 1));
}

function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  game.draw();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
