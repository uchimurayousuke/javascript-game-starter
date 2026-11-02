"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

let scene, items, message;

function start() {
  scene = "start"; items = []; message = "";
}

function update() {

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#26334a"; ctx.font = "26px sans-serif";
  if (scene === "start") {
    ctx.fillText("森の入口に立っています。", 70, 90);
    ctx.fillText("1: 広場へ進む　2: 川へ進む", 70, 160);
  } else if (scene === "river") {
    ctx.fillText("川の水が急に増えたので、家へ戻りました。", 70, 90);
    ctx.fillText("おしまい！　Rで最初から", 70, 160);
  } else if (scene === "clearing") {
    ctx.fillText("広場に着きました。", 70, 90);
    ctx.fillText("1: 鍵を探す　2: 花を探す　3: 扉へ", 70, 160);
  } else if (scene === "end") {
    ctx.fillText(message, 70, 90);
    ctx.fillText("おしまい！　Rで最初から", 70, 160);
  } else if (scene === "key") {
    ctx.fillText("小石の下に鍵が見えます。", 70, 90);
    ctx.fillText("1: 鍵を拾って戻る　2: 拾わず戻る", 70, 160);
  } else if (scene === "flower") {
    ctx.fillText("青い花が咲いています。", 70, 90);
    ctx.fillText("1: 花を摘んで戻る　2: 摘まず戻る", 70, 160);
  }
  ctx.fillText("持ち物: " + (items.join("、") || "なし"), 70, 260);
  if (scene !== "end") ctx.fillText(message, 70, 360);
}

window.addEventListener("keydown", event => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "r") { start(); return; }
  if (!["1", "2", "3"].includes(key) || scene === "end" || scene === "river") return;
  if (key === "3" && scene !== "clearing") return;
  if (scene === "start") scene = key === "1" ? "clearing" : key === "2" ? "river" : scene;
  else if (scene === "clearing") {
    if (key === "1") scene = "key";
    else if (key === "2") scene = "flower";
    else if (items.includes("鍵")) {
      scene = "end";
      message = "鍵で庭園の扉を開けました。";
    } else message = "扉は鍵が必要です。鍵を探そう。";
  } else if (scene === "key" || scene === "flower") {
    const item = scene === "key" ? "鍵" : "花";
    if (key === "1" && !items.includes(item)) items.push(item);
    scene = "clearing"; message = "広場に戻りました。";
  }
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

start();
gameLoop();
