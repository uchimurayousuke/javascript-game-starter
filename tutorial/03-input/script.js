"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const playerWidth = 110;
const playerHeight = 18;
const playerY = 385;
const playerSpeed = 6;
let playerX = (canvas.width - playerWidth) / 2;

const coinRadius = 14;
const coinSpeed = 3;
let coinX = canvas.width / 2;
let coinY = 80;

// キーが「押されているか」を true / false で覚えます。
let leftPressed = false;
let rightPressed = false;

function start() {
  playerX = (canvas.width - playerWidth) / 2;
  coinX = canvas.width / 2;
  coinY = 80;
  clearKeys();
}

function update() {
  if (leftPressed) {
    playerX -= playerSpeed;
  }
  if (rightPressed) {
    playerX += playerSpeed;
  }

  // 受け皿全体が画面の中に収まるようにします。
  playerX = Math.max(0, Math.min(playerX, canvas.width - playerWidth));

  coinY += coinSpeed;
  if (coinY - coinRadius > canvas.height) {
    resetCoin();
  }
}

function resetCoin() {
  coinX = coinRadius + Math.random() * (canvas.width - coinRadius * 2);
  coinY = -coinRadius;
}

function handleKeyDown(event) {
  if (event.code === "ArrowLeft") {
    leftPressed = true;
    event.preventDefault(); // 矢印キーでページがスクロールするのを防ぎます。
  }
  if (event.code === "ArrowRight") {
    rightPressed = true;
    event.preventDefault();
  }
}

function handleKeyUp(event) {
  if (event.code === "ArrowLeft") {
    leftPressed = false;
  }
  if (event.code === "ArrowRight") {
    rightPressed = false;
  }
}

function clearKeys() {
  leftPressed = false;
  rightPressed = false;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2563eb";
  ctx.fillRect(playerX, playerY, playerWidth, playerHeight);

  ctx.fillStyle = "#f5b942";
  ctx.beginPath();
  ctx.arc(coinX, coinY, coinRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#172b4d";
  ctx.font = "22px sans-serif";
  ctx.fillText("コイン: 0", 24, 38);
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
// 別のタブへ移ったときに、キーが押されたままになるのを防ぎます。
window.addEventListener("blur", clearKeys);

// このゲームループは全ステップで共通です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
