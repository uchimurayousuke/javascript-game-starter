"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

class RoomObject {
  constructor(x, y, width, height, name) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.name = name;
  }

  contains(x, y) {
    return x >= this.x && x < this.x + this.width &&
      y >= this.y && y < this.y + this.height;
  }

  draw() {
    ctx.fillStyle = "#b7cbd4";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#24354a";
    ctx.font = "22px sans-serif";
    ctx.fillText(this.name, this.x + 15, this.y + 35);
  }
}

let objects, message;

function start() {
  objects = [
    new RoomObject(60, 105, 160, 180, "本棚"),
    new RoomObject(300, 130, 170, 140, "引き出し"),
    new RoomObject(535, 120, 165, 150, "換気口"),
    new RoomObject(625, 285, 120, 80, "扉")
  ];
  message = "気になる物をクリックしよう";
}

function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#24354a";
  ctx.font = "22px sans-serif";
  ctx.fillText("部屋の物をクリックして調べよう", 45, 45);
  for (const object of objects) object.draw();
  ctx.fillText(message, 45, 370);
}

function pointFromClick(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height
  };
}

canvas.addEventListener("click", (event) => {
  const point = pointFromClick(event);
  for (const object of objects) {
    if (object.contains(point.x, point.y)) {
      message = object.name + "を調べた";
      return;
    }
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
