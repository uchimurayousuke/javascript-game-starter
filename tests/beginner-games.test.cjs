"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8").replace(/\r\n/g,"\n");

function setup(game,stage="complete",randomValues=[0.55,0]) {
  const listeners={}, drawn=[], clock={now:0}, randoms=[...randomValues];
  const on=(name,fn)=>(listeners[name]??=[]).push(fn);
  const ctx={clearRect(){},fillRect(){},fillText(text){drawn.push(String(text));}};
  const canvas={width:800,height:450,getContext:()=>ctx};
  const math=Object.create(Math);math.random=()=>randoms.length?randoms.shift():0;
  const context=vm.createContext({document:{querySelector:()=>canvas},window:{addEventListener:on},performance:{now:()=>clock.now},requestAnimationFrame(){},Math:math});
  vm.runInContext(read(`examples/${game}/${stage}/script.js`),context);
  return {run:s=>vm.runInContext(s,context), clock, drawn,
    fire:(key,extra={})=>{let prevented=false;const event={key,code:key===" "?"Space":"",repeat:false,ctrlKey:false,altKey:false,metaKey:false,isComposing:false,preventDefault(){prevented=true;},...extra};for(const fn of listeners.keydown||[])fn(event);return prevented;},
    show:()=>{drawn.length=0;vm.runInContext("draw()",context);return drawn.join(" ");}};
}
const type=(g,text)=>{for(const key of text)g.fire(key);};

test("初心者3教材の各段階には目標・説明・確認・練習と独立した見本がある",()=>{
  for(const game of ["timing","typing","number-guess"]){
    const page=read(`examples/${game}/tutorial.html`), sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    assert.equal(sections.length,3,game);assert.doesNotMatch(page,/<(?:canvas|iframe|script)\b/i);
    for(const [i,section] of sections.entries()){
      for(const part of ["目標","コードの意味","書く場所と置き換えるコード","保存後の確かめ方","小さな練習"])assert.ok(section[0].includes(part),`${game}: ${part}`);
      const headings=["目標","書く場所と置き換えるコード","コードの意味","保存後の確かめ方","小さな練習"].map(part=>section[0].indexOf(`<h3>${part}</h3>`));
      assert.ok(headings.every((at,index)=>at>=0 && (index===0 || at>headings[index-1])),`${game}: 説明の順番`);
      assert.match(section[0],new RegExp(`href="step${i+1}/index.html"`));
      for(const file of ["index.html","style.css","script.js"]) assert.ok(fs.existsSync(path.join(root,`examples/${game}/step${i+1}/${file}`)));
    }
  }
});

test("制作例一覧と README は完成した3本だけを新たに紹介する",()=>{
  const page=read("examples/index.html"), beginner=page.split("<h2>初心者向け</h2>")[1].split("<h2>中級者向け</h2>")[0];
  assert.equal((beginner.match(/<article>/g)||[]).length,5);
  for(const game of ["timing","typing","number-guess"]){
    assert.ok(beginner.includes(`href="${game}/tutorial.html"`));
    assert.ok(beginner.includes(`href="${game}/complete/index.html"`));
    assert.ok(read("README.md").includes(`examples/${game}/tutorial.html`));
  }
});

test("タイミングの各段階と、入力による成功・失敗・再挑戦",()=>{
  const first=setup("timing","step1");assert.equal(first.run("markerX"),80);assert.match(first.show(),/止めよう/);
  const second=setup("timing","step2");const x=second.run("markerX");second.run("update()");assert.equal(second.run("markerX"),x+4);
  const g=setup("timing");
  assert.equal(g.run("markerX"),84);g.fire(" ",{repeat:true});assert.equal(g.run("state"),"moving");g.fire(" ",{ctrlKey:true});assert.equal(g.run("state"),"moving");
  while(g.run("markerX")<500)g.run("update()");assert.equal(g.run("markerX"),500);
  assert.equal(g.fire(" "),true);assert.equal(g.run("success"),true);assert.equal(g.run("state"),"stopped");assert.match(g.show(),/成功/);
  g.run("update()");assert.equal(g.run("markerX"),500);g.fire("r",{repeat:true});assert.equal(g.run("state"),"stopped");
  g.fire("r");assert.equal(g.run("markerX"),80);assert.equal(g.run("speed"),4);assert.equal(g.run("state"),"moving");assert.equal(g.run("success"),false);
  g.fire(" ");assert.equal(g.run("success"),false);assert.match(g.show(),/おしい/);
  g.fire("r");while(g.run("markerX")<300)g.run("update()");g.fire(" ");assert.equal(g.run("success"),true);
  g.fire("r");g.run("markerX=501");g.fire(" ");assert.equal(g.run("success"),false,"501 は範囲外");
});

test("タイピングの誤入力・修飾キー・速さ・終了と再挑戦",()=>{
  const first=setup("typing","step1");assert.equal(first.run("word"),"a");
  const second=setup("typing","step2");type(second,"acatdog");assert.equal(second.run("state"),"clear");second.fire("r");assert.equal(second.run("wordIndex"),0);
  const g=setup("typing");
  for(const extra of [{repeat:true},{ctrlKey:true},{altKey:true},{metaKey:true},{isComposing:true}])g.fire("a",extra);
  assert.equal(g.run("position"),0);assert.equal(g.run("mistakes"),0);
  g.fire("x");assert.equal(g.run("position"),0);assert.equal(g.run("mistakes"),1);
  g.fire("A",{shiftKey:true});assert.equal(g.run("wordIndex"),1);assert.equal(g.run("score"),15);
  g.clock.now=3000;type(g,"cat");assert.equal(g.run("wordIndex"),2);assert.equal(g.run("score"),50,"3秒ちょうどでは速さの加点なし");
  type(g,"dogsunfish");assert.equal(g.run("state"),"clear");assert.match(g.show(),/全部打てた/);
  const old=g.run("score");g.fire("a");assert.equal(g.run("score"),old);
  g.fire("r");assert.equal(g.run("score"),0);assert.equal(g.run("mistakes"),0);assert.equal(g.run("wordIndex"),0);assert.equal(g.run("endTime"),33000);
  g.clock.now=33000;g.run("update()");assert.equal(g.run("state"),"over");assert.match(g.show(),/時間切れ/);g.fire("a");assert.equal(g.run("score"),0);
  g.fire("r");assert.equal(g.run("state"),"playing");assert.equal(g.run("endTime"),63000);
  g.clock.now=63000;g.fire("a");assert.equal(g.run("state"),"over");assert.equal(g.run("score"),0,"境界時刻の入力では得点しない");
  const perfect=setup("typing");type(perfect,"acatdogsunfish");assert.equal(perfect.run("state"),"clear");assert.equal(perfect.run("score"),190);
  perfect.clock.now=7000;perfect.run("update()");assert.equal(perfect.run("seconds"),30);assert.match(perfect.show(),/残り: 30秒/);
});

test("数あての空欄・範囲外・ヒント・正解・回数切れと再挑戦",()=>{
  const first=setup("number-guess","step1");type(first,"12");assert.equal(first.run("inputText"),"12");assert.equal(first.fire("Backspace"),true);assert.equal(first.run("inputText"),"1");
  const second=setup("number-guess","step2");for(const [value,hint] of [["8","もっと大きい"],["15","もっと小さい"],["12","正解"]]){type(second,value);second.fire("Enter");assert.ok(second.run("hint").includes(hint));}
  const g=setup("number-guess");assert.equal(g.run("answer"),12);
  g.fire("Enter");assert.equal(g.run("attempts"),0);assert.match(g.run("hint"),/数字を入れて/);
  type(g,"0");g.fire("Enter");assert.equal(g.run("attempts"),0);assert.match(g.run("hint"),/1から20/);g.fire("Backspace");
  type(g,"21");g.fire("Enter");assert.equal(g.run("attempts"),0);g.fire("Backspace");g.fire("Backspace");
  g.fire("8",{repeat:true});g.fire("8",{ctrlKey:true});assert.equal(g.run("inputText"),"");
  type(g,"8");g.fire("Enter");assert.equal(g.run("attempts"),1);assert.match(g.run("hint"),/もっと大きい/);
  assert.match(g.show(),/1〜20 \/ Enter で答える/);assert.match(g.show(),/Backspace で1文字消せます/);
  type(g,"15");g.fire("Enter");assert.equal(g.run("attempts"),2);assert.match(g.run("hint"),/もっと小さい/);
  type(g,"12");g.fire("Enter");assert.equal(g.run("state"),"clear");assert.match(g.show(),/正解/);assert.match(g.show(),/1〜20 \/ Enter で答える/);assert.match(g.show(),/Backspace で1文字消せます/);assert.equal(g.run("attempts"),3);
  type(g,"8");assert.equal(g.run("inputText"),"");g.fire("r");assert.equal(g.run("state"),"playing");assert.equal(g.run("answer"),1);assert.equal(g.run("attempts"),0);
  const loss=setup("number-guess");for(const guess of ["1","2","3","4","5"]){type(loss,guess);loss.fire("Enter");}
  assert.equal(loss.run("state"),"over");assert.match(loss.show(),/こたえは 12/);loss.fire("r");assert.equal(loss.run("attempts"),0);assert.equal(loss.run("inputText"),"");
  const maximum=setup("number-guess","complete",[0.999]);assert.equal(maximum.run("answer"),20);type(maximum,"20");maximum.fire("Enter");assert.equal(maximum.run("state"),"clear");
});
