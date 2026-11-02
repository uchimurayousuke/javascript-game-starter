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

test("新しい20教材の手順と赤緑比較は各段階の見本と一致する",()=>{
 const games=[["intermediate","rhythm"],["intermediate","nonogram"],["advanced","match3"],["advanced","bomb-maze"]];
 const features=[["beginner","menu"],["beginner","help"],["beginner","countdown"],["beginner","results"],["intermediate","stage-select"],["intermediate","pause"],["intermediate","difficulty"],["intermediate","sound"],["intermediate","save"],["advanced","fade"],["advanced","particles"],["advanced","touch-controls"]];
 const pair=new RegExp(viewSource+'<details class="old-code"><summary>変更前のコードを確認する</summary><p>変更前（確認用）：</p><pre><code>([\\s\\S]*?)</code></pre></details><p>変更後（コピー用）：</p><pre><code>([\\s\\S]*?)</code></pre>','g');
 function verify(dir,count,initial){let code=initial;const page=read(dir+"tutorial.html"),sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];assert.equal(sections.length,count,dir);
  for(const [i,s] of sections.entries()){
   const next=read(`${dir}step${i+1}/script.js`),view=s[0].match(new RegExp(viewSource));assert.ok(view);checkComparison(code,next,view[1],`${dir}step${i+1}`);
   const pairs=[...s[0].matchAll(pair)];assert.ok(pairs.length,dir);for(const [j,p] of pairs.entries()){const old=decode(p[2]),updated=decode(p[3]);checkComparison(old,updated,p[1],`${dir}step${i+1} change${j+1}`);assert.equal(code.split(old).length,2,dir);code=code.replace(old,updated);}
   assert.equal(code,next,dir);assert.doesNotThrow(()=>new Function(code),`${dir}step${i+1}`);for(const file of ["index.html","style.css","script.js"])assert.ok(fs.existsSync(path.join(root,`${dir}step${i+1}/${file}`)));
  }assert.equal(code,read(dir+"complete/script.js"),dir);return code;
 }
 for(const [level,name] of games){const dir=`examples/${level}/${name}/`,basic=verify(dir,5,read("template/script.js"));verify(dir+"extensions/",3,basic);}
 for(const [level,name] of features){const dir=`features/${level}/${name}/`;verify(dir,3,read("template/script.js"));assert.match(read(dir+"tutorial.html"),/自分のゲームに組み込むには/);}
});

test('追加した教材は各図の代替テキストと画像を備える',()=>{
 const games=[['intermediate','rhythm'],['intermediate','nonogram'],['advanced','match3'],['advanced','bomb-maze']];const features=[['beginner','menu'],['beginner','help'],['beginner','countdown'],['beginner','results'],['intermediate','stage-select'],['intermediate','pause'],['intermediate','difficulty'],['intermediate','sound'],['intermediate','save'],['advanced','fade'],['advanced','particles'],['advanced','touch-controls']];
 const pages=[];for(const [level,name] of games){pages.push([`examples/${level}/${name}/`,2]);pages.push([`examples/${level}/${name}/extensions/`,1]);}for(const [level,name] of features)pages.push([`features/${level}/${name}/`,1]);
 for(const [dir,count] of pages){const page=read(dir+'tutorial.html'),figures=[...page.matchAll(/<figure class="learning-diagram"[\s\S]*?<\/figure>/g)];assert.equal(figures.length,count,dir);for(const f of figures){assert.match(f[0],/alt="[^"]+"/);assert.match(f[0],/role="region" tabindex="0"/);const src=f[0].match(/<img src="([^"]+)"/)[1],img=fs.readFileSync(path.resolve(root,dir,src),'utf8'),view=img.match(/viewBox="0 0 (\d+) (\d+)"/);assert.ok(view,src);assert.match(f[0],new RegExp(`width="${view[1]}" height="${view[2]}"`));}}
});
