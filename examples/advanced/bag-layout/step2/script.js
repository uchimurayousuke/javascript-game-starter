"use strict";
const canvas = document.querySelector("#game-canvas"), ctx = canvas.getContext("2d");
const columns = 6, rows = 4, cellSize = 64, boardX = 40, boardY = 95;
class Item {
  constructor(name, cells, color) { this.name = name; this.cells = cells; this.color = color; this.x = null; this.y = null; }
  rotate() {
    const turned = this.cells.map(([x, y]) => [-y, x]);
    const minX = Math.min(...turned.map(cell => cell[0])), minY = Math.min(...turned.map(cell => cell[1]));
    this.cells = turned.map(([x, y]) => [x - minX, y - minY]);
  }
  at(x = this.x, y = this.y) { return this.cells.map(([dx, dy]) => [x + dx, y + dy]); }
}
class Bag {
  constructor() {
    this.items = [new Item("L字", [[0,0],[0,1],[1,1]], "#ed8e65"), new Item("棒", [[0,0],[1,0],[2,0]], "#75a8d8"), new Item("四角", [[0,0],[1,0],[0,1],[1,1]], "#e8c257")];
    this.selected = null; this.hover = null; this.state = "playing"; this.message = "道具を選び、Rで回転しよう";
    this.round = 1; this.itemBonus = 0; this.adjBonus = 0;
  }
  blocked(x, y) { return false; }
  occupied(x, y, ignore = null) {
    return this.items.find(item => item !== ignore && item.x !== null && item.at().some(([cx, cy]) => cx === x && cy === y));
  }
  select(index) {
    if (this.state !== "playing") return;
    const item = this.items[index];
    if (!item || item.x !== null) { this.message = "配置済みの道具は盤面から回収できます"; return; }
    this.selected = this.selected === item ? null : item;
  }
  rotate() { if (this.state === "playing" && this.selected) this.selected.rotate(); }
}
let bag;
function start() { bag = new Bag(); }
function update() {}
function draw() {
  ctx.clearRect(0, 0, 800, 450); ctx.fillStyle = "#eef4f8"; ctx.fillRect(0, 0, 800, 450);
  ctx.fillStyle = "#20364a"; ctx.font = "bold 25px sans-serif"; ctx.fillText("道具をつめるバッグ", 40, 40);
  ctx.font = "16px sans-serif"; ctx.fillText("道具を選ぶ → Rで回転して形を確かめる", 40, 70);
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    ctx.fillStyle = bag.blocked(x,y) ? "#9ba7b1" : "#ffffff"; ctx.fillRect(boardX+x*cellSize, boardY+y*cellSize, cellSize, cellSize);
    ctx.strokeStyle = "#8fa4b5"; ctx.strokeRect(boardX+x*cellSize, boardY+y*cellSize, cellSize, cellSize);
  }
  for (const item of bag.items) if (item.x !== null) for (const [x,y] of item.at()) {
    ctx.fillStyle = item.color; ctx.fillRect(boardX+x*cellSize+3, boardY+y*cellSize+3, cellSize-6, cellSize-6);
    ctx.fillStyle = "#20364a"; ctx.font = "14px sans-serif"; ctx.fillText(item.name, boardX+x*cellSize+8, boardY+y*cellSize+35);
  }
  if (bag.selected) {
    ctx.fillStyle = "#20364a"; ctx.font = "15px sans-serif"; ctx.fillText("形の見本（まだ配置しません）", boardX+10, boardY+22);
    ctx.globalAlpha = 0.7; ctx.fillStyle = bag.selected.color;
    for (const [x,y] of bag.selected.cells) ctx.fillRect(boardX+(x+1)*cellSize+3, boardY+(y+1)*cellSize+3, cellSize-6, cellSize-6);
    ctx.globalAlpha = 1;
  }
  ctx.font = "16px sans-serif";
  bag.items.forEach((item, index) => {
    const x = 460, y = 86 + index*49; ctx.fillStyle = bag.selected === item ? "#f4d782" : "#ffffff"; ctx.fillRect(x,y,285,40);
    ctx.fillStyle = "#20364a"; ctx.fillText((index+1) + "：" + item.name + (item.x === null ? "（選ぶ）" : "（配置中）"), x+12,y+26);
    for (const [dx,dy] of item.cells) { ctx.fillStyle = item.color; ctx.fillRect(x+225+dx*11,y+5+dy*11,10,10); }
  });
  ctx.fillStyle = "#20364a"; ctx.font = "16px sans-serif";
  const messageRows = bag.message.match(/.{1,24}/gu) || [];
  messageRows.slice(0, 2).forEach((line, index) => ctx.fillText(line, 40, 380 + index * 20));

}
function position(event) { const rect = canvas.getBoundingClientRect(); return {x: (event.clientX-rect.left)*800/rect.width, y: (event.clientY-rect.top)*450/rect.height}; }
window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
  if (/^[1-3]$/.test(event.key)) bag.select(Number(event.key)-1);
  if (event.key.toLowerCase() === "r") bag.rotate();
});
canvas.addEventListener("mousemove", event => { const p = position(event); bag.hover = {x: Math.floor((p.x-boardX)/cellSize), y: Math.floor((p.y-boardY)/cellSize)}; });
canvas.addEventListener("click", event => {
  const p = position(event);
  if (p.x >= 460 && p.x <= 745 && p.y >= 86 && p.y < 224) { const i = Math.floor((p.y-86)/49); if (p.y < 86+i*49+40) bag.select(i); return; }
});
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
start(); gameLoop();
