"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const baseline = [
  {id:"窓", x:140, y:110, w:90, h:75, color:"#7cbde4", visible:true},
  {id:"時計", x:340, y:100, w:55, h:55, color:"#ffd35a", visible:true},
  {id:"絵", x:500, y:110, w:90, h:75, color:"#e9919b", visible:true},
  {id:"机", x:190, y:265, w:170, h:55, color:"#bb895f", visible:true},
  {id:"箱", x:480, y:250, w:75, h:70, color:"#83b88b", visible:true}
];
let scene, differences, state, streak, message;

function start() {
  streak = 0;
  nextRound();
}

function nextRound() {
  scene = baseline.map(item => ({...item}));
  differences = baseline.filter((item, i) => {
    const shown = scene[i];
    return item.x !== shown.x || item.y !== shown.y || item.color !== shown.color || item.visible !== shown.visible;
  }).map(item => {
    const shown = scene.find(other => other.id === item.id);
    const change = item.visible !== shown.visible ? "見えない" : item.color !== shown.color ? "色が違う" : "位置が違う";
    return {id:item.id, change};
  });
  state = "playing"; message = "";
}
function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f7f2df"; ctx.fillRect(70, 55, 610, 285);
  ctx.fillStyle = "#1f3d5b"; ctx.font = "20px sans-serif";
  ctx.fillText("へんか探し　連続 " + streak + " / 5", 70, 32);
  (state === "reference" ? baseline : scene).forEach(item => {
    if (!item.visible) return;
    ctx.fillStyle = item.color; ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = "#1f3d5b"; ctx.font = "16px sans-serif"; ctx.fillText(item.id, item.x, item.y - 8);
  });
  ctx.fillStyle = "#1f3d5b"; ctx.font = "18px sans-serif";
  ctx.fillText(message, 70, 430);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
