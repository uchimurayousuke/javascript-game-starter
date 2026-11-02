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
    this.board = new Board(); this.selected = null; this.score = 0; this.moves = 10; this.state = "playing"; this.message = "隣を選んで交換";
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
  if (game.selected) { ctx.strokeStyle = "#f8dc8b"; ctx.lineWidth = 4; ctx.strokeRect(80 + game.selected.x * 50, 65 + game.selected.y * 50, 46, 46); }
  ctx.fillStyle = "#26334a"; ctx.font = "22px sans-serif";
  ctx.fillText("同じ文字を3つそろえる", 420, 80);
  ctx.fillText("得点 " + game.score + " / 120", 420, 120);
  ctx.fillText("残りの交換 " + game.moves, 420, 160);
  ctx.fillText("6×6の盤面", 420, 200);
  ctx.fillText(game.message, 420, 300);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
