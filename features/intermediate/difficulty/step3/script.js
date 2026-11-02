"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let selected, state, x;

function start() {
  selected = 0; state = "menu"; x = 100;
}

function update() {
  if (state === "playing") { x += selected === 0 ? 2 : 4; if (x > 700) x = 100; }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  if (state === "menu") ctx.fillText("難易度: " + (selected === 0 ? "普通" : "速い"), 200, 120);
  else { ctx.fillText("R: 設定へ", 200, 120); ctx.fillRect(x, 200, 40, 40); }
  if (state === "menu") ctx.fillText("←→で選ぶ / Enterで開始", 160, 200);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (state !== "menu") return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); selected = 1 - selected; }
  else if (event.key === "Enter") state = "playing";
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
