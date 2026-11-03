"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let startedAt, remaining; let state;

function start() {
  startedAt = performance.now(); remaining = 10; state = "playing";
}

function update() {
  remaining = Math.max(0, 10 - (performance.now() - startedAt) / 1000);
  if (remaining === 0) state = "over";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("残り: " + Math.ceil(remaining) + "秒", 230, 160);
  if (state === "over") ctx.fillText("時間切れ", 230, 220);

}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
