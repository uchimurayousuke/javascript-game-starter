"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

class Card {
  constructor(kind, label, amount) {
    this.kind = kind;
    this.label = label;
    this.amount = amount;
  }

  draw(x, y) {
    ctx.fillStyle = "#f8dc8b";
    ctx.fillRect(x, y, 160, 110);
    ctx.fillStyle = "#26334a";
    ctx.font = "22px sans-serif";
    ctx.fillText(this.label, x + 15, y + 40);
    ctx.fillText("効果 " + this.amount, x + 15, y + 75);
  }
}

class Character {
  constructor(name, maxHp) {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.block = 0;
  }

  takeDamage(amount) {
    const blocked = Math.min(this.block, amount);
    this.block -= blocked;
    this.hp = Math.max(0, this.hp - (amount - blocked));
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

}

let player, enemy, hand, deck, discard, action, state, message, intent;

function start() {
  player = new Character("自分", 30);
  enemy = new Character("敵", 24);
  deck = [];
  discard = [];
  hand = [];
  for (let i = 0; i < 3; i++) {
    deck.push(new Card("attack", "攻撃", 6));
    deck.push(new Card("defend", "防御", 4));
    deck.push(new Card("heal", "回復", 5));
  }
  shuffle(deck);
  drawCards();
  action = 2;
  intent = "attack";
  state = "playing";
  message = "カードをクリックして使おう";
}

function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "24px sans-serif";
  ctx.fillText("自分 HP " + player.hp + " / " + player.maxHp + "  防御 " + player.block, 60, 60);
  ctx.fillText("敵 HP " + enemy.hp + " / " + enemy.maxHp, 480, 60);
  ctx.fillText(intent === "attack" ? "次: 攻撃6" : "次: 防御4", 480, 100);
  for (let i = 0; i < hand.length; i++) hand[i].draw(80 + i * 180, 230);
  ctx.fillText("山札 " + deck.length + "  捨て札 " + discard.length, 60, 140);
  ctx.fillText("行動力 " + action + " / 2", 60, 100);
  ctx.fillText(message, 60, 195);
  if (state === "playing") {
    ctx.fillStyle = "#b7cbd4";
    ctx.fillRect(600, 345, 160, 55);
    ctx.fillStyle = "#26334a";
    ctx.fillText("手番を終える", 608, 380);
  } else ctx.fillText("R でもう一度", 600, 380);
}

function drawCards() {
  while (hand.length < 3) {
    if (deck.length === 0 && discard.length > 0) {
      while (discard.length > 0) deck.push(discard.pop());
      shuffle(deck);
    }
    if (deck.length === 0) return;
    hand.push(deck.pop());
  }
}

function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const card = cards[i];
    cards[i] = cards[j];
    cards[j] = card;
  }
}

function applyCard(card) {
  if (card.kind === "attack") enemy.takeDamage(card.amount);
  else if (card.kind === "defend") player.block += card.amount;
  else if (card.kind === "heal") player.heal(card.amount);
}

function endTurn() {
  if (state !== "playing") return;
  while (hand.length > 0) discard.push(hand.pop());
  if (intent === "attack") player.takeDamage(6);
  else enemy.block += 4;
  player.block = 0;
  if (player.hp <= 0) {
    state = "over";
    message = "負けてしまった";
    return;
  }
  intent = intent === "attack" ? "defend" : "attack";
  action = 2;
  drawCards();
  message = "次の手番です";
}

function pointFromClick(event) {
  const rect = canvas.getBoundingClientRect();
  return {x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height};
}

canvas.addEventListener("click", (event) => {
  if (state !== "playing") return;
  const point = pointFromClick(event);
  if (point.x >= 600 && point.x < 760 && point.y >= 345 && point.y < 400) {
    endTurn();
    return;
  }
  for (let i = 0; i < hand.length; i++) {
    const left = 80 + i * 180;
    if (point.x >= left && point.x < left + 160 && point.y >= 230 && point.y < 340) {
      if (action <= 0) {
        message = "行動力が足りません。手番を終えよう";
        return;
      }
      const card = hand.splice(i, 1)[0];
      action--;
      applyCard(card);
      discard.push(card);
      message = card.label + "を使った";
      if (enemy.hp <= 0) {
        state = "clear";
        message = "勝利！ 敵を倒した";
      }
      return;
    }
  }
});

window.addEventListener("keydown", (event) => {
  if (!event.repeat && event.key.toLowerCase() === "r") start();
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
