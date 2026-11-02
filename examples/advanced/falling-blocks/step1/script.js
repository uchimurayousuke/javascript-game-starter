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
}
class Piece {
  constructor(shape) { this.shape = shape.map(row => [...row]); this.x = 3; this.y = 0; }
  draw(y = this.y, color = "#e28c59") {
    ctx.fillStyle = color;
    this.shape.forEach((row, dy) => row.forEach((value, dx) => {
      if (value) ctx.fillRect(100 + (this.x + dx) * 25, 50 + (y + dy) * 25, 23, 23);
    }));
  }
}
class Game {
  constructor() {
    this.board = new Board(); this.piece = new Piece(shapes[0]);
    this.state = "playing"; this.counter = 0; this.score = 0; this.lines = 0;
  }
}
let game;

function start() {
  game = new Game();
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  game.board.draw();
  if (game.state === "playing") game.piece.draw();
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText("盤面と図形", 360, 90);
  ctx.fillText("得点 " + game.score + "　消した行 " + game.lines + " / 2", 360, 140);
  if (game.state !== "playing") ctx.fillText(game.state === "clear" ? "クリア！ Rで再開" : "積み上がった！ Rで再開", 360, 370);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
