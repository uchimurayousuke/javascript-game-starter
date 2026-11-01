"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let markerX;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  markerX = 80;
}

// 毎フレーム呼ばれます。
function update() {
  // この段階ではまだ動かしません。
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
  ctx.fillText("青い線を緑の中で止めよう", 190, 120);
}

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
