"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let asset, flip, angle;
function loadImage(src) {
  const image = new Image();
  const asset = {image, status: "loading"};
  image.onload = () => { asset.status = image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "error"; };
  image.onerror = () => { asset.status = "error"; };
  image.src = src;
  return asset;
}

function start() {
  asset = loadImage("assets/player-blue.png"); flip = false; angle = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif";
  if (asset.status === "ready") {
    ctx.drawImage(asset.image, 368, 193, 64, 64);
  } else ctx.fillText(asset.status === "error" ? "画像を読み込めません" : "読み込み中", 180, 100);
  ctx.fillStyle = "#bd422f"; ctx.fillRect(397, 222, 6, 6);
  ctx.fillStyle = "#26334a"; ctx.fillText("中心 (400,225) / R: 再開", 80, 360);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }

});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
