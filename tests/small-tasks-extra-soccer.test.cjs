"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#x27|#39|#10|#13);/g, (_, c) => ({amp:"&",lt:"<",gt:">",quot:'"',"#x27":"'","#39":"'","#10":"\n","#13":"\r"}[c]));
const blocks = (text) => [...text.matchAll(/<pre class="task-code"><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g)].map((m) => ({attrs:Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], decode(a[2])])), code:decode(m[2])}));

function boot(source) {
  const ctx = new Proxy({}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}});
  const canvas = {width:800,height:450,getContext:()=>ctx,addEventListener(){}};
  new vm.Script(source).runInNewContext({document:{querySelector:()=>canvas},window:{addEventListener(){}},requestAnimationFrame(){}},{timeout:1000});
}

test("サッカーの小作業は基本と発展の全段階の見本を再現する", () => {
  const folder = "examples/advanced/soccer";
  for (const [ext, count] of [["",5],["/extensions",3]]) {
    const page = read(`${folder}${ext}/tutorial.html`);
    const files = Object.fromEntries(["index.html","style.css","script.js"].map((f) => [f, read(ext ? `${folder}/complete/${f}` : `template/${f}`)]));
    const sections = [...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    assert.equal(sections.length,count);
    for (const [i, section] of sections.entries()) {
      const main = section[0].split('<details class="task-reference">')[0], edits = blocks(main);
      assert.ok(edits.length>0, `${ext} step${i+1}`);
      assert.equal((main.match(/class="lesson-task"/g)||[]).length,edits.length);
      assert.equal((main.match(/class="task-marker"/g)||[]).length,edits.length);
      assert.equal((main.match(/class="task-copy-button" hidden/g)||[]).length,edits.length);
      assert.match(main,/<p class="task-check">/);
      assert.match(section[0],/<details class="task-reference">/);
      for (const item of edits) {
        const a=item.attrs, mark=a["data-small-match"], sep=a["data-small-separator"], action=a["data-small-action"];
        assert.equal(a["data-small-file"],"script.js");
        assert.ok(mark && files["script.js"].includes(mark));
        assert.equal(files["script.js"].indexOf(mark),files["script.js"].lastIndexOf(mark),"目印は1か所");
        assert.ok(["replace","before","after"].includes(action));
        const replacement=action==="replace"?item.code:action==="before"?item.code+sep+mark:mark+sep+item.code;
        files["script.js"]=files["script.js"].replace(mark,()=>replacement);
        boot(files["script.js"]);
      }
      for (const f of Object.keys(files)) assert.equal(files[f],read(`${folder}${ext}/step${i+1}/${f}`),`${ext} step${i+1} ${f}`);
    }
  }
});
