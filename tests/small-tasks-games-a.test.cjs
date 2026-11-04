"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const decode = s => s.replace(/&(amp|lt|gt|quot|#x27|#39|#10);/g, (_, c) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#x27": "'", "#39": "'", "#10": "\n" }[c]));
const blocks = text => [...text.matchAll(/<pre class="task-code"><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g)].map(m => ({ attrs: Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], decode(x[2])])), code: decode(m[2]) }));
function boot(source) {
  const ctx = new Proxy({}, { get: (target, key) => key in target ? target[key] : () => {}, set: (target, key, value) => { target[key] = value; return true; } });
  const canvas = { width: 800, height: 450, getContext: () => ctx, addEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 450 }) };
  new vm.Script(source).runInNewContext({ document: { querySelector: () => canvas, addEventListener() {} }, window: { addEventListener() {} }, requestAnimationFrame() {}, performance: { now: () => 0 } }, { timeout: 1000 });
}
function apply(files, block) {
  const a = block.attrs, file = a["data-small-file"], match = a["data-small-match"], sep = a["data-small-separator"];
  assert.ok(Object.hasOwn(files, file));
  assert.ok(match && files[file].includes(match), match);
  assert.equal(files[file].split(match).length, 2, match);
  const replacement = a["data-small-action"] === "after" ? match + sep + block.code : a["data-small-action"] === "before" ? block.code + sep + match : a["data-small-action"] === "replace" ? block.code : null;
  assert.notEqual(replacement, null);
  files[file] = files[file].replace(match, () => replacement);
  boot(files["script.js"]);
}
for (const game of ["examples/beginner/number-guess", "examples/beginner/bounce", "examples/beginner/target", "examples/beginner/timing", "examples/beginner/typing", "examples/beginner/quiz", "examples/beginner/story", "examples/intermediate/anomaly-check", "examples/intermediate/breakout", "examples/intermediate/memory", "examples/intermediate/minesweeper", "examples/intermediate/nonogram", "examples/intermediate/number-cards", "examples/intermediate/rhythm", "examples/intermediate/shooting", "examples/intermediate/shop", "examples/intermediate/snake", "examples/intermediate/sokoban", "examples/intermediate/word-guess"]) test(`${game} の基本・発展の主画面を順に実行し各段階を再現する`, () => {
  for (const ext of ["", "/extensions"]) {
    const page = read(`${game}${ext}/tutorial.html`);
    const files = Object.fromEntries(["index.html", "style.css", "script.js"].map(f => [f, read(ext ? `${game}/complete/${f}` : `template/${f}`)]));
    const sections = [...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    assert.equal(sections.length, fs.readdirSync(path.join(root, game + ext)).filter(n => /^step\d+$/.test(n)).length);
    for (let i = 0; i < sections.length; i++) {
      const main = sections[i][0].split('<details class="task-reference">')[0];
      const tasks = blocks(main);
      assert.ok(tasks.length >= 1);
      assert.equal((main.match(/class="lesson-task"/g) || []).length, tasks.length);
      assert.equal((main.match(/class="task-marker"/g) || []).length, tasks.length);
      assert.equal((main.match(/class="task-copy-button" hidden/g) || []).length, tasks.length);
      assert.match(main, /class="task-check"/);
      for (const task of tasks) apply(files, task);
      for (const f of Object.keys(files)) assert.equal(files[f], read(`${game}${ext}/step${i + 1}/${f}`), `${ext} step${i + 1} ${f}`);
    }
  }
});
