"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let markerX, speed, state, success, round, hits, score;

function start() {
  markerX = 80;
  speed = 4;
  state = "moving";
  success = false;
  round = 1;
  hits = 0;
  score = 0;
}

function update() {
  if (state === "moving") {
    markerX += speed;
    if (markerX >= 720 || markerX <= 80) {
      speed = -speed;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d9e8f9";
  ctx.fillRect(80, 200, 640, 24);
  ctx.fillStyle = "#50a76b";
  const halfWidth = 100 - (round - 1) * 30;
  ctx.fillRect(400 - halfWidth, 200, halfWidth * 2, 24);
  ctx.fillStyle = "#204a84";
  ctx.fillRect(markerX - 5, 180, 10, 64);
  ctx.fillStyle = "#26334a";
  ctx.font = "24px sans-serif";
  ctx.fillText("ラウンド " + round + " / 3  成功 " + hits + "  得点 " + score, 245, 80);
  ctx.fillText("スペースで止める", 270, 120);
  if (state === "stopped") {
    if (success) {
      ctx.fillText("成功！ 緑の中で止まった", 220, 300);
    } else {
      ctx.fillText("おしい！ 緑の外で止まった", 205, 300);
    }
    ctx.fillText("Space で次へ / R で最初から", 200, 350);
  } else if (state === "finished") {
    ctx.fillText("3回終了！ R で最初から", 220, 320);
  }
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.code === "Space") {
    event.preventDefault();
    if (state === "moving") {
      state = "stopped";
      const halfWidth = 100 - (round - 1) * 30;
      success = markerX >= 400 - halfWidth && markerX <= 400 + halfWidth;
      if (success) {
        hits++;
        score++;
        if (Math.abs(markerX - 400) <= 10) score++;
      }
    } else if (state === "stopped") {
      if (round === 3) {
        state = "finished";
      } else {
        round++;
        markerX = 80;
        speed = 4;
        state = "moving";
      }
    }
  } else if (event.key.toLowerCase() === "r" && state !== "moving") {
    start();
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
