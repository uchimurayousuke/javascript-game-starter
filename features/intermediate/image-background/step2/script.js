"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let asset, cover;
function loadImage(src) {
  const image = new Image();
  const asset = {image, status: "loading"};
  image.onload = () => { asset.status = image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "error"; };
  image.onerror = () => { asset.status = "error"; };
  image.src = src;
  return asset;
}

function start() {
  asset = loadImage("assets/background.png"); cover = false;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e6edf2"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (asset.status === "ready") {
    const scale = cover ? Math.max(800 / asset.image.naturalWidth, 450 / asset.image.naturalHeight) : Math.min(800 / asset.image.naturalWidth, 450 / asset.image.naturalHeight);
    const width = asset.image.naturalWidth * scale, height = asset.image.naturalHeight * scale;
    ctx.drawImage(asset.image, 0, 0, width, height);
  } else { ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif"; ctx.fillText(asset.status === "error" ? "背景を読み込めません" : "背景を読み込み中", 150, 100); }
  ctx.fillStyle = "#245c92"; ctx.fillRect(380, 210, 40, 40);
  ctx.fillStyle = "#ffffff"; ctx.font = "18px sans-serif"; ctx.fillText("人", 390, 238);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(60, 40, 550, 36);
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText(cover ? "画面を埋める（端を切る）" : "全体を収める", 80, 66);
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif"; ctx.fillText("R: 読み直す / C: 収める・埋める", 90, 410);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (event.key.toLowerCase() === "c") cover = !cover;
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
