"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let score, level, message, loadVersion = 0;
const saveButton = document.createElement("button");
saveButton.type = "button"; saveButton.textContent = "保存する";
document.body.append(saveButton);

function start() {
  score = 0; level = 1; message = ""; loadVersion += 1;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  ctx.fillText("得点: " + score, 200, 130);
  ctx.fillText("レベル: " + level, 200, 190);
  ctx.fillText("Space: 得点　L: レベル　R: 最初から", 80, 270);
  ctx.font = "22px sans-serif"; ctx.fillText(message, 140, 330);
}

window.addEventListener("keydown", event => {
  if (event.target && (event.target.tagName === "INPUT" || event.target.tagName === "BUTTON")) return;
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.code === "Space") event.preventDefault();
  if (event.repeat) return;
  if (event.code === "Space") { score = Math.min(999, score + 10); loadVersion += 1; }
  if (event.key.toLowerCase() === "l") { level = Math.min(10, level + 1); loadVersion += 1; }
  if (event.key.toLowerCase() === "r") start();
});
saveButton.addEventListener("click", () => {
  const data = JSON.stringify({version: 1, score, level});
  const url = URL.createObjectURL(new Blob([data], {type: "application/json"}));
  const link = document.createElement("a"); link.href = url; link.download = "game-save.json";
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message = "保存しました";
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
