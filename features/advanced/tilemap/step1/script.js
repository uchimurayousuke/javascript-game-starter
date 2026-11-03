"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let map, row, col;

function start() {
  map = [[1,1,1,1,1],[1,0,0,2,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]];
  row = 1; col = 1;
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "28px sans-serif";
  for (let y = 0; y < map.length; y++) for (let x = 0; x < map[y].length; x++) {
    ctx.fillStyle = map[y][x] === 1 ? "#65717e" : "#e6edf2";
    ctx.fillRect(250 + x * 60, 60 + y * 60, 58, 58);
  }
  ctx.fillStyle = "#3984c6"; ctx.fillRect(260 + col * 60, 70 + row * 60, 38, 38);
  ctx.fillStyle = "#26334a"; ctx.fillText("列: " + col + " 行: " + row, 60, 80);
  ctx.fillText("地図を表示", 60, 400);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
