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
    this.boostFrames = 0;
    this.boosts = 2;
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
    const maxSpeed = this.boostFrames > 0 ? 4.5 : 3;
    if (this.boostFrames > 0) this.boostFrames--;
    if (keys.ArrowUp) this.speed = Math.min(maxSpeed, this.speed + 0.1);
    else if (keys.ArrowDown) this.speed = Math.max(-1, this.speed - 0.1);
    else this.speed *= 0.98;
    if (Math.abs(this.speed) > 0.01) {
      if (keys.ArrowLeft) this.angle -= 0.06;
      if (keys.ArrowRight) this.angle += 0.06;
    }
    const nextX = this.x + Math.cos(this.angle) * this.speed;
    const nextY = this.y + Math.sin(this.angle) * this.speed;
    if (course.contains(nextX, nextY)) {
      this.x = nextX;
      this.y = nextY;
    } else {
      this.speed = 0;
    }
  }

}

class Checkpoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  contains(x, y) {
    return Math.hypot(x - this.x, y - this.y) <= 45;
  }

  draw(number, active) {
    ctx.fillStyle = active ? "#f8dc8b" : "#e6ebee";
    ctx.fillRect(this.x - 13, this.y - 13, 26, 26);
    ctx.strokeStyle = active ? "#b64a27" : "#52666b";
    ctx.lineWidth = active ? 4 : 2;
    ctx.strokeRect(this.x - 13, this.y - 13, 26, 26);
    ctx.fillStyle = "#26334a";
    ctx.font = "18px sans-serif";
    ctx.fillText(String(number), this.x - 5, this.y + 6);
  }
}

let course, car, keys, checkpoints, nextCheckpoint, laps, state, startTime, elapsed;

function start() {
  course = new Course();
  car = new Car(140, 110);
  keys = {};
  checkpoints = [new Checkpoint(660, 110), new Checkpoint(660, 350),
    new Checkpoint(140, 350), new Checkpoint(140, 110)];
  nextCheckpoint = 0;
  laps = 0;
  state = "playing";
  startTime = performance.now();
  elapsed = 0;
}

function update() {
  if (state !== "playing") return;
  elapsed = performance.now() - startTime;
  car.update();
  if (checkpoints[nextCheckpoint].contains(car.x, car.y)) {
    nextCheckpoint++;
    if (nextCheckpoint === checkpoints.length) {
      laps++;
      nextCheckpoint = 0;
    }
  }
  if (laps >= 2) state = "clear";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  course.draw();
  for (let i = 0; i < checkpoints.length; i++) {
    checkpoints[i].draw(i + 1, i === nextCheckpoint);
  }
  car.draw();
  ctx.fillStyle = "#26334a";
  ctx.font = "20px sans-serif";
  ctx.fillText("周回 " + laps + "  次の地点 " + (nextCheckpoint + 1) + " / 4（番号順）", 205, 205);
  ctx.fillText("時間 " + (elapsed / 1000).toFixed(1) + " 秒", 205, 240);
  if (state === "clear") ctx.fillText("2周完走！ R でもう一度", 205, 275);
  else ctx.fillText("↑加速 ↓減速 ←→ハンドル Spaceブースト: " + car.boosts, 205, 275);
}

window.addEventListener("keydown", (event) => {
  if (!event.repeat && event.key.toLowerCase() === "r") { start(); return; }
  if (event.code === "Space" && !event.repeat && state === "playing" && car.boosts > 0 && car.boostFrames === 0) {
    event.preventDefault();
    car.boosts--;
    car.boostFrames = 60;
    return;
  }
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

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
