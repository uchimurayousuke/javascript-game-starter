"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const pages = {
  "tutorial/index.html": ["coin-coordinates", "coin-arc", "coin-hit"],
  "examples/target/tutorial.html": ["target-coordinate", "target-distance"],
  "examples/bounce/tutorial.html": ["bounce-wall", "bounce-paddle"],
  "examples/breakout/tutorial.html": ["brick-grid", "brick-hit"],
  "examples/shooting/tutorial.html": ["shoot-motion", "shoot-hit"],
  "examples/platformer/tutorial.html": ["platformer-gravity", "platformer-collision", "platformer-camera", "platformer-instances"],
  "examples/platformer/extensions/tutorial.html": ["extension-stomp", "extension-dash", "extension-retry"]
};
const figure = (file, id) => {
  const matches = [...read(file).matchAll(new RegExp('<figure class="learning-diagram" id="' + id + '"[^>]*>([\\s\\S]*?)</figure>', 'g'))];
  assert.equal(matches.length, 1, `${file}: ${id}`);
  return matches[0][1];
};
const words = (html) => html.replace(/<[^>]+>/g, " ").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("各教材の図には見出しと説明があり、SVG とスタイルがローカルで使える", () => {
  for (const [file, ids] of Object.entries(pages)) {
    const html = read(file);
    const css = html.match(/<link rel="stylesheet" href="([^"]*diagrams\.css)">/);
    assert.ok(css && fs.existsSync(path.resolve(root, path.dirname(file), css[1])), file);
    assert.equal((html.match(/<figure class="learning-diagram"/g) || []).length, ids.length);
    const seenIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(seenIds).size, seenIds.length, `${file}: id の重複`);
    for (const id of ids) {
      const content = figure(file, id);
      assert.match(content, new RegExp(`<figcaption id="${id}-title">図：`));
      assert.match(content, /<p>[^]*?<\/p>/);
      assert.doesNotMatch(content, /<(?:script|canvas|iframe)\b/i);
      const svgs = [...content.matchAll(/(<svg\b[^>]*role="img"[^>]*aria-labelledby="([^"]+) ([^"]+)"[^>]*>[\s\S]*?<\/svg>)/g)];
      assert.equal(svgs.length, (content.match(/<svg\b/g) || []).length, `${id}: SVG の説明`);
      for (const [, svg, titleId, descId] of svgs) {
        assert.match(svg, new RegExp(`<title id="${titleId}">[^<]+</title>`));
        assert.match(svg, new RegExp(`<desc id="${descId}">[^<]+</desc>`));
        assert.match(svg, /viewBox="[\d. ]+"/);
        assert.doesNotMatch(svg, /(?:href|src)="(?:https?:|\/\/)/i);
      }
    }
  }
  const css = read("tutorial/diagrams.css");
  assert.match(css, /\.learning-diagram svg\s*\{[^}]*width:\s*100%[^}]*height:\s*auto/s);
  assert.match(css, /\.diagram-card\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /@media\s*\(max-width:\s*480px\)/);
  assert.match(css, /\.diagram-flow\s*\{\s*flex-direction:\s*column/s);
  assert.match(css, /\.diagram-marker[^}]*font:\s*700\s+0\.875rem/s);
  for (const [file, id] of [["examples/platformer/tutorial.html", "platformer-instances"], ["examples/platformer/extensions/tutorial.html", "extension-retry"]]) {
    const diagram = figure(file, id);
    assert.equal((diagram.match(/class="diagram-branch-arm"/g) || []).length, 2, id);
    assert.doesNotMatch(diagram, /class="diagram-flow"/, `${id}: 分岐を直列で示さない`);
  }
});

function setup(file, rect = { left: 0, top: 0, width: 800, height: 450 }) {
  const handlers = {}, arcs = [];
  const on = (type, fn) => (handlers[type] ??= []).push(fn);
  const ctx = { clearRect(){}, fillRect(){}, fillText(){}, beginPath(){}, fill(){}, arc(...args){ arcs.push(args); } };
  const canvas = {width:800, height:450, getContext:() => ctx, getBoundingClientRect:() => rect, addEventListener:on};
  const context = vm.createContext({document:{querySelector:() => canvas, addEventListener:on}, window:{addEventListener:on}, performance:{now:() => 0}, requestAnimationFrame(){}});
  vm.runInContext(read(file), context);
  return {run:(s) => vm.runInContext(s, context), fire:(type, e={}) => (handlers[type] || []).forEach((f) => f({preventDefault(){}, repeat:false, ...e})), arcs};
}

test("コインの初期座標、arc と四角による接触例が実際のコードと合う", () => {
  const g = setup("tutorial/05-game/script.js");
  g.run("start()");
  assert.equal(g.run("playerX"), 345); assert.equal(g.run("playerY"), 385);
  assert.equal(g.run("playerWidth"), 110); assert.equal(g.run("playerHeight"), 18);
  assert.equal(g.run("coinX"), 400); assert.equal(g.run("coinY"), 80); assert.equal(g.run("coinRadius"), 14);
  g.run("draw()"); assert.deepEqual(g.arcs.at(-1), [400,80,14,0,Math.PI * 2]);
  const svg = figure("tutorial/index.html", "coin-coordinates");
  assert.match(svg, /circle cx="160" cy="32" r="5\.6"/);
  assert.match(svg, /rect x="138" y="154" width="44" height="7\.2"/);
  assert.equal(400 * 0.4, 160); assert.equal(80 * 0.4, 32); assert.ok(Math.abs(14 * 0.4 - 5.6) < 1e-10);
  const arc = words(figure("tutorial/index.html", "coin-arc"));
  assert.match(arc, /Math\.PI \/ 2/); assert.match(arc, /Math\.PI \* 2/); assert.match(arc, /下端/);
  assert.ok(Math.abs(Math.cos(Math.PI / 2)) < 1e-12 && Math.sin(Math.PI / 2) === 1);
  g.run("coinX=400; coinY=371"); assert.equal(g.run("coinTouchesPlayer()"), true);
  g.run("coinY=370.9"); assert.equal(g.run("coinTouchesPlayer()"), false);
  const hit = words(figure("tutorial/index.html", "coin-hit"));
  for (const term of ["coinY + coinRadius >= playerY", "coinY - coinRadius <= playerY + playerHeight", "coinX + coinRadius >= playerX", "coinX - coinRadius <= playerX + playerWidth", "371 + 14 = 385"]) assert.ok(hit.includes(term), term);
});

test("クリック座標の変換と的の円周は実際のクリック処理で確かめる", () => {
  const g = setup("examples/target/complete/script.js", {left:100, top:50, width:400, height:225});
  const map = words(figure("examples/target/tutorial.html", "target-coordinate"));
  for (const value of ["300 - 100 = 200", "200 × 800 / 400 = 400", "450 / 225 = 225"]) assert.ok(map.includes(value));
  g.run("start()"); g.fire("click", {clientX:300, clientY:162.5}); assert.equal(g.run("score"), 1);
  g.run("start()"); g.fire("click", {clientX:317.5, clientY:162.5}); assert.equal(g.run("score"), 1);
  g.run("start()"); g.fire("click", {clientX:318, clientY:162.5}); assert.equal(g.run("score"), 0);
  assert.match(words(figure("examples/target/tutorial.html", "target-distance")), /Math\.hypot\(35, 0\) = 35/);
});

test("反射とブロックの行列・当たりの数値例がゲームに合う", () => {
  const b = setup("examples/bounce/complete/script.js");
  b.run("start(); x=786; y=225; dx=4; dy=0; update()"); assert.equal(b.run("x"), 790); assert.equal(b.run("dx"), -4);
  b.run("start(); x=400; y=396; dx=0; dy=4; update()"); assert.equal(b.run("y"), 400); assert.equal(b.run("dy"), -4); assert.equal(b.run("score"), 1);
  const paddle = words(figure("examples/bounce/tutorial.html", "bounce-paddle"));
  for (const term of ["dy > 0", "y + radius >= paddleY", "y - radius <= paddleY + 14", "x + radius >= paddleX", "x - radius <= paddleX + paddleWidth"]) assert.ok(paddle.includes(term), term);
  const g = setup("examples/breakout/complete/script.js"); g.run("start()");
  assert.equal(g.run("bricks[10].x"), 240); assert.equal(g.run("bricks[10].y"), 85);
  g.run("x=241; y=95; dx=0; dy=0; update()"); assert.equal(g.run("bricks[10].alive"), false); assert.equal(g.run("score"), 1);
  g.run("start(); bricks=[{x:240,y:85,alive:true}]; x=230; y=95; dx=0; dy=0; update()"); assert.equal(g.run("bricks[0].alive"), false);
  assert.match(words(figure("examples/breakout/tutorial.html", "brick-grid")), /\(240, 85\)/);
});

test("シューティングの4条件と端だけの接触を実際の更新処理で確かめる", () => {
  const g = setup("examples/shooting/complete/script.js");
  const hit = words(figure("examples/shooting/tutorial.html", "shoot-hit"));
  for (const term of ["bullet.x < enemy.x + 30", "bullet.x + 6 > enemy.x", "bullet.y < enemy.y + 30", "bullet.y + 12 > enemy.y", "!bullet.hit", "!enemy.hit"]) assert.ok(hit.includes(term), term);
  g.run("start(); bullets=[{x:100,y:108}]; enemies=[{x:105,y:103}]; spawnTimer=30; update()");
  assert.equal(g.run("score"), 1); assert.equal(g.run("enemies.length"), 0);
  g.run("start(); bullets=[{x:99,y:108}]; enemies=[{x:105,y:103}]; spawnTimer=30; update()");
  assert.equal(g.run("score"), 0); assert.equal(g.run("enemies.length"), 1);
});

test("図の図形の位置と大きさは、説明した数値例の関係を保つ", () => {
  function shapes(file, id) {
    return [...figure(file, id).matchAll(/<rect\b([^>]*)\/>/g)].map(([, attrs]) => Object.fromEntries([...attrs.matchAll(/(?:^|\s)(x|y|width|height)="([\d.]+)"/g)].map(([, key, value]) => [key, Number(value)])));
  }
  const [enemy, bullet] = shapes("examples/shooting/tutorial.html", "shoot-hit");
  assert.equal(enemy.width / bullet.width, 30 / 6);
  assert.equal(enemy.height / bullet.height, 30 / 12);
  assert.equal((enemy.x - bullet.x) / bullet.width * 6, 105 - 100);
  assert.equal((enemy.y - bullet.y) / bullet.height * 12, 105 - 100);
  const [,, touchEnemy, touchBullet] = shapes("examples/shooting/tutorial.html", "shoot-hit");
  assert.equal(touchBullet.x + touchBullet.width, touchEnemy.x, "端だけが接する例");
  const [wall, player] = shapes("examples/platformer/tutorial.html", "platformer-collision");
  assert.equal(wall.x - player.x, 300 - 270);
  assert.equal(player.width, 30); assert.equal(player.height, 40);
  assert.equal(player.y + player.height, 120);
  const [target, before, after] = shapes("examples/platformer/extensions/tutorial.html", "extension-stomp");
  const scale = before.height / 40;
  assert.ok(Math.abs((target.y - (before.y + before.height)) / scale - (360 - 350)) < 1e-9);
  assert.ok(Math.abs(((after.y + after.height) - target.y) / scale - (362 - 360)) < 1e-9);
  const paddle = shapes("examples/bounce/tutorial.html", "bounce-paddle");
  assert.equal(paddle[1].y + paddle[1].height, paddle[0].y, "ボールを囲む四角が板の上端に接する");
  const [stage, viewport, stagePlayer, screen, screenPlayer] = shapes("examples/platformer/tutorial.html", "platformer-camera");
  assert.ok(Math.abs((viewport.x - stage.x) / stage.width * 2400 - 500) < 1e-9);
  assert.ok(Math.abs((stagePlayer.x - stage.x) / stage.width * 2400 - 885) < 1e-9);
  assert.ok(Math.abs((screenPlayer.x - screen.x) / screen.width * 800 - 385) < 1e-9);
  assert.ok(Math.abs(viewport.width / stage.width * 2400 - 800) < 1e-9);
});

test("小さい図でも番号が重ならず、arc の矢印は円周に沿って進む", () => {
  for (const [file, ids] of Object.entries(pages)) for (const id of ids) {
    const content = figure(file, id);
    for (const [, graphic] of content.matchAll(/<div class="diagram-visual">([\s\S]*?)<\/div>/g)) {
      const [, width, height] = graphic.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
      const smallWidth = 144, smallHeight = smallWidth * height / width;
      const marks = [...graphic.matchAll(/class="diagram-marker"[^>]*left:clamp\(10px, ([\d.]+)%, calc\(100% - 10px\)\);top:clamp\(10px, ([\d.]+)%, calc\(100% - 10px\)\)[^>]*>(\d+)<\/span>/g)].map(([, x, y, label]) => ({x: Math.max(10, Math.min(smallWidth - 10, Number(x) * smallWidth / 100)), y: Math.max(10, Math.min(smallHeight - 10, Number(y) * smallHeight / 100)), label}));
      for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) {
        assert.ok(Math.hypot(marks[i].x - marks[j].x, marks[i].y - marks[j].y) >= 20, `${id}: ${marks[i].label} と ${marks[j].label}`);
      }
    }
  }
  const arc = figure("tutorial/index.html", "coin-arc");
  const arrows = [...arc.matchAll(/M(\d+) (\d+) L(\d+) (\d+) L(\d+) (\d+)/g)].map((m) => m.slice(1).map(Number));
  const bottom = arrows.find((a) => a[3] === 140), top = arrows.find((a) => a[3] === 30);
  assert.ok(bottom && bottom[2] < bottom[0] && bottom[2] < bottom[4], "下端では左向き");
  assert.ok(top && top[2] > top[0] && top[2] > top[4], "上端では右向き");
});

test("Player の重力、壁・床・天井、カメラと敵の独立性", () => {
  const step = setup("examples/platformer/step3/script.js");
  step.run("start(); player.onGround=true; jumpPressed=true; player.update(terrain)");
  assert.equal(step.run("player.vy"), -10.5); assert.equal(step.run("player.y"), 339.5);
  step.run("start(); player.x=268; player.onGround=true; right=true; player.update(terrain)"); assert.equal(step.run("player.x"), 270);
  step.run("start(); player.x=500; player.y=300; player.vy=-6; player.update(terrain)"); assert.equal(step.run("player.y"), 295); assert.equal(step.run("player.vy"), 0);
  step.run("start(); player.update(terrain)"); assert.equal(step.run("player.y"), 350); assert.equal(step.run("player.onGround"), true);
  assert.equal(step.run("overlaps({x:0,y:0,width:10,height:10},{x:10,y:0,width:10,height:10})"), false);
  const full = setup("examples/platformer/complete/script.js");
  full.run("start(); player.x=885; update()"); assert.equal(full.run("cameraX"), 500); assert.equal(full.run("player.x-cameraX"), 385);
  full.run("start(); update()"); assert.equal(full.run("cameraX"), 0);
  full.run("start(); player.x=2370; update()"); assert.equal(full.run("cameraX"), 1600);
  full.run("start(); enemies[0].update()"); assert.equal(full.run("enemies[0].x"), 901); assert.equal(full.run("enemies[1].x"), 1700);
  assert.match(words(figure("examples/platformer/tutorial.html", "platformer-gravity")), /同じ更新で重力/);
});

test("踏む例、Shift と中間からの再開を実際の処理で確かめる", () => {
  const g = setup("examples/platformer/extensions/complete/script.js");
  g.run("start(); player.x=900; player.y=310; player.vy=11.5; player.onGround=false; update()");
  assert.equal(g.run("enemies[0].alive"), false); assert.equal(g.run("player.y"), 320); assert.equal(g.run("player.vy"), -8);
  g.run("start(); player.x=900; player.y=340; player.vy=0; update()"); assert.equal(g.run("state"), "over");
  g.run("start(); player.x=900; player.y=350; player.vy=-8; update()"); assert.equal(g.run("state"), "over");
  g.run("start(); right=true; update()"); assert.equal(g.run("player.x"), 84);
  g.run("start(); right=true; dashLeft=true; update()"); assert.equal(g.run("player.x"), 86);
  g.run("start(); right=true; dashRight=true; update()"); assert.equal(g.run("player.x"), 86);
  g.run("start(); checkpoint.active=true; coins[0].taken=true; score=1; enemies[0].stomp(); defeated=1; state='over'");
  g.fire("keydown", {code:"KeyR"}); assert.equal(g.run("player.x"), 1200); assert.equal(g.run("score"), 1); assert.equal(g.run("defeated"), 1); assert.equal(g.run("enemies[0].alive"), false);
  g.fire("keydown", {code:"KeyR", repeat:true}); assert.equal(g.run("player.x"), 1200);
  g.fire("keydown", {code:"KeyR"}); assert.equal(g.run("player.x"), 80); assert.equal(g.run("score"), 0);
  assert.match(words(figure("examples/platformer/extensions/tutorial.html", "extension-stomp")), /350 <= 360/);
});
