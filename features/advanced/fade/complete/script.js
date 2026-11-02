"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let scene, phase, alpha;

function start() {
  scene = "A"; phase = "idle"; alpha = 0;
}

function update() {
  if (phase === "out") {
    alpha = Math.min(1, alpha + 0.05);
    if (alpha >= 1) { scene = scene === "A" ? "B" : "A"; phase = "in"; }
  } else if (phase === "in") {
    alpha = Math.max(0, alpha - 0.05);
    if (alpha <= 0) phase = "idle";
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = scene === "A" ? "#dcecca" : "#dce8ef"; ctx.fillRect(0, 0, 800, 450);
  ctx.fillStyle = "#26334a"; ctx.font = "30px sans-serif";
  ctx.fillText("画面 " + scene, 320, 180);
  ctx.fillText("Enterで切り替え", 250, 250);
  ctx.globalAlpha = alpha; ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, 800, 450); ctx.globalAlpha = 1;
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (event.key === "Enter" && phase === "idle") phase = "out";
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
