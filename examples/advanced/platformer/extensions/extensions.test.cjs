"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const here = __dirname;
const stages = ["stomp", "dash", "checkpoint"];
const read = (...parts) => fs.readFileSync(path.join(here, ...parts), "utf8").replace(/\r\n/g, "\n");
const decode = (text) => text.replace(/&(?:amp|lt|gt|quot|#x27);/g,
  (entity) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" }[entity]));

test("発展課題の変更手順から、3段階の見本を再現できる", () => {
  const html = read("tutorial.html");
  const sections = [...html.matchAll(/<section id="([^"]+)" data-stage="[^"]+">([\s\S]*?)<\/section>/g)];
  assert.deepEqual(sections.map((section) => section[1]), stages);
  let script = read("..", "complete", "script.js");
  for (const [, stage, section] of sections) {
    const edits = [...section.matchAll(/<p>変更前（確認用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre><\/details><p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/g)];
    assert.ok(edits.length > 0, stage);
    for (const [, before, after] of edits) {
      const original = decode(before);
      assert.equal(script.split(original).length, 2, `${stage}: 書き換える場所が一つに決まる`);
      script = script.replace(original, () => decode(after));
    }
    assert.equal(script, read(stage, "script.js"), stage);
    new vm.Script(script);
    assert.equal(read(stage, "style.css"), read("..", "complete", "style.css"));
    assert.match(read(stage, "index.html"), /<canvas id="game-canvas" width="800" height="450"/);
    assert.doesNotMatch(read(stage, "index.html"), /<(?:h[1-6]|details|nav)\b/i);
  }
  for (const file of ["index.html", "style.css", "script.js"]) {
    assert.equal(read("complete", file), read("checkpoint", file));
  }
  assert.doesNotMatch(html, /<(canvas|iframe|script)\b/i);
});

test("教材と各見本のリンク先、CSS と JavaScript が存在する", () => {
  const files = ["tutorial.html", ...stages.map((stage) => `${stage}/index.html`), "complete/index.html"];
  for (const file of files) {
    const html = read(file);
    for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (target.startsWith("#")) {
        assert.ok(html.includes(`id="${target.slice(1)}"`), target);
      } else {
        const [pathAndQuery, fragment] = target.split("#");
        const linked = path.resolve(here, path.dirname(file), pathAndQuery.split("?")[0]);
        assert.ok(fs.existsSync(linked), `${file}: ${target}`);
        if (fragment) assert.ok(fs.readFileSync(linked, "utf8").includes(`id="${decodeURIComponent(fragment)}"`), `${file}: ${target}`);
      }
    }
  }
});

function setup(stage = "stomp") {
  const listeners = {};
  const frames = [];
  const texts = [];
  const rectangles = [];
  const ctx = {
    clearRect() { texts.length = 0; rectangles.length = 0; },
    fillRect(x, y, width, height) { rectangles.push({ color: ctx.fillStyle, x, y, width, height }); },
    fillText(text) { texts.push(text); }
  };
  const canvas = { width: 800, height: 450, getContext: () => ctx };
  const context = vm.createContext({
    document: { querySelector: () => canvas },
    window: { addEventListener(type, listener) { (listeners[type] ??= []).push(listener); } },
    requestAnimationFrame(callback) { frames.push(callback); }
  });
  vm.runInContext(read(stage, "script.js"), context);
  return {
    run: (code) => vm.runInContext(code, context),
    value: (code) => JSON.parse(JSON.stringify(vm.runInContext(code, context))),
    key(type, code, repeat = false) {
      for (const listener of listeners[type] || []) listener({ code, repeat, preventDefault() {} });
    },
    blur() { for (const listener of listeners.blur || []) listener(); },
    frame() {
      assert.equal(frames.length, 1, "ゲームループは一つだけ動く");
      frames.shift()();
    },
    texts, rectangles,
    pendingFrames: () => frames.length
  };
}

test("上から踏むと、その敵だけが倒れ、プレイヤーがはねる", () => {
  for (const stage of stages) {
    const g = setup(stage);
    g.run("player.x = 900; player.y = 310; player.vy = 10; player.onGround = false");
    g.frame();
    assert.deepEqual(g.value("({ alive: enemies[0].alive, secondAlive: enemies[1].alive, defeated, y: player.y, vy: player.vy, onGround: player.onGround, state })"),
      { alive: false, secondAlive: true, defeated: 1, y: 320, vy: -8, onGround: false, state: "playing" }, stage);
    assert.ok(g.texts.includes("倒した敵: 1 / 2"));
    assert.equal(g.rectangles.filter((rect) => rect.color === "#d64b5c").length, 1);
    const stoppedX = g.run("enemies[0].x");
    for (let frame = 0; frame < 60; frame++) g.frame();
    assert.equal(g.run("enemies[0].x"), stoppedX, "倒れた敵は動かない");
    assert.equal(g.run("defeated"), 1, "倒した数が繰り返し増えない");
    assert.equal(g.run("state"), "playing", "倒れた敵と重なっても失敗しない");
    g.key("keydown", "KeyR");
    assert.equal(g.run("enemies.every(enemy => enemy.alive)"), true);
    assert.equal(g.run("defeated"), 0);
    assert.equal(g.pendingFrames(), 1);
  }
});

test("踏む判定は、上端と同じ高さからの落下や、速い落下にも対応する", () => {
  for (const [y, vy] of [[320, 0], [310, 30]]) {
    const g = setup();
    g.run(`player.x = 900; player.y = ${y}; player.vy = ${vy}; player.onGround = false`);
    g.frame();
    assert.equal(g.run("enemies[0].alive"), false);
    assert.equal(g.run("state"), "playing");
  }
});

test("横から、下から、上昇中の接触を、踏んだことにしない", () => {
  const cases = [
    "player.x = 880; player.y = 350; player.vy = 0",
    "player.x = 880; player.y = 340; player.vy = 2",
    "player.x = 900; player.y = 350; player.vy = -8",
    "enemies[0].y = 250; player.x = 900; player.y = 275; player.vy = -8"
  ];
  for (const code of cases) {
    const g = setup();
    g.run(code);
    g.frame();
    assert.equal(g.run("state"), "over", code);
    assert.equal(g.run("enemies[0].alive"), true, code);
    assert.equal(g.run("defeated"), 0, code);
  }
});

test("左右の Shift、キーの解除、再挑戦と壁の判定", () => {
  for (const stage of ["dash", "checkpoint"]) {
    const g = setup(stage);
    g.key("keydown", "ArrowRight"); g.frame();
    assert.equal(g.run("player.x"), 84);
    g.key("keydown", "ShiftLeft"); g.frame();
    assert.equal(g.run("player.x"), 90);
    g.key("keydown", "ShiftRight"); g.key("keyup", "ShiftLeft"); g.frame();
    assert.equal(g.run("player.x"), 96, "もう片方の Shift を押していればダッシュが続く");
    g.key("keyup", "ShiftRight"); g.frame();
    assert.equal(g.run("player.x"), 100);
    g.key("keydown", "ShiftLeft"); g.blur(); g.frame();
    assert.equal(g.run("player.x"), 100);
    assert.equal(g.run("dashLeft || dashRight"), false);
    g.run("player.x = 368; right = true; dashRight = true"); g.frame();
    assert.equal(g.run("player.x"), 370, "ダッシュでも壁を通り抜けない");
    g.key("keydown", "KeyR");
    assert.equal(g.run("dashLeft || dashRight || left || right"), false);
    assert.equal(g.run("player.x"), 80);
  }
});

test("ダッシュ中も上から敵を踏んで倒せる", () => {
  for (const stage of ["dash", "checkpoint"]) {
    const g = setup(stage);
    g.run("player.x = 894; player.y = 310; player.vy = 10; player.onGround = false");
    g.key("keydown", "ArrowRight"); g.key("keydown", "ShiftRight");
    g.frame();
    assert.equal(g.run("player.x"), 900);
    assert.equal(g.run("enemies[0].alive"), false);
    assert.equal(g.run("state"), "playing");
  }
});

test("中間ポイントで再開すると、コインと倒した敵の記録が残る", () => {
  const g = setup("checkpoint");
  g.run("player.x = 1200; coins[0].taken = true; score = 1; enemies[0].stomp(); defeated = 1");
  g.frame();
  assert.equal(g.run("checkpoint.active"), true);
  assert.ok(g.texts.includes("中間ポイント: 通過済み"));
  g.run("player.y = 460"); g.frame();
  assert.equal(g.run("state"), "over");
  assert.ok(g.texts.includes("ゲームオーバー！ R キーで中間から"));
  g.key("keydown", "ShiftRight"); g.key("keydown", "ArrowRight");
  g.key("keydown", "KeyR");
  assert.deepEqual(g.value("({ x: player.x, y: player.y, vy: player.vy, cameraX, state, score, defeated, checkpoint: checkpoint.active, taken: coins[0].taken, alive: enemies[0].alive, input: left || right || jumpHeld || jumpPressed || dashLeft || dashRight })"),
    { x: 1200, y: 350, vy: 0, cameraX: 815, state: "playing", score: 1, defeated: 1, checkpoint: true, taken: true, alive: false, input: false });
  g.key("keydown", "KeyR", true);
  assert.equal(g.run("player.x"), 1200, "R の長押しで最初へ戻らない");
  g.frame();
  assert.equal(g.run("player.onGround"), true);
  assert.equal(g.pendingFrames(), 1);
  g.key("keyup", "KeyR"); g.key("keydown", "KeyR");
  assert.deepEqual(g.value("({ x: player.x, active: checkpoint.active, score, defeated, alive: enemies.every(enemy => enemy.alive) })"),
    { x: 80, active: false, score: 0, defeated: 0, alive: true }, "プレイ中の R は全てを最初に戻す");
});

test("中間を通る前の失敗とクリア後の R は最初からになる", () => {
  const g = setup("checkpoint");
  g.run("player.y = 460"); g.frame();
  g.key("keydown", "KeyR");
  assert.equal(g.run("player.x"), 80);
  g.run("player.x = checkpoint.x"); g.frame();
  g.run("player.x = goal.x"); g.frame();
  assert.equal(g.run("state"), "clear");
  g.key("keydown", "KeyR");
  assert.equal(g.run("checkpoint.active"), false);
  assert.equal(g.run("player.x"), 80);
});

test("敵と同時に触れたフレームでは中間通過やクリアにしない", () => {
  for (const target of ["checkpoint", "goal"]) {
    const g = setup("checkpoint");
    g.run(`player.x = ${target}.x; enemies = [new Enemy(${target}.x, ${target}.x, ${target}.x + 50)]`);
    g.frame();
    assert.equal(g.run("state"), "over");
    assert.equal(g.run("checkpoint.active"), false);
  }
});

function playToGoal(stage, failAfterCheckpoint = false) {
  const g = setup(stage);
  let rightHeld = false;
  let retried = false;
  const recent = [];
  for (let frame = 0; frame < 1500; frame++) {
    const state = g.run("state");
    if (state === "clear") break;
    if (state === "over") {
      assert.ok(failAfterCheckpoint && !retried && g.run("checkpoint.active"), JSON.stringify(recent));
      g.key("keydown", "KeyR"); g.key("keyup", "KeyR");
      rightHeld = false;
      retried = true;
      assert.equal(g.run("player.x"), 1200);
      continue;
    }
    const p = g.value("({ x: player.x, y: player.y, vy: player.vy, grounded: player.onGround, enemies: enemies.filter(enemy => enemy.alive).map(enemy => ({x: enemy.x, width: enemy.width})) })");
    const target = p.enemies.find((enemy) => enemy.x - p.x > -30 && enemy.x - p.x < 110);
    const moveRight = !(target && !p.grounded && p.x >= target.x - 5 && p.x <= target.x + target.width);
    if (moveRight !== rightHeld) {
      g.key(moveRight ? "keydown" : "keyup", "ArrowRight");
      rightHeld = moveRight;
    }
    const obstacles = [400, 650, 1100, 1450, 1850].filter((x) => !(x === 1450 && failAfterCheckpoint && !retried));
    const nearObstacle = obstacles.some((x) => p.x >= x - 78 && p.x <= x - 30);
    const nearEnemy = target && target.x - p.x > 0 && target.x - p.x < 90;
    const jump = p.grounded && (nearObstacle || nearEnemy);
    if (jump) g.key("keydown", "Space");
    g.frame();
    if (jump) g.key("keyup", "Space");
    recent.push({ frame, x: p.x, y: p.y, jump, moveRight });
    if (recent.length > 12) recent.shift();
  }
  assert.equal(g.run("state"), "clear", JSON.stringify(recent));
  assert.equal(g.run("defeated"), 2, "通常のキー操作で2体とも踏んで倒した");
  assert.equal(retried, failAfterCheckpoint);
  assert.equal(g.pendingFrames(), 1);
}

test("キー操作とゲームループだけで、敵を2体踏んでゴールできる", () => {
  playToGoal("stomp");
});

test("キー操作だけで、中間通過、落下、再挑戦を経てゴールできる", () => {
  playToGoal("checkpoint", true);
});
