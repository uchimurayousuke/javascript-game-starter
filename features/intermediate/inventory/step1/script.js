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
  ctx.fillText("持ち物を表示", 120, 300);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
