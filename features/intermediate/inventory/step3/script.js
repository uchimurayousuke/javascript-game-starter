"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let hp, potions;

function start() {
  hp = 5; potions = 2;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("体力: " + hp + " / 10", 230, 150);
  ctx.fillText("回復薬: " + potions, 230, 210);
  ctx.fillText("1: 使う　G: 拾う　R: 最初から", 120, 300);
}

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.repeat) return;
  if (event.key === "1" && potions > 0 && hp < 10) { hp = Math.min(10, hp + 3); potions -= 1; }
  if (event.key.toLowerCase() === "g") potions = Math.min(5, potions + 1);
  if (event.key.toLowerCase() === "r") start();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
