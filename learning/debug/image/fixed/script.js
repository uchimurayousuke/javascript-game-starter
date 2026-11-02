"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const image = new Image();
image.onload = () => { ctx.drawImage(image, 100, 100); };
image.onerror = () => { ctx.font = "24px sans-serif"; ctx.fillText("画像を読めません。名前と場所を確認", 40, 80); };
image.src = "assets/player-blue.png";
