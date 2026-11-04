"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#x27|#39|#10);/g, (_, name) => ({amp:"&",lt:"<",gt:">",quot:'"',"#x27":"'","#39":"'","#10":"\n"}[name]));
const blocks = (html) => [...html.matchAll(/<pre class="task-code"><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g)].map((m) => ({
  attrs: Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], decode(a[2])])),
  code: decode(m[2]),
}));

test("カードバトルの基本・発展は小作業を順に行うと各段階の見本になる", () => {
  const base = "examples/advanced/card-battle";
  for (const sub of ["", "/extensions"]) {
    const page = read(`${base}${sub}/tutorial.html`);
    const sections = [...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    assert.equal(sections.length, sub ? 3 : 5);
    let source = read(sub ? `${base}/complete/script.js` : "template/script.js");
    for (const [i, section] of sections.entries()) {
      const main = section[0].split('<details class="task-reference">')[0];
      const edits = blocks(main);
      assert.ok(edits.length > 0);
      assert.equal((main.match(/class="lesson-task"/g) || []).length, edits.length);
      assert.equal((main.match(/class="task-marker"/g) || []).length, edits.length);
      assert.equal((main.match(/class="task-copy-button" hidden/g) || []).length, edits.length);
      assert.match(main, /class="task-check"/);
      for (const { attrs, code } of edits) {
        assert.equal(attrs["data-small-file"], "script.js");
        const old = attrs["data-small-match"], action = attrs["data-small-action"], sep = attrs["data-small-separator"];
        assert.ok(old && source.includes(old));
        assert.equal(source.indexOf(old), source.lastIndexOf(old), "目印は1か所に決まる");
        assert.ok(["replace", "before", "after"].includes(action));
        const next = action === "replace" ? code : action === "before" ? code + sep + old : old + sep + code;
        source = source.replace(old, () => next);
        assert.doesNotThrow(() => new vm.Script(source));
      }
      assert.equal(source, read(`${base}${sub}/step${i + 1}/script.js`), `${sub || "basic"} step${i + 1}`);
      assert.match(section[0], /<details class="task-reference">/);
    }
  }
});
