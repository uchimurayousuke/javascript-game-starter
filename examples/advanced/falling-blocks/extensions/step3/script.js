"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const shapes = [ [[1,1],[1,1]], [[1,1,1,1]], [[1,0],[1,0],[1,1]], [[0,1,0],[1,1,1]] ];
class Board {
  constructor() { this.cells = Array.from({length: 14}, () => Array(8).fill(0)); }
  fits(piece, x, y, shape = piece.shape) {
    return shape.every((row, dy) => row.every((value, dx) => !value ||
      (x + dx >= 0 && x + dx < 8 && y + dy >= 0 && y + dy < 14 && !this.cells[y + dy][x + dx])));
  }
  draw() {
    for (let y = 0; y < 14; y++) for (let x = 0; x < 8; x++) {
      ctx.fillStyle = this.cells[y][x] ? "#617cb5" : "#e6edf2";
      ctx.fillRect(100 + x * 25, 50 + y * 25, 23, 23);
    }
  }
  lock(piece) {
    piece.shape.forEach((row, dy) => row.forEach((value, dx) => { if (value) this.cells[piece.y + dy][piece.x + dx] = 1; }));
  }
  clearRows() {
    const kept = this.cells.filter(row => row.some(cell => !cell));
    const cleared = 14 - kept.length;
    while (kept.length < 14) kept.unshift(Array(8).fill(0));
    this.cells = kept;
    return cleared;
  }
}
class Piece {
  constructor(shape) { this.shape = shape.map(row => [...row]); this.x = 3; this.y = 0; }
  draw(y = this.y, color = "#e28c59") {
    ctx.fillStyle = color;
    this.shape.forEach((row, dy) => row.forEach((value, dx) => {
      if (value) ctx.fillRect(100 + (this.x + dx) * 25, 50 + (y + dy) * 25, 23, 23);
    }));
  }
  rotated() {
    return this.shape[0].map((_, x) => this.shape.map(row => row[x]).reverse());
  }
}
class Game {
  constructor() {
    this.board = new Board(); this.piece = new Piece(shapes[0]);
    this.state = "playing"; this.counter = 0; this.score = 0; this.lines = 0;
    this.nextShape = shapes[Math.floor(Math.random() * shapes.length)];
  }
  move(dx, dy) {
    if (this.state !== "playing") return false;
    if (this.board.fits(this.piece, this.piece.x + dx, this.piece.y + dy)) {
      this.piece.x += dx; this.piece.y += dy; return true;
    }
    if (dy === 1) {
      this.board.lock(this.piece);
      const count = this.board.clearRows(); this.lines += count; this.score += count * 100;
      if (this.lines >= 2) { this.state = "clear"; return false; }
      this.piece = new Piece(this.nextShape);
      this.nextShape = shapes[Math.floor(Math.random() * shapes.length)];
      if (!this.board.fits(this.piece, this.piece.x, this.piece.y)) this.state = "over";
    }
    return false;
  }
  rotate() {
    const shape = this.piece.rotated();
    if (this.board.fits(this.piece, this.piece.x, this.piece.y, shape)) this.piece.shape = shape;
  }
  landingY() {
    let y = this.piece.y;
    while (this.board.fits(this.piece, this.piece.x, y + 1)) y++;
    return y;
  }
}
let game;

function start() {
  game = new Game();
}

function update() {
  if (game.state !== "playing") return;
  game.counter++;
  if (game.counter >= 30) { game.counter = 0; game.move(0, 1); }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  game.board.draw();
  if (game.state === "playing") game.piece.draw(game.landingY(), "#b7cbd4");
  if (game.state === "playing") game.piece.draw();
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText("←→移動 ↓落下 ↑回転", 360, 90);
  ctx.fillText("得点 " + game.score + "　消した行 " + game.lines + " / 2", 360, 140);
  ctx.fillText("Space: 一気に落とす", 360, 180);
  ctx.fillText("次の形", 360, 230);
  ctx.fillStyle = "#e28c59";
  game.nextShape.forEach((row, y) => row.forEach((value, x) => { if (value) ctx.fillRect(360 + x * 25, 250 + y * 25, 23, 23); }));
  ctx.fillStyle = "#26334a";
  if (game.state !== "playing") ctx.fillText(game.state === "clear" ? "クリア！ Rで再開" : "積み上がった！ Rで再開", 360, 370);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  if (event.key.toLowerCase() === "r") { start(); return; }
  if (game.state !== "playing") return;
  if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) event.preventDefault();
  if (event.key === "ArrowLeft") game.move(-1, 0);
  else if (event.key === "ArrowRight") game.move(1, 0);
  else if (event.key === "ArrowDown") game.move(0, 1);
  else if (event.key === "ArrowUp") game.rotate();
  else if (event.key === " ") { while (game.move(0, 1)) {} }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
