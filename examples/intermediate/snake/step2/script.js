"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const cell = 30, boardX = 80, boardY = 70;
let snake, direction, nextDirection, lastMove;

function start() {
  snake = [{x: 4, y: 4}, {x: 3, y: 4}, {x: 2, y: 4}];
  direction = {x: 1, y: 0};
  nextDirection = {x: 1, y: 0};
  lastMove = performance.now();
}

function update() {
  if (performance.now() - lastMove < 200) return;
  lastMove = performance.now();
  direction = nextDirection;
  const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
  if (head.x < 0) head.x = 9;
  if (head.x > 9) head.x = 0;
  if (head.y < 0) head.y = 9;
  if (head.y > 9) head.y = 0;
  snake.unshift(head);
  snake.pop();
}

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
  ctx.fillText("矢印キーで進もう", 430, 150);
  ctx.fillText("端から反対側に出ます", 430, 200);
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.key === "ArrowUp" && direction.y !== 1) nextDirection = {x: 0, y: -1};
  if (event.key === "ArrowDown" && direction.y !== -1) nextDirection = {x: 0, y: 1};
  if (event.key === "ArrowLeft" && direction.x !== 1) nextDirection = {x: -1, y: 0};
  if (event.key === "ArrowRight" && direction.x !== -1) nextDirection = {x: 1, y: 0};
  if (event.key.startsWith("Arrow")) event.preventDefault();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
