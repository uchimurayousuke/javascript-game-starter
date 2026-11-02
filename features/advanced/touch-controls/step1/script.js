"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

canvas.style.touchAction = "none";
let x, touch;
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
  x = 400; touch = "";
}

function update() {
  const left = touch === "left", right = touch === "right";
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
}

canvas.addEventListener("pointerdown", event => { touch = direction(event); });
window.addEventListener("pointerup", () => { touch = ""; });

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
