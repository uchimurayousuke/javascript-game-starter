"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const WORLD_WIDTH = 2400;
let player;
let left = false, right = false, jumpHeld = false, jumpPressed = false;
let dashLeft = false, dashRight = false;
let cameraX = 0;
const terrain = [
  { x: 0, y: 390, width: 650, height: 60 },
  { x: 750, y: 390, width: 700, height: 60 },
  { x: 1550, y: 390, width: 850, height: 60 },
  { x: 400, y: 335, width: 40, height: 55 },
  { x: 1100, y: 330, width: 45, height: 60 },
  { x: 1850, y: 335, width: 40, height: 55 },
  { x: 260, y: 270, width: 100, height: 20 },
  { x: 1260, y: 270, width: 120, height: 20 }
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
    const speed = (dashLeft || dashRight) ? 6 : 4;
    const dx = (right ? speed : 0) - (left ? speed : 0);
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

  bounce(top) {
    this.y = top - this.height;
    this.vy = -8;
    this.onGround = false;
  }

  draw(cameraX) {
    ctx.fillStyle = "#2765b0";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

let coins, enemies, score, defeated;

class Enemy {
  constructor(x, minX, maxX) {
    this.x = x;
    this.y = 360;
    this.width = 30;
    this.height = 30;
    this.minX = minX;
    this.maxX = maxX;
    this.dx = 1;
    this.alive = true;
  }

  update() {
    if (!this.alive) return;
    this.x += this.dx;
    if (this.x <= this.minX || this.x >= this.maxX) this.dx = -this.dx;
  }

  stomp() {
    this.alive = false;
  }

  draw(cameraX) {
    if (!this.alive) return;
    ctx.fillStyle = "#d64b5c";
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}

const goal = { x: 2300, y: 310, width: 35, height: 80 };
let state;

function start() {
  player = new Player();
  left = false; right = false; jumpHeld = false; jumpPressed = false;
  dashLeft = false; dashRight = false;
  cameraX = 0;
  score = 0;
  defeated = 0;
  coins = [
    { x: 460, y: 350, width: 20, height: 20, taken: false },
    { x: 960, y: 350, width: 20, height: 20, taken: false },
    { x: 1950, y: 350, width: 20, height: 20, taken: false }
  ];
  enemies = [new Enemy(900, 850, 990), new Enemy(1700, 1640, 1780)];
  state = "playing";
}

function update() {
  if (state !== "playing") return;
  const previousBottom = player.y + player.height;
  player.update(terrain);
  for (const coin of coins) {
    if (!coin.taken && overlaps(player, coin)) { coin.taken = true; score++; }
  }
  for (const enemy of enemies) enemy.update();
  if (player.y > canvas.height) state = "over";
  for (const enemy of enemies) {
    if (!enemy.alive || !overlaps(player, enemy)) continue;
    if (player.vy > 0 && previousBottom <= enemy.y) {
      enemy.stomp();
      player.bounce(enemy.y);
      defeated++;
    } else {
      state = "over";
      break;
    }
  }
  if (state === "playing" && overlaps(player, goal)) state = "clear";
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width,
    player.x + player.width / 2 - canvas.width / 2));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#7cb97a";
  for (const block of terrain) ctx.fillRect(block.x - cameraX, block.y, block.width, block.height);
  player.draw(cameraX);
  ctx.fillStyle = "#d99c18";
  for (const coin of coins) {
    if (!coin.taken) ctx.fillRect(coin.x - cameraX, coin.y, coin.width, coin.height);
  }
  for (const enemy of enemies) enemy.draw(cameraX);
  ctx.fillStyle = "#26334a";
  ctx.font = "22px sans-serif";
  ctx.fillText("コイン: " + score + " / " + coins.length, 20, 32);
  ctx.fillText("倒した敵: " + defeated + " / " + enemies.length, 520, 32);
  ctx.font = "17px sans-serif";
  ctx.fillText("←→ 移動   Shift ダッシュ   Space / ↑ ジャンプ   R 再挑戦", 20, 438);
  ctx.font = "22px sans-serif";
  ctx.fillStyle = "#8455a5";
  ctx.fillRect(goal.x - cameraX, goal.y, goal.width, goal.height);
  ctx.fillStyle = "#26334a";
  if (state === "over") ctx.fillText("ゲームオーバー！ R キーでもう一度", 180, 210);
  if (state === "clear") ctx.fillText("クリア！ R キーでもう一度", 240, 210);
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
  if (event.code === "ArrowLeft") left = true;
  if (event.code === "ArrowRight") right = true;
  if (event.code === "ShiftLeft") dashLeft = true;
  if (event.code === "ShiftRight") dashRight = true;
  if ((event.code === "Space" || event.code === "ArrowUp") && !jumpHeld) {
    jumpHeld = true;
    jumpPressed = true;
  }
});
window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") left = false;
  if (event.code === "ArrowRight") right = false;
  if (event.code === "ShiftLeft") dashLeft = false;
  if (event.code === "ShiftRight") dashRight = false;
  if (event.code === "Space" || event.code === "ArrowUp") jumpHeld = false;
});
window.addEventListener("blur", () => {
  left = false; right = false; jumpHeld = false; jumpPressed = false;
  dashLeft = false; dashRight = false;
});

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyR") start();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
