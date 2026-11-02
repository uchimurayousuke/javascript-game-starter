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
function runs(values) {
  const result = []; let count = 0;
  for (const value of [...values, 0]) {
    if (value) count++;
    else if (count) { result.push(count); count = 0; }
  }
  return result.length ? result.join(" ") : "0";
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
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "#26334a";
    ctx.fillText(runs(puzzles[puzzle][i]), 100, oy + i * size + 33);
    ctx.fillStyle = "#26334a";
    ctx.fillText(runs(puzzles[puzzle].map(row => row[i])), ox + i * size + 8, 85);
  }
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    const cell = cells[y][x]; ctx.fillStyle = cell === 1 ? "#3984c6" : "#e8eff2";
    ctx.fillRect(ox + x * size, oy + y * size, size - 2, size - 2);
    if (cell === 1) { ctx.fillStyle = "#ffffff"; ctx.fillText("■", ox + x * size + 17, oy + y * size + 34); }
    if (cell === 2) { ctx.fillStyle = "#26334a"; ctx.fillText("×", ox + x * size + 17, oy + y * size + 34); }
  }
  ctx.fillStyle = "#26334a"; ctx.fillText("クリック: 塗る / 右クリック: ×", 475, 150);
  ctx.fillText("数字は続くマスの数", 475, 190);
}

function changeCell(event, mark) {
  event.preventDefault();
  if (state !== "playing") return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) * canvas.width / rect.width - 180) / 54);
  const y = Math.floor(((event.clientY - rect.top) * canvas.height / rect.height - 110) / 54);
  if (x < 0 || x >= 5 || y < 0 || y >= 5) return;
  cells[y][x] = cells[y][x] === mark ? 0 : mark;
}
canvas.addEventListener("click", event => changeCell(event, 1));
canvas.addEventListener("contextmenu", event => changeCell(event, 2));

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
