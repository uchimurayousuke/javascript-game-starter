"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let state, gameX, keys;
function startGame() { state = "playing"; gameX = 100; keys = {}; }
function updateGame() {
  gameX += (keys.ArrowRight ? 3 : 0) - (keys.ArrowLeft ? 3 : 0);
  gameX = Math.max(20, Math.min(780, gameX));
}
function drawGame() {
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  ctx.fillText("ゲーム中　←→: 移動 / Esc: 戻る", 130, 140);
  ctx.fillStyle = "#397ab4"; ctx.fillRect(gameX - 20, 230, 40, 40);
}

function start() {
  state = "title"; gameX = 100; keys = {};
}

function update() {
  if (state === "playing") updateGame();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  if (state === "title") ctx.fillText("タイトル　H: 遊び方　Enter: 開始", 130, 140);
  else if (state === "help") { ctx.fillText("遊び方: 左右キーで動く", 130, 140); ctx.fillText("Esc: タイトルへ戻る", 130, 200); }
  else drawGame();
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  if (state === "title" && key === "h") state = "help";
  else if (key === "escape") { state = "title"; keys = {}; }
  else if (state === "title" && key === "enter") startGame();
  else if (state === "playing" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); keys[event.key] = true; }
});
window.addEventListener("keyup", event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") keys[event.key] = false; });
window.addEventListener("blur", () => { keys = {}; });

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
