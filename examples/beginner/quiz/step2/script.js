"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const questions = [
  {text: "3 + 4 は？", choices: ["6", "7", "8"], answer: 1, explanation: "3 + 4 = 7"},
  {text: "10 - 6 は？", choices: ["4", "3", "5"], answer: 0, explanation: "10 - 6 = 4"},
  {text: "2 × 3 は？", choices: ["5", "7", "6"], answer: 2, explanation: "2を3回足すと6"},
  {text: "8 ÷ 2 は？", choices: ["2", "6", "4"], answer: 2, explanation: "8を2つに分けると4"},
  {text: "5 + 4 は？", choices: ["9", "8", "10"], answer: 0, explanation: "5 + 4 = 9"}
];
let order, index, score, state, message;

function start() {
  order = questions.slice(0, 1);
  index = 0; score = 0; state = "answer"; message = "";
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "26px sans-serif";
  if (state === "result") {
    ctx.fillText("結果 " + score + " / 1", 80, 120);
    ctx.fillText("R で再開", 80, 180);
    return;
  }
  const q = order[index];
  ctx.fillText("問題 " + (index + 1) + " / " + (1), 80, 60);
  ctx.fillText(q.text, 80, 110);
  for (let i = 0; i < q.choices.length; i++) ctx.fillText((i + 1) + ": " + q.choices[i], 100, 180 + i * 55);
  ctx.fillText("1〜3の選択肢", 80, 380);
}



function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
