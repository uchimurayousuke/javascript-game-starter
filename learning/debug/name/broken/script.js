"use strict";
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
let score = 0;
ctx.font = "28px sans-serif";
ctx.fillText("得点: " + scroe, 100, 100);
