"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let inputText, answer, hint, attempts, state, history, low, high;
let maxNumber = 20;

function start() {
  inputText = "";
  answer = Math.floor(Math.random() * maxNumber) + 1;
  hint = "1から" + maxNumber + "の数を入力して Enter";
  attempts = 0;
  history = [];
  low = 1;
  high = maxNumber;
  state = "playing";
}

function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("かくれた数を当てよう", 235, 85);
  ctx.font = "24px sans-serif";
  const limit = maxNumber === 20 ? 5 : 7;
  ctx.fillText("残り: " + (limit - attempts) + "回", 300, 145);
  if (state === "playing") {
    ctx.fillText("入力: " + inputText, 300, 210);
  }
  ctx.fillText(hint, 175, 285);
  ctx.font = "18px sans-serif";
  ctx.fillText("候補: " + low + "〜" + high, 45, 190);
  ctx.fillText("回答の履歴", 570, 110);
  for (let i = 0; i < history.length; i++) {
    ctx.fillText(history[i], 570, 140 + i * 25);
  }
  ctx.font = "20px sans-serif";
  ctx.fillText("1〜" + maxNumber + " / Enter で答える / Dで難易度", 175, 325);
  ctx.fillText("Backspace で1文字消せます", 225, 355);
  if (state !== "playing") ctx.fillText("R キーでもう一度", 275, 410);
}

function checkGuess() {
  if (inputText === "") {
    hint = "数字を入れてから Enter";
    return;
  }
  const guess = Number(inputText);
  if (guess < 1 || guess > maxNumber) {
    hint = "1から" + maxNumber + "の数を入れてね";
    return;
  }
  attempts++;
  let result = "正解";
  if (guess < answer) result = "もっと大きい";
  if (guess > answer) result = "もっと小さい";
  history.push(guess + "：" + result);
  if (guess < answer) low = Math.max(low, guess + 1);
  if (guess > answer) high = Math.min(high, guess - 1);
  if (guess === answer) {
    hint = "正解！ こたえは " + answer;
    state = "clear";
  } else if (attempts >= (maxNumber === 20 ? 5 : 7)) {
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
  if (event.key.toLowerCase() === "d") {
    maxNumber = maxNumber === 20 ? 100 : 20;
    start();
    return;
  }
  if (state !== "playing") {
    if (event.key.toLowerCase() === "r") start();
    return;
  }
  if (event.key >= "0" && event.key <= "9" && event.key.length === 1) {
    if (inputText.length < 3) inputText += event.key;
  } else if (event.key === "Backspace") {
    event.preventDefault();
    inputText = inputText.slice(0, -1);
  } else if (event.key === "Enter") {
    event.preventDefault();
    checkGuess();
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
