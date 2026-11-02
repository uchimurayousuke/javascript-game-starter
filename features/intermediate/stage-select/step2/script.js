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
    ctx.fillText("←→: 選択　Enter: 決定", 210, 320);
  } else if (state === "playing") ctx.fillText("ステージ " + selected + "　Space: クリア", 160, 180);
  else ctx.fillText("クリア！ Esc: 選択へ", 200, 180);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (state === "select") {
    if (event.key === "ArrowLeft") { event.preventDefault(); selected = Math.max(1, selected - 1); }
    else if (event.key === "ArrowRight") { event.preventDefault(); selected = Math.min(3, selected + 1); }
    else if (event.key === "Enter" && selected <= unlocked) state = "playing";
  } else if (state === "playing" && event.key === " ") {
    event.preventDefault(); state = "clear";
  } else if (state === "clear" && event.key === "Escape") state = "select";
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
