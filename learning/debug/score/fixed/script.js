"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
let score = 0, coinY = 80;
function update() {
  if (coinY >= 300) { score += 1; coinY = 80; }
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#172b4d"; ctx.font = "24px sans-serif";
  ctx.fillText("得点: " + score + " / Space: 接触 / R: やり直す", 40, 60);
  ctx.fillStyle = "#f5b942"; ctx.beginPath(); ctx.arc(150, coinY, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2563eb"; ctx.fillRect(100, 314, 100, 18);
}
document.addEventListener("keydown", event => {
  if (event.code === "Space" && !event.repeat) { event.preventDefault(); coinY = 300; }
  if (event.code === "KeyR") { score = 0; coinY = 80; }
});
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
gameLoop();
