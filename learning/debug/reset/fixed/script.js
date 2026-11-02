"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
let score = 0;
function start() { score = 0; }
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#172b4d"; ctx.font = "24px sans-serif";
  ctx.fillText("得点: " + score + " / Space: 1点 / R: やり直す", 40, 80);
}
document.addEventListener("keydown", event => {
  if (event.code === "Space" && !event.repeat) { event.preventDefault(); score += 1; draw(); }
  if (event.code === "KeyR" && !event.repeat) { start(); draw(); }
});
start(); draw();
