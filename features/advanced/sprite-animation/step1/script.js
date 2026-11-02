"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let asset, x, frame, keys, moving, animationStart;
function loadImage(src) {
  const image = new Image();
  const asset = {image, status: "loading"};
  image.onload = () => { asset.status = image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "error"; };
  image.onerror = () => { asset.status = "error"; };
  image.src = src;
  return asset;
}
function frameCount() {
  if (asset.status !== "ready") return 0;
  const width = asset.image.naturalWidth, height = asset.image.naturalHeight;
  if (width < 64 || width % 64 !== 0 || height !== 64) return 0;
  return width / 64;
}

function start() {
  asset = loadImage("assets/walk-sheet.png"); x = 400; frame = 0; keys = {}; moving = false; animationStart = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif";
  const count = frameCount();
  if (asset.status === "loading") ctx.fillText("画像を読み込み中", 220, 100);
  else if (asset.status === "error") ctx.fillText("画像を読み込めません", 220, 100);
  else if (!count) ctx.fillText("シートの大きさを確認してください", 180, 100);
  else ctx.drawImage(asset.image, frame * 64, 0, 64, 64, x - 32, 190, 64, 64);
  if (count > 0) ctx.fillText("コマ: " + (frame + 1) + " / " + count, 220, 310);
  ctx.fillText("R: 読み直す", 220, 360);
}

window.addEventListener("keydown", event => {
  if (event.key.toLowerCase() === "r" && !event.repeat) { start(); return; }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
