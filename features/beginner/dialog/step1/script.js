"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const messages = ["こんにちは", "気をつけて", "またね"];
let index;

function start() {
  index = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText(messages[index], 180, 180);
  ctx.fillText("会話を表示", 180, 300);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
