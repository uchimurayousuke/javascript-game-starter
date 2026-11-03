"use strict";
const canvas = document.querySelector("#game-canvas"), ctx = canvas.getContext("2d");
const cols = 8, rows = 4, size = 62, boardLeft = 30, boardTop = 110;
const directions = [[1,0],[0,1],[-1,0],[0,-1]], arrows = ["→","↓","←","↑"];
class Factory {
  constructor() {
    this.tiles = Array.from({length: rows}, () => Array.from({length: cols}, () => null));
    this.tiles[1][0] = {type:"source", dir:0}; this.tiles[1][7] = {type:"exit", dir:0};
    this.materials = [{x:0,y:1,kind:"round"}]; this.tool = "belt"; this.direction = 0;
    this.running = false; this.last = performance.now(); this.accumulator = 0; this.delivered = 0; this.discarded = 0; this.tickCount = 0;
    this.nextKind = "round"; this.round = 1; this.state = "playing"; this.message = "入口と出口を見てみよう";
  }
  tile(x, y) { return x >= 0 && x < cols && y >= 0 && y < rows ? this.tiles[y][x] : null; }
}
let factory;
function start() { factory = new Factory(); }
function update() {
  const now = performance.now(), dt = Math.min(0.1, Math.max(0, (now - factory.last) / 1000)); factory.last = now;
}
function draw() {
  ctx.clearRect(0, 0, 800, 450); ctx.fillStyle = "#f0f4f7"; ctx.fillRect(0,0,800,450);
  ctx.fillStyle = "#233f52"; ctx.font = "bold 24px sans-serif"; ctx.fillText("ベルトでつなぐ小さな工場", 30, 38);
  ctx.font = "16px sans-serif"; ctx.fillText("入口と出口、材料を表示します", 30, 69);
  for (let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
    const tile = factory.tile(x,y), px=boardLeft+x*size, py=boardTop+y*size;
    ctx.fillStyle = tile ? (tile.type === "machine" ? "#efc775" : tile.type === "source" ? "#b9dbb5" : tile.type === "exit" ? "#a7cde1" : "#dce8ef") : "#ffffff";
    ctx.fillRect(px,py,size,size); ctx.strokeStyle="#92a8b5"; ctx.strokeRect(px,py,size,size);
    if (tile) { ctx.fillStyle="#233f52"; ctx.font="18px sans-serif"; ctx.fillText(tile.type === "source" ? "入口" : tile.type === "exit" ? "出口" : tile.type === "machine" ? "加工" : arrows[tile.dir],px+12,py+28); if(tile.type === "machine") ctx.fillText(arrows[tile.dir],px+20,py+50); }
  }
  for (const material of factory.materials) {
    const x=boardLeft+material.x*size+size/2,y=boardTop+material.y*size+size/2;
    ctx.fillStyle="#c13f3f"; ctx.beginPath();
    if(material.kind === "round") ctx.arc(x,y,11,0,Math.PI*2);
    else if(material.kind === "square") ctx.rect(x-10,y-10,20,20);
    else if(material.kind === "triangle") {ctx.moveTo(x,y-12);ctx.lineTo(x+12,y+10);ctx.lineTo(x-12,y+10);ctx.closePath();}
    else {ctx.moveTo(x,y-13);ctx.lineTo(x+13,y);ctx.lineTo(x,y+13);ctx.lineTo(x-13,y);ctx.closePath();}
    ctx.fill();
  }
  ctx.fillStyle="#233f52"; ctx.font="16px sans-serif";
  ctx.fillStyle="#233f52";ctx.font="15px sans-serif";ctx.fillText(factory.message,30,93);
}
function position(event) { const rect = canvas.getBoundingClientRect(); return {x:(event.clientX-rect.left)*800/rect.width,y:(event.clientY-rect.top)*450/rect.height}; }
function toggle() { if (factory.state === "playing") { factory.running = !factory.running; factory.accumulator = 0; factory.last = performance.now(); } }
window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
});
canvas.addEventListener("click", event => {
  const p = position(event);
});
window.addEventListener("blur", () => { factory.running = false; factory.accumulator = 0; factory.last = performance.now(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) factory.running = false; factory.accumulator = 0; factory.last = performance.now(); });
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
start(); gameLoop();
