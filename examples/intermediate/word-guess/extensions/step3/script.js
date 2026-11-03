"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const words4 = [{word:"BIRD", meaning:"鳥"}, {word:"FISH", meaning:"魚"}, {word:"TREE", meaning:"木"}, {word:"MOON", meaning:"月"}, {word:"NOON", meaning:"正午"}, {word:"BOOK", meaning:"本"}, {word:"ROOM", meaning:"部屋"}, {word:"STAR", meaning:"星"}, {word:"LEAF", meaning:"葉"}, {word:"SNOW", meaning:"雪"}, {word:"RAIN", meaning:"雨"}, {word:"FOOD", meaning:"食べ物"}, {word:"FROG", meaning:"カエル"}, {word:"DUCK", meaning:"アヒル"}];
const words5 = [{word:"APPLE", meaning:"りんご"}, {word:"GRAPE", meaning:"ぶどう"}, {word:"PEACH", meaning:"もも"}, {word:"SHEEP", meaning:"ひつじ"}, {word:"PLANT", meaning:"植物"}, {word:"STONE", meaning:"石"}, {word:"BREAD", meaning:"パン"}, {word:"HEART", meaning:"心"}];
const words = words5;
const wordLength = 5;
const maxRows = 6;
let answer, rows, draft, state, message, stats;

function start() {
  answer = words[Math.floor(Math.random() * words.length)].word;
  rows = []; draft = ""; state = "playing"; message = "";
  try { stats = JSON.parse(localStorage.getItem("word-guess-stats") || "null"); } catch { stats = null; }
  if (!stats || !Number.isInteger(stats.played) || !Number.isInteger(stats.won) || stats.played < 0 || stats.won < 0 || stats.won > stats.played) stats = {played:0, won:0};
}

function judge(guess, target) {
  const result = Array(wordLength).fill("absent");
  const remaining = {};
  for (let i = 0; i < wordLength; i++) {
    if (guess[i] === target[i]) result[i] = "exact";
    else remaining[target[i]] = (remaining[target[i]] || 0) + 1;
  }
  for (let i = 0; i < wordLength; i++) {
    if (result[i] === "exact") continue;
    if ((remaining[guess[i]] || 0) > 0) { result[i] = "present"; remaining[guess[i]]--; }
  }
  return result;
}
function handleKey(event) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (state !== "playing" && event.key === " ") { event.preventDefault(); start(); return; }
  if (state !== "playing") return;
  if (event.key === "Backspace") { event.preventDefault(); draft = draft.slice(0, -1); message = ""; return; }
  if (/^[a-zA-Z]$/.test(event.key) && draft.length < wordLength) { draft += event.key.toUpperCase(); message = ""; return; }
  if (event.key !== "Enter") return;
  if (draft.length !== wordLength || !words.some(item => item.word === draft)) { message = "候補のことばを入力してください"; return; }
  const result = judge(draft, answer);
  rows.push({word:draft, result});
  if (draft === answer) { state = "clear"; message = "正解！"; }
  else if (rows.length >= maxRows) { state = "over"; message = "答えは " + answer; }
  if (state !== "playing") {
    stats.played++; if (state === "clear") stats.won++;
    try { localStorage.setItem("word-guess-stats", JSON.stringify(stats)); } catch {}
  }
  draft = "";
}
function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1f3d5b"; ctx.font = "22px sans-serif";
  ctx.fillText(wordLength + "文字ことば当て", 30, 38);
  ctx.font = "16px sans-serif";
  ctx.fillText("候補と意味", 390, 70);
  const rowsPerColumn = Math.ceil(words.length / 2);
  words.forEach((item, i) => ctx.fillText(item.word + "：" + item.meaning, 390 + Math.floor(i / rowsPerColumn) * 190, 100 + (i % rowsPerColumn) * 25));
  ctx.fillText("緑：位置も文字も同じ", 390, 285);
  ctx.fillText("黄：別の場所に残っている", 390, 308);
  ctx.fillText("灰：残りの文字にはない", 390, 331);
  for (let row = 0; row < maxRows; row++) {
    const entry = rows[row];
    for (let col = 0; col < wordLength; col++) {
      const x = 30 + col * 48, y = 60 + row * 46;
      const color = entry ? entry.result[col] : "empty";
      ctx.fillStyle = color === "exact" ? "#23835d" : color === "present" ? "#a06c00" : color === "absent" ? "#576579" : "#eaf5fb";
      ctx.fillRect(x, y, 42, 40);
      ctx.fillStyle = entry ? "white" : "#1f3d5b"; ctx.font = "bold 23px sans-serif";
      ctx.fillText(entry ? entry.word[col] : row === rows.length ? (draft[col] || "") : "", x + 12, y + 28);
    }
  }
  ctx.fillStyle = "#1f3d5b"; ctx.font = "16px sans-serif";
  ctx.fillText(message, 30, 342);
  if (state !== "playing") ctx.fillText("Spaceで再挑戦", 490, 425);
  for (let row = 0; row < keyboard.length; row++) for (let col = 0; col < keyboard[row].length; col++) {
    ctx.fillStyle = "#d8eaf5"; ctx.fillRect(30 + col * 31, 350 + row * 28, 28, 25);
    ctx.fillStyle = "#1f3d5b"; ctx.fillText(keyboard[row][col], 37 + col * 31, 368 + row * 28);
  }
  ctx.fillStyle = "#d8eaf5"; ctx.fillRect(360, 350, 90, 30); ctx.fillRect(360, 385, 90, 30);
  ctx.fillStyle = "#1f3d5b"; ctx.fillText("消す", 380, 371); ctx.fillText(state === "playing" ? "決定" : "再挑戦", 375, 406);
  ctx.fillText("記録：" + stats.won + "勝 / " + stats.played + "回", 490, 385);
}

window.addEventListener("keydown", handleKey);
const keyboard = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  for (let row = 0; row < keyboard.length; row++) {
    for (let col = 0; col < keyboard[row].length; col++) {
      if (x >= 30 + col * 31 && x < 58 + col * 31 && y >= 350 + row * 28 && y < 375 + row * 28) handleKey({key:keyboard[row][col], repeat:false, preventDefault(){}});
    }
  }
  if (x >= 360 && x <= 450 && y >= 350 && y <= 380) handleKey({key:"Backspace", repeat:false, preventDefault(){}});
  if (x >= 360 && x <= 450 && y >= 385 && y <= 415) handleKey({key:state === "playing" ? "Enter" : " ", repeat:false, preventDefault(){}});
});
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
