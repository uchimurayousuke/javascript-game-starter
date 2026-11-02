"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let images, selected;
function loadImage(src) {
  const image = new Image();
  const asset = {image, status: "loading"};
  image.onload = () => { asset.status = image.naturalWidth > 0 && image.naturalHeight > 0 ? "ready" : "error"; };
  image.onerror = () => { asset.status = "error"; };
  image.src = src;
  return asset;
}

function start() {
  selected = 0;
  images = [loadImage("assets/player-blue.png")];
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const asset = images[selected];
  ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif";
  if (asset.status === "ready") ctx.drawImage(asset.image, 300, 150);
  else ctx.fillText("画像を準備できません", 200, 100);
  ctx.fillText("R: 読み直す", 200, 350);
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
