"use strict";
const { verifyLessonSteps } = require("./lesson-edits.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const examples=[["beginner","image-swap"],["beginner","image-layout"],["beginner","health-bar"],["intermediate","image-background"],["intermediate","image-hitbox"],["intermediate","buttons"],["intermediate","collision"],["intermediate","checkpoint"],["advanced","sprite-animation"],["advanced","image-transform"],["advanced","delta-time"],["advanced","camera"]];
test("12教材の3段階の小作業が見本と一致する", () => {
  for (const [level, name] of examples) {
    const page = "features/" + level + "/" + name + "/tutorial.html";
    assert.equal(verifyLessonSteps(page).length, 3);
    assert.match(read(page), /自分のゲームに組み込むには/);
  }
});

test("PNGの寸法と各見本にある独立コピーを確かめる",()=>{
 const dim={'player-blue.png':[64,64],'player-alt.png':[96,64],'background.png':[800,600],'walk-sheet.png':[256,64]},uses={'beginner/image-swap':['player-blue.png','player-alt.png'],'beginner/image-layout':['player-alt.png'],'intermediate/image-background':['background.png'],'intermediate/image-hitbox':['player-blue.png','player-alt.png'],'advanced/sprite-animation':['walk-sheet.png'],'advanced/image-transform':['player-blue.png']};
 for(const [name,size] of Object.entries(dim)){const data=fs.readFileSync(path.join(root,'features/assets/images',name));assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],size);}
 for(const [slug,names] of Object.entries(uses))for(const stage of ['step1','step2','step3','complete'])for(const name of names){const src=fs.readFileSync(path.join(root,'features/assets/images',name)),copy=fs.readFileSync(path.join(root,'features',slug,stage,'assets',name));assert.deepEqual(copy,src,`${slug}/${stage}/${name}`);}
});

test("共通機能一覧は初心者11・中級14・上級11を紹介する",()=>{
 const page=read('features/index.html'),groups=['初心者向け','中級者向け','上級者向け'];for(let i=0;i<groups.length;i++){const start=page.indexOf(`<h2>${groups[i]}</h2>`),end=i<2?page.indexOf(`<h2>${groups[i+1]}</h2>`):page.indexOf('</main>');assert.ok(start>=0&&end>start);assert.equal((page.slice(start,end).match(/<article>/g)||[]).length,[11,14,11][i]);}for(const [level,name] of examples){assert.ok(page.includes(`${level}/${name}/tutorial.html`));assert.ok(page.includes(`${level}/${name}/complete/index.html`));}assert.ok(read('README.md').includes('36作例'));
});

test("各教材の図は最終段階にあり、代替テキストと正しい寸法を持つ",()=>{
 for(const [level,name] of examples){
  const page=read(`features/${level}/${name}/tutorial.html`);
  const sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
  assert.doesNotMatch(sections[0][0],/<figure class="learning-diagram"/);
  assert.doesNotMatch(sections[1][0],/<figure class="learning-diagram"/);
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
