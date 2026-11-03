"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=file=>fs.readFileSync(path.join(root,file),"utf8");
const svg=name=>read(`tutorial/illustrations/astra/${name}.svg`);
const words=name=>[...svg(name).matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(m=>m[1].replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").normalize("NFKC").replace(/−/g,"-"));
const labels=(name,items)=>{const text=words(name).join(" ");for(const item of items)assert.ok(text.includes(item.normalize("NFKC").replace(/−/g,"-")),`${name}: ${item}`);};
function game(file){
 const listeners={},rects=[],randoms=[],math=Object.create(Math);math.random=()=>randoms.length?randoms.shift():0.999999;
 const ctx=new Proxy({fillRect(...v){rects.push(v);}}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 const on=(type,fn)=>(listeners[type]??=[]).push(fn),canvas={width:800,height:450,getContext:()=>ctx,addEventListener:on,getBoundingClientRect:()=>({left:0,top:0,width:800,height:450})};
 const context=vm.createContext({document:{querySelector:()=>canvas,addEventListener:on},window:{addEventListener:on},Math:math,performance:{now:()=>0},requestAnimationFrame(){}});
 vm.runInContext(read(file),context);
 return {run:code=>vm.runInContext(code,context),rects,randoms,key:key=>(listeners.keydown||[]).forEach(fn=>fn({key,repeat:false,preventDefault(){}}))};
}
const json=(g,code)=>JSON.parse(g.run(`JSON.stringify(${code})`));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test("9図は該当段階に置き、画像の寸法・代替文・拡大リンクを備える",()=>{
 const items=[
  ["examples/advanced/falling-blocks/tutorial.html",3,"blocks-rotation","blocks-rotation"],
  ["examples/intermediate/memory/tutorial.html",1,"memory-grid-index","memory-grid-index"],
  ["examples/intermediate/memory/tutorial.html",2,"memory-index-wrap","memory-index-wrap"],
  ["examples/intermediate/memory/tutorial.html",4,"shuffle-memory","shared-shuffle"],
  ["examples/advanced/card-battle/tutorial.html",5,"shuffle-cards","shared-shuffle"],
  ["examples/beginner/quiz/extensions/tutorial.html",1,"shuffle-quiz","shared-shuffle"],
  ["examples/beginner/typing/extensions/tutorial.html",1,"shuffle-typing","shared-shuffle"],
  ["examples/advanced/soccer/tutorial.html",2,"soccer-normalize","soccer-normalize"],
  ["examples/advanced/racing/tutorial.html",3,"race-road","race-road"],
  ["examples/advanced/tactics/tutorial.html",3,"tactics-distance-basic","tactics-distance-basic"],
  ["examples/advanced/tactics/extensions/tutorial.html",1,"tactics-distance","tactics-distance"],
  ["learning/setup.html",0,"learning-two-zips","learning-two-zips"]
 ];
 for(const [file,step,id,asset] of items){
  const page=read(file),section=step?[...page.matchAll(/<section><h2>ステップ (\d)：[\s\S]*?<\/section>/g)].find(m=>Number(m[1])===step)?.[0]:page.match(/<section><h2>1\. ダウンロードして展開<\/h2>[\s\S]*?<\/section>/)?.[0];
  assert.ok(section,`${file}: step ${step}`);const match=section.match(new RegExp(`<figure class="learning-diagram" id="${id}"[\\s\\S]*?</figure>`));assert.ok(match,`${file}: ${id}`);
  const figure=match[0],image=figure.match(/<img src="([^"]+)" width="(\d+)" height="(\d+)" alt="([^"]+)">/);assert.ok(image);assert.ok(image[4].length>10);assert.match(figure,/class="diagram-scroll" role="region" tabindex="0"/);assert.ok(figure.includes(`href="${image[1]}" target="_blank" rel="noopener"`));
  assert.equal(path.resolve(root,path.dirname(file),image[1]),path.join(root,`tutorial/illustrations/astra/${asset}.svg`));const s=svg(asset),box=s.match(/viewBox="0 0 (\d+) (\d+)"/);assert.ok(box);assert.deepEqual(image.slice(2,4),box.slice(1,3));assert.match(s,/<title\b[^>]*>[^<]+<\/title>/);assert.match(s,/<desc\b[^>]*>[^<]+<\/desc>/);assert.doesNotMatch(s,/(?:href|src)="(?:https?:|\/\/)/i);
 }
});
test("回転図の列と候補は実際の回転処理に一致する",()=>{
 const g=game("examples/advanced/falling-blocks/step3/script.js"),before=json(g,"shapes[2]"),after=json(g,"new Piece(shapes[2]).rotated()");
 assert.deepEqual(before,[[1,0],[1,0],[1,1]]);assert.deepEqual(after,[[1,1,1],[1,0,0]]);labels("blocks-rotation",["列0：1 → 1 → 1","列1：0 → 0 → 1","[[1,1,1], [1,0,0]]"]);
 g.run("game.piece = new Piece(shapes[2]); game.piece.x = 6; game.piece.y = 0");assert.equal(g.run("game.board.fits(game.piece, game.piece.x, game.piece.y)"),true);assert.equal(g.run("game.board.fits(game.piece, game.piece.x, game.piece.y, game.piece.rotated())"),false);g.run("game.rotate()");assert.deepEqual(json(g,"game.piece.shape"),before);
});
test("シャッフル図の1回分と、4教材の実際の交換が一致する",()=>{
 const memory=game("examples/intermediate/memory/step4/script.js");memory.randoms.push(0.2);memory.run("start()");assert.deepEqual(json(memory,"cards.map(c=>c.letter)"),["A","C","C","D","B","A","D","B"]);labels("shared-shuffle",["i＝7 → jは0〜7から選ぶ。ここでは j＝1","0.2 × 8","cards[7] ← B","cards[1] ← C"]);
 const cards=game("examples/advanced/card-battle/step5/script.js");cards.randoms.push(0.2);cards.run('globalThis.sample = ["A","B","C","D","B","A","D","C"]; shuffle(sample)');assert.deepEqual(json(cards,"sample"),["A","C","C","D","B","A","D","B"]);
 const quiz=game("examples/beginner/quiz/extensions/step1/script.js");quiz.randoms.push(0.2);quiz.run("start()");assert.deepEqual(json(quiz,"order.map(q=>questions.indexOf(q))"),[0,4,2,3,1]);assert.equal(quiz.run("order === questions"),false);
 const typing=game("examples/beginner/typing/extensions/step1/script.js");typing.randoms.push(0.2);typing.run("start()");assert.deepEqual(json(typing,"words"),["a","fish","dog","sun","cat"]);assert.deepEqual(json(typing,"wordList"),["a","cat","dog","sun","fish"]);
});
test("カードの位置と両端の折り返しが図の値に一致する",()=>{
 const basic=game("examples/intermediate/memory/step1/script.js");basic.rects.length=0;basic.run("draw()");assert.deepEqual(basic.rects[5],[280,220,100,110]);labels("memory-grid-index",["5 % 4＝1","floor(5 / 4)＝1","(280,220)"]);
 const next=game("examples/intermediate/memory/step2/script.js");next.run("selected = 7");next.key("ArrowRight");assert.equal(next.run("selected"),0);next.key("ArrowLeft");assert.equal(next.run("selected"),7);labels("memory-index-wrap",["(7＋1) % 8＝0","(0＋8−1) % 8＝7"]);
});
test("斜め移動と道路の判定は図の例と境界に一致する",()=>{
 const soccer=game("examples/advanced/soccer/step2/script.js");soccer.run('game.keys = {ArrowRight:true}; game.update()');near(soccer.run("game.player.x"),202.5);near(soccer.run("game.player.y"),225);
 soccer.run('game.player.x=200; game.player.y=225; game.keys={ArrowRight:true,ArrowDown:true}; game.update()');near(soccer.run("game.player.x"),200+2.5/Math.SQRT2);near(soccer.run("game.player.y"),225+2.5/Math.SQRT2);labels("soccer-normalize",["右へ2.5px","約201.768","約226.768","|| 1"]);
 const race=game("examples/advanced/racing/step3/script.js");for(const [x,y,expected] of [[140,110,true],[400,230,false],[60,110,false],[90,60,true],[710,400,true],[190,230,true],[610,230,true],[400,160,true],[400,300,true],[190.1,230,false],[89.9,60,false]])assert.equal(race.run(`course.contains(${x},${y})`),expected,`${x},${y}`);labels("race-road",["A (140,110)","B (400,230)","C (60,110)","中央の境界も道路"]);
});
test("剣と弓の射程は各ステップの実際の攻撃判定に一致する",()=>{
 function attack(stage,kind,ux,uy,tx,ty){const g=game(`examples/advanced/tactics/${stage}/script.js`);g.run(`game.units=[new Unit(${ux},${uy},"ally","${kind}"),new Unit(${tx},${ty},"enemy","sword")];game.selected=game.units[0];game.click(${tx},${ty})`);return g.run("game.units[1].hp");}
 assert.equal(attack("step3","sword",1,1,2,1),4);assert.equal(attack("step3","sword",1,1,2,2),6);assert.equal(attack("extensions/step1","archer",1,3,2,2),4);assert.equal(attack("extensions/step1","sword",1,3,2,2),6);
 labels("tactics-distance-basic",["敵A：列2・行1","1＋0＝1 → 届く","敵B：列2・行2","1＋1＝2 → 届かない"]);labels("tactics-distance",["敵が (列2, 行2)","弓の射程2 → 届く","剣の射程1 → 届かない"]);
});
test("ひな型ZIPの入口と中身は図と一致する",()=>{
 const entry=read("教材を開く.html"),setup=read("learning/setup.html");assert.match(entry,/href="learning\/index.html"/);assert.match(setup,/href="\.\.\/downloads\/my-game\.zip" download="my-game.zip"/);
 for(const name of ["index.html","style.css","script.js"])assert.ok(fs.existsSync(path.join(root,"template",name)));labels("learning-two-zips",["index.html","style.css","script.js"]);
});
