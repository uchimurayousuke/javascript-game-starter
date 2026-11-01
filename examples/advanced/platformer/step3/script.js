"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const WORLD_WIDTH = 800;
let player;
let left = false, right = false, jumpHeld = false, jumpPressed = false;
const terrain = [
  { x: 0, y: 390, width: 800, height: 60 },
  { x: 300, y: 335, width: 40, height: 55 },
  { x: 480, y: 275, width: 160, height: 20 }
];

class Player {
  constructor() {
    this.x = 80;
    this.y = 350;
    this.width = 30;
    this.height = 40;
    this.vy = 0;
    this.onGround = false;
  }

  update(terrain) {
    const dx = (right ? 4 : 0) - (left ? 4 : 0);
    this.x += dx;
    for (const block of terrain) {
      if (overlaps(this, block)) {
        if (dx > 0) this.x = block.x - this.width;
        if (dx < 0) this.x = block.x + block.width;
      }
    }
    this.x = Math.max(0, Math.min(WORLD_WIDTH - this.width, this.x));
    if (jumpPressed && this.onGround) {
      this.vy = -11;
      this.onGround = false;
    }
    jumpPressed = false;
    this.vy = Math.min(this.vy + 0.5, 12);
    this.y += this.vy;
    this.onGround = false;
    for (const block of terrain) {
      if (overlaps(this, block)) {
        if (this.vy > 0) {
          this.y = block.y - this.height;
          this.onGround = true;
        } else if (this.vy < 0) {
          this.y = block.y + block.height;
        }
        this.vy = 0;
      }
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
  player.update(terrain);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#7cb97a";
  for (const block of terrain) ctx.fillRect(block.x, block.y, block.width, block.height);
  player.draw();
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
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
