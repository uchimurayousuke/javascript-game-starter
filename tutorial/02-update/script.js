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

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  coinX = canvas.width / 2;
  coinY = 80;
}

// 毎フレーム呼ばれます。
function update() {
  // 1フレームごとに y を増やすと、下へ進みます。
  coinY += coinSpeed;

  // コイン全体が画面の下へ出たら、上に戻します。
  if (coinY - coinRadius > canvas.height) {
    resetCoin();
  }
}

function resetCoin() {
  // Math.random() は 0 以上 1 未満の数を返します。
  // コインの左右が画面からはみ出さない範囲を選びます。
  coinX = coinRadius + Math.random() * (canvas.width - coinRadius * 2);
  coinY = -coinRadius;
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  // 前の絵を消してから、今の位置に描き直します。
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 受け皿: 左上の x、y、幅、高さを指定します。
  ctx.fillStyle = "#2563eb";
  ctx.fillRect(playerX, playerY, playerWidth, playerHeight);

  // コイン: 中心の x、y、半径、開始角度、終了角度を指定します。
  ctx.fillStyle = "#f5b942";
  ctx.beginPath();
  ctx.arc(coinX, coinY, coinRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#172b4d";
  ctx.font = "22px sans-serif";
  ctx.fillText("コイン: 0", 24, 38);
}

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
