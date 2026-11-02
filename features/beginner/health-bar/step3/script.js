"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const maxHp = 100;
let hp;

function start() {
  hp = maxHp;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  ctx.fillText("HP（残り体力） " + hp + " / " + maxHp, 120, 100);
  ctx.fillStyle = "#dce8ef"; ctx.fillRect(120, 150, 300, 30);
  ctx.fillStyle = "#3f9b68"; ctx.fillRect(120, 150, 300 * hp / maxHp, 30);
  ctx.fillText("D: 30ダメージ / H: 20回復 / R: 再開", 120, 260);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (event.key.toLowerCase() === "d") hp = Math.max(0, hp - 30);
  else if (event.key.toLowerCase() === "h") hp = Math.min(maxHp, hp + 20);
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
