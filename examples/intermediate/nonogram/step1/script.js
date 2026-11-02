"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const puzzles = [
  [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]],
  [[1,1,0,1,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]]
];
let puzzle, cells, state;
function resetBoard() {
  cells = Array.from({length: 5}, () => Array(5).fill(0)); state = "playing";
}

function start() {
  puzzle = 0; resetBoard();
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ox = 180, oy = 110, size = 54;
  ctx.font = "20px sans-serif";
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    const cell = cells[y][x]; ctx.fillStyle = cell === 1 ? "#3984c6" : "#e8eff2";
    ctx.fillRect(ox + x * size, oy + y * size, size - 2, size - 2);
    if (cell === 1) { ctx.fillStyle = "#ffffff"; ctx.fillText("■", ox + x * size + 17, oy + y * size + 34); }
    if (cell === 2) { ctx.fillStyle = "#26334a"; ctx.fillText("×", ox + x * size + 17, oy + y * size + 34); }
  }
  ctx.fillStyle = "#26334a"; ctx.fillText("5×5の盤面", 475, 150);
  ctx.fillText("ヒントは次の段階", 475, 190);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
