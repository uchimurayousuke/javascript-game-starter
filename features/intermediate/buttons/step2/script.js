"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

canvas.style.touchAction = "none";
let enabled, hover, pressed, count;
function point(event) {
  const rect = canvas.getBoundingClientRect();
  return {x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height};
}
function inside(p) { return p.x >= 280 && p.x < 520 && p.y >= 160 && p.y < 230; }

function start() {
  enabled = true; hover = false; pressed = null; count = 0;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = !enabled ? "#c6cbd0" : pressed !== null ? "#d89c45" : hover ? "#f8dc8b" : "#dce8ef";
  ctx.fillRect(280, 160, 240, 70);
  ctx.fillStyle = "#26334a"; ctx.font = "26px sans-serif";
  ctx.fillText(enabled ? "押す" : "無効", 370, 205);
  ctx.fillText("回数: " + count, 100, 100);
}

function down(event, id) {
  if (!enabled || pressed !== null || !inside(point(event))) return;
  event.preventDefault(); pressed = id;
  if (event.pointerId !== undefined && canvas.setPointerCapture) { try { canvas.setPointerCapture(event.pointerId); } catch (error) {} }
}
function move(event) { hover = inside(point(event)); }
function up(event, id) {
  if (pressed === id) pressed = null;
}
if (window.PointerEvent) {
  canvas.addEventListener("pointerdown", event => down(event, event.pointerId));
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerleave", () => { hover = false; });
  window.addEventListener("pointerup", event => up(event, event.pointerId));
  window.addEventListener("pointercancel", event => { if (pressed === event.pointerId) pressed = null; });
} else {
  canvas.addEventListener("mousedown", event => down(event, "mouse"));
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseleave", () => { hover = false; });
  window.addEventListener("mouseup", event => up(event, "mouse"));
}
window.addEventListener("blur", () => { pressed = null; hover = false; });

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
