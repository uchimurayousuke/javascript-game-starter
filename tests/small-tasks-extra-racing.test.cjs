"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#x27|#39|#10|#13);/g, (_, c) => ({ amp:"&", lt:"<", gt:">", quot:'"', "#x27":"'", "#39":"'", "#10":"\n", "#13":"\r" }[c]));
const blocks = (section) => [...section.matchAll(/<pre class="task-code"><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g)].map((m) => ({ attrs:Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1],decode(a[2])])), code:decode(m[2]) }));

function boot(source) {
  const ctx = new Proxy({}, { get:(target,key) => key in target ? target[key] : () => {}, set:(target,key,value) => { target[key]=value; return true; } });
  const canvas = { width:800, height:450, getContext:() => ctx };
  new vm.Script(source).runInNewContext({ document:{ querySelector:() => canvas }, window:{ addEventListener() {} }, requestAnimationFrame() {}, performance:{ now:() => 0 } }, { timeout:1000 });
}

test("レースの基本と発展の小作業は各段階の見本を再現する", () => {
  for (const sub of ["", "/extensions"]) {
    const dir = `examples/advanced/racing${sub}`, page = read(`${dir}/tutorial.html`);
    const sections = [...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    assert.equal(sections.length, sub ? 3 : 5);
    let source = read(sub ? "examples/advanced/racing/complete/script.js" : "template/script.js");
    for (const [i, section] of sections.entries()) {
      const main = section[0].split('<details class="task-reference">')[0], edits = blocks(main);
      assert.ok(edits.length, `${sub} ${i+1}`);
      assert.equal((main.match(/class="lesson-task"/g) || []).length, edits.length);
      assert.equal((main.match(/class="task-marker"/g) || []).length, edits.length);
      assert.equal((main.match(/class="task-copy-button" hidden/g) || []).length, edits.length);
      assert.match(main, /class="task-check"/);
      for (const {attrs,code} of edits) {
        assert.equal(attrs["data-small-file"], "script.js");
        const old = attrs["data-small-match"], sep = attrs["data-small-separator"], action = attrs["data-small-action"];
        assert.ok(old && source.includes(old)); assert.equal(source.indexOf(old), source.lastIndexOf(old));
        const next = action === "replace" ? code : action === "before" ? code + sep + old : action === "after" ? old + sep + code : null;
        assert.notEqual(next, null); source = source.replace(old, () => next); boot(source);
      }
      assert.equal(source, read(`${dir}/step${i+1}/script.js`), `${sub} step${i+1}`);
    }
    assert.equal(source, read(`${dir}/complete/script.js`));
  }
});
