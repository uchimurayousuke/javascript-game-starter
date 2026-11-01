"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  // ここに初期設定を書く
}

// 毎フレーム呼ばれます。
function update() {
  // ここにキャラクターの移動や当たり判定などを書く
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ここに ctx.fillRect() などを使った描画を書く
}

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
