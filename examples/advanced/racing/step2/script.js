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

  update() {
    if (keys.ArrowUp) this.speed = Math.min(3, this.speed + 0.1);
    else if (keys.ArrowDown) this.speed = Math.max(-1, this.speed - 0.1);
    else this.speed *= 0.98;
    if (Math.abs(this.speed) > 0.01) {
      if (keys.ArrowLeft) this.angle -= 0.06;
      if (keys.ArrowRight) this.angle += 0.06;
    }
    const nextX = this.x + Math.cos(this.angle) * this.speed;
    const nextY = this.y + Math.sin(this.angle) * this.speed;
    this.x = nextX;
    this.y = nextY;
  }

}

let course, car, keys;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  course = new Course();
  car = new Car(140, 110);
  keys = {};
}

// 毎フレーム呼ばれます。
function update() {
  car.update();
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  course.draw();
  car.draw();
  ctx.fillStyle = "#26334a";
  ctx.font = "20px sans-serif";
  ctx.fillText("矢印キーで走る車を作ります", 205, 205);
}

window.addEventListener("keydown", (event) => {

  if (event.key === "ArrowUp" || event.key === "ArrowDown" ||
      event.key === "ArrowLeft" || event.key === "ArrowRight") {
    keys[event.key] = true;
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown" ||
      event.key === "ArrowLeft" || event.key === "ArrowRight") {
    keys[event.key] = false;
    event.preventDefault();
  }
});

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
