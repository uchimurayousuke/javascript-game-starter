"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
let x = 100;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2563eb"; ctx.fillRect(x, 200, 50, 50);
  ctx.fillStyle = "#172b4d"; ctx.font = "24px sans-serif"; ctx.fillText("右矢印: 移動 / x: " + x, 40, 60);
}
document.addEventListener("keydown", event => {
  if (event.code === "ArrowRight") { x += 10; draw(); }
});
draw();
