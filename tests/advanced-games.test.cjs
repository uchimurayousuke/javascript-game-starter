"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const levelOf = game => (["timing","typing","number-guess"].includes(game) ? "beginner" : ["snake","memory","shop"].includes(game) ? "intermediate" : "advanced");
test("制作例の一覧とREADMEは難易度ごとに7本・9本・11本紹介する",()=>{
 const page=fs.readFileSync(path.join(root,"examples/index.html"),"utf8"),readme=fs.readFileSync(path.join(root,"README.md"),"utf8");
 const groups=["初心者向け","中級者向け","上級者向け"];
 for(let i=0;i<groups.length;i++){
  const start=page.indexOf(`<h2>${groups[i]}</h2>`),end=i+1<groups.length?page.indexOf(`<h2>${groups[i+1]}</h2>`):page.indexOf("</main>");
  assert.ok(start>=0&&end>start);assert.equal((page.slice(start,end).match(/<article>/g)||[]).length,[7,9,11][i],groups[i]);
 }
 for(const game of ["timing","typing","number-guess","snake","memory","shop","escape","tower-defense","card-battle","racing"]){
  assert.ok(page.includes(`${levelOf(game)}/${game}/tutorial.html`),game);assert.ok(readme.includes(`examples/${levelOf(game)}/${game}/tutorial.html`),game);
 }
 for(const game of ["escape","tower-defense","card-battle","racing"]){
  const html=fs.readFileSync(path.join(root,"examples","advanced",game,"tutorial.html"),"utf8"),sections=[...html.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
  assert.equal(sections.length,5,game);
  for(const [i,section] of sections.entries()){
   const headings=["目標","書く場所と置き換えるコード","コードの意味","保存後の確かめ方","小さな練習"].map(x=>section[0].indexOf(`<h3>${x}</h3>`));
   assert.ok(headings.every((at,j)=>at>=0&&(j===0||at>headings[j-1])),game);assert.ok(section[0].includes(`href="step${i+1}/index.html"`));
  }
 }
});
function setup(game,stage="complete",randoms=[]){
 const listeners={},clock={value:0},shown=[],rects=[];
 const ctx={clearRect(){},fillRect(...args){rects.push({color:this.fillStyle,args});},strokeRect(){},fillText(text){shown.push(String(text));},beginPath(){},arc(){},fill(){},save(){},restore(){},translate(){},rotate(){}};
 const canvas={width:800,height:450,getContext:()=>ctx,getBoundingClientRect:()=>({left:10,top:20,width:400,height:225}),addEventListener(type,fn){(listeners[type]??=[]).push(fn);}};
 const math=Object.create(Math);math.random=()=>randoms.length?randoms.shift():0;
 const context=vm.createContext({document:{querySelector:()=>canvas},window:{addEventListener(type,fn){(listeners[type]??=[]).push(fn);}},performance:{now:()=>clock.value},requestAnimationFrame(){},Math:math});
 vm.runInContext(fs.readFileSync(path.join(root,"examples","advanced",game,stage,"script.js"),"utf8"),context);
 return {clock,rects,run:s=>vm.runInContext(s,context),click:(x,y)=>{for(const fn of listeners.click||[])fn({clientX:10+x/2,clientY:20+y/2});},key:(key,type="keydown")=>{for(const fn of listeners[type]||[])fn({key,repeat:false,ctrlKey:false,altKey:false,metaKey:false,isComposing:false,preventDefault(){}});},tick:(n=1)=>{for(let i=0;i<n;i++)vm.runInContext("update()",context);},show:()=>{shown.length=0;rects.length=0;vm.runInContext("draw()",context);return shown.join(" ");}};
}

test("タワーディフェンスは入口・ゴールと集団・拠点の残りを表示する",()=>{
 for(const stage of ["step1","step2","step3","step4","complete"]){const g=setup("tower-defense",stage);assert.match(g.show(),/入口/);assert.match(g.show(),/ゴール/);}
 const g=setup("tower-defense");assert.match(g.show(),/敵の集団 1 \/ 3  拠点の残り 3/);
});

test("レースの4地点に番号を表示し、次の地点の強調が移る",()=>{
 for(const stage of ["step4","complete"]){
  const g=setup("racing",stage);assert.match(g.show(),/1 2 3 4/);assert.match(g.show(),/次の地点 1 \/ 4（番号順）/);
  let active=g.rects.filter(r=>r.color==="#f8dc8b"&&r.args[2]===26);assert.equal(active.length,1);assert.deepEqual(active[0].args,[647,97,26,26]);
  g.key("ArrowUp");let i=0;while(g.run("nextCheckpoint")===0&&i++<400)g.tick();assert.equal(g.run("nextCheckpoint"),1);assert.match(g.show(),/次の地点 2 \/ 4/);
  active=g.rects.filter(r=>r.color==="#f8dc8b"&&r.args[2]===26);assert.equal(active.length,1);assert.deepEqual(active[0].args,[647,337,26,26]);
 }
});

test("脱出ゲームは順番を間違えても道具を失わず、クリックで脱出・再開できる",()=>{
 const g=setup("escape");g.click(680,320);assert.match(g.run("game.message"),/鍵/);g.click(600,150);assert.match(g.run("game.message"),/ドライバー/);
 g.click(100,150);assert.match(g.run("game.message"),/241/);g.click(350,150);assert.equal(g.run("game.view"),"drawer");
 g.click(400,320);assert.match(g.run("game.message"),/違う/);assert.equal(g.run("game.inventory.items.length"),0);
 for(let n=0;n<2;n++)g.click(270,220);for(let n=0;n<4;n++)g.click(360,220);g.click(450,220);g.click(400,320);
 assert.equal(g.run('game.inventory.items.includes("ドライバー")'),true);g.click(400,320);assert.equal(g.run("game.inventory.items.length"),1);
 g.click(60,410);assert.equal(g.run("game.unlocked"),true);assert.match(g.show(),/開いた/);g.click(100,410);g.click(680,320);assert.equal(g.run('game.inventory.items.includes("ドライバー")'),true);assert.equal(g.run("game.state"),"playing");
 g.click(600,150);assert.equal(g.run("game.ventOpen"),true);assert.equal((g.show().match(/開いた/g)||[]).length,2);assert.equal(g.run('game.inventory.items.includes("鍵")'),true);g.click(200,410);g.click(680,320);assert.equal(g.run("game.state"),"clear");assert.match(g.show(),/脱出成功/);
 g.click(350,150);assert.equal(g.run("game.view"),"room");g.key("r");assert.equal(g.run("game.state"),"playing");assert.equal(g.run("game.inventory.items.length"),0);assert.equal(g.run('game.digits.join("")'),"000");
});

test("タワーディフェンスは配置・3波の勝利と無配置での失敗・再開を実際に進められる",()=>{
 const g=setup("tower-defense");for(const [x,y] of [[280,230],[400,150],[600,200]])g.click(x,y);
 assert.equal(g.run("spots.length"),5);assert.equal(g.run("towers.length"),3);assert.equal(g.run("money"),0);g.click(300,250);g.click(220,220);assert.equal(g.run("money"),0);assert.equal(g.run("towers.length"),3);
 let ticks=0;while(g.run('state === "playing" && money < 20')&&ticks++<5000)g.tick();assert.equal(g.run("money"),20);g.click(200,200);assert.equal(g.run("towers.length"),4);assert.equal(g.run("money"),0);
 while(g.run('state === "playing"')&&ticks++<5000)g.tick();assert.equal(g.run("state"),"clear",`ticks=${ticks} lives=${g.run("lives")} wave=${g.run("wave")}`);assert.equal(g.run("wave"),3);assert.match(g.show(),/守りきった/);
 g.key("r");assert.equal(g.run("state"),"playing");assert.equal(g.run("towers.length"),0);assert.equal(g.run("money"),60);assert.equal(g.run("lives"),3);assert.equal(g.run("wave"),1);assert.equal(g.run("spawned"),0);
 let failTicks=0;while(g.run('state === "playing"')&&failTicks++<5000)g.tick();assert.equal(g.run("state"),"over");assert.equal(g.run("lives"),0);g.key("r");assert.equal(g.run("state"),"playing");
});

test("タワーは射程の中心間距離120を含み、121は含まない",()=>{
 const g=setup("tower-defense");
 g.run('towers = [new Tower(300, 250)]; enemies = [{x: 420, y: 250, hp: 2, alive: true}]; towers[0].update()');assert.equal(g.run("bullets.length"),1);
 g.run('bullets = []; towers = [new Tower(300, 250)]; enemies = [{x: 421, y: 250, hp: 2, alive: true}]; towers[0].update()');assert.equal(g.run("bullets.length"),0);
});

test("カードは実際のクリックで防御・回復・行動力・手番を処理する",()=>{
 const g=setup("card-battle","complete",Array(100).fill(0.999));
 const play=kind=>{const i=g.run(`hand.findIndex(card => card.kind === "${kind}")`);assert.ok(i>=0,kind);g.click(100+i*180,270);};
 const total=()=>g.run("deck.length + hand.length + discard.length");
 assert.equal(total(),9);assert.equal(g.run("hand.length"),3);play("defend");assert.equal(g.run("player.block"),4);g.click(650,370);assert.equal(g.run("player.hp"),28);assert.equal(g.run("player.block"),0);
 play("heal");assert.equal(g.run("player.hp"),30);play("attack");assert.equal(g.run("enemy.hp"),18);assert.equal(g.run("action"),0);
 const before=g.run('JSON.stringify({hand:hand.map(c=>c.kind),hp:player.hp,enemy:enemy.hp,discard:discard.length})');g.click(100,270);assert.equal(g.run('JSON.stringify({hand:hand.map(c=>c.kind),hp:player.hp,enemy:enemy.hp,discard:discard.length})'),before);assert.equal(total(),9);
});

test("カードバトルは山札切れで捨て札を戻し、勝利・敗北・再開を処理する",()=>{
 const g=setup("card-battle","complete",Array(200).fill(0.999));let recycled=false;
 for(let turn=0;turn<30&&g.run('state === "playing"');turn++){
  for(let n=0;n<2&&g.run('state === "playing"');n++){
   const available=JSON.parse(g.run("JSON.stringify(hand.map(c => c.kind))")),hp=g.run("player.hp");
   let kind=available.includes("attack")?"attack":(hp<=25&&available.includes("heal")?"heal":(available.includes("defend")?"defend":available[0]));
   const i=available.indexOf(kind);if(i>=0)g.click(100+i*180,270);
   assert.equal(g.run("deck.length + hand.length + discard.length"),9);
  }
  if(g.run('state === "playing"')){const discard=g.run("discard.length"),deck=g.run("deck.length");g.click(650,370);if(deck===0&&g.run("discard.length")<discard)recycled=true;}
 }
 assert.equal(recycled,true);assert.equal(g.run("state"),"clear");const hp=g.run("player.hp");g.click(650,370);assert.equal(g.run("player.hp"),hp,"倒した後に敵は攻撃しない");g.key("r");assert.equal(g.run("state"),"playing");assert.equal(g.run("player.hp"),30);assert.equal(g.run("deck.length + hand.length + discard.length"),9);
 const fail=setup("card-battle");for(let i=0;i<5;i++)fail.click(650,370);assert.equal(fail.run("state"),"over");assert.equal(fail.run("player.hp"),0);fail.key("r");assert.equal(fail.run("player.hp"),30);assert.equal(fail.run("state"),"playing");
});

test("レースはキーを離すと減速し、道路外への移動は直前の位置に戻る",()=>{
 const g=setup("racing");g.key("ArrowUp");g.tick(20);const speed=g.run("car.speed");assert.ok(speed>0);g.key("ArrowUp","keyup");g.tick();assert.ok(g.run("car.speed")<speed);
 g.key("ArrowUp");let blocked=false;for(let i=0;i<400;i++){const x=g.run("car.x");g.tick();if(g.run("car.speed")===0){assert.equal(g.run("car.x"),x);blocked=true;break;}}
 assert.equal(blocked,true);assert.equal(g.run("laps"),0);const boundary=g.run("car.x");g.key("ArrowUp","keyup");g.key("ArrowDown");g.tick(10);assert.ok(g.run("car.x")<boundary,"後退して道路上へ戻れる");g.key("ArrowDown","keyup");g.key("r");assert.equal(g.run("car.x"),140);assert.equal(g.run("car.y"),110);assert.equal(g.run("elapsed"),0);assert.equal(g.run("nextCheckpoint"),0);
 g.key("ArrowDown");g.tick(10);g.key("ArrowDown","keyup");g.key("ArrowUp");g.tick(30);assert.equal(g.run("laps"),0);assert.equal(g.run("nextCheckpoint"),0,"開始地点を往復しても周回にならない");
});

test("レースはハンドル操作だけで実際に道路を2周し、時計を止めて再開する",()=>{
 const g=setup("racing");g.key("ArrowUp");let ticks=0,blocks=0;
 while(g.run('state === "playing"')&&ticks<6000){
  const data=JSON.parse(g.run('JSON.stringify({x:car.x,y:car.y,angle:car.angle,speed:car.speed,target:checkpoints[nextCheckpoint]})'));
  const desired=Math.atan2(data.target.y-data.y,data.target.x-data.x);
  const diff=Math.atan2(Math.sin(desired-data.angle),Math.cos(desired-data.angle));
  g.key("ArrowLeft","keyup");g.key("ArrowRight","keyup");
  if(diff>0.025)g.key("ArrowRight");else if(diff< -0.025)g.key("ArrowLeft");
  g.clock.value+=1000/60;g.tick();ticks++;if(g.run("car.speed")===0)blocks++;
 }
 assert.equal(g.run("state"),"clear",`ticks=${ticks} blocks=${blocks} position=${g.run('car.x + "," + car.y')} next=${g.run("nextCheckpoint")} laps=${g.run("laps")}`);
 assert.equal(g.run("laps"),2);const elapsed=g.run("elapsed");assert.ok(elapsed>0);g.clock.value+=3000;g.tick(10);assert.equal(g.run("elapsed"),elapsed);g.key("r");assert.equal(g.run("elapsed"),0);assert.equal(g.run("laps"),0);assert.equal(g.run("nextCheckpoint"),0);assert.equal(g.run("car.speed"),0);
});
