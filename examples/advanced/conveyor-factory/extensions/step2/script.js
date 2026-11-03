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
    this.nextKind = "triangle"; this.round = 1; this.state = "playing"; this.message = "ベルトと加工機を置いて道を作ろう";
  }
  tile(x, y) { return x >= 0 && x < cols && y >= 0 && y < rows ? this.tiles[y][x] : null; }
  edit(x, y) {
    if (this.state !== "playing" || this.running) { this.message = "編集するには一時停止してください"; return; }
    if (x <= 0 || x >= cols-1 || y < 0 || y >= rows) return;
    if (this.materials.some(material => material.x === x && material.y === y)) { this.message = "材料があるマスは編集できません"; return; }
    this.tiles[y][x] = this.tool === "erase" ? null : {type:this.tool, dir:this.direction};
    this.message = "配置しました。入口から出口へつなごう";
  }
  tick(supply = true) {
    if (this.state !== "playing") return;
    const snapshot = this.materials.map(material => ({...material}));
    const occupied = new Set(snapshot.map(material => material.x + "," + material.y));
    const proposals = [];
    for (const material of snapshot) {
      const current = this.tile(material.x, material.y);
      if (!current || current.type === "exit") continue;
      const [dx,dy] = directions[current.dir], x = material.x + dx, y = material.y + dy;
      const destination = this.tile(x,y);
      if (!destination || occupied.has(x + "," + y)) continue;
      proposals.push({material, x, y});
    }
    proposals.sort((a,b) => a.material.y - b.material.y || a.material.x - b.material.x);
    const claimed = new Set(), accepted = new Map();
    for (const proposal of proposals) {
      const key = proposal.x + "," + proposal.y;
      if (!claimed.has(key)) { claimed.add(key); accepted.set(proposal.material, proposal); }
    }
    const next = [];
    for (const material of snapshot) {
      const move = accepted.get(material);
      if (!move) { next.push(material); continue; }
      const destination = this.tile(move.x,move.y);
      let kind = material.kind;
      if (destination.type === "machine") {
        if (kind === "round") kind = "square";
        else if (kind === "triangle") kind = "diamond";
      }
      if (destination.type === "exit") {
        if (kind === "square" || kind === "diamond") this.delivered++; else this.discarded++;
      } else next.push({x:move.x,y:move.y,kind});
    }
    if (supply && !next.some(material => material.x === 0 && material.y === 1)) {
      next.push({x:0,y:1,kind:this.nextKind});
      this.nextKind = this.nextKind === "round" ? "triangle" : "round";
    }
    this.materials = next; this.tickCount++;
    const target = 3;
    if (this.delivered >= target) {
      this.running = false;
      this.state = "clear"; this.message = "クリア！ Spaceで最初から";
    }
  }
}
let factory;
function start() { factory = new Factory(); }
function update() {
  const now = performance.now(), dt = Math.min(0.1, Math.max(0, (now - factory.last) / 1000)); factory.last = now;
  if (factory.running && factory.state === "playing") { factory.accumulator += dt; if (factory.accumulator >= 0.5) { factory.accumulator -= 0.5; factory.tick(); } }
}
function draw() {
  ctx.clearRect(0, 0, 800, 450); ctx.fillStyle = "#f0f4f7"; ctx.fillRect(0,0,800,450);
  ctx.fillStyle = "#233f52"; ctx.font = "bold 24px sans-serif"; ctx.fillText("ベルトでつなぐ小さな工場", 30, 38);
  ctx.font = "16px sans-serif"; ctx.fillText("参考：入口と出口をまっすぐ結び、途中に加工機を1つ置こう", 30, 69);
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
  ctx.fillText("1 ベルト　2 加工機　3 消す", 30, 390);
  ctx.fillText("選択：" + ({belt:"ベルト",machine:"加工機",erase:"消す"}[factory.tool]) + " " + arrows[factory.direction], 30, 419);

  ctx.fillText("納品 " + factory.delivered + " / " + 3 + "　失敗 " + factory.discarded, 550, 119);
  ctx.fillText("刻み " + factory.tickCount, 550, 148);
  ctx.fillText(factory.running ? "動作中" : "一時停止中", 550, 177);
  ctx.fillStyle="#246b87";ctx.fillRect(550,198,200,40);ctx.fillRect(550,248,200,40);ctx.fillStyle="white";
  ctx.fillText("Space：開始 / 停止",562,224);ctx.fillText("N：1刻み進める",562,274);
  ctx.fillStyle="#233f52";ctx.fillText("R：向きを変える",550,318);
  ctx.fillStyle="#233f52";ctx.fillText("丸→四角 / 三角→ひし形",550,348);
  ctx.fillStyle="#233f52";ctx.font="15px sans-serif";ctx.fillText(factory.message,30,93);
}
function position(event) { const rect = canvas.getBoundingClientRect(); return {x:(event.clientX-rect.left)*800/rect.width,y:(event.clientY-rect.top)*450/rect.height}; }
function toggle() { if (factory.state === "playing") { factory.running = !factory.running; factory.accumulator = 0; factory.last = performance.now(); } }
window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
  if (event.key === "1") factory.tool = "belt";
  if (event.key === "2") factory.tool = "machine";
  if (event.key === "3") factory.tool = "erase";
  if (event.key.toLowerCase() === "n" && !factory.running) factory.tick();
  if (event.code === "Space" && factory.state === "playing") { event.preventDefault(); toggle(); }
  if (event.key.toLowerCase() === "r" && !factory.running) factory.direction = (factory.direction + 1) % 4;
  if (event.code === "Space" && factory.state === "clear") { event.preventDefault(); start(); }
});
canvas.addEventListener("click", event => {
  const p = position(event);
  if (p.x>=550 && p.x<=750 && p.y>=198 && p.y<=238) { toggle(); return; }
  if (p.x>=550 && p.x<=750 && p.y>=248 && p.y<=288) { if (!factory.running) factory.tick(); return; }
  factory.edit(Math.floor((p.x-boardLeft)/size), Math.floor((p.y-boardTop)/size));
});
window.addEventListener("blur", () => { factory.running = false; factory.accumulator = 0; factory.last = performance.now(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) factory.running = false; factory.accumulator = 0; factory.last = performance.now(); });
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
start(); gameLoop();
