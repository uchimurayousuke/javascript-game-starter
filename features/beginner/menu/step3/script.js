"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let state, selected, gameX, keys;
function startGame() { state = "game"; gameX = 100; keys = {}; }
function updateGame() {
  gameX += (keys.ArrowRight ? 3 : 0) - (keys.ArrowLeft ? 3 : 0);
  gameX = Math.max(20, Math.min(780, gameX));
}
function drawGame() {
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  ctx.fillText("ゲーム中　←→: 移動 / Esc: 戻る", 160, 150);
  ctx.fillStyle = "#397ab4"; ctx.fillRect(gameX - 20, 230, 40, 40);
}

function start() {
  state = "menu"; selected = 0; gameX = 100; keys = {};
}

function update() {
  if (state === "game") updateGame();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "30px sans-serif";
  if (state === "menu") {
    ctx.fillText("ゲームメニュー", 260, 100);
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = selected === i ? "#f8dc8b" : "#dce8ef";
      ctx.fillRect(250, 150 + i * 80, 300, 60);
      ctx.fillStyle = "#26334a"; ctx.fillText(i === 0 ? "はじめる" : "遊び方", 320, 190 + i * 80);
    }
    ctx.fillText(selected === 0 ? "選択中: はじめる" : "選択中: 遊び方", 260, 350);
    ctx.font = "22px sans-serif"; ctx.fillText("↑↓で選択 / Enter・クリックで決定", 180, 410);
  } else if (state === "game") drawGame();
  else ctx.fillText("遊び方　Esc: メニューへ", 160, 200);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (state === "menu") {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); selected = 1 - selected; }
    else if (event.key === "Enter") { if (selected === 0) startGame(); else state = "help"; }
  } else if (event.key === "Escape") { state = "menu"; keys = {}; }
  else if (state === "game" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); keys[event.key] = true; }
});
window.addEventListener("keyup", event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") keys[event.key] = false; });
window.addEventListener("blur", () => { keys = {}; });
canvas.addEventListener("click", event => {
  if (state !== "menu") return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  if (x >= 250 && x < 550 && y >= 150 && y < 290) {
    const i = Math.floor((y - 150) / 80);
    if (y < 210 + i * 80) { selected = i; if (i === 0) startGame(); else state = "help"; }
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
