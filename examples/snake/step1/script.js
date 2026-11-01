"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const cell = 30, boardX = 80, boardY = 70;
let snake;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  snake = [{x: 4, y: 4}, {x: 3, y: 4}, {x: 2, y: 4}];
}

// 毎フレーム呼ばれます。
function update() {
  // この段階ではまだ動かしません。
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#c6d2df";
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      ctx.strokeRect(boardX + col * cell, boardY + row * cell, cell, cell);
    }
  }
  ctx.fillStyle = "#2d8c58";
  for (const part of snake) {
    ctx.fillRect(boardX + part.x * cell + 1, boardY + part.y * cell + 1, cell - 2, cell - 2);
  }
  ctx.fillStyle = "#145a38";
  ctx.fillRect(boardX + snake[0].x * cell + 1, boardY + snake[0].y * cell + 1, cell - 2, cell - 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(boardX + snake[0].x * cell + 8, boardY + snake[0].y * cell + 9, 4, 4);
  ctx.fillRect(boardX + snake[0].x * cell + 18, boardY + snake[0].y * cell + 9, 4, 4);
  ctx.fillStyle = "#26334a";
  ctx.font = "24px sans-serif";
  ctx.fillText("濃い緑が頭", 430, 300);
  ctx.fillText("緑のマスがヘビ", 430, 150);
}

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
