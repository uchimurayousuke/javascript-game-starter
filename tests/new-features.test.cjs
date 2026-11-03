"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8").replace(/\r\n/g,"\n");
const list=[["beginner","score-combo"],["beginner","lives"],["beginner","dialog"],["beginner","input-edges"],["intermediate","timer"],["intermediate","inventory"],["intermediate","spawner"],["intermediate","invincibility"],["advanced","tilemap"],["advanced","enemy-ai"],["advanced","hit-effects"],["advanced","save-file"]];
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g,v=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#x27;":"'","&#39;":"'"})[v]);
function game(name,level=list.find(x=>x[1]===name)[0],stage="step3",source=null){
 const events={},clock={now:0},draw=[],labels=[],offsets=[],rects=[],elements=[],downloads=[],on=(type,fn)=>(events[type]??=[]).push(fn),ctx=new Proxy({save(){draw.push("save")},restore(){draw.push("restore")},translate(...args){draw.push("translate");offsets.push(args)},clearRect(){},fillRect(...args){rects.push(args)},fillText(text){labels.push(String(text))}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)}),canvas={width:800,height:450,getContext:()=>ctx};
 const document={querySelector:()=>canvas,body:{append(e){elements.push(e)}},createElement(tag){return {tagName:tag.toUpperCase(),files:[],listeners:{},append(){},remove(){},click(){this.clicked=true},addEventListener(type,fn){this.listeners[type]=fn}}}};
 const context=vm.createContext({document,window:{addEventListener:on},performance:{now:()=>clock.now},requestAnimationFrame(){},setTimeout:fn=>fn(),URL:{createObjectURL:blob=>(downloads.push(blob),"blob:demo"),revokeObjectURL(){}},Blob:class{constructor(parts,options){this.parts=parts;this.type=options.type}}});
 vm.runInContext(source===null?read(`features/${level}/${name}/${stage}/script.js`):source,context);
 const fire=(type,event={})=>{let prevented=false;const e={key:"",code:"",repeat:false,preventDefault(){prevented=true},...event};(events[type]||[]).forEach(fn=>fn(e));return prevented;};
 return {clock,draw,labels,offsets,rects,elements,downloads,run:s=>vm.runInContext(s,context),key:(key,extra={})=>fire("keydown",{key,code:key===" "?"Space":key,...extra}),up:key=>fire("keyup",{key}),blur:()=>fire("blur"),update:()=>vm.runInContext("update()",context)};
}
test("12教材は36段階のコピー欄と色分けを適用すると各見本を再現する",()=>{
 for(const [level,name] of list){const dir=`features/${level}/${name}`,page=read(`${dir}/tutorial.html`),sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];assert.equal(sections.length,3,name);let previous=read("template/script.js");
  for(const [i,match] of sections.entries()){
   const section=match[0],pair=section.match(/<details class="old-code"><summary>変更前のコードを確認する<\/summary><p>変更前（確認用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre><\/details><p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/);assert.ok(pair,name);assert.equal(decode(pair[1]),previous);const next=decode(pair[2]);assert.equal(next,read(`${dir}/step${i+1}/script.js`));
   const rows=[...section.matchAll(/<div class="change-row change-(same|removed|added)"><span class="change-label">([^<]*)<\/span><span class="change-code">([^<]*)<\/span><\/div>/g)].map(m=>({kind:m[1],label:decode(m[2]),line:m[3]==="（空行）"?"":decode(m[3])}));assert.ok(rows.length);const counts=section.match(/<summary>行ごとの比較を見る（消す (\d+) 行・追加 (\d+) 行）<\/summary>/);assert.ok(counts);assert.equal(Number(counts[1]),rows.filter(r=>r.kind==="removed").length);assert.equal(Number(counts[2]),rows.filter(r=>r.kind==="added").length);for(const row of rows)assert.equal(row.label,{same:"そのまま",removed:"− 消す",added:"＋ 追加"}[row.kind]);
   assert.deepEqual(rows.filter(r=>r.kind!=="added").map(r=>r.line),previous.replace(/\n$/,"").split("\n"),`${name}: old`);assert.deepEqual(rows.filter(r=>r.kind!=="removed").map(r=>r.line),next.replace(/\n$/,"").split("\n"),`${name}: new`);
   for(const file of ["index.html","style.css"])assert.equal(read(`${dir}/step${i+1}/${file}`),read(`template/${file}`));assert.doesNotThrow(()=>new vm.Script(next));previous=next;
  }
  for(const file of ["index.html","style.css","script.js"])assert.equal(read(`${dir}/complete/${file}`),read(`${dir}/step3/${file}`));assert.match(page,/自分のゲームに組み込むには/);
 }
});
test("得点・残り・持ち物は上限と再開始を守る",()=>{
 let g=game("score-combo");g.key(" ");assert.equal(g.key(" ",{repeat:true}),true);g.key(" ");assert.equal(g.run("score"),30);g.key("f");g.key(" ");assert.equal(g.run("score"),40);g.key("r");assert.equal(g.run("score"),0);
 g=game("lives");for(let i=0;i<3;i++)g.key("x");assert.equal(g.run("state"),"over");g.key("h");assert.equal(g.run("lives"),0);g.key("r");g.key("h");assert.equal(g.run("lives"),3);
 g=game("inventory");g.key("1");assert.equal(g.run("hp"),8);g.key("1");assert.equal(g.run("hp"),10);assert.equal(g.run("potions"),0);g.key("1");assert.equal(g.run("potions"),0);for(let i=0;i<8;i++)g.key("g");assert.equal(g.run("potions"),5);g.key("r");assert.equal(g.run("hp"),5);
});
test("会話と入力は押し始め・長押し・解除を区別する",()=>{
 let g=game("dialog");g.clock.now=200;g.update();assert.equal(g.run("shown"),2);g.key(" ");assert.equal(g.run("shown"),5);g.key(" ");assert.equal(g.run("index"),1);assert.equal(g.run("shown"),0);g.key("r");assert.equal(g.run("index"),0);
 g=game("input-edges");g.key(" ");assert.equal(g.key(" ",{repeat:true}),true);assert.equal(g.run("count"),1);g.key("ArrowRight");assert.equal(g.key("ArrowRight",{repeat:true}),true);for(let i=0;i<3;i++)g.update();assert.equal(g.run("x"),409);g.blur();g.update();assert.equal(g.run("x"),409);g.key("r");assert.equal(g.run("x"),400);
 g=game("input-edges","beginner","step2");g.key("ArrowRight");g.blur();g.update();assert.equal(g.run("x"),400);
});
test("時間切れ・出現と無敵は期限ちょうどを扱う",()=>{
 let g=game("timer");g.clock.now=2500;g.update();assert.equal(g.run("remaining"),7.5);g.clock.now=10000;g.update();assert.equal(g.run("remaining"),0);assert.equal(g.run("state"),"over");g.key("r");assert.equal(g.run("remaining"),10);
 g=game("spawner");for(let i=0;i<12;i++)g.key(" ");assert.equal(g.run("items.length"),10);g.clock.now=3000;g.update();assert.equal(g.run("items.length"),1);g.key("r");assert.equal(g.run("items.length"),0);
 g=game("invincibility");g.key("x");assert.equal(g.run("hp"),2);g.clock.now=999;g.key("x");assert.equal(g.run("hp"),2);g.clock.now=1000;g.key("x");assert.equal(g.run("hp"),1);g.key("r");assert.equal(g.run("hp"),3);
});
test("地図・巡回と追跡・一時演出は位置と期限を守る",()=>{
 let g=game("tilemap");assert.equal(g.key("ArrowLeft",{repeat:true}),true);g.key("ArrowLeft");assert.equal(g.run("col"),1);g.key("ArrowRight");g.key("ArrowRight");assert.equal(g.run("score"),1);assert.equal(g.run("map[1][3]"),0);g.key("r");assert.equal(g.run("map[1][3]"),2);
 g=game("enemy-ai");g.run("start(); playerX=260; enemy.update(playerX)");assert.equal(g.run("enemy.state"),"追跡");g.run("start(); playerX=261; enemy.update(playerX)");assert.equal(g.run("enemy.state"),"巡回");g.run("enemy.x=500; playerX=700; enemy.update(playerX)");assert.equal(g.run("enemy.x"),498);for(const [target,expected] of [[199,199],[200,200],[201,201]]){g.run(`enemy.x=200; playerX=${target}; enemy.update(playerX)`);assert.equal(g.run("enemy.x"),expected);g.run("enemy.update(playerX)");assert.equal(g.run("enemy.x"),expected);}g.key("ArrowRight");g.blur();assert.equal(g.run("right"),false);
 g=game("hit-effects");g.key(" ");g.draw.length=0;g.clock.now=599;g.run("draw()");assert.ok(g.draw.includes("translate"));assert.equal(g.draw.filter(x=>x==="save").length,g.draw.filter(x=>x==="restore").length);g.clock.now=600;g.draw.length=0;g.run("draw()");assert.ok(!g.draw.includes("translate"));
});
test("保存ファイルは不正値を拒み、古い読込で再開後の値を上書きしない",async()=>{
 const g=game("save-file"),input=g.run("loadInput"),change=input.listeners.change,button=g.run("saveButton");assert.equal(g.key(" ",{target:{tagName:"BUTTON"}}),false);assert.equal(g.run("score"),0);
 button.listeners.click();assert.equal(g.downloads[0].type,"application/json");assert.deepEqual(JSON.parse(g.downloads[0].parts[0]),{version:1,score:0,level:1});
 async function load(text,size=20){input.files=[{size,text:async()=>text}];await change();}
 await load('{"version":1,"score":30,"level":2}');assert.equal(g.run("score"),30);assert.equal(g.run("level"),2);
 for(const bad of ["{}",'{"version":2,"score":1,"level":1}','{"version":1,"score":-1,"level":1}','{"version":1,"score":2.5,"level":1}','{"version":1,"score":9,"level":11}','{"version":1,"score":1,"level":1,"extra":1}']){await load(bad);assert.equal(g.run("score"),30);assert.equal(g.run("level"),2);}
 await load('{"version":1,"score":0,"level":1}',4097);assert.equal(g.run("score"),30);let finish;input.files=[{size:20,text:()=>new Promise(resolve=>{finish=resolve})}];const pending=change();g.key("r");finish('{"version":1,"score":88,"level":2}');await pending;assert.equal(g.run("score"),0);assert.equal(g.run("level"),1);
});
test("12教材の図は各最終段階に置かれ、実例の数値と拡大リンクを示す",()=>{
 const values={"score-combo":["10×2＝20","合計得点","40"],lives:["残り回数","0のまま","最大3"],dialog:["100ms","200ms後","shown＝2"],"input-edges":["x＝409","count＝2"],timer:["経過 2.5秒","残り 7.5秒","経過 10秒"],inventory:["HP 8 / 10","HP 10 / 10","薬 0 個"],spawner:["2999ms","3000msちょうど","上限は10個"],invincibility:["999ms","1000ms","2000ms"],tilemap:["310","120","2 → 0"],"enemy-ai":["横の差 100","横の差 101","160〜320"],"hit-effects":["200ms","600ms","上へ8px"],"save-file":["4096バイト","0〜999","1〜10"]};
 for(const [level,name] of list){const page=read(`features/${level}/${name}/tutorial.html`),section=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)][2][0],figure=section.match(new RegExp(`<figure class="learning-diagram" id="feature-${name}"[\\s\\S]*?</figure>`));assert.ok(figure,name);const img=figure[0].match(/<img src="([^"]+)" width="(\d+)" height="(\d+)" alt="([^"]+)">/);assert.ok(img,name);assert.ok(img[4].length>10);assert.match(figure[0],/class="diagram-scroll" role="region" tabindex="0"/);assert.ok(figure[0].includes(`href="${img[1]}" target="_blank" rel="noopener"`));const caption=figure[0].match(/<figcaption[^>]*>図：([^<]+)<\/figcaption>/);assert.ok(caption);assert.ok(figure[0].includes(`aria-label="図を大きく見る：${caption[1]}（新しいタブ）"`));const asset=path.resolve(root,`features/${level}/${name}`,img[1]);assert.equal(asset,path.resolve(root,`tutorial/illustrations/astra/feature-${name}.svg`));const svg=fs.readFileSync(asset,"utf8"),box=svg.match(/viewBox="0 0 (\d+) (\d+)"/);assert.ok(box);assert.deepEqual(img.slice(2,4),box.slice(1,3));assert.match(svg,/<title\b[^>]*>[^<]+<\/title>/);assert.match(svg,/<desc\b[^>]*>[^<]+<\/desc>/);for(const value of values[name])assert.ok(svg.includes(value),`${name}: ${value}`);
 }
});
test("36の小さな練習は指定箇所を変えると記載どおりの結果になる",async()=>{
 const exercises={
  "score-combo":[["score += 10;","score += 5;"],["score += 10 * combo;","score += 5 * combo;"],["combo = 0;\n  if (event.key.toLowerCase() === \"r\")","combo = 1;\n  if (event.key.toLowerCase() === \"r\")"]],
  lives:[["lives = 3;","lives = 2;"],["lives === 0","lives === 1"],["Math.min(3, lives + 1)","Math.min(4, lives + 1)"]],
  dialog:[["\"こんにちは\"","\"おはよう\""],["\"気をつけて\"","\"ありがとう\""],["index += 1; shown = 0;","index += 1; shown = 1;"]],
  "input-edges":[["count += 1;","count += 2;"],["* 3));","* 5));"],["x = 400;","x = 100;"]],
  timer:[["Math.ceil(remaining)","Math.floor(remaining)"],["remaining === 0","remaining <= 3"],["event.key.toLowerCase() === \"r\"","event.key.toLowerCase() === \"n\""]],
  inventory:[["hp = 5;","hp = 4;"],["hp + 3","hp + 2"],["Math.min(5, potions + 1)","Math.min(3, potions + 1)"]],
  spawner:[["items.length < 10","items.length < 5"],["nextSpawn = now + 1000","nextSpawn = now + 2000"],["now - item.born < 3000","now - item.born < 2000"]],
  invincibility:[["hp = 3;","hp = 4;"],["immuneUntil = now + 1000","immuneUntil = now + 2000"],["performance.now() / 200","performance.now() / 400"]],
  tilemap:[["row = 1;","row = 3;"],["col = 1;","col = 2;"],["score += 1;","score += 2;"]],
  "enemy-ai":[["this.direction * 2","this.direction * 1"],["* 3));","* 6));"],["Math.abs(playerX - this.x) <= 100","Math.abs(playerX - this.x) <= 50"]],
  "hit-effects":[["effectStart + 600","effectStart + 1000"],["? 5 : -5","? 10 : -5"],["* 40 / 1000","* 80 / 1000"]],
  "save-file":[["score + 10","score + 5"],["game-save.json","my-save.json"],["data.score > 999","data.score > 99"]]
 };
 for(const [level,name] of list){const sections=[...read(`features/${level}/${name}/tutorial.html`).matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
  for(let i=0;i<3;i++){const [oldText,newText]=exercises[name][i],src=read(`features/${level}/${name}/step${i+1}/script.js`);assert.equal(src.split(oldText).length,2,`${name} ${i+1}: 指定箇所`);const g=game(name,level,`step${i+1}`,src.replace(oldText,newText));const section=sections[i][0],question=section.match(/<h3>予想してみる<\/h3><p>(.*?)<\/p>/)[1],exercise=section.match(/<h3>小さな練習<\/h3><p>(.*?)<\/p>/)[1];assert.notEqual(decode(exercise),decode(question));
   if(name==="score-combo"){g.key(" ");g.key(" ");if(i===2){g.key("f");g.key(" ");assert.equal(g.run("score"),50);}else assert.equal(g.run("score"),i===0?10:15);}
   if(name==="lives"){if(i===0)assert.equal(g.run("lives"),2);if(i===1){g.key("x");g.key("x");assert.equal(g.run("lives"),1);assert.equal(g.run("state"),"over");}if(i===2){g.key("h");assert.equal(g.run("lives"),4);}}
   if(name==="dialog"){if(i===0)assert.equal(g.run("messages[0]"),"おはよう");if(i===1){g.key(" ");assert.equal(g.run("messages[index]"),"ありがとう");}if(i===2){g.key(" ");g.key(" ");assert.equal(g.run("index"),1);assert.equal(g.run("shown"),1);}}
   if(name==="input-edges"){if(i===0){g.key(" ");assert.equal(g.run("count"),2);}if(i===1){g.key("ArrowRight");g.update();g.update();assert.equal(g.run("x"),410);}if(i===2){g.key("ArrowRight");g.update();g.key("r");assert.equal(g.run("x"),100);}}
   if(name==="timer"){if(i===0){g.clock.now=2500;g.update();g.labels.length=0;g.run("draw()");assert.ok(g.labels.includes("残り: 7秒"));}if(i===1){g.clock.now=7000;g.update();assert.equal(g.run("state"),"over");assert.equal(g.run("remaining"),3);}if(i===2){g.clock.now=5000;g.update();g.key("n");assert.equal(g.run("remaining"),10);}}
   if(name==="inventory"){if(i===0)assert.equal(g.run("hp"),4);if(i===1){g.key("1");assert.equal(g.run("hp"),7);}if(i===2){g.key("g");g.key("g");assert.equal(g.run("potions"),3);}}
   if(name==="spawner"){if(i===0){for(let n=0;n<6;n++)g.key(" ");assert.equal(g.run("items.length"),5);}if(i===1){g.clock.now=1000;g.update();g.clock.now=2999;g.update();assert.equal(g.run("items.length"),1);g.clock.now=3000;g.update();assert.equal(g.run("items.length"),2);}if(i===2){g.key(" ");g.clock.now=1000;g.update();g.clock.now=2000;g.update();assert.equal(g.run("items.length"),2);assert.equal(g.run("items.some(item => item.born === 0)"),false);}}
   if(name==="invincibility"){if(i===0)assert.equal(g.run("hp"),4);if(i===1){g.key("x");g.clock.now=1000;g.key("x");assert.equal(g.run("hp"),2);}if(i===2){g.key("x");g.clock.now=200;g.rects.length=0;g.run("draw()");assert.equal(g.rects.length,1);g.clock.now=400;g.rects.length=0;g.run("draw()");assert.equal(g.rects.length,0);}}
   if(name==="tilemap"){if(i===0)assert.equal(g.run("row"),3);if(i===1)assert.equal(g.run("col"),2);if(i===2){g.key("ArrowRight");g.key("ArrowRight");assert.equal(g.run("score"),2);}}
   if(name==="enemy-ai"){if(i===0){g.run("start(); enemy.update(playerX)");assert.equal(g.run("enemy.x"),161);}if(i===1){g.key("ArrowRight");g.update();assert.equal(g.run("playerX"),486);}if(i===2){g.run("start(); playerX=211; enemy.update(playerX)");assert.equal(g.run("enemy.state"),"巡回");g.run("start(); playerX=210; enemy.update(playerX)");assert.equal(g.run("enemy.state"),"追跡");}}
   if(name==="hit-effects"){g.key(" ");if(i===0){g.clock.now=999;assert.equal(g.run("performance.now() < until"),true);g.clock.now=1000;assert.equal(g.run("performance.now() < until"),false);}if(i===1){g.offsets.length=0;g.run("draw()");assert.equal(g.offsets[0][0],10);}if(i===2){g.clock.now=500;g.labels.length=0;g.run("draw()");assert.ok(g.labels.includes("10"));assert.equal(g.run("145 - (performance.now() - effectStart) * 80 / 1000"),105);}}
   if(name==="save-file"){if(i===0){g.key(" ");g.key(" ");assert.equal(g.run("score"),10);}if(i===1){g.run("saveButton").listeners.click();assert.equal(g.elements.find(e=>e.tagName==="A").download,"my-save.json");}if(i===2){const input=g.run("loadInput");input.files=[{size:30,text:async()=>'{"version":1,"score":100,"level":1}'}];await input.listeners.change();assert.equal(g.run("score"),0);assert.equal(g.run("message"),"読み込めませんでした");}}
  }
 }
});
