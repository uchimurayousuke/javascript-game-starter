"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const wordList = ["a", "cat", "dog", "sun", "fish"];
let words;
let wordIndex, position, state, score, mistakes, wordErrors, wordStarted, endTime, seconds;

function start() {
  words = [...wordList];
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const word = words[i];
    words[i] = words[j];
    words[j] = word;
  }
  wordIndex = 0;
  position = 0;
  state = "playing";
  score = 0;
  mistakes = 0;
  wordErrors = 0;
  wordStarted = performance.now();
  endTime = wordStarted + 30000;
  seconds = 30;
}

function update() {
  if (state === "playing") {
    seconds = Math.max(0, Math.ceil((endTime - performance.now()) / 1000));
    if (seconds === 0) state = "over";
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "24px sans-serif";
  ctx.fillText("得点: " + score + "  まちがい: " + mistakes + "  残り: " + seconds + "秒", 100, 65);
  if (state === "playing") {
    ctx.fillText("英字を順番に打とう", 260, 120);
    ctx.font = "56px sans-serif";
    ctx.fillText(words[wordIndex], 300, 210);
    ctx.font = "24px sans-serif";
    ctx.fillText("打てた文字: " + words[wordIndex].slice(0, position), 230, 270);
    ctx.fillText("1語完成: 1文字10点 / 正確 +5 / 3秒未満 +5", 110, 335);
  } else {
    if (state === "clear") {
      ctx.fillText("全部打てた！", 310, 200);
    } else {
      ctx.fillText("時間切れ！", 320, 200);
    }
    ctx.fillText("R キーでもう一度", 270, 270);
  }
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  const key = event.key.toLowerCase();
  if (state !== "playing") {
    if (key === "r") start();
    return;
  }
  if (performance.now() >= endTime) {
    seconds = 0;
    state = "over";
    return;
  }
  if (key.length !== 1 || key < "a" || key > "z") return;
  if (key === words[wordIndex][position]) {
    position++;
    if (position === words[wordIndex].length) {
      score += words[wordIndex].length * 10;
      if (wordErrors === 0) score += 5;
      if (performance.now() - wordStarted < 3000) score += 5;
      wordIndex++;
      position = 0;
      wordErrors = 0;
      wordStarted = performance.now();
      if (wordIndex === words.length) {
        seconds = Math.max(0, Math.ceil((endTime - performance.now()) / 1000));
        state = "clear";
      }
    }
  } else {
    mistakes++;
    wordErrors++;
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
