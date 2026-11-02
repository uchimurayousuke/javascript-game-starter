"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const box = {x: 400, y: 150, width: 160, height: 150};
const radius = 30;
let x, y;
function nearest() {
  const nx = Math.max(box.x, Math.min(x, box.x + box.width));
  const ny = Math.max(box.y, Math.min(y, box.y + box.height));
  const distance = Math.hypot(x - nx, y - ny);
  return {x: nx, y: ny, distance};
}

function start() {
  x = 180; y = 225;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#dce8ef"; ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.fillStyle = "#397ab4"; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText("円の中心: (" + x + ", " + y + ") / 半径 " + radius, 60, 60);
  const near = nearest();
  ctx.fillText("近い点: (" + near.x + ", " + near.y + ") / 距離 " + near.distance.toFixed(1), 60, 100);
  ctx.fillText(near.distance <= radius ? "接触している" : "離れている", 60, 140);
  ctx.fillStyle = "#d14f37"; ctx.fillRect(near.x - 4, near.y - 4, 8, 8);
  ctx.fillStyle = "#26334a"; ctx.fillText("矢印: 移動 / R: 再開", 60, 390);

}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (event.key === "ArrowLeft") { event.preventDefault(); x = Math.max(radius, x - 10); }
  else if (event.key === "ArrowRight") { event.preventDefault(); x = Math.min(800 - radius, x + 10); }
  else if (event.key === "ArrowUp") { event.preventDefault(); y = Math.max(radius, y - 10); }
  else if (event.key === "ArrowDown") { event.preventDefault(); y = Math.min(450 - radius, y + 10); }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
