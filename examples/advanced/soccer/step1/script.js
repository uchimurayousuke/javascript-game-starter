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
}
let game;

function start() {
  game = new Game();
}

function update() {

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
  ctx.fillText("ピッチと選手", 180, 430);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
