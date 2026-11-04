"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { assertReadingPage } = require("../tests/reading-page-policy.cjs");
const root = __dirname;
const games = ["target", "bounce", "breakout", "shooting", "timing", "typing", "number-guess", "snake", "memory", "shop", "escape", "tower-defense", "card-battle", "racing"];
const levelOf = game => (["target", "bounce", "timing", "typing", "number-guess"].includes(game) ? "beginner" : ["breakout", "shooting", "snake", "memory", "shop"].includes(game) ? "intermediate" : "advanced");
const read = (...parts) => fs.readFileSync(path.join(root, levelOf(parts[0]), ...parts), "utf8").replace(/\r\n/g, "\n");
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|#x27);/g, (x) => ({"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"', "&#x27;":"'"}[x]));

test("手順の置換を順に適用すると各段階の3ファイルと一致する", () => {
  for (const game of games) {
    const tutorial = read(game, "tutorial.html");
    const sections = [...tutorial.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    assert.equal(sections.length, ["escape", "tower-defense", "card-battle", "racing"].includes(game) ? 5 : game === "memory" || game === "shop" ? 4 : 3);
    let script = fs.readFileSync(path.join(root, "..", "template", "script.js"), "utf8").replace(/\r\n/g, "\n");
    for (const [index, section] of sections.entries()) {
      const replacements = [...section[0].matchAll(/<p>変更前（確認用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre><\/details>(?:<\/details>)?<p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/g)];
      assert.ok(replacements.length);
      for (const replacement of replacements) {
        const before = decode(replacement[1]);
        const after = decode(replacement[2]);
        assert.equal(script.split(before).length, 2, game + " ambiguous replacement");
        script = script.replace(before, () => after);
      }
      const step = "step" + (index + 1);
      assert.equal(script, read(game, step, "script.js"));
      for (const file of ["index.html", "style.css"]) assert.equal(read(game, step, file), fs.readFileSync(path.join(root, "..", "template", file), "utf8").replace(/\r\n/g, "\n"));
      new vm.Script(script);
    }
    for (const file of ["index.html", "style.css", "script.js"]) assert.equal(read(game, "complete", file), read(game, "step" + sections.length, file));
    assertReadingPage(tutorial);
  }
});

test("ローカルのリンクと参照ファイルが存在する", () => {
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".html")) {
        const html = fs.readFileSync(file, "utf8").replace(/<pre>[\s\S]*?<\/pre>/g, "");
        for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
          const [pathAndQuery, fragment] = decode(match[1]).split("#");
          const relative = pathAndQuery.split("?")[0];
          const target = relative ? path.resolve(path.dirname(file), decodeURIComponent(relative)) : file;
          assert.ok(fs.existsSync(target), file + " -> " + match[1]);
          if (fragment) {
            const linked = fs.readFileSync(target, "utf8").replace(/<pre>[\s\S]*?<\/pre>/g, "");
            assert.ok(linked.includes(`id="${decodeURIComponent(fragment)}"`), file + " -> " + match[1]);
          }
        }
      }
    }
  }
  visit(root);
});

function setup(game) {
  const listeners = {};
  const on = (type, fn) => (listeners[type] ??= []).push(fn);
  const context2d = { clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, fill(){}, fillText(){} };
  const canvas = { width:800, height:450, getContext:() => context2d, getBoundingClientRect:() => ({left:10, top:20, width:400, height:225}), addEventListener:on };
  const clock = { value:0 };
  const context = vm.createContext({ document:{querySelector:() => canvas}, window:{addEventListener:on}, performance:{now:() => clock.value}, requestAnimationFrame(){} });
  vm.runInContext(read(game, "complete", "script.js"), context);
  return { run:(s) => vm.runInContext(s, context), clock, fire:(type, event) => (listeners[type] || []).forEach((fn) => fn({preventDefault(){}, ...event})) };
}

test("完成版の操作、得点、終了、再開", () => {
  const target = setup("target");
  target.fire("click", {clientX:210, clientY:132.5});
  assert.equal(target.run("score"), 1);
  target.clock.value = 20000;
  target.fire("click", {clientX:210, clientY:132.5});
  assert.equal(target.run("score"), 1);
  target.fire("keydown", {key:"r"}); assert.equal(target.run("score"), 0);

  const bounce = setup("bounce");
  bounce.fire("keydown", {key:"ArrowLeft"}); bounce.run("update()"); assert.ok(bounce.run("paddleX") < 345);
  bounce.run("x = paddleX + 30; y = paddleY - radius - 2; dy = 4; dx = 0; update()");
  assert.equal(bounce.run("score"), 1); assert.ok(bounce.run("dy") < 0);
  bounce.run("y = 500; update()"); assert.equal(bounce.run("over"), true);
  bounce.fire("keydown", {key:"r"}); assert.equal(bounce.run("over"), false);

  const breakout = setup("breakout");
  assert.equal(breakout.run("bricks.length"), 24);
  breakout.run("x = bricks[0].x + 20; y = bricks[0].y + 10; dx = 0; dy = 1; update()");
  assert.equal(breakout.run("score"), 1); assert.equal(breakout.run("bricks[0].alive"), false);
  breakout.run("score = bricks.length - 1; bricks.forEach((b, i) => b.alive = i === 1); x = bricks[1].x + 20; y = bricks[1].y + 10; dx = 0; dy = 1; update()");
  assert.equal(breakout.run("state"), "clear"); breakout.fire("keydown", {key:"r"}); assert.equal(breakout.run("score"), 0);

  const shooting = setup("shooting");
  shooting.fire("keydown", {key:" ", code:"Space"}); shooting.run("update()"); assert.equal(shooting.run("bullets.length"), 1);
  shooting.run("bullets = [{x: 100, y: 108}]; enemies = [{x: 100, y: 100}]; spawnTimer = 20; update()");
  assert.equal(shooting.run("score"), 1); assert.equal(shooting.run("enemies.length"), 0);
  shooting.run("enemies = [{x: 10, y: 419}]; update()"); assert.equal(shooting.run("state"), "over");
  shooting.fire("keydown", {key:"r"}); assert.equal(shooting.run("state"), "playing");
});
