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

}

let player, enemy, hand;

function start() {
  player = new Character("自分", 30);
  enemy = new Character("敵", 24);
  hand = [new Card("attack", "攻撃", 6), new Card("defend", "防御", 4), new Card("heal", "回復", 5)];
}

function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a";
  ctx.font = "24px sans-serif";
  ctx.fillText("自分 HP " + player.hp + " / " + player.maxHp + "  防御 " + player.block, 60, 60);
  ctx.fillText("敵 HP " + enemy.hp + " / " + enemy.maxHp, 480, 60);
  for (let i = 0; i < hand.length; i++) hand[i].draw(80 + i * 180, 230);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
