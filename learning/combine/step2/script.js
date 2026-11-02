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

let leftPressed = false;
let rightPressed = false;
let score = 0;

const targetScore = 5;
const startingLives = 3;
let lives = startingLives;
let gameState = "menu";

function start() {
  playerX = (canvas.width - playerWidth) / 2;
  coinX = canvas.width / 2;
  coinY = 80;
  clearKeys();
  score = 0;
  lives = startingLives;
  gameState = "playing";
}

function update() {
  if (gameState !== "playing") {
    return;
  }

  if (leftPressed) {
    playerX -= playerSpeed;
  }
  if (rightPressed) {
    playerX += playerSpeed;
  }
  playerX = Math.max(0, Math.min(playerX, canvas.width - playerWidth));

  coinY += coinSpeed;

  if (coinTouchesPlayer()) {
    score += 1;
    if (score >= targetScore) {
      gameState = "clear";
    } else {
      resetCoin();
    }
  } else if (coinY - coinRadius > canvas.height) {
    lives -= 1;
    if (lives === 0) {
      gameState = "gameover";
    } else {
      resetCoin();
    }
  }
}

function coinTouchesPlayer() {
  return (
    coinY + coinRadius >= playerY &&
    coinY - coinRadius <= playerY + playerHeight &&
    coinX + coinRadius >= playerX &&
    coinX - coinRadius <= playerX + playerWidth
  );
}

function resetCoin() {
  coinX = coinRadius + Math.random() * (canvas.width - coinRadius * 2);
  coinY = -coinRadius;
}

function handleKeyDown(event) {
  if (gameState === "menu" && event.code === "Enter") {
    start();
    return;
  }
  if (gameState === "playing" && event.code === "ArrowLeft") {
    leftPressed = true;
    event.preventDefault();
  }
  if (gameState === "playing" && event.code === "ArrowRight") {
    rightPressed = true;
    event.preventDefault();
  }
  if ((gameState === "clear" || gameState === "gameover") && event.code === "KeyM") {
    clearKeys();
    gameState = "menu";
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (gameState === "clear" || gameState === "gameover") {
      start();
    }
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

  if (gameState === "menu") {
    ctx.fillStyle = "#172b4d";
    ctx.font = "32px sans-serif";
    ctx.fillText("コインキャッチ", 260, 180);
    ctx.font = "22px sans-serif";
    ctx.fillText("Enterでスタート", 290, 250);
    return;
  }

  ctx.fillStyle = "#2563eb";
  ctx.fillRect(playerX, playerY, playerWidth, playerHeight);

  ctx.fillStyle = "#f5b942";
  ctx.beginPath();
  ctx.arc(coinX, coinY, coinRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#172b4d";
  ctx.font = "22px sans-serif";
  ctx.fillText("コイン: " + score + " / " + targetScore, 24, 38);
  ctx.fillText("のこり: " + lives, 650, 38);

  ctx.font = "18px sans-serif";
  ctx.fillText("← →：移動 / " + targetScore + "枚でクリア / " + startingLives + "回ミスで終了", 24, 430);

  if (gameState !== "playing") {
    ctx.fillStyle = "rgba(247, 251, 255, 0.92)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let message = "ゲームオーバー";
    if (gameState === "clear") {
      message = "クリア！";
    }

    ctx.fillStyle = "#172b4d";
    ctx.textAlign = "center";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(message, canvas.width / 2, 195);
    ctx.font = "24px sans-serif";
    ctx.fillText("集めたコイン: " + score + " 枚", canvas.width / 2, 245);
    ctx.fillText("Space: もう一度 / M: メニュー", canvas.width / 2, 295);
    ctx.textAlign = "left";
  }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", clearKeys);

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
