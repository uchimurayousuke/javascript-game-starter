"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let lives, state;

function start() {
  lives = 3; state = "playing";
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("残り: " + lives, 250, 150);
  if (state === "over") ctx.fillText("ゲームオーバー", 250, 220);
  ctx.fillText("X: 失敗　H: 回復　R: 最初から", 170, 300);
}

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.repeat) return;
  if (event.key.toLowerCase() === "x" && state === "playing") {
    lives = Math.max(0, lives - 1);
    if (lives === 0) state = "over";
  }
  if (event.key.toLowerCase() === "r") start();
  if (event.key.toLowerCase() === "h" && state === "playing") lives = Math.min(3, lives + 1);
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
