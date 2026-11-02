"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let playerX, left = false, right = false;
const playerY = 400, playerWidth = 40;
let bullets, firing = false, cooldown, enemies, spawnTimer, score, state, spawnCount, enemyBullets, lives, invulnerable, enemyShotTimer;

function start() {
  playerX = 380; left = false; right = false;
  bullets = []; firing = false; cooldown = 0;
  enemies = []; spawnTimer = 0; score = 0; state = "playing"; spawnCount = 0;
  enemyBullets = []; lives = 3; invulnerable = 0; enemyShotTimer = 120;
}

function update() {
  if (state !== "playing") return;
  if (left) playerX -= 6;
  if (right) playerX += 6;
  playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));
  if (cooldown > 0) cooldown--;
  if (firing && cooldown === 0) {
    bullets.push({ x: playerX + playerWidth / 2 - 3, y: playerY });
    cooldown = 12;
  }
  for (const bullet of bullets) bullet.y -= 8;
  bullets = bullets.filter((bullet) => bullet.y + 12 >= 0);
  spawnTimer--;
  if (spawnTimer <= 0) {
    const tough = spawnCount % 2 === 1;
    enemies.push({ x: Math.random() * (canvas.width - 30), y: -30, size: 30,
      speed: tough ? 2 : 1, hp: tough ? 2 : 1 });
    spawnCount++;
    spawnTimer = 60;
  }
  for (const enemy of enemies) enemy.y += enemy.speed;
  for (const bullet of bullets) {
    for (const enemy of enemies) {
      if (!bullet.hit && !enemy.hit && bullet.x < enemy.x + enemy.size &&
          bullet.x + 6 > enemy.x && bullet.y < enemy.y + enemy.size && bullet.y + 12 > enemy.y) {
        bullet.hit = true;
        enemy.hp--;
        if (enemy.hp <= 0) { enemy.hit = true; score++; }
      }
    }
  }
  bullets = bullets.filter((bullet) => !bullet.hit);
  enemies = enemies.filter((enemy) => !enemy.hit);
  if (invulnerable > 0) invulnerable--;
  enemyShotTimer--;
  if (enemyShotTimer <= 0 && enemies.length > 0) {
    enemyBullets.push({x: enemies[0].x + enemies[0].size / 2 - 3, y: enemies[0].y + enemies[0].size});
    enemyShotTimer = 120;
  }
  for (const shot of enemyBullets) {
    shot.y += 4;
    if (shot.x < playerX + playerWidth && shot.x + 6 > playerX &&
        shot.y < playerY + 22 && shot.y + 12 > playerY) {
      shot.hit = true;
      if (invulnerable === 0) {
        lives--;
        invulnerable = 90;
        if (lives === 0) state = "over";
      }
    }
  }
  enemyBullets = enemyBullets.filter(shot => !shot.hit && shot.y < canvas.height);
  if (enemies.some((enemy) => enemy.y + enemy.size >= canvas.height)) state = "over";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2269b4";
  ctx.fillRect(playerX, playerY, playerWidth, 22);
  ctx.fillStyle = "#edaa27";
  for (const shot of enemyBullets) ctx.fillRect(shot.x, shot.y, 6, 12);
  for (const bullet of bullets) ctx.fillRect(bullet.x, bullet.y, 6, 12);
  for (const enemy of enemies) {
    ctx.fillStyle = enemy.hp > 1 ? "#913d64" : "#e34b5f";
    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
  }
  ctx.fillStyle = "#26334a"; ctx.font = "24px sans-serif";
  ctx.fillText("得点: " + score + "  残り: " + lives, 20, 35);
  if (invulnerable > 0) ctx.fillText("無敵中", 650, 35);
  if (state === "over") ctx.fillText("ゲームオーバー！ R キーでもう一度", 180, 225);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault();
  if (event.key === "ArrowLeft") left = true;
  if (event.key === "ArrowRight") right = true;
});
window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") left = false;
  if (event.key === "ArrowRight") right = false;
});
window.addEventListener("blur", () => { left = false; right = false; });
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") { event.preventDefault(); firing = true; }
});
window.addEventListener("keyup", (event) => {
  if (event.code === "Space") firing = false;
});
window.addEventListener("blur", () => { firing = false; });
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") start();
});
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
