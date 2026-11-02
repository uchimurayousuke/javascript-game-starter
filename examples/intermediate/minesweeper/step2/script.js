"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let size, bombCount, cells, state, first;
function newBoard() {
  cells = Array.from({length: size}, () => Array.from({length: size}, () => ({bomb: false, open: false, flag: false, count: 0})));
  state = "playing"; first = true;
}
function neighbors(x, y) {
  const result = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if ((dx || dy) && nx >= 0 && nx < size && ny >= 0 && ny < size) result.push([nx, ny]);
  }
  return result;
}
function counts() {
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    cells[y][x].count = neighbors(x, y).filter(([nx, ny]) => cells[ny][nx].bomb).length;
  }
}

function start() {
  size = 5; bombCount = 4; newBoard();
  for (const [x, y] of [[0, 0], [4, 0], [0, 4], [4, 4]]) cells[y][x].bomb = true;
  counts();
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
    ctx.fillText(cell.bomb ? "爆" : String(cell.count), ox + x * cellSize + 9, oy + y * cellSize + 28);
  }
  ctx.fillStyle = "#26334a";
  ctx.fillText("数字は周囲の爆弾", 430, 90);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
