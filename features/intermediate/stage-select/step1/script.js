"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let state, selected, unlocked;

function start() {
  state = "select"; selected = 1; unlocked = 3;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "26px sans-serif";
  if (state === "select") {
    ctx.fillText("ステージを選ぼう", 250, 90);
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = selected === i ? "#f8dc8b" : "#dce8ef"; ctx.fillRect(140 + i * 130, 160, 110, 80);
      ctx.fillStyle = "#26334a"; ctx.fillText(i <= unlocked ? String(i) : "鍵 " + i, 165 + i * 130, 210);
    }
    ctx.fillText("選択中: " + selected, 300, 270);
    ctx.fillText("3つのステージ", 210, 320);
  } else if (state === "playing") ctx.fillText("ステージ " + selected + "　Space: クリア", 160, 180);
  else ctx.fillText("クリア！ Esc: 選択へ", 200, 180);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
