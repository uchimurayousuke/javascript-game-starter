"use strict";
const canvas = document.querySelector("#game-canvas"), ctx = canvas.getContext("2d");
let deck, hand, selected, score, plays, state, message, round, bonus, startBonus, reverse;
function shuffle(values) {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}
function deal() {
  while (hand.length < 7 && deck.length) hand.push(deck.pop());
}
function newRound() {
  deck = shuffle(Array.from({length: 24}, (_, i) => Math.floor(i / 4) + 1));
  hand = []; selected = []; score = startBonus; plays = 0; state = "playing"; message = "7枚の手札を見てみよう"; deal();
}
function start() { round = 1; bonus = 1; startBonus = 0; reverse = false; newRound(); }
function update() {}
function draw() {
  ctx.clearRect(0, 0, 800, 450); ctx.fillStyle = "#ecf4e9"; ctx.fillRect(0, 0, 800, 450);
  ctx.fillStyle = "#203c32"; ctx.font = "bold 25px sans-serif"; ctx.fillText("数字カードで得点づくり", 28, 42);
  ctx.font = "17px sans-serif";
  const target = 70;
  ctx.fillText("得点 " + score + " / " + target + "　提出 " + plays + " / 3　山札 " + deck.length, 28, 76);
  ctx.fillText("3つ同じ ×4 / 連番 ×3 / 2つ同じ ×2 / そのほか ×1", 28, 106);
  hand.forEach((value, index) => {
    const x = 28 + index * 105, y = selected.includes(index) ? 164 : 174;
    ctx.fillStyle = selected.includes(index) ? "#f6cf68" : "#ffffff"; ctx.fillRect(x, y, 90, 112);
    ctx.strokeStyle = "#365c4d"; ctx.lineWidth = 2; ctx.strokeRect(x, y, 90, 112);
    ctx.fillStyle = "#203c32"; ctx.font = "bold 38px sans-serif"; ctx.fillText(String(value), x + 34, y + 65);
    ctx.font = "16px sans-serif"; ctx.fillText(String(index + 1), x + 10, y + 24);
  });
  ctx.fillStyle = "#203c32"; ctx.font = "18px sans-serif";
  ctx.fillText("手札に7枚の数字を配ります", 28, 323);
  ctx.fillText(message, 28, 358);
  ctx.fillText("カードの合計 × 組合せの倍率 = 得点", 28, 395);
}
window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
});
canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect(), x = (event.clientX - rect.left) * 800 / rect.width, y = (event.clientY - rect.top) * 450 / rect.height;
});
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
start(); gameLoop();
