"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const playerWidth = 110;
const playerHeight = 18;
const playerY = 385;
let playerX = (canvas.width - playerWidth) / 2;

const coinRadius = 14;
const coinSpeed = 3;
let coinX = canvas.width / 2;
let coinY = 80;

function start() {
  coinX = canvas.width / 2;
  coinY = 80;
}

function update() {
  coinY += coinSpeed;

  if (coinY - coinRadius > canvas.height) {
    resetCoin();
  }
}

function resetCoin() {
  coinX = coinRadius + Math.random() * (canvas.width - coinRadius * 2);
  coinY = -coinRadius;
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

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
