"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let scene, items, message;

function start() {
  scene = "start"; items = []; message = "";
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "26px sans-serif";
  if (scene === "start") {
    ctx.fillText("森の入口に立っています。", 70, 90);
  }
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
