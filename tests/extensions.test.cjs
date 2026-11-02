"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
function setup(relative,stage="complete",randoms=[]){
 randoms=[...randoms];
 const listeners={},clock={now:0},texts=[];
 const on=(type,fn)=>(listeners[type]??=[]).push(fn);
 const context2d={clearRect(){},fillRect(){},strokeRect(){},fillText(text){texts.push(String(text));},beginPath(){},arc(){},fill(){},save(){},restore(){},translate(){},rotate(){}};
 const canvas={width:800,height:450,getContext:()=>context2d,getBoundingClientRect:()=>({left:10,top:20,width:400,height:225}),addEventListener:on};
 const math=Object.create(Math);math.random=()=>randoms.length?randoms.shift():0.5;
 const c=vm.createContext({document:{querySelector:()=>canvas,addEventListener:on},window:{addEventListener:on},performance:{now:()=>clock.now},requestAnimationFrame(){},Math:math});
 vm.runInContext(fs.readFileSync(path.join(root,relative,stage,"script.js"),"utf8"),c);
 return {clock,run:code=>vm.runInContext(code,c),key:(key,type="keydown",extra={})=>{const code=key===" "?"Space":key;for(const fn of listeners[type]||[])fn({key,code,repeat:false,ctrlKey:false,altKey:false,metaKey:false,isComposing:false,preventDefault(){},...extra});},click:(x,y)=>{for(const fn of listeners.click||[])fn({clientX:10+x/2,clientY:20+y/2});},tick:(count=1,ms=0)=>{for(let i=0;i<count;i++){clock.now+=ms;vm.runInContext("update()",c);}},show:()=>{texts.length=0;vm.runInContext("draw()",c);return texts.join(" ");}};
}

test("コイン発展は端で反転し、得点で加速し、ボーナスと再挑戦を処理する",()=>{
 const g=setup("tutorial/extensions","complete",[0.5,0.1,0.5,0.9]);
 g.run("coinX = canvas.width - coinRadius; coinDX = 2");g.tick();assert.equal(g.run("coinX"),786);assert.equal(g.run("coinDX"),-2);
 g.run("score = 2; coinX = 400; coinY = 80");g.tick();assert.equal(g.run("coinY"),84);
 g.run("resetCoin()");assert.equal(g.run("bonusCoin"),true);g.run("coinX = playerX + playerWidth / 2; coinY = playerY - coinRadius");g.tick();assert.equal(g.run("score"),4);
 g.run("coinX = playerX + playerWidth / 2; coinY = playerY - coinRadius");g.tick();assert.equal(g.run("gameState"),"clear");g.key(" ");assert.equal(g.run("score"),0);assert.equal(g.run("bonusCoin"),false);
});

test("的あて発展は動く的の縮小、3連続の加点、失敗と再開を処理する",()=>{
 const g=setup("examples/beginner/target/extensions","complete",Array(20).fill(0.5));const x=g.run("targetX");g.tick();assert.equal(g.run("targetX"),x+2);
 for(let i=0;i<3;i++)g.click(g.run("targetX"),g.run("targetY"));assert.equal(g.run("score"),5);assert.equal(g.run("radius"),29);assert.equal(g.run("streak"),3);
 g.click(0,0);assert.equal(g.run("streak"),0);g.clock.now=20000;g.click(g.run("targetX"),g.run("targetY"));assert.equal(g.run("score"),5);g.key("r");assert.equal(g.run("score"),0);assert.equal(g.run("radius"),35);
});

test("はね返し発展は反射位置・速度・残り回数を処理する",()=>{
 const g=setup("examples/beginner/bounce/extensions");g.run("x = paddleX + paddleWidth / 2 + 27.5; y = paddleY - radius - 4; dx = 0; dy = 4");g.tick();assert.equal(g.run("score"),1);assert.equal(g.run("dx"),2);
 for(let i=0;i<2;i++){g.run("x = paddleX + paddleWidth / 2; y = paddleY - radius - 4; dx = 0; dy = 4");g.tick();}assert.equal(g.run("score"),3);assert.equal(g.run("dy"),-5);
 for(let i=0;i<3;i++){g.run("y = canvas.height + radius + 20");g.tick();}assert.equal(g.run("over"),true);assert.equal(g.run("lives"),0);g.key("r");assert.equal(g.run("lives"),3);assert.equal(g.run("score"),0);
});

test("タイミング発展は3回の範囲、中央の追加点、再挑戦を処理する",()=>{
 const g=setup("examples/beginner/timing/extensions");
 for(let round=1;round<=3;round++){g.tick(round===1?79:80);assert.equal(g.run("markerX"),400);g.key(" ");assert.equal(g.run("state"),"stopped");assert.equal(g.run("score"),round*2);g.key(" ");}
 assert.equal(g.run("state"),"finished");g.key("r");assert.equal(g.run("round"),1);assert.equal(g.run("score"),0);
});

test("タイピング発展は全単語を混ぜ、連続加点、時間ペナルティと再開を処理する",()=>{
 const g=setup("examples/beginner/typing/extensions","complete",Array(30).fill(0.999));g.key("z");assert.equal(g.run("seconds"),28);assert.equal(g.run("wordErrors"),1);g.clock.now=28000;g.tick();assert.equal(g.run("state"),"over");g.key("r");assert.equal(g.run("state"),"playing");
 const order=JSON.parse(g.run("JSON.stringify(words)"));for(const word of order)for(const letter of word)g.key(letter);
 assert.equal(g.run("state"),"clear");assert.equal(g.run("streak"),5);assert.equal(g.run("score"),195);g.key("r");assert.equal(g.run("streak"),0);assert.equal(g.run("seconds"),30);
});

test("数あて発展は履歴と候補を保ち、100までの難易度でも入力でクリアできる",()=>{
 const g=setup("examples/beginner/number-guess/extensions","complete",[0.55,0.55,0.55]);
 const guess=n=>{for(const key of String(n))g.key(key);g.key("Enter");};
 guess(8);guess(15);assert.equal(g.run("low"),9);assert.equal(g.run("high"),14);assert.equal(g.run("history.length"),2);
 g.key("d");assert.equal(g.run("maxNumber"),100);assert.equal(g.run("answer"),56);assert.equal(g.run("history.length"),0);
 for(const n of [50,75,62,56])guess(n);assert.equal(g.run("state"),"clear");assert.equal(g.run("attempts"),4);g.key("r");assert.equal(g.run("maxNumber"),100);assert.equal(g.run("history.length"),0);
});

test("ブロック発展の丈夫なブロックは重なり続けても1回だけ減る",()=>{
 const g=setup("examples/intermediate/breakout/extensions");
 g.run("x = bricks[16].x + 35; y = bricks[16].y + 20 + radius + 1; dx = 0; dy = -4");g.tick();assert.equal(g.run("bricks[16].hp"),1);assert.equal(g.run("bricks[16].alive"),true);
 for(let i=0;i<5;i++)g.tick();assert.equal(g.run("bricks[16].hp"),1);
 g.run("x = bricks[16].x + 35; y = bricks[16].y + 20 + radius + 1; dx = 0; dy = -4");g.tick();assert.equal(g.run("bricks[16].alive"),false);assert.equal(g.run("score"),1);
 for(let i=0;i<3;i++){g.run("y = canvas.height + radius + 20");g.tick();}assert.equal(g.run("state"),"over");g.key("r");assert.equal(g.run("lives"),3);assert.equal(g.run("level"),1);
});

test("シューティング発展は実際の発射で通常敵とボスを倒して再開できる",()=>{
 const g=setup("examples/intermediate/shooting/extensions");g.key(" ");let i=0;while(g.run('state === "playing"')&&i++<5000)g.tick();
 assert.equal(g.run("state"),"clear",`updates=${i} score=${g.run("score")} lives=${g.run("lives")}`);assert.equal(g.run("bossStarted"),true);g.key("r");assert.equal(g.run("state"),"playing");assert.equal(g.run("lives"),3);assert.equal(g.run("bossStarted"),false);
});

test("シューティングの無敵は同時被弾を1回にし、下端とボス撃破後を扱う",()=>{
 const g=setup("examples/intermediate/shooting/extensions");g.run("enemyBullets = [{x: playerX + 1, y: playerY - 4}, {x: playerX + 2, y: playerY - 4}]");g.tick();assert.equal(g.run("lives"),2);assert.equal(g.run("invulnerable"),90);
 g.run("enemyBullets = [{x: playerX + 1, y: playerY - 4}]");g.tick();assert.equal(g.run("lives"),2);
 const leak=setup("examples/intermediate/shooting/extensions");leak.run('enemies = [{x:0,y:420,size:30,speed:1,hp:1}]');leak.tick();assert.equal(leak.run("state"),"over");
 const boss=setup("examples/intermediate/shooting/extensions");boss.run('bossStarted = true; enemies = [{x:100,y:100,size:60,speed:0,hp:1,boss:true}]; bullets = [{x:110,y:110}]; enemyBullets = [{x:playerX+1,y:playerY-4}]');boss.tick();assert.equal(boss.run("state"),"clear");assert.equal(boss.run("lives"),3);
});

test("スネーク発展は障害物、可変間隔、限定ボーナスとクリアを処理する",()=>{
 const values=[39.5/94,39.5/93,39.5/92,0,38.5/90,38.5/89];const g=setup("examples/intermediate/snake/extensions","complete",values);
 g.tick(1,200);assert.equal(g.run("score"),1);g.tick(1,180);assert.equal(g.run("score"),2);assert.equal(g.run("bonus !== null"),true);assert.equal(g.run("bonusUntil"),5380);
 g.tick(1,160);g.tick(1,140);g.tick(1,120);assert.equal(g.run("state"),"clear");g.key("r");assert.equal(g.run("score"),0);assert.equal(g.run("bonus"),null);
 const wall=setup("examples/intermediate/snake/extensions");wall.key("ArrowUp");wall.tick(1,200);wall.tick(1,200);assert.equal(wall.run("state"),"over");
 const exp=setup("examples/intermediate/snake/extensions","complete",values);exp.tick(1,200);exp.tick(1,180);exp.key("ArrowUp");exp.clock.now=5380;exp.tick();assert.equal(exp.run("bonus"),null);
});

test("神経衰弱発展は公開後に比較を数え、期限直前と期限ちょうどを区別する",()=>{
 const g=setup("examples/intermediate/memory/extensions","complete",Array(20).fill(0.999));const click=i=>g.click(210+(i%4)*120,145+Math.floor(i/4)*130);
 click(0);assert.equal(g.run("firstIndex"),-1);g.clock.now=2000;
 for(const [a,b] of [[0,5],[1,4],[2,7]]){click(a);click(b);}assert.equal(g.run("pairs"),3);assert.equal(g.run("turns"),3);
 g.clock.now=61999;click(3);assert.equal(g.run("firstIndex"),3);g.clock.now=62000;click(6);assert.equal(g.run("state"),"over");assert.equal(g.run("pairs"),3);
 g.key("r");assert.equal(g.run("turns"),0);assert.equal(g.run("previewUntil"),64000);
 const win=setup("examples/intermediate/memory/extensions","complete",Array(20).fill(0.999));win.clock.now=2000;for(const [a,b] of [[0,5],[1,4],[2,7],[3,6]]){win.click(210+(a%4)*120,145+Math.floor(a/4)*130);win.click(210+(b%4)*120,145+Math.floor(b/4)*130);}assert.equal(win.run("state"),"clear");assert.equal(win.run("turns"),4);
});

test("お店発展は値段と出来事で需要を変え、在庫を持ち越して目標を達成できる",()=>{
 const g=setup("examples/intermediate/shop/extensions","complete",Array(20).fill(0.5));g.key("ArrowUp");assert.equal(g.run("products[0].price"),40);assert.equal(g.run("effectiveDemand(products[0])"),1);g.key("ArrowDown");
 for(let i=0;i<3;i++)g.key("b");g.key("Enter");assert.equal(g.run("money"),110);assert.equal(g.run("products[0].stock"),1);g.key("Enter");assert.equal(g.run("day"),2);assert.equal(g.run("products[0].demand"),3);
 g.key("b");g.key("b");g.key("Enter");assert.equal(g.run("money"),175);g.key("Enter");g.key("Enter");g.key("Enter");assert.equal(g.run("state"),"clear");g.key("r");assert.equal(g.run("money"),100);assert.equal(g.run("products[0].price"),35);
});

test("脱出発展は道具を組み合わせて戻り、鍵と明かりと番号で脱出する",()=>{
 const g=setup("examples/advanced/escape/extensions");
 const item=name=>{const i=g.run(`game.inventory.items.indexOf(${JSON.stringify(name)})`);assert.ok(i>=0,name);g.click(40+i*150,410);};
 g.click(80,120);g.click(320,150);for(const [i,n] of [[0,2],[1,4],[2,1]])for(let j=0;j<n;j++)g.click(260+i*90,200);g.click(350,320);g.click(50,410);
 item("ドライバー");g.click(550,140);item("鍵");g.click(650,300);assert.equal(g.run("game.room"),2);
 g.click(80,120);assert.equal(g.run("game.hintRead"),false);g.click(320,150);assert.equal(g.run("game.room"),1);
 item("電池");item("懐中電灯");assert.equal(g.run('game.inventory.selected'),"点灯ライト");item("鍵");g.click(650,300);item("点灯ライト");g.click(80,120);assert.equal(g.run("game.hintRead"),true);
 item("鍵");g.click(650,300);for(const [i,n] of [[0,3],[1,1],[2,4]])for(let j=0;j<n;j++)g.click(260+i*90,200);g.click(350,320);assert.equal(g.run("game.state"),"clear");g.key("r");assert.equal(g.run("game.inventory.items.length"),0);
});

test("タワー発展は設置、資金を得た強化、ボスを含む3集団を処理する",()=>{
 const g=setup("examples/advanced/tower-defense/extensions");for(const [x,y] of [[300,250],[400,150],[600,200]])g.click(x,y);assert.equal(g.run("money"),0);g.click(300,250);assert.equal(g.run("towers[0].level"),1);
 let boss=false,upgraded=false;for(let i=0;i<5000&&g.run('state === "playing"');i++){g.tick();boss ||= g.run('enemies.some(e => e.kind === "boss")');if(!upgraded&&g.run("money >= 20")){g.click(300,250);upgraded=true;assert.equal(g.run("towers[0].level"),2);}}
 assert.equal(upgraded,true);assert.equal(boss,true);assert.equal(g.run("state"),"clear");g.key("r");assert.equal(g.run("money"),60);assert.equal(g.run("towers.length"),0);
});

test("カード発展は実際の手札操作で敵の予告、コスト、毒、勝利を処理する",()=>{
 const g=setup("examples/advanced/card-battle/extensions","complete",Array(100).fill(0.999));
 let sawPoison=false,sawStrong=false;for(let turn=0;turn<30&&g.run('state === "playing"');turn++){
  for(let attempt=0;attempt<3&&g.run('state === "playing"');attempt++){
   const cards=JSON.parse(g.run("JSON.stringify(hand.map(c => ({kind:c.kind,cost:c.cost})))"));const action=g.run("action");let idx=cards.findIndex(c=>c.kind==="attack"&&c.cost<=action);if(idx<0)idx=cards.findIndex(c=>c.kind==="poison"&&c.cost<=action);if(idx<0)idx=cards.findIndex(c=>c.cost<=action);if(idx<0)break;
   sawPoison ||= cards[idx].kind==="poison";sawStrong ||= cards[idx].cost===2;g.click(90+idx*180,250);assert.equal(g.run("hand.length+deck.length+discard.length"),9);
  }if(g.run('state === "playing"'))g.click(650,370);
 }
 assert.equal(g.run("state"),"clear");g.key("r");assert.equal(g.run("intent"),"attack");assert.equal(g.run("enemy.poisonTurns"),0);
 const p=setup("examples/advanced/card-battle/extensions");p.run('enemy.hp=2; enemy.poisonTurns=1; intent="attack"');p.click(650,370);assert.equal(p.run("state"),"clear");assert.equal(p.run("player.hp"),30);
 const c=setup("examples/advanced/card-battle/extensions");c.run('hand=[new Card("attack","強攻撃",12,2)]; action=1');c.click(90,250);assert.equal(c.run("hand.length"),1);assert.equal(c.run("enemy.hp"),24);
});

test("レース発展は入力で2周し、ブーストと最速記録を再挑戦後も保つ",()=>{
 const g=setup("examples/advanced/racing/extensions");g.key(" ");assert.equal(g.run("car.boosts"),1);g.key(" ");assert.equal(g.run("car.boosts"),1);g.key("ArrowUp");
 for(let i=0;i<8000&&g.run('state === "playing"');i++){
  const delta=g.run('Math.atan2(checkpoints[nextCheckpoint].y-car.y, checkpoints[nextCheckpoint].x-car.x)-car.angle');const d=Math.atan2(Math.sin(delta),Math.cos(delta));g.key("ArrowLeft","keyup");g.key("ArrowRight","keyup");if(d>0.025)g.key("ArrowRight");if(d< -0.025)g.key("ArrowLeft");g.tick(1,16);
 }
 assert.equal(g.run("state"),"clear");assert.equal(g.run("laps"),2);const best=g.run("bestLap");assert.ok(best>0);g.key("r");assert.equal(g.run("bestLap"),best);assert.equal(g.run("car.boosts"),2);
});

test("15教材の手順は各見本を再現し、図と導線が有効",()=>{
 const paths=["tutorial","examples/beginner/target","examples/beginner/bounce","examples/beginner/timing","examples/beginner/typing","examples/beginner/number-guess","examples/intermediate/breakout","examples/intermediate/shooting","examples/intermediate/snake","examples/intermediate/memory","examples/intermediate/shop","examples/advanced/escape","examples/advanced/tower-defense","examples/advanced/card-battle","examples/advanced/racing"];
 const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#x27);/g,m=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":"\"","&#x27;":"'"})[m]);
 for(const base of paths){const folder=path.join(root,base),page=fs.readFileSync(path.join(folder,"extensions/tutorial.html"),"utf8").replace(/\r\n/g,"\n");let code=fs.readFileSync(path.join(folder,base==="tutorial"?"05-game":"complete","script.js"),"utf8").replace(/\r\n/g,"\n");
  const sections=[...page.matchAll(/<section><h2>ステップ (\d)：[\s\S]*?<\/section>/g)];assert.equal(sections.length,3,base);
  for(let i=0;i<3;i++){const section=sections[i][0];const pairs=[...section.matchAll(/<details class="old-code"><summary>変更前のコードを確認する<\/summary><p>変更前（確認用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre><\/details><p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/g)];assert.ok(pairs.length,base);
   for(const pair of pairs){const old=decode(pair[1]),next=decode(pair[2]);assert.equal(code.split(old).length,2,base + " step " + (i+1) + " snippet " + old.slice(0,90));code=code.replace(old,next);}
   assert.equal(code,fs.readFileSync(path.join(folder,`extensions/step${i+1}/script.js`),"utf8"),base);
  }
  assert.equal(code,fs.readFileSync(path.join(folder,"extensions/complete/script.js"),"utf8"),base);
  const figure=page.match(/<figure class="learning-diagram"[\s\S]*?<\/figure>/g);assert.equal(figure.length,1,base);assert.match(figure[0],/<img [^>]*alt="[^"]+"/);const src=figure[0].match(/<img src="([^"]+)"/)[1];assert.ok(fs.existsSync(path.resolve(folder,"extensions",src)),base);
  const basic=fs.readFileSync(path.join(folder,base==="tutorial"?"index.html":"tutorial.html"),"utf8");assert.ok(basic.includes('href="extensions/tutorial.html"'),base);
 }
});

test("神経衰弱の結果画面はクリア時の残り秒を保持する",()=>{
 const g=setup("examples/intermediate/memory/extensions","complete",Array(20).fill(0.999));g.clock.now=3000;for(const [a,b] of [[0,5],[1,4],[2,7],[3,6]]){g.click(210+(a%4)*120,145+Math.floor(a/4)*130);g.click(210+(b%4)*120,145+Math.floor(b/4)*130);}assert.equal(g.run("state"),"clear");assert.match(g.show(),/残り: 59秒/);g.clock.now=70000;assert.match(g.show(),/残り: 59秒/);
});


test("ボスがゴールに届けば残りがあっても失敗",()=>{
 const g=setup("examples/advanced/tower-defense/extensions");g.run('spawned=3; wave=3; const e = new Enemy("boss"); e.x=699; e.y=100; e.nextPoint=3; enemies=[e];');g.tick();assert.equal(g.run("state"),"over");assert.equal(g.run("lives"),0);
});

test("道具は正しい組み合わせだけで消費され、点灯ライトは重複しない",()=>{
 const g=setup("examples/advanced/escape/extensions");g.run('game.inventory.add("電池");game.inventory.add("ドライバー");game.inventory.add("懐中電灯")');g.click(40,410);g.click(190,410);assert.equal(g.run("game.inventory.items.length"),3);g.click(40,410);g.click(340,410);assert.equal(g.run('game.inventory.items.includes("電池")'),false);assert.equal(g.run('game.inventory.items.includes("懐中電灯")'),false);assert.equal(g.run('game.inventory.items.filter(x=>x==="点灯ライト").length'),1);
 g.run('game.inventory.add("電池");game.inventory.add("懐中電灯")');const index=name=>g.run(`game.inventory.items.indexOf(${JSON.stringify(name)})`);g.click(40+index("電池")*150,410);g.click(40+index("懐中電灯")*150,410);assert.equal(g.run('game.inventory.items.filter(x=>x==="点灯ライト").length'),1);
});

test("はね返しステップ2の図は当たり位置0.5から横速度2になる",()=>{
 const g=setup("examples/beginner/bounce/extensions","step2");g.run("x = paddleX + paddleWidth / 2 + 27.5; y = paddleY - radius - 4; dx = 0; dy = 4");g.tick();assert.equal(g.run("dx"),2);assert.equal(g.run("dy"),-4);
});
