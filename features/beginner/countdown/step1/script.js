"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let state, startedAt, x;

function start() {
  state = "ready"; startedAt = 0; x = 100;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "30px sans-serif";
  if (state === "ready") ctx.fillText("開始前の画面", 280, 170);
  else if (state === "countdown") ctx.fillText(String(Math.max(1, 3 - Math.floor((performance.now() - startedAt) / 1000))), 390, 170);
  else { ctx.fillText("スタート！", 300, 170); ctx.fillRect(x, 240, 40, 40); }
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
