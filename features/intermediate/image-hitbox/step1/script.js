"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let images, selected, x, showBox;
const y = 225, target = {x: 500, y: 200, width: 50, height: 50};
function loadImage(src) {
  const image = new Image();
  const asset = {image, status: "loading"};
  image.onload = () => { asset.status = image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "error"; };
  image.onerror = () => { asset.status = "error"; };
  image.src = src;
  return asset;
}

function start() {
  images = [loadImage("assets/player-blue.png")]; selected = 0; x = 200; showBox = false;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const asset = images[selected];
  ctx.fillStyle = "#e7edf2"; ctx.fillRect(target.x, target.y, target.width, target.height);
  ctx.fillStyle = "#26334a"; ctx.font = "18px sans-serif"; ctx.fillText("目標", target.x + 5, target.y + 30);
  if (asset.status === "ready") {
    const width = selected === 0 ? 64 : 96;
    ctx.drawImage(asset.image, x - width / 2, y - 32, width, 64);
  } else { ctx.fillStyle = "#26334a"; ctx.fillText(asset.status === "error" ? "画像を読めません" : "読み込み中", 80, 100); }
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText("←→: 移動 / R: 再開", 60, 380);

}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (event.key === "ArrowLeft") { event.preventDefault(); x = Math.max(16, x - 8); }
  else if (event.key === "ArrowRight") { event.preventDefault(); x = Math.min(784, x + 8); }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
