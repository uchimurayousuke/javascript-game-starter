"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let selected, state, x;

function start() {
  selected = 0; state = "menu"; x = 100;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  if (state === "menu") ctx.fillText("難易度: " + (selected === 0 ? "普通" : "速い"), 200, 120);
  else { ctx.fillText("R: 設定へ", 200, 120); ctx.fillRect(x, 200, 40, 40); }
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
