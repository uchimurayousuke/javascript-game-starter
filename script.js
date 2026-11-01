"use strict";

// ===== まずはここを変えてみよう =====
const GAME_SECONDS = 20; // 制限時間（秒）
const POINTS_PER_HIT = 1; // 1回押したときの得点

// ===== 画面の部品 =====
const screens = {
  start: document.querySelector("#start-screen"),
  play: document.querySelector("#play-screen"),
  result: document.querySelector("#result-screen"),
};
const scoreOutput = document.querySelector("#score");
const timeOutput = document.querySelector("#time");
const finalScore = document.querySelector("#final-score");
const gameArea = document.querySelector("#game-area");
const targetButton = document.querySelector("#target-button");

let score = 0;
let timeLeft = GAME_SECONDS;
let timerId = null;
let isPlaying = false;

function showScreen(name) {
  for (const [screenName, element] of Object.entries(screens)) {
    element.hidden = screenName !== name;
  }
}

function updateStatus() {
  scoreOutput.value = String(score);
  timeOutput.value = String(timeLeft);
}

// ===== ゲームのルール：ここから自分のアイデアに変えていこう =====
function moveTarget() {
  const maxX = Math.max(0, gameArea.clientWidth - targetButton.offsetWidth);
  const maxY = Math.max(0, gameArea.clientHeight - targetButton.offsetHeight);

  targetButton.style.left = `${Math.floor(Math.random() * (maxX + 1))}px`;
  targetButton.style.top = `${Math.floor(Math.random() * (maxY + 1))}px`;
}

function hitTarget() {
  if (!isPlaying) return;

  score += POINTS_PER_HIT;
  updateStatus();
  moveTarget();
}

function finishGame() {
  isPlaying = false;
  clearInterval(timerId);
  timerId = null;
  finalScore.textContent = String(score);
  showScreen("result");
  document.querySelector("#restart-button").focus();
}

function startGame() {
  clearInterval(timerId);
  score = 0;
  timeLeft = GAME_SECONDS;
  isPlaying = true;
  updateStatus();
  showScreen("play");
  moveTarget();
  targetButton.focus();

  timerId = setInterval(() => {
    timeLeft -= 1;
    updateStatus();
    if (timeLeft <= 0) finishGame();
  }, 1000);
}

document.querySelector("#start-button").addEventListener("click", startGame);
document.querySelector("#restart-button").addEventListener("click", startGame);
targetButton.addEventListener("click", hitTarget);
window.addEventListener("resize", () => {
  if (isPlaying) moveTarget();
});

updateStatus();
