"use strict";
const { verifyLessonSteps } = require("./lesson-edits.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
test("20教材の小作業は各段階の見本と一致する", () => {
  const games=[["intermediate","rhythm"],["intermediate","nonogram"],["advanced","match3"],["advanced","bomb-maze"]];
  const features=[["beginner","menu"],["beginner","help"],["beginner","countdown"],["beginner","results"],["intermediate","stage-select"],["intermediate","pause"],["intermediate","difficulty"],["intermediate","sound"],["intermediate","save"],["advanced","fade"],["advanced","particles"],["advanced","touch-controls"]];
  for (const [level, name] of games) {
    const dir = "examples/" + level + "/" + name + "/";
    assert.equal(verifyLessonSteps(dir + "tutorial.html").length, 5);
    assert.equal(verifyLessonSteps(dir + "extensions/tutorial.html").length, 3);
  }
  for (const [level, name] of features) {
    const page = "features/" + level + "/" + name + "/tutorial.html";
    assert.equal(verifyLessonSteps(page).length, 3);
    assert.match(read(page), /自分のゲームに組み込むには/);
  }
});

test('追加した教材は各図の代替テキストと画像を備える',()=>{
 const games=[['intermediate','rhythm'],['intermediate','nonogram'],['advanced','match3'],['advanced','bomb-maze']];const features=[['beginner','menu'],['beginner','help'],['beginner','countdown'],['beginner','results'],['intermediate','stage-select'],['intermediate','pause'],['intermediate','difficulty'],['intermediate','sound'],['intermediate','save'],['advanced','fade'],['advanced','particles'],['advanced','touch-controls']];
 const pages=[];for(const [level,name] of games){pages.push([`examples/${level}/${name}/`,2]);pages.push([`examples/${level}/${name}/extensions/`,1]);}for(const [level,name] of features)pages.push([`features/${level}/${name}/`,1]);
 for(const [dir,count] of pages){const page=read(dir+'tutorial.html'),figures=[...page.matchAll(/<figure class="learning-diagram"[\s\S]*?<\/figure>/g)];assert.equal(figures.length,count,dir);for(const f of figures){assert.match(f[0],/alt="[^"]+"/);assert.match(f[0],/role="region" tabindex="0"/);const src=f[0].match(/<img src="([^"]+)"/)[1],img=fs.readFileSync(path.resolve(root,dir,src),'utf8'),view=img.match(/viewBox="0 0 (\d+) (\d+)"/);assert.ok(view,src);assert.match(f[0],new RegExp(`width="${view[1]}" height="${view[2]}"`));}}
});
