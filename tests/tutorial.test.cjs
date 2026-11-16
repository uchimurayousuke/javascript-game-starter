"use strict";
const { verifyLessonSteps } = require("./lesson-edits.cjs");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const steps = ["01-draw", "02-update", "03-input", "04-collision", "05-game"];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const normalize = (text) => text.replace(/\r\n/g, "\n").trimEnd() + "\n";
const tutorial = read("tutorial/index.html");

test("共通ひな型は同じフォルダーの3ファイルだけで動く", () => {
  const html = read("template/index.html");
  assert.match(html, /href="style\.css"/);
  assert.match(html, /src="script\.js"/);
  assert.match(html, /<canvas id="game-canvas" width="800" height="450"/);
  const cleared = [], frames = [];
  const canvas = { width: 800, height: 450, getContext: () => ({ clearRect: (...args) => cleared.push(args) }) };
  const context = vm.createContext({ document: { querySelector: selector => { assert.equal(selector, "#game-canvas"); return canvas; } }, requestAnimationFrame: callback => frames.push(callback) });
  vm.runInContext(read("template/script.js"), context);
  assert.deepEqual(cleared, [[0, 0, 800, 450]]);
  assert.equal(frames.length, 1);
});

function decode(text) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" };
  return text.replace(/&(amp|lt|gt|quot|#39);/g, (_, name) => entities[name]);
}

function functionSource(source, name) {
  const pattern = new RegExp("^function " + name + "\\([^\\n]*\\) \\{\\n[\\s\\S]*?^\\}", "gm");
  const matches = Array.from(source.matchAll(pattern));
  assert.equal(matches.length, 1, "function must exist once: " + name);
  return matches[0];
}

const lessons = Array.from(tutorial.matchAll(/<section\b[^>]*data-step="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g));

test("コインキャッチでは各作業のコピー欄が直接開いている", () => {
  for (const lesson of lessons) {
    assert.doesNotMatch(lesson[2], /class="coin-reference"|説明用の抜粋|比較とコピー用コードを開く/, lesson[1]);
    assert.match(lesson[2], /<pre class="coin-copy"><code data-small-file=/, lesson[1]);
  }
});

test("the published instructions reproduce all three files at every step", async t => {
  assert.deepEqual(lessons.map(lesson => lesson[1]), steps);
  assert.equal(verifyLessonSteps("tutorial/index.html").length, steps.length);
  for (const step of steps) {
    await t.test(step, () => {
      const script = normalize(read("tutorial/" + step + "/script.js"));
      assert.equal(functionSource(script, "gameLoop")[0], functionSource(normalize(read("template/script.js")), "gameLoop")[0]);
    });
  }
});

test("reading pages and game pages stay separate", () => {
  assert.doesNotMatch(tutorial, /<(?:canvas|iframe|object|embed)\b/i);
  assert.deepEqual([...tutorial.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x => x[0]), [
    '<script src="workshop-effects.js?v=20261116-ui-motion" defer></script>',
    '<script src="coin-small-tasks.js?v=20261116-ui-motion" defer></script>',
    '<script src="coin-hit.js?v=20261116-ui-motion" defer></script>',
    '<script src="coin-step-visuals.js" defer></script>',
  ]);
  const requiredHeadings = ["目標", "小さな作業", "保存・再読み込み後の確認", "小さな練習"];
  for (const lesson of lessons) {
    const headings = Array.from(lesson[2].matchAll(/<h3>\d\. ([^<]+)<\/h3>/g), (match) => match[1]);
    assert.deepEqual(headings, requiredHeadings);
  }
  for (const step of steps) {
    const html = read("tutorial/" + step + "/index.html");
    assert.doesNotMatch(html, /STEP|編集する|<nav\b|<h[1-6]\b/);
    const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
    assert.equal((body.match(/<canvas\b/g) || []).length, 1);
    assert.equal(body.replace(/<canvas\b[^>]*>[\s\S]*?<\/canvas>/, "").replace(/<\/?main>/g, "").trim(), "");
  }
});

function checkLink(file, link) {
  assert.doesNotMatch(link, /^[a-z]+:/i, "links and assets must work locally");
  const [pathAndQuery, fragment] = link.split("#");
  const relative = pathAndQuery.split("?")[0];
  const target = relative ? path.resolve(root, path.dirname(file), decodeURIComponent(relative)) : path.join(root, file);
  assert.ok(fs.existsSync(target), file + " links to missing file " + link);
  if (fragment) {
    assert.ok(read(path.relative(root, target)).includes('id="' + fragment + '"'), "missing anchor: " + link);
  }
}

test("HTML assets and relative README links resolve locally", () => {
  const pages = ["template/index.html", "tutorial/index.html", ...steps.map((step) => "tutorial/" + step + "/index.html")];
  for (const file of pages) {
    const html = read(file).replace(/<pre>[\s\S]*?<\/pre>/g, "");
    for (const match of html.matchAll(/(?:href|src)="([^"]*)"/g)) checkLink(file, decode(match[1]));
  }
  for (const file of ["README.md", "tutorial/README.md"]) {
    for (const [, link] of read(file).matchAll(/\]\(([^)]+)\)/g)) {
      if (file === "README.md" && link.startsWith("https://github.com/")) continue;
      checkLink(file, link);
    }
  }
});
