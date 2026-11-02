"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let asset, fit;
function loadImage(src) {
  const image = new Image();
  const asset = {image, status: "loading"};
  image.onload = () => { asset.status = image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "error"; };
  image.onerror = () => { asset.status = "error"; };
  image.src = src;
  return asset;
}

function start() {
  fit = false; asset = loadImage("assets/player-alt.png");
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif";
  ctx.strokeStyle = "#26334a"; ctx.lineWidth = 2; ctx.strokeRect(250, 120, 240, 180);
  if (asset.status === "ready") {
    if (fit) {
      const scale = Math.min(240 / asset.image.naturalWidth, 180 / asset.image.naturalHeight);
      const width = asset.image.naturalWidth * scale, height = asset.image.naturalHeight * scale;
      ctx.drawImage(asset.image, 250 + (240 - width) / 2, 120 + (180 - height) / 2, width, height);
    } else ctx.drawImage(asset.image, 250, 120, 240, 180);
  } else ctx.fillText(asset.status === "error" ? "画像を読み込めません" : "読み込み中", 250, 100);
  ctx.fillText(fit ? "形を変えずに収める" : "引き伸ばす", 250, 330);
  ctx.fillText("R: 読み直す / B: 表示方法を切替", 180, 370);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (event.key.toLowerCase() === "b") fit = !fit;
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
