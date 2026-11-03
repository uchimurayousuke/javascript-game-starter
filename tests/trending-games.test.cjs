"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
function load(level,name,stage="complete"){
 const listeners={},clock={now:0},randoms=[],math=Object.create(Math),stored={};math.random=()=>randoms.length?randoms.shift():0.9;
 const on=(type,fn)=>(listeners[type]??=[]).push(fn);
 const ctx=new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)});
 const canvas={width:800,height:450,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:800,height:450}),addEventListener:on};
 const document={querySelector:()=>canvas,addEventListener:on,hidden:false};
 const context=vm.createContext({document,window:{addEventListener:on},performance:{now:()=>clock.now},requestAnimationFrame(){},Math:math,localStorage:{getItem:key=>stored[key]??null,setItem:(key,value)=>{stored[key]=value;}}});
 vm.runInContext(fs.readFileSync(path.join(root,"examples",level,name,stage,"script.js"),"utf8"),context);
 const fire=(type,event={})=>(listeners[type]||[]).forEach(fn=>fn({repeat:false,preventDefault(){},...event}));
 return {clock,randoms,document,fire,run:code=>vm.runInContext(code,context),key:(key,modifiers={})=>fire("keydown",{key,code:key===" "?"Space":key,...modifiers}),up:key=>fire("keyup",{key,code:key}),click:(x,y)=>fire("click",{clientX:x,clientY:y}),tick:(dt=1000/60)=>{clock.now+=dt;vm.runInContext("update()",context);}};
}
const value=(g,expr)=>JSON.parse(g.run(`JSON.stringify(${expr})`));
test("ことば当ては正位置を先に消費し、入力と再挑戦を扱う",()=>{
 const g=load("intermediate","word-guess");
 assert.deepEqual(value(g,'judge("NOON", "MOON")'),["absent","exact","exact","exact"]);
 assert.deepEqual(value(g,'judge("MOON", "NOON")'),["absent","exact","exact","exact"]);
 g.run('answer="MOON"');for(const k of "BIR")g.key(k);g.key("Enter");assert.equal(g.run("rows.length"),0);g.key("D");g.key("Enter");assert.equal(g.run("rows.length"),1);
 for(const k of "MOON")g.key(k);g.key("Enter");assert.equal(g.run("state"),"clear");g.key("R");assert.equal(g.run("state"),"clear");g.key(" ");assert.equal(g.run("state"),"playing");
 g.key("R");g.key("H");assert.equal(g.run("draft"),"RH");g.key("Backspace");assert.equal(g.run("draft"),"R");g.key("A",{ctrlKey:true});g.key("B",{metaKey:true});g.key("C",{altKey:true});assert.equal(g.run("draft"),"R");
 assert.ok(g.run("words.length")>g.run("maxRows"));assert.ok(load("intermediate","word-guess","extensions/step2").run("words.length > maxRows"));
});
test("へんか探しは基準を壊さず差から正誤を判定し、連続正解と失敗を扱う",()=>{
 const g=load("intermediate","anomaly-check");const before=g.run("JSON.stringify(baseline)");assert.equal(g.run("state"),"reference");g.key("Enter");
 g.randoms.push(0,0,0.4);g.run("nextRound()");assert.equal(g.run("scene[0].x"),170);assert.equal(g.run("baseline[0].x"),140);assert.equal(g.run('differences[0].change'),"位置が違う");g.key("1");assert.equal(g.run("streak"),1);assert.match(g.run("message"),/窓は位置が違う/);
 g.key("Enter");g.run("scene = baseline.map(item => ({...item})); differences = []; state='playing'");g.key("1");assert.equal(g.run("streak"),0);
 for(let i=0;i<5;i++){g.run("scene = baseline.map(item => ({...item})); differences = []; state='playing'");g.key("2");}
 assert.equal(g.run("state"),"clear");g.key(" ");assert.equal(g.run("state"),"reference");assert.equal(g.run("JSON.stringify(baseline)"),before);
});
test("フルーツは重なりを有限値で解決し、同じ果物を二重に合体しない",()=>{
 const g=load("advanced","fruit-merge");
 g.run("game.fruits=[new Fruit(200,200,0),new Fruit(200,200,0),new Fruit(200,200,0)]");g.run("game.resolvePairs()");
 assert.deepEqual(value(g,"game.fruits.map(f=>f.level).sort()"),[0,1]);assert.equal(g.run("game.score"),20);
 g.run("game.fruits=[new Fruit(200,200,0),new Fruit(200,200,1)]");g.run("game.resolvePairs()");assert.equal(g.run("game.fruits.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y))"),true);assert.equal(g.run("game.fruits.length"),2);
 g.run("game.fruits=[]; game.cooldown=0; game.drop(); game.drop()");assert.equal(g.run("game.fruits.length"),1);
 g.run("game.fruits=Array.from({length:40},(_,i)=>new Fruit(80+i*12,200,5)); game.cooldown=0; game.drop()");assert.equal(g.run("game.fruits.length"),40);
 g.run("game.fruits=Array.from({length:10},(_,i)=>new Fruit(70,410-i*20,5));game.state='playing'");for(let i=0;i<120;i++)g.tick();assert.ok(g.run("game.fruits.every(f=>f.x-f.radius>=leftWall-0.001&&f.x+f.radius<=rightWall+0.001&&f.y+f.radius<=floorY+0.001&&Number.isFinite(f.x)&&Number.isFinite(f.y))"));
});
test("自動攻撃はゼロ距離や多重衝突を扱い、選択中は止まり60秒でクリア",()=>{
 const g=load("advanced","survivor");g.run("game.enemies=[new Enemy(game.player.x,game.player.y)];game.shoot()");assert.equal(g.run("game.bullets.every(b=>Number.isFinite(b.vx)&&Number.isFinite(b.vy))"),true);
 g.run("game.enemies=[new Enemy(500,200),new Enemy(500,200)];game.enemies.forEach(e=>e.hp=1);game.bullets=[new Bullet(500,200,0,0)];game.spawnTimer=100;game.shotTimer=100");g.tick(16);assert.equal(g.run("game.enemies.length"),1);assert.equal(g.run("game.gems.length"),1);assert.equal(g.run("game.bullets.length"),0);
 g.run("game.gems=[new Gem(game.player.x,game.player.y),new Gem(game.player.x,game.player.y),new Gem(game.player.x,game.player.y)];game.enemies=[]");g.tick(16);assert.equal(g.run("game.state"),"choice");const elapsed=g.run("game.elapsed");g.tick(2000);assert.equal(g.run("game.elapsed"),elapsed);g.key("1");assert.equal(g.run("game.state"),"playing");assert.equal(g.run("game.damage"),2);
 g.run("game.spawn=()=>{};game.enemies=[];game.player.hp=5;game.elapsed=0");g.tick(60000);assert.ok(g.run("game.elapsed <= 0.05"));g.fire("blur");g.tick(60000);assert.ok(g.run("game.elapsed <= 0.05"));g.fire("focus");g.document.hidden=true;g.fire("visibilitychange");g.tick(60000);assert.ok(g.run("game.elapsed <= 0.05"));g.document.hidden=false;g.fire("visibilitychange");for(let i=0;i<1201;i++)g.tick(50);assert.equal(g.run("game.state"),"clear");g.key(" ");assert.equal(g.run("game.state"),"playing");
});
test("サバイバルの基本攻撃は最も近い敵への方向を距離で割って求める",()=>{
 const g=load("advanced","survivor");
 g.run("game.enemies=[new Enemy(game.player.x+60,game.player.y),new Enemy(game.player.x+3,game.player.y+4)];game.bullets=[];game.shoot()");
 assert.equal(g.run("game.bullets.length"),1);
 assert.equal(g.run("game.bullets[0].vx"),180);
 assert.equal(g.run("game.bullets[0].vy"),240);
 g.run("game.enemies=[new Enemy(game.player.x,game.player.y)];game.bullets=[];game.shoot()");
 assert.equal(g.run("game.bullets[0].vx"),300);
 assert.equal(g.run("game.bullets[0].vy"),0);
});
test("発展の画面キー、5文字と成績保存が動く",()=>{
 const g=load("intermediate","word-guess","extensions/complete");g.run('answer="APPLE"');
 for(const letter of "APPLE"){
  const spot=value(g,`keyboard.map(row=>row.indexOf("${letter}"))`),row=spot.findIndex(i=>i>=0),col=spot[row];g.click(30+col*31+10,350+row*28+10);
 }
 assert.equal(g.run("draft"),"APPLE");g.click(400,395);assert.equal(g.run("state"),"clear");assert.equal(g.run("stats.won"),1);g.click(400,395);assert.equal(g.run("state"),"playing");assert.equal(g.run("stats.played"),1);
});
test("へんか探しの発展は2か所、期限と変化した物の選択を扱う",()=>{
 const g=load("intermediate","anomaly-check","extensions/complete");g.randoms.push(0,0,0.4,0);g.run("nextRound()");assert.equal(g.run("differences.length"),2);g.key("1");assert.equal(g.run("state"),"locate");g.click(220,145);assert.equal(g.run("streak"),1);
 g.randoms.push(0.9);g.run("nextRound()");g.tick(8000);assert.equal(g.run("state"),"feedback");assert.equal(g.run("streak"),0);assert.match(g.run("message"),/時間切れ/);
});
test("フルーツは猶予中に終了せず、上限線と連鎖得点を扱う",()=>{
 const g=load("advanced","fruit-merge","extensions/complete");g.run("game.fruits=[new Fruit(320,100,5)];game.fruits[0].age=0;game.dangerFrames=59");g.tick();assert.equal(g.run("game.state"),"playing");
 g.run("game.fruits[0].age=181;game.fruits[0].vy=0;game.dangerFrames=59");g.tick();assert.equal(g.run("game.state"),"over");g.key("r");assert.equal(g.run("game.score"),0);
 for(let i=0;i<2;i++)g.run("game.fruits=[new Fruit(200,200,0),new Fruit(220,200,0)];game.resolvePairs()");assert.equal(g.run("game.combo"),2);assert.equal(g.run("game.score"),60);
});
test("サバイバルの発展は3発、種類ごとの敵、各数の上限を守る",()=>{
 const g=load("advanced","survivor","extensions/complete");g.run("game.bullets=[];game.enemies=[new Enemy(500,225,'fast')];game.shoot()");assert.equal(g.run("game.bullets.length"),3);assert.equal(g.run("game.enemies[0].speed"),78);
 g.run("game.enemies=Array.from({length:60},()=>new Enemy(500,225));game.spawn()");assert.equal(g.run("game.enemies.length"),60);
 g.run("game.bullets=Array.from({length:99},()=>new Bullet(100,100,0,0));game.shoot()");assert.equal(g.run("game.bullets.length"),100);
 g.run("game.enemies=[];game.elapsed=29.99;game.spawnTimer=100;game.last=performance.now()");g.tick(50);assert.equal(g.run("game.enemies.filter(e=>e.kind==='boss').length"),1);g.tick(50);assert.equal(g.run("game.enemies.filter(e=>e.kind==='boss').length"),1);
});
test("4教材の手順と比較表示は32段階のコードを再現する",()=>{
 const games=[["intermediate","word-guess"],["intermediate","anomaly-check"],["advanced","fruit-merge"],["advanced","survivor"]];
 const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#x27);/g,x=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#x27;":"'"})[x]);
 for(const [level,name] of games)for(const extension of [false,true]){
  const base=path.join(root,"examples",level,name),folder=path.join(base,extension?"extensions":""),page=fs.readFileSync(path.join(folder,"tutorial.html"),"utf8");
  const sections=[...page.matchAll(/<section><h2>ステップ (\d)：[\s\S]*?<\/section>/g)];assert.equal(sections.length,extension?3:5,name);assert.doesNotMatch(page,/<(?:canvas|iframe|script)\b/i);
  let previous=fs.readFileSync(extension?path.join(base,"complete/script.js"):path.join(root,"template/script.js"),"utf8").replace(/\r\n/g,"\n");
  for(const [index,match] of sections.entries()){
   const section=match[0],pair=section.match(/<details class="old-code"><summary>変更前のコードを確認する<\/summary><p>変更前（確認用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre><\/details><p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/);assert.ok(pair,`${name} ${index+1}`);
   const old=decode(pair[1]),next=decode(pair[2]);assert.equal(old,previous);assert.equal(next,fs.readFileSync(path.join(folder,`step${index+1}/script.js`),"utf8"));
   assert.match(section,/<h3>目標<\/h3>/);assert.match(section,/<h3>コードの意味<\/h3>/);assert.match(section,/<h3>保存後の確認<\/h3>/);assert.match(section,/<h3>小さな練習<\/h3>/);assert.match(section,/<summary>練習の答え<\/summary>/);
   const rows=[...section.matchAll(/<div class="change-row change-(same|removed|added)"><span class="change-label">[^<]*<\/span><span class="change-code">([\s\S]*?)<\/span><\/div>/g)];assert.ok(rows.length);
   const before=old.split("\n"),after=next.split("\n");let a=0,b=0;
   for(const [,kind,text] of rows){const line=text==="（空行）"?"":decode(text);if(kind!=="added"){a=before.indexOf(line,a);assert.ok(a>=0,`${name} old ${line}`);a++;}if(kind!=="removed"){b=after.indexOf(line,b);assert.ok(b>=0,`${name} new ${line}`);b++;}}
   previous=next;
  }
  assert.equal(previous,fs.readFileSync(path.join(folder,"complete/script.js"),"utf8"));
 }
});
