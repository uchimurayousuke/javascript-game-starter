"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let state, selected;

function start() {
  state = "menu"; selected = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "30px sans-serif";
  if (state === "menu") {
    ctx.fillText("ゲームメニュー", 260, 100);
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = selected === i ? "#f8dc8b" : "#dce8ef";
      ctx.fillRect(250, 150 + i * 80, 300, 60);
      ctx.fillStyle = "#26334a"; ctx.fillText(i === 0 ? "はじめる" : "遊び方", 320, 190 + i * 80);
    }
    ctx.fillText(selected === 0 ? "選択中: はじめる" : "選択中: 遊び方", 260, 350);
  } else if (state === "game") ctx.fillText("ゲーム中", 160, 200);
  else ctx.fillText("遊び方", 160, 200);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
