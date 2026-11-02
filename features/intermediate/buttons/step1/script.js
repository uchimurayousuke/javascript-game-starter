"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

canvas.style.touchAction = "none";
let enabled, hover, pressed, count;

function start() {
  enabled = true; hover = false; pressed = null; count = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = !enabled ? "#c6cbd0" : pressed !== null ? "#d89c45" : hover ? "#f8dc8b" : "#dce8ef";
  ctx.fillRect(280, 160, 240, 70);
  ctx.fillStyle = "#26334a"; ctx.font = "26px sans-serif";
  ctx.fillText(enabled ? "押す" : "無効", 370, 205);
  ctx.fillText("回数: " + count, 100, 100);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
