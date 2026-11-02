"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let volume, muted, message;

function start() {
  volume = 0.25; muted = false; message = "Spaceで音を試す";
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  ctx.fillText(message, 160, 140);
  ctx.fillText("Space: 音を試す / R: 最初から", 160, 360);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  if (event.key === " ") { event.preventDefault(); message = "音を鳴らす操作を受け付けた"; }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
