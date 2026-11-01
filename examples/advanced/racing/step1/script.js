"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

class Course {
  contains(x, y) {
    const outer = x >= 90 && x <= 710 && y >= 60 && y <= 400;
    const inside = x > 190 && x < 610 && y > 160 && y < 300;
    return outer && !inside;
  }

  draw() {
    ctx.fillStyle = "#71888c";
    ctx.fillRect(90, 60, 620, 340);
    ctx.fillStyle = "#d1e6bd";
    ctx.fillRect(190, 160, 420, 140);
  }
}

class Car {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.speed = 0;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = "#305f9a";
    ctx.fillRect(-12, -8, 24, 16);
    ctx.fillStyle = "#f7e7a3";
    ctx.fillRect(3, -6, 6, 12);
    ctx.restore();
  }

}

let course, car;

function start() {
  course = new Course();
  car = new Car(140, 110);
}

function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  course.draw();
  car.draw();
  ctx.fillStyle = "#26334a";
  ctx.font = "20px sans-serif";
  ctx.fillText("矢印キーで走る車を作ります", 205, 205);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
