"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let word;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  word = "a";
}

// 毎フレーム呼ばれます。
function update() {
  // この段階ではまだ入力を調べません。
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("表示された英字を打とう", 210, 130);
  ctx.font = "64px sans-serif";
  ctx.fillText(word, 375, 250);
}

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
