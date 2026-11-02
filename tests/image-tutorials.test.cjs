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

const examples=[["beginner","image-swap"],["beginner","image-layout"],["beginner","health-bar"],["intermediate","image-background"],["intermediate","image-hitbox"],["intermediate","buttons"],["intermediate","collision"],["intermediate","checkpoint"],["advanced","sprite-animation"],["advanced","image-transform"],["advanced","delta-time"],["advanced","camera"]];
test("12教材の3段階の変更手順と赤緑比較が見本と一致する",()=>{
 const pair=new RegExp(viewSource+'<details class="old-code"><summary>変更前のコードを確認する</summary><p>変更前（確認用）：</p><pre><code>([\\s\\S]*?)</code></pre></details><p>変更後（コピー用）：</p><pre><code>([\\s\\S]*?)</code></pre>','g');
 for(const [level,name] of examples){const dir=`features/${level}/${name}/`,page=read(dir+'tutorial.html'),sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];assert.equal(sections.length,3,dir);assert.match(page,/自分のゲームに組み込むには/);let code=read('template/script.js');
  for(const [i,section] of sections.entries()){const next=read(`${dir}step${i+1}/script.js`),view=section[0].match(new RegExp(viewSource));assert.ok(view);checkComparison(code,next,view[1],`${dir}step${i+1}`);const pairs=[...section[0].matchAll(pair)];assert.ok(pairs.length,dir);for(const [j,pair] of pairs.entries()){const old=decode(pair[2]),updated=decode(pair[3]);checkComparison(old,updated,pair[1],`${dir}変更${j+1}`);assert.equal(code.split(old).length,2,dir);code=code.replace(old,updated);}assert.equal(code,next,dir);assert.doesNotThrow(()=>new Function(code));for(const name of ['index.html','style.css','script.js'])assert.ok(fs.existsSync(path.join(root,`${dir}step${i+1}/${name}`)));}
  assert.equal(code,read(dir+'complete/script.js'));
 }
});

test("PNGの寸法と各見本にある独立コピーを確かめる",()=>{
 const dim={'player-blue.png':[64,64],'player-alt.png':[96,64],'background.png':[800,600],'walk-sheet.png':[256,64]},uses={'beginner/image-swap':['player-blue.png','player-alt.png'],'beginner/image-layout':['player-alt.png'],'intermediate/image-background':['background.png'],'intermediate/image-hitbox':['player-blue.png','player-alt.png'],'advanced/sprite-animation':['walk-sheet.png'],'advanced/image-transform':['player-blue.png']};
 for(const [name,size] of Object.entries(dim)){const data=fs.readFileSync(path.join(root,'features/assets/images',name));assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],size);}
 for(const [slug,names] of Object.entries(uses))for(const stage of ['step1','step2','step3','complete'])for(const name of names){const src=fs.readFileSync(path.join(root,'features/assets/images',name)),copy=fs.readFileSync(path.join(root,'features',slug,stage,'assets',name));assert.deepEqual(copy,src,`${slug}/${stage}/${name}`);}
});

test("共通機能一覧は初心者7・中級10・上級7を紹介する",()=>{
 const page=read('features/index.html'),groups=['初心者向け','中級者向け','上級者向け'];for(let i=0;i<groups.length;i++){const start=page.indexOf(`<h2>${groups[i]}</h2>`),end=i<2?page.indexOf(`<h2>${groups[i+1]}</h2>`):page.indexOf('</main>');assert.ok(start>=0&&end>start);assert.equal((page.slice(start,end).match(/<article>/g)||[]).length,[7,10,7][i]);}for(const [level,name] of examples){assert.ok(page.includes(`${level}/${name}/tutorial.html`));assert.ok(page.includes(`${level}/${name}/complete/index.html`));}assert.ok(read('README.md').includes('24作例'));
});

test("各教材の図は最終段階にあり、代替テキストと正しい寸法を持つ",()=>{
 for(const [level,name] of examples){
  const page=read(`features/${level}/${name}/tutorial.html`);
  const sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
  assert.doesNotMatch(sections[0][0],/<figure/);
  assert.doesNotMatch(sections[1][0],/<figure/);
  const matches=[...sections[2][0].matchAll(/<figure class="learning-diagram"[\s\S]*?<\/figure>/g)];
  assert.equal(matches.length,1,name);
  const figure=matches[0][0];
  assert.match(figure,/role="region" tabindex="0"/);
  const img=figure.match(/<img src="\.\.\/\.\.\/\.\.\/tutorial\/illustrations\/astra\/([^"/]+)" width="(\d+)" height="(\d+)" alt="([^"]+)">/);
  assert.ok(img,name);
  const svg=read(`tutorial/illustrations/astra/${img[1]}`);
  const viewBox=svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  assert.ok(viewBox,name); assert.deepEqual(img.slice(2,4),viewBox.slice(1,3),name);
 }
});
