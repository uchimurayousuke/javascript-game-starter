"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let player;
let left = false, right = false, jumpHeld = false, jumpPressed = false;

class Player {
  constructor() {
    this.x = 80;
    this.y = 350;
    this.width = 30;
    this.height = 40;
    this.vy = 0;
    this.onGround = false;
  }

  update() {
    if (left) this.x -= 4;
    if (right) this.x += 4;
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    if (jumpPressed && this.onGround) {
      this.vy = -11;
      this.onGround = false;
    }
    jumpPressed = false;
    this.vy = Math.min(this.vy + 0.5, 12);
    this.y += this.vy;
    if (this.y + this.height >= 390) {
      this.y = 390 - this.height;
      this.vy = 0;
      this.onGround = true;
    }
  }

  draw() {
    ctx.fillStyle = "#2765b0";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

function start() {
  player = new Player();
  left = false; right = false; jumpHeld = false; jumpPressed = false;
}

function update() {
  player.update();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#7cb97a";
  ctx.fillRect(0, 390, 800, 60);
  player.draw();
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
  if (event.code === "ArrowLeft") left = true;
  if (event.code === "ArrowRight") right = true;
  if ((event.code === "Space" || event.code === "ArrowUp") && !jumpHeld) {
    jumpHeld = true;
    jumpPressed = true;
  }
});
window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") left = false;
  if (event.code === "ArrowRight") right = false;
  if (event.code === "Space" || event.code === "ArrowUp") jumpHeld = false;
});
window.addEventListener("blur", () => {
  left = false; right = false; jumpHeld = false; jumpPressed = false;
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
