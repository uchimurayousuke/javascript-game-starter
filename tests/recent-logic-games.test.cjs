"use strict";
const {test}=require("node:test"), assert=require("node:assert/strict"), fs=require("node:fs"), path=require("node:path"), vm=require("node:vm");
const root=path.resolve(__dirname,"..");
function load(level,name,stage="complete") {
 const listeners={}, clock={now:0}, draws=[], ctx=new Proxy({fillText:(...args)=>draws.push({type:"text",args}),fillRect:(...args)=>draws.push({type:"rect",args})}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>(obj[key]=value,true)});
 const on=(type,fn)=>(listeners[type]??=[]).push(fn);
 const canvas={width:800,height:450,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:800,height:450}),addEventListener:on};
 const document={querySelector:()=>canvas,addEventListener:on,hidden:false};
 const context=vm.createContext({document,window:{addEventListener:on},performance:{now:()=>clock.now},requestAnimationFrame(){},Math});
 vm.runInContext(fs.readFileSync(path.join(root,"examples",level,name,stage,"script.js"),"utf8"),context);
 const run=code=>vm.runInContext(code,context), fire=(type,event={})=>(listeners[type]||[]).forEach(fn=>fn({preventDefault(){},repeat:false,...event}));
 return {run,document,fire,draws,key:(key,code=key)=>fire("keydown",{key,code}),tick:ms=>{clock.now+=ms;run("update()");}};
}
const val=(game,expr)=>JSON.parse(game.run(`JSON.stringify(${expr})`));
test("数字カードは組合せの優先順位と無効入力、最後の一手の成功を守る",()=>{
 const g=load("intermediate","number-cards");
 assert.deepEqual(val(g,"Array.from({length:6},(_,i)=>[...deck,...hand].filter(v=>v===i+1).length)"),[4,4,4,4,4,4]);
 assert.deepEqual(val(g,"[evaluateCards([2,2,2]).multiplier,evaluateCards([2,3,4]).multiplier,evaluateCards([2,2,5]).multiplier,evaluateCards([1,3,6]).multiplier]"),[4,3,2,1]);
 assert.deepEqual(val(g,"evaluateCards([2,2,5])"),{sum:9,multiplier:2,name:"2つ同じ",points:18});
 g.run("hand=[5,2,2,1,3,4,6]; selected=[0,1,2]; evaluateCards(selected.map(i=>hand[i]))");assert.deepEqual(val(g,"hand"),[5,2,2,1,3,4,6]);
 g.run("selected=[];submit()");assert.equal(g.run("plays"),0);
 g.run("selected=[0,1,2];selectCard(3)");assert.equal(g.run("selected.length"),3);
 g.run("score=60;plays=2;submit()");assert.equal(g.run("state"),"clear");assert.equal(g.run("score"),78);
 g.key(" ","Space");assert.equal(g.run("score"),0);assert.equal(g.run("hand.length"),7);
});
test("カードの発展は道具の順番と強化を反映する",()=>{
 const g=load("intermediate","number-cards","extensions/complete");
 assert.equal(g.run("evaluateCards([2,2,5]).points"),54);g.key("q");assert.equal(g.run("evaluateCards([2,2,5]).points"),45);
 g.run("score=100;hand=[2,2,5,1,3,4,6];selected=[0,1,2];submit()");assert.equal(g.run("state"),"choice");g.key("1");assert.equal(g.run("round"),2);assert.equal(g.run("bonus"),2);assert.equal(g.run("plays"),0);
});
test("途中段階は実装済みの操作だけを表示し、バッグの回転を大きく見せる",()=>{
 for(const stage of ["step1","step2","step3"]){const g=load("intermediate","number-cards",stage);const texts=g.draws.filter(x=>x.type==="text").map(x=>String(x.args[0])).join(" ");assert.doesNotMatch(texts,/Enter/);if(stage==="step1")assert.doesNotMatch(texts,/クリックで選択/);}
 const first=load("advanced","bag-layout","step1");assert.doesNotMatch(first.draws.filter(x=>x.type==="text").map(x=>x.args[0]).join(" "),/Rで回転|盤面に置く|回収/);
 const preview=load("advanced","bag-layout","step2");preview.key("1");preview.key("r");preview.draws.length=0;preview.run("draw()");
 assert.deepEqual(val(preview,"bag.selected.cells"),[[1,0],[0,0],[0,1]]);assert.equal(preview.run("bag.items[0].x"),null);
 assert.equal(preview.draws.filter(x=>x.type==="rect"&&x.args[2]===58&&x.args[3]===58).length,3);
 assert.match(preview.draws.filter(x=>x.type==="text").map(x=>x.args[0]).join(" "),/まだ配置しません/);
 for(const stage of ["step1","step2"]){const g=load("advanced","conveyor-factory",stage);const texts=g.draws.filter(x=>x.type==="text").map(x=>String(x.args[0])).join(" ");assert.doesNotMatch(texts,/Space|1刻み進める/);}
});
test("バッグは回転を正規化し、盤外や重なりを拒否して回収できる",()=>{
 const g=load("advanced","bag-layout");g.run("bag.select(0);bag.rotate()");
 assert.deepEqual(val(g,"bag.selected.cells"),[[1,0],[0,0],[0,1]]);
 assert.equal(g.run("bag.canPlace(bag.selected,5,0)"),false);
 g.run("bag.rotate();bag.rotate();bag.rotate();bag.clickCell(0,0);bag.select(1)");
 assert.equal(g.run("bag.canPlace(bag.selected,0,0)"),false);g.run("bag.clickCell(0,0)");assert.equal(g.run("bag.selected.name"),"棒");
 g.run("bag.select(1);bag.clickCell(0,0)");assert.equal(g.run("bag.items[0].x"),null);assert.equal(g.run("bag.selected.name"),"L字");
});
test("バッグは図の複数辺を1組に数え、実物の目標配置でもクリアできる",()=>{
 const g=load("advanced","bag-layout");
 g.run("bag.items=[new Item('A',[[0,0],[0,1],[1,1]],'red'),new Item('B',[[0,0]],'blue'),new Item('C',[[0,0]],'gold')];bag.items[0].x=0;bag.items[0].y=0;bag.items[1].x=1;bag.items[1].y=0;bag.items[2].x=2;bag.items[2].y=2");
 assert.equal(g.run("bag.calculate().score"),9);assert.deepEqual(val(g,"bag.calculate().pairs.map(p=>[p.a,p.b,p.points])"),[["A","B",3]]);
 g.run("start();bag.select(0);bag.clickCell(0,0);bag.select(1);bag.clickCell(1,0);bag.select(2);bag.clickCell(2,1)");
 assert.equal(g.run("bag.calculate().score"),15);g.run("bag.check()");assert.equal(g.run("bag.state"),"clear");
 const ext=load("advanced","bag-layout","extensions/complete");assert.equal(ext.run("bag.blocked(5,3)"),true);
 ext.run("bag.select(0);bag.clickCell(0,0);bag.select(1);bag.clickCell(1,0);bag.select(2);bag.clickCell(2,1)");assert.equal(ext.run("bag.calculate().score"),17);
 ext.run("bag.check();bag.choose('1')");assert.equal(ext.run("bag.round"),2);assert.equal(ext.run("bag.itemBonus"),1);
});
test("工場の同時更新は図の2刻みと行先の競合を再現する",()=>{
 const g=load("advanced","conveyor-factory","extensions/complete");
 g.run("for(let x=1;x<=4;x++)factory.tiles[1][x]={type:'belt',dir:0};factory.materials=[{x:1,y:1,kind:'round'},{x:2,y:1,kind:'round'}];factory.tick(false)");
 assert.deepEqual(val(g,"factory.materials.map(m=>[m.x,m.y])"),[[1,1],[3,1]]);
 g.run("factory.tick(false)");assert.deepEqual(val(g,"factory.materials.map(m=>[m.x,m.y])"),[[2,1],[4,1]]);
 g.run("factory.tiles[1][1]={type:'belt',dir:0};factory.tiles[0][2]={type:'belt',dir:1};factory.tiles[1][2]={type:'belt',dir:0};factory.materials=[{x:1,y:1,kind:'round'},{x:2,y:0,kind:'triangle'}];factory.tick(false)");
 assert.deepEqual(val(g,"factory.materials.map(m=>[m.x,m.y,m.kind])"),[[1,1,"round"],[2,1,"triangle"]]);
});
test("工場は編集時の材料を守り、加工品だけ納品し、長時間離脱で進まない",()=>{
 const g=load("advanced","conveyor-factory");
 g.run("factory.materials=[{x:1,y:1,kind:'round'}];factory.tool='belt';factory.edit(1,1)");assert.equal(g.run("factory.tiles[1][1]"),null);
 g.run("factory.running=true;factory.edit(2,1)");assert.equal(g.run("factory.tiles[1][2]"),null);
 g.run("factory.running=false;factory.materials=[];for(let x=1;x<=6;x++){factory.tool=x===4?'machine':'belt';factory.edit(x,1)};factory.materials=[{x:0,y:1,kind:'round'}]");
 for(let i=0;i<7;i++)g.run("factory.tick(false)");assert.equal(g.run("factory.delivered"),1);
 g.run("factory.materials=[{x:6,y:1,kind:'round'}];factory.tick(false)");assert.equal(g.run("factory.delivered"),1);assert.equal(g.run("factory.discarded"),1);
 g.run("factory.running=true");g.document.hidden=true;g.fire("visibilitychange");g.tick(60000);assert.equal(g.run("factory.running"),false);assert.equal(g.run("factory.tickCount"),8);
});
test("3教材の24段階は変更前後の全文と実際のコードが一致する",()=>{
 const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#x27);/g,x=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#x27;":"'"})[x]);
 for(const [level,name] of [["intermediate","number-cards"],["advanced","bag-layout"],["advanced","conveyor-factory"]]) for(const extension of [false,true]){
  const base=path.join(root,"examples",level,name),folder=path.join(base,extension?"extensions":""),page=fs.readFileSync(path.join(folder,"tutorial.html"),"utf8");
  const sections=[...page.matchAll(/<section><h2>ステップ (\d)：[\s\S]*?<\/section>/g)];assert.equal(sections.length,extension?3:5);
  let previous=fs.readFileSync(extension?path.join(base,"complete/script.js"):path.join(root,"template/script.js"),"utf8").replace(/\r\n/g,"\n");
  for(const [index,match] of sections.entries()){
   const section=match[0],pair=section.match(/<details class="old-code"><summary>変更前のコードを確認する<\/summary><p>変更前（確認用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre><\/details><p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/);
   assert.ok(pair,`${name} ${index+1}`);assert.equal(decode(pair[1]),previous);
   const next=decode(pair[2]);assert.equal(next,fs.readFileSync(path.join(folder,`step${index+1}/script.js`),"utf8"));
   for(const label of ["目標","コードの意味","保存後の確認","小さな練習"])assert.ok(section.includes(`<h3>${label}</h3>`));
   assert.match(section,/<summary>練習の答え<\/summary>/);
   const rows=[...section.matchAll(/<div class="change-row change-(same|removed|added)"><span class="change-label">[^<]*<\/span><span class="change-code">([\s\S]*?)<\/span><\/div>/g)];assert.ok(rows.length);
   const before=previous.split("\n"),after=next.split("\n");let a=0,b=0;
   for(const [,kind,text] of rows){const line=text==="（空行）"?"":decode(text);if(kind!=="added"){a=before.indexOf(line,a);assert.ok(a>=0);a++;}if(kind!=="removed"){b=after.indexOf(line,b);assert.ok(b>=0);b++;}}
   previous=next;
  }
  assert.equal(previous,fs.readFileSync(path.join(folder,"complete/script.js"),"utf8"));
 }
});
