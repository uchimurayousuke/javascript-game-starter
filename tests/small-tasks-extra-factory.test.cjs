"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#x27|#39|#10|#13);/g, (_, c) => ({amp:"&",lt:"<",gt:">",quot:'"',"#x27":"'","#39":"'","#10":"\n","#13":"\r"}[c]));
const blocks = (section) => [...section.matchAll(/<pre class="task-code"><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g)].map((m) => ({attrs:Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1],decode(a[2])])),code:decode(m[2])}));

test("工場の基本と発展の小作業は構文を保ち各段階の見本を再現する", () => {
  const chapters=JSON.parse(read("tutorial/compare/chapters.json"));
  for(const sub of ["", "/extensions"]) {
    const dir=`examples/advanced/conveyor-factory${sub}`, page=read(`${dir}/tutorial.html`);
    const sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    const references=chapters.filter((x)=>x.page===`${dir}/tutorial.html`);
    assert.equal(sections.length,sub?3:5);assert.equal(references.length,sections.length);
    const files={"index.html":read("template/index.html"),"style.css":read("template/style.css"),"script.js":read(sub?"examples/advanced/conveyor-factory/complete/script.js":"template/script.js")};
    for(const [i,section] of sections.entries()) {
      const main=section[0].split('<details class="task-reference">')[0],edits=blocks(main);
      assert.ok(edits.length,`${sub} step${i+1}`);
      assert.equal((main.match(/class="lesson-task"/g)||[]).length,edits.length);
      assert.equal((main.match(/class="task-marker"/g)||[]).length,edits.length);
      assert.equal((main.match(/class="task-copy-button" hidden/g)||[]).length,edits.length);
      assert.match(main,/class="task-check"/);
      for(const {attrs,code} of edits) {
        const file=attrs["data-small-file"],old=attrs["data-small-match"],sep=attrs["data-small-separator"],action=attrs["data-small-action"];
        assert.ok(Object.hasOwn(files,file));assert.ok(old&&files[file].includes(old));
        assert.equal(files[file].indexOf(old),files[file].lastIndexOf(old),`${sub} step${i+1}: 目印`);
        const next=action==="replace"?code:action==="before"?code+sep+old:action==="after"?old+sep+code:null;
        assert.notEqual(next,null);files[file]=files[file].replace(old,()=>next);
        assert.doesNotThrow(()=>new vm.Script(files["script.js"]),`${sub} step${i+1}: 小作業後の構文`);
      }
      for(const file of Object.keys(files)) assert.equal(files[file],read(references[i].sources[file]),`${sub} step${i+1} ${file}`);
    }
  }
});
