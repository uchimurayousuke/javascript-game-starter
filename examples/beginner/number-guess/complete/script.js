"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let inputText, answer, hint, attempts, state;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  inputText = "";
  answer = Math.floor(Math.random() * 20) + 1;
  hint = "1から20の数を入力して Enter";
  attempts = 0;
  state = "playing";
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
  ctx.fillText("かくれた数を当てよう", 235, 85);
  ctx.font = "24px sans-serif";
  ctx.fillText("残り: " + (5 - attempts) + "回", 300, 145);
  if (state === "playing") {
    ctx.fillText("入力: " + inputText, 300, 210);
  }
  ctx.fillText(hint, 175, 285);
  ctx.font = "20px sans-serif";
  ctx.fillText("1〜20 / Enter で答える", 225, 325);
  ctx.fillText("Backspace で1文字消せます", 225, 355);
  if (state !== "playing") ctx.fillText("R キーでもう一度", 275, 410);
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
  attempts++;
  if (guess === answer) {
    hint = "正解！ こたえは " + answer;
    state = "clear";
  } else if (attempts >= 5) {
    hint = "残念！ こたえは " + answer;
    state = "over";
  } else if (guess < answer) {
    hint = "もっと大きい数だよ";
  } else {
    hint = "もっと小さい数だよ";
  }
  inputText = "";
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (state !== "playing") {
    if (event.key.toLowerCase() === "r") start();
    return;
  }
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
