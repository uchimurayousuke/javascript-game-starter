"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let size, bombCount, cells, state, first, startedAt, stoppedAt, hard;
function newBoard() {
  cells = Array.from({length: size}, () => Array.from({length: size}, () => ({bomb: false, open: false, flag: false, count: 0})));
  state = "playing"; first = true;
  startedAt = null; stoppedAt = null;
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
function placeBombs(x, y) {
  const choices = [];
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
    if (Math.abs(col - x) > 1 || Math.abs(row - y) > 1) choices.push([col, row]);
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  for (const [col, row] of choices.slice(0, bombCount)) cells[row][col].bomb = true;
  counts();
}
function openCell(x, y) {
  const cell = cells[y][x];
  if (cell.open || cell.flag || state !== "playing") return;
  cell.open = true;
  if (cell.bomb) { state = "over"; stoppedAt = performance.now(); return; }
  if (cell.count === 0) for (const [nx, ny] of neighbors(x, y)) openCell(nx, ny);
  if (cells.flat().every(c => c.bomb || c.open)) { state = "clear"; stoppedAt = performance.now(); }
}

function start() {
  hard = false;
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
    if (cell.flag) ctx.fillText("旗", ox + x * cellSize + 9, oy + y * cellSize + 28);
    else if (cell.open) ctx.fillText(cell.bomb ? "爆" : cell.count ? String(cell.count) : "", ox + x * cellSize + 9, oy + y * cellSize + 28);
  }
  ctx.fillStyle = "#26334a";
  ctx.fillText("クリック: 開く / R: 再開", 430, 90);
  ctx.fillText("右クリック: 旗", 430, 125);
  ctx.fillText("D: 難易度 " + (hard ? "8×8 / 10個" : "5×5 / 4個"), 430, 160);
  ctx.fillText("時間: " + (startedAt === null ? 0 : Math.floor(((stoppedAt === null ? performance.now() : stoppedAt) - startedAt) / 1000)) + "秒", 430, 200);
  ctx.fillText("数字をクリック: 旗の数で開く", 430, 240);
  if (state !== "playing") ctx.fillText(state === "clear" ? "クリア！" : "爆弾！", 430, 300);
}

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return {x: Math.floor(((event.clientX - rect.left) * canvas.width / rect.width - 50) / 42), y: Math.floor(((event.clientY - rect.top) * canvas.height / rect.height - 50) / 42)};
}
canvas.addEventListener("click", event => {
  if (state !== "playing") return;
  const {x, y} = point(event);
  if (x < 0 || y < 0 || x >= size || y >= size || cells[y][x].flag) return;
  if (first) { placeBombs(x, y); first = false; startedAt = performance.now(); }
  if (cells[y][x].open && cells[y][x].count > 0) {
    const around = neighbors(x, y);
    if (around.filter(([nx, ny]) => cells[ny][nx].flag).length === cells[y][x].count) {
      for (const [nx, ny] of around) openCell(nx, ny);
    }
    return;
  }
  openCell(x, y);
});
canvas.addEventListener("contextmenu", event => {
  event.preventDefault();
  if (state !== "playing") return;
  const {x, y} = point(event);
  if (x >= 0 && y >= 0 && x < size && y < size && !cells[y][x].open) cells[y][x].flag = !cells[y][x].flag;
});
window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") newBoard();
  else if (event.key.toLowerCase() === "d") { hard = !hard; size = hard ? 8 : 5; bombCount = hard ? 10 : 4; newBoard(); }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
