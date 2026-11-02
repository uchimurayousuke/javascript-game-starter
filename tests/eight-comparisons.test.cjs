"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (x) => ({"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"', "&#39;":"'", "&#x27;":"'"}[x]));
const levelOf = game => (["target", "bounce", "timing", "typing", "number-guess"].includes(game) ? "beginner" : ["breakout", "shooting", "snake", "memory", "shop"].includes(game) ? "intermediate" : "advanced");
const examplePath = p => `${levelOf(p.split("/")[0])}/${p}`;
const pages = ["tutorial/index.html", ...["target", "bounce", "breakout", "shooting", "platformer", "platformer/extensions", "timing", "typing", "number-guess", "snake", "memory", "shop", "escape", "tower-defense", "card-battle", "racing"].map((p) => `examples/${examplePath(p)}/tutorial.html`)];
const rowPattern = /<div class="change-row change-(removed|added|same|hunk)"><span class="change-label">([^<]*)<\/span><span class="change-code">([^<]*)<\/span><\/div>/g;
const rowSource = '(?:<div class="change-row change-(?:removed|added|same|hunk)"><span class="change-label">[^<]*</span><span class="change-code">[^<]*</span></div>)*';
const viewSource = `<div class="change-view" aria-label="コードの変更の比較"><p class="change-view-title">比較（読むための表示）</p>(${rowSource})</div>`;
const rows = (html) => [...html.matchAll(rowPattern)].map(([, kind, label, code]) => ({ kind, label: decode(label), code: code === '（空行）' ? '' : decode(code) }));
const lines = (text) => text.replace(/\n$/, "").split("\n");
const equal = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const at = (array, part, index) => equal(array.slice(index, index + part.length), part);

function checkComparison(oldCode, newCode, view, location) {
  const oldLines = lines(oldCode), newLines = lines(newCode), groups = [];
  let current;
  for (const item of rows(view)) {
    const labels = { removed: "− 消す", added: "＋ 追加", same: "そのまま", hunk: "比較する場所" };
    assert.equal(item.label, labels[item.kind], location);
    if (item.kind === "hunk") { current = []; groups.push(current); }
    else { assert.ok(current, location); current.push(item); }
  }
  assert.ok(groups.length, location);
  assert.ok(groups.flat().some((x) => x.kind === "added" || x.kind === "removed"), location);
  let oi = 0, ni = 0;
  for (const group of groups) {
    const o = group.filter((x) => x.kind !== "added").map((x) => x.code);
    const n = group.filter((x) => x.kind !== "removed").map((x) => x.code);
    let found = null;
    for (let a = oi; a <= oldLines.length && !found; a++) {
      if (!at(oldLines, o, a)) continue;
      for (let b = ni; b <= newLines.length; b++) {
        if (at(newLines, n, b) && equal(oldLines.slice(oi, a), newLines.slice(ni, b))) { found = [a, b]; break; }
      }
    }
    assert.ok(found, `${location}: 表示した行が元のコードと一致しません`);
    oi = found[0] + o.length; ni = found[1] + n.length;
  }
  assert.ok(equal(oldLines.slice(oi), newLines.slice(ni)), `${location}: 変更行が省略されています`);
}

test("新しい16教材の赤緑比較は各変更と各段階に一致する",()=>{
 const games=[["beginner","quiz"],["beginner","story"],["intermediate","sokoban"],["intermediate","minesweeper"],["advanced","falling-blocks"],["advanced","quest-rpg"],["advanced","tactics"],["advanced","soccer"]];
 const pair=new RegExp(viewSource+'<details class="old-code"><summary>変更前のコードを確認する</summary><p>変更前（確認用）：</p><pre><code>([\\s\\S]*?)</code></pre></details><p>変更後（コピー用）：</p><pre><code>([\\s\\S]*?)</code></pre>','g');
 for(const [level,name] of games){let previous=read("template/script.js");for(const sub of ["","extensions/"]){const dir=`examples/${level}/${name}/${sub}`,page=read(dir+"tutorial.html"),sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
  assert.equal(sections.length,sub?3:5,dir);
  for(const section of sections){const step=section[1],view=section[0].match(new RegExp(viewSource)),next=read(`${dir}step${step}/script.js`);assert.ok(view,`${dir}${step}`);checkComparison(previous,next,view[1],`${dir}${step} 全体`);previous=next;
   const matches=[...section[0].matchAll(pair)];assert.ok(matches.length);for(const [i,m] of matches.entries())checkComparison(decode(m[2]),decode(m[3]),m[1],`${dir}${step} 変更${i+1}`);assert.equal(matches.length,(section[0].match(/<details class="old-code">/g)||[]).length);
  }
 }}
});
