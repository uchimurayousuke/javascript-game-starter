"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let scene, items, message;

function start() {
  scene = "start"; items = []; message = "";
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "26px sans-serif";
  if (scene === "start") {
    ctx.fillText("森の入口に立っています。", 70, 90);
    ctx.fillText("1: 広場へ進む　2: 川へ進む", 70, 160);
  } else if (scene === "river") {
    ctx.fillText("川の水が急に増えたので、家へ戻りました。", 70, 90);
    ctx.fillText("おしまい", 70, 160);
  } else if (scene === "clearing") {
    ctx.fillText("広場に着きました。", 70, 90);
    ctx.fillText("1: 家へ帰る　2: 森を見渡す", 70, 160);
  } else if (scene === "end") {
    ctx.fillText(message, 70, 90);
    ctx.fillText("おしまい", 70, 160);
  }
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (!["1", "2", "3"].includes(key) || scene === "end" || scene === "river") return;
  if (key === "3") return;
  if (scene === "start") scene = key === "1" ? "clearing" : key === "2" ? "river" : scene;
  else if (scene === "clearing" && key === "1") { scene = "end"; message = "森の景色を楽しみ、家へ帰りました。"; }
  else if (scene === "clearing" && key === "2") { scene = "end"; message = "見晴らしのよい丘を見つけました。"; }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
