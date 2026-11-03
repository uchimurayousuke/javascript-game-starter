"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const words4 = [{word:"BIRD", meaning:"鳥"}, {word:"FISH", meaning:"魚"}, {word:"TREE", meaning:"木"}, {word:"MOON", meaning:"月"}, {word:"NOON", meaning:"正午"}, {word:"BOOK", meaning:"本"}, {word:"ROOM", meaning:"部屋"}, {word:"STAR", meaning:"星"}, {word:"LEAF", meaning:"葉"}, {word:"SNOW", meaning:"雪"}, {word:"RAIN", meaning:"雨"}, {word:"FOOD", meaning:"食べ物"}, {word:"FROG", meaning:"カエル"}, {word:"DUCK", meaning:"アヒル"}];
const words = words4;
const wordLength = 4;
const maxRows = 6;
let answer, rows, draft, state, message;

function start() {
  answer = words[Math.floor(Math.random() * words.length)].word;
  rows = []; draft = ""; state = "playing"; message = "";
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
  if (state !== "playing") return;
  if (event.key === "Backspace") { event.preventDefault(); draft = draft.slice(0, -1); message = ""; return; }
  if (/^[a-zA-Z]$/.test(event.key) && draft.length < wordLength) { draft += event.key.toUpperCase(); message = ""; return; }
  if (event.key !== "Enter") return;
  if (draft.length !== wordLength || !words.some(item => item.word === draft)) { message = "候補のことばを入力してください"; return; }
  const result = judge(draft, answer);
  rows.push({word:draft, result});
  if (draft === answer) { state = "clear"; message = "正解！"; }
  else if (rows.length >= maxRows) { state = "over"; message = "答えは " + answer; }
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
  ctx.fillText("英字を入力、Backspaceで消す、Enterで決定", 30, 385);
}

window.addEventListener("keydown", handleKey);
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
