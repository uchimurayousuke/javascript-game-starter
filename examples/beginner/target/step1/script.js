"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let targetX, targetY;
const radius = 35;

function start() {
  targetX = 400;
  targetY = 225;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e34b5f";
  ctx.beginPath();
  ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
  ctx.fill();
}


function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
start();
gameLoop();
