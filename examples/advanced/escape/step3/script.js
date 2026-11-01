"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

class RoomObject {
  constructor(x, y, width, height, name) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.name = name;
  }

  contains(x, y) {
    return x >= this.x && x < this.x + this.width &&
      y >= this.y && y < this.y + this.height;
  }

  draw() {
    ctx.fillStyle = "#b7cbd4";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#24354a";
    ctx.font = "22px sans-serif";
    ctx.fillText(this.name, this.x + 15, this.y + 35);
  }
}

class Inventory {
  constructor() {
    this.items = [];
    this.selected = "";
  }

  add(item) {
    if (!this.items.includes(item)) this.items.push(item);
  }

  click(x, y) {
    for (let i = 0; i < this.items.length; i++) {
      const left = 30 + i * 150;
      if (x >= left && x < left + 140 && y >= 390 && y < 435) {
        this.selected = this.items[i];
        return true;
      }
    }
    return false;
  }

  draw() {
    for (let i = 0; i < this.items.length; i++) {
      const left = 30 + i * 150;
      ctx.fillStyle = "#f8dc8b";
      ctx.fillRect(left, 390, 140, 45);
      if (this.items[i] === this.selected) {
        ctx.strokeStyle = "#c45631";
        ctx.lineWidth = 4;
        ctx.strokeRect(left, 390, 140, 45);
      }
      ctx.fillStyle = "#24354a";
      ctx.font = "17px sans-serif";
      ctx.fillText(this.items[i], left + 8, 418);
    }
  }
}

let objects, message, view, digits, unlocked, inventory;

// ゲームを始めるときに、1回だけ呼ばれます。
function start() {
  objects = [
    new RoomObject(60, 105, 160, 180, "本棚"),
    new RoomObject(300, 130, 170, 140, "引き出し"),
    new RoomObject(535, 120, 165, 150, "換気口"),
    new RoomObject(625, 285, 120, 80, "扉")
  ];
  message = "気になる物をクリックしよう";
  view = "room";
  digits = [0, 0, 0];
  unlocked = false;
  inventory = new Inventory();
}

// 毎フレーム呼ばれます。
function update() {
  // 状態はクリックで更新します。
}

// 毎フレーム呼ばれます。ゲームの絵を描く場所です。
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#24354a";
  ctx.font = "22px sans-serif";
  if (view === "drawer") {
    ctx.fillText("数字をクリックして番号を合わせよう", 165, 120);
    for (let i = 0; i < digits.length; i++) {
      ctx.fillStyle = "#f8dc8b";
      ctx.fillRect(250 + i * 90, 190, 70, 80);
      ctx.fillStyle = "#24354a";
      ctx.fillText(String(digits[i]), 275 + i * 90, 240);
    }
    ctx.fillStyle = "#b7cbd4";
    ctx.fillRect(300, 300, 200, 45);
    ctx.fillStyle = "#24354a";
    ctx.fillText("番号を確かめる", 315, 330);
    ctx.fillStyle = "#b7cbd4";
    ctx.fillRect(30, 390, 120, 45);
    ctx.fillStyle = "#24354a";
    ctx.fillText("戻る", 52, 420);
  } else {
    ctx.fillText("部屋の物をクリックして調べよう", 45, 45);
    for (const object of objects) {
      object.draw();
      if (object.name === "引き出し" && unlocked) {
        ctx.fillStyle = "#416a47";
        ctx.fillRect(object.x, object.y + 60, object.width, 35);
        ctx.fillStyle = "#ffffff";
        ctx.font = "18px sans-serif";
        ctx.fillText("開いた", object.x + 15, object.y + 84);
      }

    }
    inventory.draw();
  }
  ctx.fillStyle = "#24354a";
  ctx.font = "20px sans-serif";
  ctx.fillText(message, 45, 370);
}

function pointFromClick(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height
  };
}

function clickDrawer(x, y) {
  if (x >= 30 && x < 150 && y >= 390 && y < 435) {
    view = "room";
    message = "部屋に戻った";
    return;
  }
  for (let i = 0; i < digits.length; i++) {
    const left = 250 + i * 90;
    if (x >= left && x < left + 70 && y >= 190 && y < 270) {
      digits[i] = (digits[i] + 1) % 10;
      return;
    }
  }
  if (x >= 300 && x < 500 && y >= 300 && y < 345) {
    if (digits.join("") === "241") {
      unlocked = true;
      inventory.add("ドライバー");
      message = "ドライバーを手に入れた";
    } else {
      message = "番号が違うようだ";
    }
  }
}

canvas.addEventListener("click", (event) => {
  const point = pointFromClick(event);

  if (view === "drawer") {
    clickDrawer(point.x, point.y);
    return;
  }
  if (inventory.click(point.x, point.y)) {
    message = inventory.selected + "を選んだ";
    return;
  }
  for (const object of objects) {
    if (object.contains(point.x, point.y)) {
      if (object.name === "本棚") message = "メモに 241 と書いてある";
      else if (object.name === "引き出し") {
        view = "drawer";
        message = "3けたの番号を合わせよう";
      } else message = object.name + "を調べた";
      return;
    }
  }
});
window.addEventListener("keydown", (event) => {
  if (!event.repeat && event.key.toLowerCase() === "r") start();
});

// 以下は start → update → draw を動かすための共通処理です。
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
