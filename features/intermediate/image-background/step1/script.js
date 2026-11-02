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
    ctx.drawImage(asset.image, 0, 0, 800, 450);
  } else { ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif"; ctx.fillText(asset.status === "error" ? "背景を読み込めません" : "背景を読み込み中", 150, 100); }
  ctx.fillStyle = "#245c92"; ctx.fillRect(380, 210, 40, 40);
  ctx.fillStyle = "#ffffff"; ctx.font = "18px sans-serif"; ctx.fillText("人", 390, 238);
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif"; ctx.fillText("R: 読み直す", 90, 410);
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
