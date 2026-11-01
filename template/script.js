"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

function start() {
}

function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
