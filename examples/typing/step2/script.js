"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const words = ["a", "cat", "dog"];
let wordIndex, position, state;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  wordIndex = 0;
  position = 0;
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
  if (state === "playing") {
    ctx.fillText("表示された英字を順番に打とう", 180, 110);
    ctx.font = "56px sans-serif";
    ctx.fillText(words[wordIndex], 300, 210);
    ctx.font = "24px sans-serif";
    ctx.fillText("打てた文字: " + words[wordIndex].slice(0, position), 230, 280);
  } else {
    ctx.fillText("全部打てた！ R キーでもう一度", 150, 220);
  }
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  const key = event.key.toLowerCase();
  if (state !== "playing") {
    if (key === "r") start();
    return;
  }
  if (key.length !== 1 || key < "a" || key > "z") return;
  if (key === words[wordIndex][position]) {
    position++;
    if (position === words[wordIndex].length) {
      wordIndex++;
      position = 0;
      if (wordIndex === words.length) state = "clear";
    }
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
