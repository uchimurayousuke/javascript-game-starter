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
  hand = []; selected = []; score = startBonus; plays = 0; state = "playing"; message = "3枚選んで決定しよう"; deal();
}
function start() { round = 1; bonus = 1; startBonus = 0; reverse = false; newRound(); }
function selectCard(index) {
  if (state !== "playing" || index < 0 || index >= hand.length) return;
  if (selected.includes(index)) selected = selected.filter(i => i !== index);
  else if (selected.length < 3) selected.push(index);
  else message = "選べるのは3枚までです";
}
function evaluateCards(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((total, value) => total + value, 0);
  let multiplier = 1, name = "そのほか";
  if (sorted[0] === sorted[2]) { multiplier = 4; name = "3つ同じ"; }
  else if (sorted[0] + 1 === sorted[1] && sorted[1] + 1 === sorted[2]) { multiplier = 3; name = "連番"; }
  else if (sorted[0] === sorted[1] || sorted[1] === sorted[2]) { multiplier = 2; name = "2つ同じ"; }
  return {sum, multiplier, name, points: sum * multiplier};
}
function submit() {
  if (state !== "playing") return;
  if (selected.length !== 3) { message = "3枚選んでください"; return; }
  const result = evaluateCards(selected.map(index => hand[index]));
  score += result.points; plays++;
  hand = hand.filter((_, index) => !selected.includes(index)); selected = []; deal();
  message = result.name + "：" + result.sum + " × " + result.multiplier + " = " + result.points + "点";
}
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
  ctx.fillText("1〜7 またはクリックで選択 / Enterで決定", 28, 323);
  ctx.fillText(message, 28, 358);
  ctx.fillText("カードの合計 × 組合せの倍率 = 得点", 28, 395);
}
window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
  if (/^[1-7]$/.test(event.key)) selectCard(Number(event.key) - 1);
  if (event.key === "Enter") submit();
});
canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect(), x = (event.clientX - rect.left) * 800 / rect.width, y = (event.clientY - rect.top) * 450 / rect.height;
  const index = Math.floor((x - 28) / 105);
  if (index >= 0 && index < hand.length && x >= 28 + index * 105 && x <= 118 + index * 105 && y >= 164 && y <= 286) selectCard(index);
});
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
start(); gameLoop();
