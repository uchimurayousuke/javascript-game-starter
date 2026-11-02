"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let state;

function start() {
  state = "title";
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  if (state === "title") ctx.fillText("タイトル　H: 遊び方", 130, 140);
  else if (state === "help") { ctx.fillText("遊び方: 左右キーで動く", 130, 140); ctx.fillText("Esc: タイトルへ戻る", 130, 200); }
  else ctx.fillText("ゲーム中", 130, 140);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  if (state === "title" && key === "h") state = "help";
  else if (key === "escape") { state = "title"; }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
