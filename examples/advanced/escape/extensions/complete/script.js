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

class Game {
  constructor() {
    this.objects = [
      new RoomObject(60, 105, 160, 180, "本棚"),
      new RoomObject(300, 130, 170, 140, "引き出し"),
      new RoomObject(535, 120, 165, 150, "換気口"),
      new RoomObject(625, 285, 120, 80, "扉")
    ];
    this.room = 1;
    this.roomTwoObjects = [
      new RoomObject(60, 105, 160, 180, "暗い箱"),
      new RoomObject(300, 130, 170, 140, "戻る扉"),
      new RoomObject(625, 285, 120, 80, "出口")
    ];
    this.inventory = new Inventory();
    this.message = "気になる物をクリックしよう";
    this.view = "room";
    this.digits = [0, 0, 0];
    this.exitDigits = [0, 0, 0];
    this.hintRead = false;
    this.unlocked = false;
    this.ventOpen = false;
    this.state = "playing";
  }

  clickDrawer(x, y) {
    if (x >= 30 && x < 150 && y >= 390 && y < 435) {
      this.view = "room";
      this.message = "部屋に戻った";
      return;
    }
    for (let i = 0; i < this.digits.length; i++) {
      const left = 250 + i * 90;
      if (x >= left && x < left + 70 && y >= 190 && y < 270) {
        this.digits[i] = (this.digits[i] + 1) % 10;
        return;
      }
    }
    if (x >= 300 && x < 500 && y >= 300 && y < 345) {
      if (this.digits.join("") === "241") {
        this.unlocked = true;
        this.inventory.add("ドライバー");
        this.inventory.add("懐中電灯");
        this.message = "ドライバーと懐中電灯を見つけた";
      } else {
        this.message = "番号が違うようだ";
      }
    }
  }

  clickExit(x, y) {
    if (x >= 30 && x < 150 && y >= 390 && y < 435) {
      this.view = "room";
      return;
    }
    for (let i = 0; i < this.exitDigits.length; i++) {
      const left = 250 + i * 90;
      if (x >= left && x < left + 70 && y >= 190 && y < 270) {
        this.exitDigits[i] = (this.exitDigits[i] + 1) % 10;
        return;
      }
    }
    if (x >= 300 && x < 500 && y >= 300 && y < 345) {
      if (this.hintRead && this.exitDigits.join("") === "314") {
        this.state = "clear";
        this.message = "脱出成功！ R でもう一度";
      } else this.message = "明かりで手がかりを確かめよう";
    }
  }

  click(x, y) {
    if (this.state !== "playing") return;
    if (this.view === "exit") {
      this.clickExit(x, y);
      return;
    }
    if (this.view === "drawer") {
      this.clickDrawer(x, y);
      return;
    }
    const previous = this.inventory.selected;
    if (this.inventory.click(x, y)) {
      if ((previous === "電池" && this.inventory.selected === "懐中電灯") ||
          (previous === "懐中電灯" && this.inventory.selected === "電池")) {
        this.inventory.items = this.inventory.items.filter(item => item !== "電池" && item !== "懐中電灯");
        this.inventory.add("点灯ライト");
        this.inventory.selected = "点灯ライト";
        this.message = "電池を入れ、ライトが点いた";
        return;
      }
      this.message = this.inventory.selected + "を選んだ";
      return;
    }
    for (const object of (this.room === 1 ? this.objects : this.roomTwoObjects)) {
      if (!object.contains(x, y)) continue;
      if (object.name === "本棚") {
        this.inventory.add("電池");
        this.message = "メモは241。電池も見つけた";
      }
      else if (object.name === "引き出し") {
        this.view = "drawer";
        this.message = "3けたの番号を合わせよう";
      } else if (object.name === "換気口") {
        if (this.inventory.selected === "ドライバー") {
          this.ventOpen = true;
          this.inventory.add("鍵");
          this.message = "換気口を開けて鍵を見つけた";
        } else this.message = "換気口はドライバーで開きそう";
      } else if (object.name === "扉") {
        if (this.inventory.selected === "鍵") {
          this.room = 2;
          this.message = "隣の部屋に入った";
        } else this.message = "扉には鍵が必要だ";
      } else if (object.name === "戻る扉") {
        this.room = 1;
        this.message = "最初の部屋に戻った";
      } else if (object.name === "暗い箱") {
        if (this.inventory.selected === "点灯ライト") {
          this.hintRead = true;
          this.message = "明かりで番号314が見えた";
        } else this.message = "暗くて中が見えない";
      } else if (object.name === "出口") {
        if (this.inventory.selected === "鍵") {
          this.view = "exit";
          this.message = "出口の番号を合わせよう";
        } else this.message = "出口には鍵が必要だ";
      }
      return;
    }
  }

  draw() {
    ctx.fillStyle = "#24354a";
    ctx.font = "22px sans-serif";
    if (this.view === "drawer" || this.view === "exit") {
      const shownDigits = this.view === "drawer" ? this.digits : this.exitDigits;
      ctx.fillText("数字をクリックして番号を合わせよう", 165, 120);
      for (let i = 0; i < shownDigits.length; i++) {
        ctx.fillStyle = "#f8dc8b";
        ctx.fillRect(250 + i * 90, 190, 70, 80);
        ctx.fillStyle = "#24354a";
        ctx.fillText(String(shownDigits[i]), 275 + i * 90, 240);
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
      ctx.fillText(this.room === 1 ? "最初の部屋を調べよう" : "隣の部屋を調べよう", 45, 45);
      for (const object of (this.room === 1 ? this.objects : this.roomTwoObjects)) {
        object.draw();
        if ((object.name === "引き出し" && this.unlocked) ||
            (object.name === "換気口" && this.ventOpen)) {
          ctx.fillStyle = "#416a47";
          ctx.fillRect(object.x, object.y + 60, object.width, 35);
          ctx.fillStyle = "#ffffff";
          ctx.font = "18px sans-serif";
          ctx.fillText("開いた", object.x + 15, object.y + 84);
        }
      }
      this.inventory.draw();
    }
    ctx.fillStyle = "#24354a";
    ctx.font = "20px sans-serif";
    ctx.fillText(this.message, 45, 370);
  }
}

let game;

function start() {
  game = new Game();
}

function update() {
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  game.draw();
}

function pointFromClick(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height
  };
}

canvas.addEventListener("click", (event) => {
  const point = pointFromClick(event);
  game.click(point.x, point.y);
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
