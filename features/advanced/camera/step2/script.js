"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const worldWidth = 2000, worldHeight = 900;
let player, camera, keys, clicked;

function start() {
  player = {x: 400, y: 225}; camera = {x: 0, y: 0}; keys = {}; clicked = null;
}

function update() {
  player.x += ((keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0)) * 4;
  player.y += ((keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0)) * 4;
  player.x = Math.max(16, Math.min(worldWidth - 16, player.x));
  player.y = Math.max(16, Math.min(worldHeight - 16, player.y));
  camera.x = Math.max(0, Math.min(worldWidth - 800, player.x - 400));
  camera.y = Math.max(0, Math.min(worldHeight - 450, player.y - 225));

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#dcecca"; ctx.fillRect(0, 0, 800, 450);
  ctx.fillStyle = "#7c9c66";
  for (let x = 0; x <= worldWidth; x += 200) ctx.fillRect(x - camera.x, -camera.y, 2, worldHeight);
  for (let y = 0; y <= worldHeight; y += 150) ctx.fillRect(-camera.x, y - camera.y, worldWidth, 2);
  ctx.fillStyle = "#397ab4"; ctx.fillRect(player.x - camera.x - 16, player.y - camera.y - 16, 32, 32);
  ctx.fillStyle = "#26334a"; ctx.font = "20px sans-serif";
  ctx.fillText("人の中心: (" + player.x + ", " + player.y + ")", 20, 35);
  ctx.fillText("カメラ左上: (" + camera.x + ", " + camera.y + ")", 20, 65);
  ctx.fillText("矢印: 移動 / R: 再開", 20, 420);
}

window.addEventListener("keydown", event => {
  if (event.key.toLowerCase() === "r" && !event.repeat) { start(); return; }
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); keys[event.key] = true; }
});
window.addEventListener("keyup", event => { keys[event.key] = false; });
window.addEventListener("blur", () => { keys = {}; });

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
