"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

canvas.style.touchAction = "none";
let x, touches, keys;
function direction(event) {
  const rect = canvas.getBoundingClientRect();
  const px = (event.clientX - rect.left) * canvas.width / rect.width;
  const py = (event.clientY - rect.top) * canvas.height / rect.height;
  if (py < 300 || py >= 390) return "";
  if (px >= 50 && px < 190) return "left";
  if (px >= 220 && px < 360) return "right";
  return "";
}

function start() {
  x = 400; touches = {}; keys = {};
}

function update() {
  const left = Object.values(touches).includes("left") || keys.ArrowLeft;
  const right = Object.values(touches).includes("right") || keys.ArrowRight;
  x += (right ? 3 : 0) - (left ? 3 : 0);
  x = Math.max(20, Math.min(780, x));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#3475b4"; ctx.fillRect(x - 20, 150, 40, 40);
  ctx.fillStyle = "#dce8ef"; ctx.fillRect(50, 300, 140, 90); ctx.fillRect(220, 300, 140, 90);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  ctx.fillText("左", 100, 355); ctx.fillText("右", 270, 355);
  ctx.fillText("ボタンを押して動く", 400, 350);
  ctx.fillText("キーボードの←→も使えます", 350, 90);
}

canvas.addEventListener("pointerdown", event => {
  const dir = direction(event); if (!dir) return;
  event.preventDefault();
  touches[event.pointerId] = dir;
  if (canvas.setPointerCapture) { try { canvas.setPointerCapture(event.pointerId); } catch (error) {} }
});
canvas.addEventListener("pointermove", event => { if (event.pointerId in touches) { event.preventDefault(); touches[event.pointerId] = direction(event); } });
window.addEventListener("pointerup", event => { delete touches[event.pointerId]; });
window.addEventListener("pointercancel", event => { delete touches[event.pointerId]; });
window.addEventListener("blur", () => { touches = {}; keys = {}; });
window.addEventListener("keydown", event => {
  if (event.key.toLowerCase() === "r" && !event.repeat) { start(); return; }
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); keys[event.key] = true; }
});
window.addEventListener("keyup", event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") keys[event.key] = false; });

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
