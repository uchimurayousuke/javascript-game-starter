"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const levels = [
  ["#######", "#.....#", "#.bb..#", "#.....#", "#.gg..#", "#.....#", "#######"],
  ["#######", "#.....#", "#..bb.#", "#.....#", "#..gg.#", "#.....#", "#######"]
];
let board, player, state, level, history;
function loadLevel() {
  board = levels[level].map(row => [...row]);
  player = {x: 3, y: 5}; state = "playing";
  history = [];
}

function start() {
  level = 0;
  loadLevel();
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const size = 48, ox = 80, oy = 50;
  for (let y = 0; y < board.length; y++) for (let x = 0; x < board[y].length; x++) {
    const cell = board[y][x];
    ctx.fillStyle = cell === "#" ? "#566375" : "#e9f1e6";
    ctx.fillRect(ox + x * size, oy + y * size, size - 2, size - 2);
    if (cell === "g" || cell === "B") { ctx.fillStyle = "#f6cc50"; ctx.fillRect(ox + x * size + 12, oy + y * size + 12, 24, 24); }
    if (cell === "b" || cell === "B") {
      ctx.fillStyle = cell === "B" ? "#5d8a54" : "#a76c3f"; ctx.fillRect(ox + x * size + 6, oy + y * size + 6, 36, 36);
      if (cell === "B") { ctx.fillStyle = "#ffffff"; ctx.fillRect(ox + x * size + 20, oy + y * size + 20, 8, 8); }
    }
  }
  ctx.fillStyle = "#3074bb"; ctx.fillRect(ox + player.x * size + 8, oy + player.y * size + 8, 32, 32);
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText("矢印: 移動 / R: 再開", 440, 100);
  ctx.fillText("U: 1手戻す", 440, 140);
  if (state === "clear") ctx.fillText("クリア！ 箱を全部置いた", 440, 240);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  if (key === "u" && history.length > 0) {
    const saved = history.pop(); board = saved.board.map(row => [...row]); player = {...saved.player}; state = "playing"; return;
  }
  if (state !== "playing") return;
  const moves = {arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1]};
  if (!moves[key]) return;
  event.preventDefault();
  const [dx, dy] = moves[key], nx = player.x + dx, ny = player.y + dy;
  const cell = board[ny][nx];
  if (cell === "#") return;
  if (cell === "b" || cell === "B") {
    const next = board[ny + dy][nx + dx];
    if (next !== "." && next !== "g") return;
    history.push({board: board.map(row => [...row]), player: {...player}});
    board[ny + dy][nx + dx] = next === "g" ? "B" : "b";
    board[ny][nx] = cell === "B" ? "g" : ".";
  } else history.push({board: board.map(row => [...row]), player: {...player}});
  player = {x: nx, y: ny};
  if (!board.some(row => row.includes("b"))) state = "clear";
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
