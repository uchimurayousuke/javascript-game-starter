"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const beats = Array.from({length: 8}, (_, i) => ({time: 2000 + i * 600, lane: i % 2}));
let state, startTime, judged, score, message;

function start() {
  state = "ready"; startTime = 0; judged = Array(8).fill(false); score = 0; message = "Enterで開始";
}

function update() {
  if (state !== "playing") return;
  const elapsed = performance.now() - startTime;
  for (let i = 0; i < beats.length; i++) {
    if (!judged[i] && elapsed > beats[i].time + 150) { judged[i] = true; message = "見逃し"; }
  }
  if (judged.every(Boolean)) { state = "result"; message = score >= 6 ? "クリア！" : "もう一度"; }

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif";
  ctx.fillText("得点 " + score + " / 目標 6", 40, 50);
  ctx.fillText(message, 40, 400);
  ctx.fillStyle = "#dce8ef"; ctx.fillRect(250, 70, 90, 270);
  ctx.fillStyle = "#26334a"; ctx.fillRect(230, 320, 180, 4);
  const elapsed = state === "ready" ? 0 : performance.now() - startTime;
  for (let i = 0; i < beats.length; i++) {
    if (judged[i]) continue;
    const y = 320 - (beats[i].time - elapsed) * 0.12;
    if (y < 70 || y > 340) continue;
    const x = 270;
    ctx.fillStyle = beats[i].lane === 0 ? "#4389bc" : "#b65a87";
    ctx.fillRect(x, y - 10, 50, 20);
    ctx.fillStyle = "#ffffff"; ctx.fillText("●", x + 15, y + 8);
  }
  ctx.fillStyle = "#26334a"; ctx.fillText("Space: タイミングよく押す", 440, 110);
  ctx.fillText("R: 再開", 440, 200);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  if (key === "enter" && state === "ready") { state = "playing"; startTime = performance.now(); message = "タイミングを合わせよう"; return; }
  update();
  if (state !== "playing") return;
  const lane = event.key === " " ? 0 : -1;
  if (lane < 0) return;
  event.preventDefault();
  const elapsed = performance.now() - startTime;
  let nearest = -1, gap = Infinity;
  for (let i = 0; i < beats.length; i++) {
    if (!judged[i] && Math.abs(elapsed - beats[i].time) < gap) { nearest = i; gap = Math.abs(elapsed - beats[i].time); }
  }
  if (nearest >= 0 && gap <= 150) {
    judged[nearest] = true; score++;
    message = "成功！";
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
