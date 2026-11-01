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
// playing: プレイ中、clear: クリア、gameover: 失敗
let gameState = "playing";

// 初回と再挑戦の初期状態を用意します。
function start() {
  // 初回と再挑戦の両方で、同じ初期設定を使います。
  playerX = (canvas.width - playerWidth) / 2;
  coinX = canvas.width / 2;
  coinY = 80;
  clearKeys();
  score = 0;
  lives = startingLives;
  gameState = "playing";
}

// 毎フレーム呼ばれます。
function update() {
  // 終了後は位置や得点を更新しません。描画は続けます。
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
    event.preventDefault();
  }
  if (event.code === "ArrowRight") {
    rightPressed = true;
    event.preventDefault();
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (gameState !== "playing") {
      // ゲームループを増やさず、データだけを最初に戻します。
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
  ctx.fillText("コイン: " + score + " / " + targetScore, 24, 38);
  ctx.fillText("のこり: " + lives, 650, 38);

  ctx.font = "18px sans-serif";
  ctx.fillText("← →：移動 / " + targetScore + "枚でクリア / " + startingLives + "回ミスで終了", 24, 430);

  if (gameState !== "playing") {
    // 背景を薄く覆い、結果を中央に重ねて描きます。
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
    ctx.fillText("Space キーでもう一度", canvas.width / 2, 295);
    // 次のフレームの得点表示が左寄せになるように戻します。
    ctx.textAlign = "left";
  }
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
