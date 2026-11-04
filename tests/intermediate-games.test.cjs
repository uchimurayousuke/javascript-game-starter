"use strict";
const { test }=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {hasInlineExplanation}=require("./lesson-explanation.cjs");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8").replace(/\r\n/g,"\n");

function setup(game,stage="complete",values=[0]){
 const listeners={},clock={now:0},randoms=[...values],shown=[],rects=[];
 const ctx={clearRect(){},fillRect(...args){rects.push({color:this.fillStyle,args});},strokeRect(){},beginPath(){},arc(){},fill(){},fillText(value){shown.push(String(value));}};
 const canvas={width:800,height:450,getContext:()=>ctx,getBoundingClientRect:()=>({left:10,top:20,width:400,height:225}),addEventListener(name,fn){(listeners[name]??=[]).push(fn);}};
 const math=Object.create(Math);math.random=()=>randoms.length?randoms.shift():0;
 const context=vm.createContext({document:{querySelector:()=>canvas},window:{addEventListener(name,fn){(listeners[name]??=[]).push(fn);}},performance:{now:()=>clock.now},requestAnimationFrame(){},Math:math});
 vm.runInContext(read(`examples/intermediate/${game}/${stage}/script.js`),context);
 return {clock,rects,run:s=>vm.runInContext(s,context),fire:(key,extra={})=>{let prevented=false;const e={key,repeat:false,ctrlKey:false,altKey:false,metaKey:false,isComposing:false,preventDefault(){prevented=true;},...extra};for(const fn of listeners.keydown||[])fn(e);return prevented;},click:(x,y)=>{for(const fn of listeners.click||[])fn({clientX:10+x/2,clientY:20+y/2});},tick:ms=>{clock.now+=ms;vm.runInContext("update()",context);},show:()=>{shown.length=0;rects.length=0;vm.runInContext("draw()",context);return shown.join(" ");}};
}

test("スネークの頭は各段階で体と区別され、移動後も先頭に描かれる",()=>{
 for(const stage of ["step1","step2","complete"]){
  const g=setup("snake",stage);assert.match(g.show(),/濃い緑が頭/);
  const head=()=>g.rects.find(r=>r.color==="#145a38");assert.deepEqual(head().args,[201,191,28,28]);
  assert.equal(g.rects.filter(r=>r.color==="#ffffff"&&r.args[2]===4&&r.args[3]===4).length,2);
  if(stage!=="step1"){g.fire("ArrowUp");g.tick(200);g.show();assert.deepEqual(head().args,[201,161,28,28]);}
 }
});

test("中級3教材は各段階と完成版、手順・確認・練習を備える",()=>{
 for(const game of ["snake","memory","shop"]){
  const page=read(`examples/intermediate/${game}/tutorial.html`),sections=[...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
  assert.equal(sections.length,game==="snake"?3:4,game);assert.doesNotMatch(page,/<(?:canvas|iframe|script)\b/i);
  for(const [i,section] of sections.entries()){
   const heads=["目標","書く場所と置き換えるコード","保存後の確かめ方","小さな練習"].map(x=>section[0].indexOf(`<h3>${x}</h3>`));
   assert.ok(heads.every((at,j)=>at>=0&&(j===0||at>heads[j-1])),`${game}: 説明の順番`);
   const meaning=section[0].indexOf("<h3>コードの意味</h3>");
   if(meaning>=0) assert.ok(meaning>heads[1]&&meaning<heads[2],`${game}: コードの意味の位置`);
   else assert.ok(hasInlineExplanation(section[0].slice(heads[0],heads[2])),`${game}: ステップ内にコードと説明`);
   assert.match(section[0],new RegExp(`href="step${i+1}/index.html"`));
   for(const name of ["index.html","style.css","script.js"])assert.ok(fs.existsSync(path.join(root,`examples/intermediate/${game}/step${i+1}/${name}`)));
  }
 }
 const page=read("examples/index.html"), middle=page.split("<h2>中級者向け</h2>")[1].split("<h2>上級者向け</h2>")[0];
 assert.equal((middle.match(/<article>/g)||[]).length,12);
 for(const game of ["snake","memory","shop"]){assert.ok(middle.includes(`href="intermediate/${game}/tutorial.html"`));assert.ok(read("README.md").includes(`examples/intermediate/${game}/tutorial.html`));}
});

test("スネークは入力で伸び、空きマスに食べ物を置き、5個でクリアする",()=>{
 const initial=setup("snake","step1");assert.equal(initial.run("snake.length"),3);assert.equal(initial.run("snake[0].x"),4);
 const step=setup("snake","step2");step.fire("ArrowUp");step.tick(200);assert.equal(step.run("snake[0].y"),3);assert.equal(step.run("snake.length"),3);
 const g=setup("snake","complete",[42.5/97,42.5/96,42.5/95,42.5/94,42.5/93]);
 assert.equal(g.run("food.x"),5);assert.equal(g.run("food.y"),4);
 g.fire("ArrowLeft");assert.equal(g.run("nextDirection.x"),1,"真逆へ進まない");
 for(let n=1;n<=5;n++){
  assert.equal(g.run("snake.some(part => part.x === food.x && part.y === food.y)"),false);
  g.fire("ArrowRight");g.tick(200);assert.equal(g.run("score"),n);assert.equal(g.run("snake.length"),3+n);
 }
 assert.equal(g.run("state"),"clear");assert.match(g.show(),/クリア/);g.fire("r");assert.equal(g.run("state"),"playing");assert.equal(g.run("snake.length"),3);assert.equal(g.run("score"),0);assert.equal(g.run("direction.x"),1);
 for(const value of [0,0.15,0.5,0.999]){const sample=setup("snake","complete",[value]);assert.equal(sample.run("snake.some(part => part.x === food.x && part.y === food.y)"),false);}
});

test("スネークは壁・体に当たる一方、移動で消えるしっぽには入れる",()=>{
 const wall=setup("snake");for(let i=0;i<6;i++)wall.tick(200);assert.equal(wall.run("state"),"over");assert.match(wall.show(),/ぶつかった/);wall.fire("r");assert.equal(wall.run("state"),"playing");
 const tail=setup("snake","complete",[42.5/97,42.5/96]);tail.tick(200);assert.equal(tail.run("snake.length"),4);
 for(const key of ["ArrowUp","ArrowLeft","ArrowDown"]){tail.fire(key);tail.tick(200);}assert.equal(tail.run("state"),"playing");assert.equal(tail.run("snake[0].x"),4);assert.equal(tail.run("snake[0].y"),4);
 const self=setup("snake","complete",[42.5/97,42.5/96,42.5/95]);self.tick(200);self.tick(200);
 for(const key of ["ArrowUp","ArrowLeft","ArrowDown"]){self.fire(key);self.tick(200);}assert.equal(self.run("state"),"over");
});

test("神経衰弱の待ち中は選べず、再開前の待ち時間が新しい盤面に影響しない",()=>{
 const first=setup("memory","step1");assert.equal(first.run("cards.length"),8);
 const second=setup("memory","step2");second.fire("ArrowRight");second.fire("Enter");assert.equal(second.run("cards[1].open"),true);second.fire("Enter");assert.equal(second.run("cards[1].open"),false);
 const g=setup("memory","step3");g.fire("Enter");g.fire("ArrowRight");g.fire("Enter");
 assert.equal(g.run("cards[0].open && cards[1].open"),true);assert.equal(g.run("closeAt"),1000);
 g.fire("ArrowRight");assert.equal(g.run("selected"),1);g.fire("Enter");assert.equal(g.run("cards[2].open"),false);
 g.tick(999);assert.equal(g.run("cards[0].open"),true);g.tick(1);assert.equal(g.run("cards[0].open || cards[1].open"),false);
 g.fire("r");g.fire("Enter");g.fire("ArrowRight");g.fire("Enter");assert.equal(g.run("closeAt"),2000);
 g.fire("r");g.fire("Enter");g.tick(1000);assert.equal(g.run("cards[0].open"),true);assert.equal(g.run("firstIndex"),0);assert.equal(g.run("closeAt"),0);
});

test("神経衰弱は実際の選択で4組そろえ、Rで元に戻る",()=>{
 const g=setup("memory","step3");
 function pick(index){while(g.run("selected")!==index)g.fire("ArrowRight");g.fire("Enter");}
 for(const [a,b] of [[0,5],[1,4],[2,7],[3,6]]){pick(a);pick(b);}
 assert.equal(g.run("pairs"),4);assert.equal(g.run("state"),"clear");assert.equal(g.run("cards.every(card => card.matched)"),true);assert.match(g.show(),/全部そろった/);
 g.fire("r");assert.equal(g.run("pairs"),0);assert.equal(g.run("cards.some(card => card.open || card.matched)"),false);
});

test("完成版の神経衰弱は4組を保って混ぜ、縮小表示のクリックと隙間を判定する",()=>{
 const g=setup("memory","complete",[...Array(7).fill(0),...Array(7).fill(0.999)]);
 const order=g.run('cards.map(card => card.letter).join("")');
 for(const letter of ["A","B","C","D"])assert.equal(g.run(`cards.filter(card => card.letter === "${letter}").length`),2);
 g.fire("r");const changed=g.run('cards.map(card => card.letter).join("")');assert.notEqual(changed,order);
 g.click(260,100);g.click(170,200);assert.equal(g.run("firstIndex"),-1,"カード間の隙間と下端は無効");
 const indexOf=(letter)=>g.run(`cards.findIndex(card => card.letter === "${letter}")`);
 const point=i=>[160+(i%4)*120+50,90+Math.floor(i/4)*130+55];
 const click=i=>g.click(...point(i));
 const a=indexOf("A"), b=indexOf("B"), third=indexOf("C");click(a);click(b);assert.notEqual(g.run("closeAt"),0);
 const selected=g.run("selected");click(third);assert.equal(g.run("selected"),selected);assert.equal(g.run(`cards[${third}].open`),false);
 g.tick(1000);assert.equal(g.run(`cards[${a}].open || cards[${b}].open`),false);
 const groups=JSON.parse(g.run('JSON.stringify(["A","B","C","D"].map(letter => cards.map((card, i) => card.letter === letter ? i : -1).filter(i => i >= 0)))'));
 for(const [first,second] of groups){click(first);click(second);const pairs=g.run("pairs");click(first);assert.equal(g.run("pairs"),pairs,"確定済みは再びめくらない");}
 assert.equal(g.run("state"),"clear");assert.equal(g.run("pairs"),4);g.fire("r");assert.equal(g.run("pairs"),0);assert.equal(g.run("closeAt"),0);
});

test("お店は仕入れと販売を会計し、日付と目標・再挑戦を処理する",()=>{
 const first=setup("shop","step1");assert.equal(first.run("money"),100);assert.equal(first.run("products.length"),3);
 const second=setup("shop","step2");second.fire("b");assert.equal(second.run("money"),80);assert.equal(second.run("products[0].stock"),1);
 const g=setup("shop","step3");g.fire("1");for(let i=0;i<3;i++)g.fire("b");assert.equal(g.run("money"),40);assert.equal(g.run("products[0].stock"),3);
 g.fire("Enter");g.fire("s");g.fire("s");assert.equal(g.run("money"),110);assert.equal(g.run("revenue"),70);assert.equal(g.run("products[0].stock"),1);
 g.fire("s");g.fire("Enter");assert.equal(g.run("day"),2);assert.equal(g.run("products[0].soldToday"),0);
 for(let i=0;i<3;i++)g.fire("b");g.fire("Enter");for(let i=0;i<3;i++)g.fire("s");assert.equal(g.run("money"),190);
 g.fire("Enter");assert.equal(g.run("day"),3);g.fire("Enter");g.fire("Enter");assert.equal(g.run("state"),"clear");assert.match(g.show(),/目標達成/);
 g.fire("r");assert.equal(g.run("day"),1);assert.equal(g.run("money"),100);assert.equal(g.run("revenue"),0);assert.equal(g.run("products.every(item => item.stock === 0)"),true);
});

test("お店は資金・在庫不足と1日3個の上限を守り、未達成から再開できる",()=>{
 const poor=setup("shop","step3");for(let i=0;i<6;i++)poor.fire("b");assert.equal(poor.run("money"),0);assert.equal(poor.run("products[0].stock"),5);assert.match(poor.run("message"),/足りません/);
 poor.fire("Enter");for(let i=0;i<4;i++)poor.fire("s");assert.equal(poor.run("products[0].stock"),2);assert.equal(poor.run("products[0].soldToday"),3);assert.match(poor.run("message"),/3個/);
 const empty=setup("shop","step3");empty.fire("Enter");empty.fire("s");assert.equal(empty.run("products[0].stock"),0);assert.match(empty.run("message"),/在庫がありません/);
 for(let day=1;day<=3;day++){if(day>1)empty.fire("Enter");empty.fire("Enter");}
 assert.equal(empty.run("state"),"over");assert.equal(empty.run("money"),100);empty.fire("r");assert.equal(empty.run("day"),1);assert.equal(empty.run("money"),100);
});

test("完成版のお店は需要に応じて自動販売し、売れ残りを持ち越して達成できる",()=>{
 const g=setup("shop","complete",Array(12).fill(0.5));
 assert.equal(g.run("products.every(item => item.demand === 2)"),true);
 assert.match(g.show(),/今日の需要/);
 for(let i=0;i<3;i++)g.fire("b");assert.equal(g.run("money"),40);g.fire("s");assert.equal(g.run("money"),40);
 g.fire("Enter");assert.equal(g.run("money"),110);assert.equal(g.run("products[0].stock"),1);assert.equal(g.run("products[0].soldToday"),2);assert.equal(g.run("revenue"),70);
 g.fire("Enter");assert.equal(g.run("day"),2);assert.equal(g.run("products[0].stock"),1);assert.equal(g.run("products[0].soldToday"),0);
 g.fire("b");g.fire("Enter");assert.equal(g.run("money"),160);assert.equal(g.run("products[0].stock"),0);
 g.fire("Enter");for(let i=0;i<2;i++)g.fire("b");g.fire("Enter");assert.equal(g.run("money"),190);g.fire("Enter");assert.equal(g.run("state"),"clear");
 g.fire("r");assert.equal(g.run("day"),1);assert.equal(g.run("money"),100);assert.equal(g.run("products.every(item => item.stock === 0)"),true);
});

test("完成版のお店は需要の範囲と資金不足・空在庫・未達成を処理する",()=>{
 const g=setup("shop","complete",[0,0.5,0.999,0,0.5,0.999,0,0.5,0.999]);
 assert.equal(g.run("products[0].demand"),1);assert.equal(g.run("products[1].demand"),2);assert.equal(g.run("products[2].demand"),3);
 for(let i=0;i<6;i++)g.fire("b");assert.equal(g.run("money"),0);assert.equal(g.run("products[0].stock"),5);
 g.fire("Enter");assert.equal(g.run("money"),35);assert.equal(g.run("products[0].stock"),4);assert.equal(g.run("products[1].soldToday"),0);
 const fail=setup("shop");for(let i=0;i<3;i++){fail.fire("Enter");fail.fire("Enter");}assert.equal(fail.run("state"),"over");assert.equal(fail.run("money"),100);fail.fire("r");assert.equal(fail.run("state"),"playing");
});
