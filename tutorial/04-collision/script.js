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

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  playerX = (canvas.width - playerWidth) / 2;
  coinX = canvas.width / 2;
  coinY = 80;
  clearKeys();
  score = 0;
}

// 毎フレーム呼ばれます。
function update() {
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
    resetCoin();
  } else if (coinY - coinRadius > canvas.height) {
    // STEP 04 では落としてもペナルティはありません。
    resetCoin();
  }
}

function coinTouchesPlayer() {
  // コインを囲む四角と受け皿の四角が重なるかを調べます。
  // 上下の条件2つと、左右の条件2つをすべて満たせばキャッチです。
  return (
    coinY + coinRadius >= playerY &&
    coinY - coinRadius <= playerY + playerHeight &&
    coinX + coinRadius >= playerX &&
    coinX - coinRadius <= playerX + playerWidth
  );
}

function resetCoin() {
  // Math.random() は 0 以上 1 未満の数を返します。
  // コインの左右が画面からはみ出さない範囲を選びます。
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

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
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
  ctx.fillText("コイン: " + score, 24, 38);
  ctx.fillText("← → キーで移動", 24, 430);
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
// 別のタブへ移ったときに、キーが押されたままになるのを防ぎます。
window.addEventListener("blur", clearKeys);

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
