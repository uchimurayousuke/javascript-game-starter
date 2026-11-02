"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let size, bombCount, cells, state, first;
function newBoard() {
  cells = Array.from({length: size}, () => Array.from({length: size}, () => ({bomb: false, open: false, flag: false, count: 0})));
  state = "playing"; first = true;
}

function start() {
  size = 5; bombCount = 4; newBoard();
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ox = 50, oy = 50, cellSize = 42;
  ctx.font = "22px sans-serif";
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const cell = cells[y][x];
    ctx.fillStyle = cell.open ? "#e5f0df" : "#b7cbd4";
    ctx.fillRect(ox + x * cellSize, oy + y * cellSize, 40, 40);
    ctx.fillStyle = "#26334a";
  }
  ctx.fillStyle = "#26334a";
  ctx.fillText("盤面を表示", 430, 90);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
