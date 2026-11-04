"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#x27|#39|#10|#13);/g, (_, x) => ({amp:"&", lt:"<", gt:">", quot:'"', "#x27":"'", "#39":"'", "#10":"\n", "#13":"\r"}[x]));
const blocks = (text) => [...text.matchAll(/<pre class="task-code"><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g)].map((m) => ({attrs:Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((x) => [x[1],decode(x[2])])),code:decode(m[2])}));
const chapters = JSON.parse(read("tutorial/compare/chapters.json"));
const chapter = (folder, step) => chapters.find((entry) => entry.page === `${folder}/tutorial.html` && entry.sources["script.js"] === `${folder}/step${step}/script.js`);
function boot(source) {
  const ctx = new Proxy({}, { get: (target, key) => key in target ? target[key] : () => {}, set: (target, key, value) => { target[key] = value; return true; } });
  const canvas = { width: 800, height: 450, getContext: () => ctx, addEventListener() {}, getBoundingClientRect: () => ({left:0, top:0, width:800, height:450}) };
  new vm.Script(source).runInNewContext({document:{querySelector:() => canvas}, window:{addEventListener() {}}, requestAnimationFrame() {}, performance:{now:() => 0}}, {timeout:1000});
}

for (const name of ["falling-blocks", "match3"]) test(`${name} 基本・発展の小作業で各段階の見本を作れる`, () => {
  const game = `examples/advanced/${name}`;
  for (const extension of ["", "/extensions"]) {
    const folder = game + extension, page = read(`${folder}/tutorial.html`);
    const base = extension ? chapter(game, 5) : null;
    if (extension) assert.ok(base, "基本編の最後の比較データ");
    const files = Object.fromEntries(["index.html", "style.css", "script.js"].map((name) => [name, read(extension ? base.sources[name] : `template/${name}`)]));
    const sections = [...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    assert.equal(sections.length, extension ? 3 : 5);
    for (const [i, section] of sections.entries()) {
      const main = section[0].split('<details class="task-reference">')[0], edits = blocks(main);
      assert.ok(edits.length, `${folder} step${i + 1}`);
      assert.equal((main.match(/class="lesson-task"/g) || []).length, edits.length);
      assert.equal((main.match(/class="task-marker"/g) || []).length, edits.length);
      assert.equal((main.match(/class="task-copy-button" hidden/g) || []).length, edits.length);
      assert.match(main, /class="task-check"/);
      for (const edit of edits) {
        const { attrs, code } = edit, file = attrs["data-small-file"], old = attrs["data-small-match"], sep = attrs["data-small-separator"];
        assert.ok(Object.hasOwn(files, file)); assert.ok(old && files[file].includes(old));
        assert.equal(files[file].indexOf(old), files[file].lastIndexOf(old), "目印が一意");
        const action = attrs["data-small-action"];
        assert.ok(["after", "before", "replace"].includes(action));
        const next = action === "after" ? old + sep + code : action === "before" ? code + sep + old : code;
        files[file] = files[file].replace(old, () => next);
        boot(files["script.js"]);
      }
      const reference = chapter(folder, i + 1); assert.ok(reference, `${folder} step${i + 1}: 比較データ`);
      for (const file of Object.keys(files)) assert.equal(files[file], read(reference.sources[file]), `${folder}/step${i + 1}/${file}`);
    }
  }
});
