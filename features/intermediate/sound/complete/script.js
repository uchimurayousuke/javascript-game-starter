"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let volume, muted, message;
let audioContext = null;
async function playSound() {
  if (muted || volume === 0) { message = "ミュート中"; return; }
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { message = "この環境では音を使えません"; return; }
    if (!audioContext) audioContext = new Audio();
    if (audioContext.state === "suspended") await audioContext.resume();
    if (audioContext.state !== "running") { message = "音を再生できません"; return; }
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.frequency.value = 440; gain.gain.value = volume;
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + 0.08);
    message = "音を再生しました";
  } catch (error) { message = "音を再生できません"; }
}

function start() {
  volume = 0.25; muted = false; message = "Spaceで音を試す";
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "28px sans-serif";
  ctx.fillText(message, 160, 140);
  ctx.fillText("Space: 音を試す / R: 最初から", 160, 360);
  ctx.fillText("音量 " + volume + " / " + (muted ? "ミュート" : "音あり"), 160, 210);
  ctx.fillText("V: 音量　M: ミュート", 160, 270);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  if (event.key === " ") { event.preventDefault(); playSound(); }
  else if (key === "v") volume = volume === 0 ? 0.25 : volume === 0.25 ? 0.5 : 0;
  else if (key === "m") muted = !muted;
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
