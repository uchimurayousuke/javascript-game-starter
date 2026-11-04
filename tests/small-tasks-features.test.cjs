"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8").replace(/\r\n/g, "\n");
const decode = text => text.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
for (const [level, name] of [...["menu", "lives", "input-edges", "health-bar", "countdown", "results", "help", "score-combo", "dialog", "image-layout", "image-swap"].map(name => ["beginner", name]), ["intermediate", "buttons"], ["intermediate", "checkpoint"], ["intermediate", "collision"], ["intermediate", "difficulty"], ["intermediate", "inventory"], ["intermediate", "invincibility"], ["intermediate", "pause"], ["intermediate", "timer"], ["intermediate", "stage-select"], ["intermediate", "spawner"], ["intermediate", "image-background"], ["intermediate", "image-hitbox"], ["intermediate", "save"], ["intermediate", "sound"], ["advanced", "delta-time"], ["advanced", "camera"], ["advanced", "fade"], ["advanced", "hit-effects"], ["advanced", "particles"], ["advanced", "enemy-ai"], ["advanced", "image-transform"], ["advanced", "sprite-animation"], ["advanced", "tilemap"], ["advanced", "touch-controls"], ["advanced", "save-file"]]) test(`${name}: 小作業を順に適用すると各段階を再現する`, () => {
  const page = read(`features/${level}/${name}/tutorial.html`);
  const files = Object.fromEntries(["index.html", "style.css", "script.js"].map(file => [file, read(`template/${file}`)]));
  for (let stage = 1; stage <= 3; stage++) {
    const section = page.split(`<span class="toc-anchor" id="lesson-section-${stage + 1}"></span><section>`)[1].split("</section>")[0];
    const main = section.split('<details class="task-reference">')[0];
    const tasks = [...main.matchAll(/<div class="lesson-task">([\s\S]*?)<\/div>/g)];
    assert.ok(tasks.length > 0);
    for (const [, task] of tasks) {
      const marker = decode(task.match(/<pre class="task-marker"><code>([\s\S]*?)<\/code>/)[1]);
      const match = task.match(/<pre class="task-code"><code data-small-file="([^"]+)" data-small-action="([^"]+)" data-small-match="([^"]*)" data-small-separator="([^"]*)">([\s\S]*?)<\/code>/);
      assert.ok(match);
      const [, file, action, rawNeedle, rawSeparator, rawCode] = match;
      const needle = decode(rawNeedle), separator = decode(rawSeparator), code = decode(rawCode);
      assert.equal(marker, needle);
      assert.equal(files[file].split(needle).length, 2, `一意な目印: ${needle}`);
      const replacement = action === "replace" ? code : action === "before" ? code + separator + needle : needle + separator + code;
      files[file] = files[file].replace(needle, () => replacement);
      const result = spawnSync(process.execPath, ["--check", "-"], { input: files["script.js"], encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      const context = new Proxy({}, { get: (target, property) => property in target ? target[property] : () => {} });
      const element = () => ({ style: {}, append() {}, remove() {}, click() {}, addEventListener() {} });
      const canvas = { ...element(), width: 800, height: 450, getContext: () => context, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 450 }) };
      const window = { addEventListener() {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
      const document = { querySelector: () => canvas, createElement: element, body: element() };
      const sandbox = { window, document, performance: { now: () => 100 }, requestAnimationFrame() {}, setTimeout() {}, Image: class {}, Blob, URL };
      assert.doesNotThrow(() => vm.runInNewContext(files["script.js"], sandbox, { timeout: 1000 }), `起動と描画: ${name} step${stage}`);
    }
    for (const file of Object.keys(files)) assert.equal(files[file], read(`features/${level}/${name}/step${stage}/${file}`), `${name} step${stage} ${file}`);
  }
});
