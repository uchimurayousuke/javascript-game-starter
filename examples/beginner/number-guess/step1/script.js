"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let inputText;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  inputText = "";
}

// 毎フレーム呼ばれます。
function update() {
  // 入力は keydown で受け取ります。
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("数字を入力してみよう", 235, 125);
  ctx.fillText("入力: " + inputText, 280, 220);
  ctx.font = "22px sans-serif";
  ctx.fillText("Backspace で1文字消せます", 235, 300);
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.key >= "0" && event.key <= "9" && event.key.length === 1) {
    if (inputText.length < 2) inputText += event.key;
  } else if (event.key === "Backspace") {
    event.preventDefault();
    inputText = inputText.slice(0, -1);
  }
});

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
