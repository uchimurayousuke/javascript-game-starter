"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let score, level, message, loadVersion = 0;
const saveButton = document.createElement("button");
saveButton.type = "button"; saveButton.textContent = "保存する";
document.body.append(saveButton);
const loadLabel = document.createElement("label");
loadLabel.textContent = "読み込む ";
const loadInput = document.createElement("input");
loadInput.type = "file"; loadInput.accept = ".json,application/json";
loadLabel.append(loadInput); document.body.append(loadLabel);

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
loadInput.addEventListener("change", async () => {
  const file = loadInput.files[0];
  if (!file) return;
  const request = ++loadVersion;
  loadInput.value = "";
  try {
    if (file.size > 4096) throw new Error();
    const data = JSON.parse(await file.text());
    if (request !== loadVersion) return;
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).sort().join(",") !== "level,score,version" || data.version !== 1 || !Number.isInteger(data.score) || data.score < 0 || data.score > 999 || !Number.isInteger(data.level) || data.level < 1 || data.level > 10) throw new Error();
    score = data.score; level = data.level; message = "読み込みました";
  } catch {
    if (request === loadVersion) message = "読み込めませんでした";
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
