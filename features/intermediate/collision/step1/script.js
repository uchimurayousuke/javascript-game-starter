"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const box = {x: 400, y: 150, width: 160, height: 150};
const radius = 30;
let x, y;

function start() {
  x = 180; y = 225;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#dce8ef"; ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.fillStyle = "#397ab4"; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText("円の中心: (" + x + ", " + y + ") / 半径 " + radius, 60, 60);

}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
