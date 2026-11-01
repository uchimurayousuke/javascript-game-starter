"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let markerX, speed;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  markerX = 80;
  speed = 4;
}

// 毎フレーム呼ばれます。
function update() {
  markerX += speed;
  if (markerX >= 720 || markerX <= 80) {
    speed = -speed;
  }
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d9e8f9";
  ctx.fillRect(80, 200, 640, 24);
  ctx.fillStyle = "#50a76b";
  ctx.fillRect(300, 200, 200, 24);
  ctx.fillStyle = "#204a84";
  ctx.fillRect(markerX - 5, 180, 10, 64);
  ctx.fillStyle = "#26334a";
  ctx.font = "24px sans-serif";
  ctx.fillText("青い線が左右に動きます", 220, 120);
}

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
