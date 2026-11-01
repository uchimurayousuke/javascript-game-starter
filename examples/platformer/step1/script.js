"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let player;

class Player {
  constructor() {
    this.x = 80;
    this.y = 350;
    this.width = 30;
    this.height = 40;
  }

  draw() {
    ctx.fillStyle = "#2765b0";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

function start() {
  player = new Player();
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#7cb97a";
  ctx.fillRect(0, 390, 800, 60);
  player.draw();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
