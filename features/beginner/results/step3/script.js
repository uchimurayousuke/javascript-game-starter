"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let state, score;

function start() {
  state = "playing"; score = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  if (state === "playing") { ctx.fillText("Spaceで得点: " + score, 180, 150); }
  else if (state === "result") { ctx.fillText("結果: " + score + "点", 200, 150); ctx.fillText("R: 再挑戦 / M: メニュー", 180, 220); }
  else ctx.fillText("メニュー　Enter: はじめる", 180, 150);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (state === "playing" && event.key === " ") { event.preventDefault(); score++; if (score >= 3) state = "result"; }
  else if (state === "result" && key === "r") start();
  else if (state === "result" && key === "m") state = "menu";
  else if (state === "menu" && key === "enter") start();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
