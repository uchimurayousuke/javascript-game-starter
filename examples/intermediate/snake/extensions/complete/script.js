"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const cell = 30, boardX = 80, boardY = 70;
const obstacles = [{x: 4, y: 2}, {x: 5, y: 2}, {x: 6, y: 2}];
let snake, direction, nextDirection, lastMove, food, score, state, bonus, bonusUntil;

function start() {
  snake = [{x: 4, y: 4}, {x: 3, y: 4}, {x: 2, y: 4}];
  direction = {x: 1, y: 0};
  nextDirection = {x: 1, y: 0};
  lastMove = performance.now();
  score = 0;
  state = "playing";
  bonus = null;
  bonusUntil = 0;
  placeFood();
}

function update() {
  if (state !== "playing") return;
  if (bonus && performance.now() >= bonusUntil) bonus = null;
  const interval = Math.max(80, 200 - score * 20);
  if (performance.now() - lastMove < interval) return;
  lastMove = performance.now();
  direction = nextDirection;
  const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
  if (head.x < 0 || head.x > 9 || head.y < 0 || head.y > 9) {
    state = "over";
    return;
  }
  if (obstacles.some(part => part.x === head.x && part.y === head.y)) {
    state = "over";
    return;
  }
  const normal = head.x === food.x && head.y === food.y;
  const bonusEaten = bonus !== null && head.x === bonus.x && head.y === bonus.y;
  const eating = normal || bonusEaten;
  for (let i = 0; i < snake.length; i++) {
    if (!eating && i === snake.length - 1) continue;
    if (snake[i].x === head.x && snake[i].y === head.y) {
      state = "over";
      return;
    }
  }
  snake.unshift(head);
  if (eating) {
    score += bonusEaten ? 2 : 1;
    if (bonusEaten) bonus = null;
    if (score >= 5) {
      state = "clear";
    } else {
      if (normal) placeFood();
      if (score >= 2 && bonus === null) placeBonus();
    }
  } else {
    snake.pop();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#c6d2df";
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      ctx.strokeRect(boardX + col * cell, boardY + row * cell, cell, cell);
    }
  }
  ctx.fillStyle = "#5a6573";
  for (const block of obstacles) {
    ctx.fillRect(boardX + block.x * cell + 1, boardY + block.y * cell + 1, cell - 2, cell - 2);
  }
  ctx.fillStyle = "#2d8c58";
  for (const part of snake) {
    ctx.fillRect(boardX + part.x * cell + 1, boardY + part.y * cell + 1, cell - 2, cell - 2);
  }
  ctx.fillStyle = "#145a38";
  ctx.fillRect(boardX + snake[0].x * cell + 1, boardY + snake[0].y * cell + 1, cell - 2, cell - 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(boardX + snake[0].x * cell + 8, boardY + snake[0].y * cell + 9, 4, 4);
  ctx.fillRect(boardX + snake[0].x * cell + 18, boardY + snake[0].y * cell + 9, 4, 4);
  if (food !== null) {
    ctx.fillStyle = "#dc5544";
    ctx.fillRect(boardX + food.x * cell + 4, boardY + food.y * cell + 4, cell - 8, cell - 8);
  }
  if (bonus) {
    ctx.fillStyle = "#a443ac";
    ctx.fillRect(boardX + bonus.x * cell + 4, boardY + bonus.y * cell + 4, cell - 8, cell - 8);
  }
  ctx.fillStyle = "#26334a";
  ctx.font = "24px sans-serif";
  ctx.fillText("濃い緑が頭 / 紫は2点・5秒", 430, 300);
  ctx.fillText("得点: " + score + " / 5", 430, 130);
  ctx.fillText("間隔: " + Math.max(80, 200 - score * 20) + "ミリ秒", 430, 270);
  if (state === "playing") {
    ctx.fillText("矢印キーで食べ物へ", 430, 190);
  } else {
    if (state === "clear") {
      ctx.fillText("クリア！", 430, 190);
    } else {
      ctx.fillText("ぶつかった！", 430, 190);
    }
    ctx.fillText("R キーでもう一度", 430, 240);
  }
}

function placeBonus() {
  const empty = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const blocked = obstacles.some(block => block.x === col && block.y === row);
      const body = snake.some(part => part.x === col && part.y === row);
      const normal = food.x === col && food.y === row;
      if (!blocked && !body && !normal) empty.push({x: col, y: row});
    }
  }
  if (empty.length > 0) {
    bonus = empty[Math.floor(Math.random() * empty.length)];
    bonusUntil = performance.now() + 5000;
  }
}

function placeFood() {
  const empty = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      let occupied = obstacles.some(block => block.x === col && block.y === row);
      if (bonus && bonus.x === col && bonus.y === row) occupied = true;
      for (const part of snake) {
        if (part.x === col && part.y === row) occupied = true;
      }
      if (!occupied) empty.push({x: col, y: row});
    }
  }
  if (empty.length === 0) {
    state = "clear";
    food = null;
    return;
  }
  food = empty[Math.floor(Math.random() * empty.length)];
}

window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (state !== "playing") {
    if (event.key.toLowerCase() === "r") start();
    return;
  }
  if (event.key === "ArrowUp" && direction.y !== 1) nextDirection = {x: 0, y: -1};
  if (event.key === "ArrowDown" && direction.y !== -1) nextDirection = {x: 0, y: 1};
  if (event.key === "ArrowLeft" && direction.x !== 1) nextDirection = {x: -1, y: 0};
  if (event.key === "ArrowRight" && direction.x !== -1) nextDirection = {x: 1, y: 0};
  if (event.key.startsWith("Arrow")) event.preventDefault();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
