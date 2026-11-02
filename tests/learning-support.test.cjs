"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const decode = s => s.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, x => ({"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"', "&#39;":"'", "&#x27;":"'"}[x]));
function checkComparison(oldCode,newCode,view) {
  const oldLines=oldCode.replace(/\n$/,"").split("\n"),newLines=newCode.replace(/\n$/,"").split("\n");
  const groups=[];let group;
  for(const [,kind,label,raw] of view.matchAll(/<div class="change-row change-(removed|added|same|hunk)"><span class="change-label">([^<]*)<\/span><span class="change-code">([^<]*)<\/span><\/div>/g)){
    assert.equal(decode(label),{removed:"− 消す",added:"＋ 追加",same:"そのまま",hunk:"比較する場所"}[kind]);
    if(kind==="hunk"){group=[];groups.push(group);}else{assert.ok(group);group.push({kind,text:raw==="（空行）"?"":decode(raw)});}
  }
  assert.ok(groups.length);let oi=0,ni=0;
  const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
  for(const rows of groups){
    const before=rows.filter(r=>r.kind!=="added").map(r=>r.text),after=rows.filter(r=>r.kind!=="removed").map(r=>r.text);let found;
    for(let a=oi;a<=oldLines.length&&!found;a++)if(equal(oldLines.slice(a,a+before.length),before))for(let b=ni;b<=newLines.length;b++)if(equal(newLines.slice(b,b+after.length),after)&&equal(oldLines.slice(oi,a),newLines.slice(ni,b))){found=[a,b];break;}
    assert.ok(found,"比較欄が変更と一致しません");oi=found[0]+before.length;ni=found[1]+after.length;
  }
  assert.ok(equal(oldLines.slice(oi),newLines.slice(ni)),"比較欄に変更の抜けがあります");
}
function harness(file, value = null, failStorage = false) {
  const events = {}, calls = [], images = [], writes = [];
  const listen = (type, fn) => (events[type] ??= []).push(fn);
  class Image { constructor() { images.push(this); } set src(v) { assert.equal(typeof this.onload, "function"); assert.equal(typeof this.onerror, "function"); this.url = v; } }
  const ctx = {clearRect(){},fillRect(...args){calls.push(["rect",...args]);},beginPath(){},arc(...args){calls.push(["arc",...args]);},fill(){},fillText(...args){calls.push(["text",...args]);},drawImage(...args){calls.push(["image",...args]);}};
  const canvas = {width:800,height:450,getContext:()=>ctx};
  const localStorage = {getItem(k){assert.equal(k,"learning-combined-coin-best-v1");if(failStorage)throw Error("blocked");return value;},setItem(k,v){if(failStorage)throw Error("blocked");writes.push([k,v]);}};
  const context=vm.createContext({document:{querySelector:()=>canvas,addEventListener:listen},window:{addEventListener:listen},Image,localStorage,requestAnimationFrame(){},Math,console});
  vm.runInContext(read(file),context);
  return {calls,images,writes,run:s=>vm.runInContext(s,context),key:code=>(events.keydown||[]).forEach(fn=>fn({code,repeat:false,preventDefault(){}}))};
}
test("4段階の変更を出発点から再現し、完成版と一致する",()=>{
 const page=read("learning/combine/tutorial.html"), sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)]; assert.equal(sections.length,4);
 let code=read("tutorial/05-game/script.js");
 for(const [i,section] of sections.entries()){
  const target=read(`learning/combine/step${i+1}/script.js`);
  const overview=section[0].match(/<details class="change-fold">[\s\S]*?<div class="change-view"[\s\S]*?<\/div><\/details>/);assert.ok(overview);checkComparison(code,target,overview[0]);
  const pairs=[...section[0].matchAll(/<details class="old-code"><summary>変更前を確認<\/summary><pre><code>([\s\S]*?)<\/code><\/pre><\/details><p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/g)];assert.ok(pairs.length);
  for(const pair of pairs){const old=decode(pair[1]),next=decode(pair[2]);assert.equal(code.split(old).length,2);code=code.replace(old,next);}
  assert.equal(code,target);
 }
 assert.equal(code,read("learning/combine/complete/script.js"));
});
test("ゲームの画面ごとに入力が分かれ、再挑戦で初期化される",()=>{
 for(const stage of ["step1","step2","step3","step4","complete"]){
  const g=harness(`learning/combine/${stage}/script.js`);assert.equal(g.run("gameState"),"menu");g.key("ArrowLeft");assert.equal(g.run("leftPressed"),false);g.key("Space");assert.equal(g.run("gameState"),"menu");g.key("Enter");assert.equal(g.run("gameState"),"playing");
  g.run("score=4; coinX=playerX+20; coinY=playerY-coinRadius; update()");assert.equal(g.run("gameState"),"clear");assert.equal(g.run("score"),5);g.key("Space");assert.equal(g.run("score"),0);assert.equal(g.run("lives"),3);assert.equal(g.run("gameState"),"playing");
  if(stage!=="step1"){g.run('score=2; lives=1; coinY=canvas.height+coinRadius+1; update()');assert.equal(g.run("gameState"),"gameover");g.key("KeyM");assert.equal(g.run("gameState"),"menu");g.key("Enter");assert.equal(g.run("score"),0);}
 }
});
test("ベストは専用キーを使い、壊れた値や保存拒否でも遊べる",()=>{
 for(const value of [null,"-1","6","3.5","foo","Infinity"," "]){const g=harness("learning/combine/step3/script.js",value);assert.equal(g.run("bestScore"),0);g.key("Enter");assert.equal(g.run("gameState"),"playing");}
 const g=harness("learning/combine/step3/script.js","3");assert.equal(g.run("bestScore"),3);g.key("Enter");g.run('score=4; coinX=playerX+20; coinY=playerY-coinRadius; update()');assert.deepEqual(g.writes,[["learning-combined-coin-best-v1","5"]]);
 const blocked=harness("learning/combine/step3/script.js",null,true);blocked.key("Enter");blocked.run('score=4; coinX=playerX+20; coinY=playerY-coinRadius; update()');assert.equal(blocked.run("bestScore"),5);assert.equal(blocked.run("gameState"),"clear");
});
test("コイン画像は読込時だけ28×28で描き、待機・失敗時は円を描く",()=>{
 const g=harness("learning/combine/step4/script.js");g.key("Enter");g.calls.length=0;g.run("draw()");assert.ok(g.calls.some(x=>x[0]==="arc"));assert.ok(!g.calls.some(x=>x[0]==="image"));const im=g.images[0];assert.equal(im.url,"assets/coin.png");im.onerror();g.calls.length=0;g.run("draw()");assert.ok(g.calls.some(x=>x[0]==="arc"));im.naturalWidth=64;im.naturalHeight=64;im.onload();g.calls.length=0;g.run("draw()");assert.deepEqual(g.calls.find(x=>x[0]==="image").slice(2),[386,66,28,28]);assert.ok(g.calls.some(x=>x[0]==="rect"&&x[3]===110&&x[4]===18));
});
test("意図的な構文エラーは1ファイルだけ、他の見本は構文が正しい",()=>{
 function scripts(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?scripts(path.join(dir,e.name)):e.name.endsWith(".js")?[path.join(dir,e.name)]:[]);}
 let failures=[];for(const file of scripts(path.join(root,"learning"))){try{new vm.Script(fs.readFileSync(file,"utf8"));}catch(e){failures.push(path.relative(root,file).replace(/\\/g,"/"));assert.equal(e.name,"SyntaxError");}}
 assert.deepEqual(failures,["learning/debug/syntax/broken/script.js"]);
});
test("6つのこわれた見本と修正版はそれぞれ1か所だけ異なる",()=>{
 for(const name of ["syntax","name","input","score","reset","image"]){const a=read(`learning/debug/${name}/broken/script.js`).split("\n"),b=read(`learning/debug/${name}/fixed/script.js`).split("\n");assert.equal(a.length,b.length);assert.equal(a.filter((line,i)=>line!==b[i]).length,1,name);}
 assert.throws(()=>harness("learning/debug/name/broken/script.js"),e=>e.name==="ReferenceError");assert.doesNotThrow(()=>harness("learning/debug/name/fixed/script.js"));
 const inputBroken=harness("learning/debug/input/broken/script.js");inputBroken.key("ArrowRight");assert.equal(inputBroken.run("x"),100);
 const input=harness("learning/debug/input/fixed/script.js");input.key("ArrowRight");assert.equal(input.run("x"),110);
 for(const kind of ["broken","fixed"]){const s=harness(`learning/debug/score/${kind}/script.js`);s.key("Space");s.run("update(); update(); update()");assert.equal(s.run("score"),kind==="fixed"?1:3);const r=harness(`learning/debug/reset/${kind}/script.js`);r.key("Space");r.key("KeyR");assert.equal(r.run("score"),kind==="fixed"?0:1);}
 const b=harness("learning/debug/image/broken/script.js"),f=harness("learning/debug/image/fixed/script.js");assert.equal(b.images[0].url,"assets/player-bleu.png");assert.equal(f.images[0].url,"assets/player-blue.png");
});

test("基礎の各例は独立したひな型のstartに入れてConsoleで確かめられる",()=>{
 const examples=[...read("learning/basics.html").matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>decode(m[1]));
 assert.equal(examples.length,4);
 const expected=[[100],[5,"青",300],[0,1,2],[110,200]];
 examples.forEach((example,i)=>{
  const template=read("template/script.js"),code=template.replace("function start() {\n}",`function start() {\n${example}\n}`),logs=[];
  const context=vm.createContext({document:{querySelector:()=>({width:800,height:450,getContext:()=>({clearRect(){}})})},requestAnimationFrame(){},console:{log:(...args)=>logs.push(...args)}});
  vm.runInContext(code,context);assert.deepEqual(logs,expected[i]);
 });
});
test("コイン画像の原画と独立した見本のコピーがそろう",()=>{
 const master=fs.readFileSync(path.join(root,"learning/assets/coin.png"));
 assert.equal(master.subarray(0,8).toString("hex"),"89504e470d0a1a0a");assert.deepEqual([master.readUInt32BE(16),master.readUInt32BE(20)],[64,64]);
 assert.ok(fs.existsSync(path.join(root,"learning/assets/coin.svg")));
 for(const stage of ["step4","complete"])assert.deepEqual(fs.readFileSync(path.join(root,"learning/combine",stage,"assets/coin.png")),master);
});
test("図8枚が各説明に置かれ、代替テキストとSVGの大きさが一致する",()=>{
 const pages=["learning/index.html","learning/setup.html","learning/basics.html","learning/debug/index.html","learning/combine/tutorial.html","learning/project.html"];
 const images=pages.flatMap(p=>[...read(p).matchAll(/<img src="(?:\.\.\/)+tutorial\/illustrations\/astra\/(learning-[^"]+\.svg)" width="(\d+)" height="(\d+)" alt="([^"]+)">/g)]);
 assert.equal(images.length,8);assert.equal(new Set(images.map(m=>m[1])).size,8);
 for(const m of images){const svg=read(`tutorial/illustrations/astra/${m[1]}`),box=svg.match(/viewBox="0 0 (\d+) (\d+)"/);assert.ok(box);assert.deepEqual(m.slice(2,4),box.slice(1,3));}
});
