"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let inputText, answer, hint;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  inputText = "";
  answer = 12;
  hint = "1から20の数を入力して Enter";
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
  ctx.fillText("かくれた数を当てよう", 235, 100);
  ctx.fillText("入力: " + inputText, 285, 195);
  ctx.font = "24px sans-serif";
  ctx.fillText(hint, 180, 270);
  ctx.fillText("1〜20 / Enter で答える", 225, 315);
  ctx.fillText("Backspace で1文字消せます", 225, 350);
}

function checkGuess() {
  if (inputText === "") {
    hint = "数字を入れてから Enter";
    return;
  }
  const guess = Number(inputText);
  if (guess < 1 || guess > 20) {
    hint = "1から20の数を入れてね";
    return;
  }
  if (guess < answer) {
    hint = "もっと大きい数だよ";
  } else if (guess > answer) {
    hint = "もっと小さい数だよ";
  } else {
    hint = "正解！";
  }
  inputText = "";
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.key >= "0" && event.key <= "9" && event.key.length === 1) {
    if (inputText.length < 2) inputText += event.key;
  } else if (event.key === "Backspace") {
    event.preventDefault();
    inputText = inputText.slice(0, -1);
  } else if (event.key === "Enter") {
    event.preventDefault();
    checkGuess();
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
