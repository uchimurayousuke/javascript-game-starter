"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { assertReadingPage } = require("../../../tests/reading-page-policy.cjs");
const here = __dirname;
const read = (...p) => fs.readFileSync(path.join(here, ...p), "utf8").replace(/\r\n/g, "\n");
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|#x27);/g, (x) => ({"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"', "&#x27;":"'"}[x]));

test("各段階の置換手順を適用すると見本と一致する", () => {
  const sections = [...read("tutorial.html").matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
  assert.equal(sections.length, 6);
  let script = read("..", "..", "..", "template", "script.js");
  for (const [i, section] of sections.entries()) {
    const edits = [...section[0].matchAll(/<p>変更前（確認用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre><\/details><p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/g)];
    assert.ok(edits.length);
    for (const [, beforeHtml, afterHtml] of edits) {
      const before = decode(beforeHtml);
      assert.equal(script.split(before).length, 2);
      script = script.replace(before, () => decode(afterHtml));
    }
    const step = "step" + (i + 1);
    assert.equal(script, read(step, "script.js"));
    for (const file of ["index.html", "style.css"]) assert.equal(read(step, file), read("..", "..", "..", "template", file));
    new vm.Script(script);
  }
  for (const file of ["index.html", "style.css", "script.js"]) assert.equal(read("complete", file), read("step6", file));
  assertReadingPage(read("tutorial.html"));
});

function setup() {
  const listeners = {};
  const on = (type, fn) => (listeners[type] ??= []).push(fn);
  const texts = [];
  const ctx = { clearRect(){}, fillRect(){}, fillText(text){ texts.push(text); } };
  const canvas = { width: 800, height: 450, getContext: () => ctx };
  const c = vm.createContext({ document: {querySelector: () => canvas}, window: {addEventListener: on}, requestAnimationFrame() {} });
  vm.runInContext(read("complete", "script.js"), c);
  return { run: (s) => vm.runInContext(s, c), key: (type, code) => (listeners[type] || []).forEach((f) => f({code, preventDefault(){}})), blur: () => (listeners.blur || []).forEach((f) => f()), texts };
}

test("入力の解除、着地と空中ジャンプ", () => {
  const g = setup();
  g.run("update()"); assert.equal(g.run("player.onGround"), true);
  g.key("keydown", "ArrowRight"); g.run("update()"); assert.equal(g.run("player.x"), 84);
  g.key("keyup", "ArrowRight"); g.run("update()"); assert.equal(g.run("player.x"), 84);
  g.key("keydown", "Space"); g.run("update()"); assert.equal(g.run("player.vy"), -10.5);
  g.key("keyup", "Space"); g.key("keydown", "Space"); g.run("update()");
  assert.equal(g.run("player.vy"), -10);
  g.key("keydown", "ArrowRight"); g.blur(); g.run("update()"); assert.equal(g.run("player.x"), 84);
  g.run("for (let i=0; i<60; i++) update()"); assert.equal(g.run("player.onGround"), true);
  assert.equal(g.run("player.y"), 350);
  g.key("keyup", "Space"); g.key("keydown", "Space");
  g.run("for (let i=0; i<60; i++) update()");
  assert.equal(g.run("player.onGround"), true, "押し続けても着地後に再ジャンプしない");
  g.key("keydown", "Space"); g.run("update()");
  assert.equal(g.run("player.onGround"), true, "キーの自動リピートで再ジャンプしない");
  g.key("keyup", "Space"); g.key("keydown", "Space"); g.run("update()");
  assert.equal(g.run("player.onGround"), false, "離して押し直すと再びジャンプできる");
});

test("壁・天井・地面の衝突とカメラの端", () => {
  const g = setup();
  g.run("player.x=368; player.y=350; player.vy=0; player.onGround=true; right=true; update()");
  assert.equal(g.run("player.x"), 370); assert.equal(g.run("player.onGround"), true);
  g.run("right=false; left=true; player.x=442; player.y=350; player.vy=0; update()");
  assert.equal(g.run("player.x"), 440);
  g.run("left=false; player.x=280; player.y=295; player.vy=-8; update()");
  assert.equal(g.run("player.y"), 290); assert.equal(g.run("player.vy"), 0);
  g.run("player.x=280; player.y=220; player.vy=10; update()");
  assert.equal(g.run("player.y"), 230); assert.equal(g.run("player.onGround"), true);
  g.run("player.x=80; player.y=350; player.vy=0; update()"); assert.equal(g.run("cameraX"), 0);
  g.run("player.x=2370; player.y=350; player.vy=0; update()"); assert.equal(g.run("cameraX"), 1600);
});

test("コイン、敵、落下、クリアと再挑戦", () => {
  const g = setup();
  assert.ok(g.texts.some((line) => line.includes("←→ 移動") && line.includes("ジャンプ") && line.includes("R 再挑戦")));
  assert.equal(g.run("player instanceof Player"), true);
  assert.equal(g.run("enemies.every(enemy => enemy instanceof Enemy)"), true);
  const secondX = g.run("enemies[1].x");
  g.run("enemies[0].x = 880; enemies[0].update()");
  assert.equal(g.run("enemies[0].x"), 881);
  assert.equal(g.run("enemies[1].x"), secondX, "敵は位置を共有しない");
  g.run("player.x=460; player.y=350; update()"); assert.equal(g.run("score"), 1);
  g.run("update()"); assert.equal(g.run("score"), 1);
  g.run("player.x=enemies[0].x; player.y=350; update()"); assert.equal(g.run("state"), "over");
  g.key("keydown", "KeyR"); assert.equal(g.run("state"), "playing"); assert.equal(g.run("score"), 0);
  g.run("player.y=460; update()"); assert.equal(g.run("state"), "over");
  g.key("keydown", "KeyR"); g.run("player.x=2300; player.y=350; update()"); assert.equal(g.run("state"), "clear");
  g.key("keydown", "KeyR"); assert.equal(g.run("player.x"), 80); assert.equal(g.run("state"), "playing");
});

test("キー操作だけで障害物と敵を越えてゴールできる", () => {
  const g = setup();
  g.run("update()");
  g.key("keydown", "ArrowRight");
  const obstacles = [400, 650, 1100, 1450, 1850];
  for (let frame = 0; frame < 1000 && g.run("state") === "playing"; frame++) {
    const x = g.run("player.x");
    const grounded = g.run("player.onGround");
    const nearWallOrGap = obstacles.some((obstacle) => x >= obstacle - 78 && x <= obstacle - 30);
    const nearEnemy = g.run("enemies.some(e => e.x - player.x > 55 && e.x - player.x < 85)");
    if (grounded && (nearWallOrGap || nearEnemy)) { g.key("keydown", "Space"); g.key("keyup", "Space"); }
    g.run("update()");
  }
  assert.equal(g.run("state"), "clear", `state=${g.run("state")} x=${g.run("player.x")} y=${g.run("player.y")}`);
});
