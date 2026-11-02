"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const palette = ["#397ab4", "#ca635c", "#7d9a47", "#9357a2"];
const letters = ["A", "B", "C", "D"];
class Board {
  constructor() {
    this.cells = [[1,0,0,2,2,1],[1,1,3,2,1,2],[0,2,0,3,0,3],
      [3,0,3,1,1,2],[2,3,2,3,1,2],[2,3,3,0,2,1]];
  }
  swap(a, b) { const old = this.cells[a.y][a.x]; this.cells[a.y][a.x] = this.cells[b.y][b.x]; this.cells[b.y][b.x] = old; }
  matches() {
    const found = new Set();
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const v = this.cells[y][x];
      if (x <= 3 && v === this.cells[y][x + 1] && v === this.cells[y][x + 2]) for (let i = 0; i < 3; i++) found.add(y * 6 + x + i);
      if (y <= 3 && v === this.cells[y + 1][x] && v === this.cells[y + 2][x]) for (let i = 0; i < 3; i++) found.add((y + i) * 6 + x);
    }
    return found;
  }
  refill(found) {
    for (let x = 0; x < 6; x++) {
      const kept = [];
      for (let y = 5; y >= 0; y--) if (!found.has(y * 6 + x)) kept.push(this.cells[y][x]);
      for (let y = 5; y >= 0; y--) this.cells[y][x] = kept.length ? kept.shift() : Math.floor(Math.random() * 4);
    }
  }
  hasMove() {
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) for (const [dx, dy] of [[1,0],[0,1]]) {
      if (x + dx >= 6 || y + dy >= 6) continue;
      const a = {x, y}, b = {x: x + dx, y: y + dy}; this.swap(a, b);
      const valid = this.matches().size > 0; this.swap(a, b);
      if (valid) return true;
    }
    return false;
  }
  draw() {
    ctx.font = "24px sans-serif";
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const v = this.cells[y][x]; ctx.fillStyle = palette[v]; ctx.fillRect(80 + x * 50, 65 + y * 50, 46, 46);
      ctx.fillStyle = "#ffffff"; ctx.fillText(letters[v], 96 + x * 50, 96 + y * 50);
    }
  }
}
class Game {
  constructor() {
    this.board = new Board(); this.selected = null; this.score = 0; this.moves = 10; this.state = "playing"; this.message = "隣を選んで交換"; this.endAt = performance.now() + 60000; this.finishedAt = null;
  }
  resolve(found) {
    let chain = 1;
    while (found.size && chain <= 12) {
      this.score += found.size * 10 * chain;
      this.board.refill(found); found = this.board.matches(); chain++;
    }
    if (found.size || !this.board.hasMove()) { this.board = new Board(); this.message = "盤面を整えました"; }
  }
  finish() {
    if (this.score >= 120) { this.state = "clear"; this.message = "クリア！ Rで再開"; }
    else if (this.moves <= 0) { this.state = "over"; this.message = "手数切れ。Rで再開"; }
    if (this.state !== "playing") this.finishedAt = performance.now();
  }
  click(x, y) {
    if (this.state !== "playing" || x < 0 || x >= 6 || y < 0 || y >= 6) return;
    const point = {x, y};
    if (!this.selected) { this.selected = point; return; }
    const previous = this.selected;
    if (Math.abs(previous.x - x) + Math.abs(previous.y - y) !== 1) { this.selected = point; return; }
    this.board.swap(previous, point); this.selected = null;
    this.moves--;
    const found = this.board.matches();
    if (!found.size) { this.board.swap(previous, point); this.message = "そろわないので戻した"; }
    else { this.message = "そろった！"; this.resolve(found); }
    this.finish();
  }
}
let game;

function start() {
  game = new Game();
}

function update() {
  if (game.state === "playing" && performance.now() >= game.endAt) { game.state = "over"; game.finishedAt = game.endAt; game.message = "時間切れ。Rで再開"; }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  game.board.draw();
  if (game.selected) { ctx.strokeStyle = "#f8dc8b"; ctx.lineWidth = 4; ctx.strokeRect(80 + game.selected.x * 50, 65 + game.selected.y * 50, 46, 46); }
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText("同じ文字を3つそろえる", 420, 80);
  ctx.fillText("得点 " + game.score + " / 120", 420, 120);
  ctx.fillText("残りの交換 " + game.moves, 420, 160);
  ctx.fillText("隣同士をクリックして交換", 420, 200);
  ctx.fillText(game.message, 420, 300);
  ctx.fillText("残り " + Math.max(0, Math.ceil((game.endAt - (game.finishedAt === null ? performance.now() : game.finishedAt)) / 1000)) + "秒", 420, 240);
}

canvas.addEventListener("click", event => {
  update();
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) * canvas.width / rect.width - 80) / 50);
  const y = Math.floor(((event.clientY - rect.top) * canvas.height / rect.height - 65) / 50);
  game.click(x, y);
});
window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
