"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
function game(level,name,dir="complete",random=0.5){
 const listeners={},clock={now:0},drawn=[],colors=[],strokes=[];const on=(type,fn)=>(listeners[type]??=[]).push(fn);
 const ctx={clearRect(){},fillRect(){},strokeRect(...args){strokes.push({color:this.strokeStyle,args});},fillText(t){drawn.push(String(t));colors.push({text:String(t),color:this.fillStyle});},beginPath(){},arc(){},fill(){},save(){},restore(){},translate(){},rotate(){}};
 const canvas={width:800,height:450,getContext:()=>ctx,getBoundingClientRect:()=>({left:10,top:20,width:400,height:225}),addEventListener:on};const math=Object.create(Math);math.random=()=>random;
 const context=vm.createContext({document:{querySelector:()=>canvas},window:{addEventListener:on},performance:{now:()=>clock.now},requestAnimationFrame(){},Math:math});
 vm.runInContext(fs.readFileSync(path.join(root,"examples",level,name,dir,"script.js"),"utf8"),context);
 const fire=(type,event)=>{for(const fn of listeners[type]||[])fn({repeat:false,preventDefault(){},...event});};
 return {clock,colors,strokes,run:s=>vm.runInContext(s,context),key:key=>fire("keydown",{key,code:key===" "?"Space":key}),release:key=>fire("keyup",{key,code:key===" "?"Space":key}),blur:()=>fire("blur",{}),click:(x,y,type="click")=>fire(type,{clientX:10+x/2,clientY:20+y/2}),tick:()=>vm.runInContext("update()",context),show:()=>{drawn.length=0;colors.length=0;strokes.length=0;vm.runInContext("draw()",context);return drawn.join(" ");}};
}

test("3択クイズは5問回答し、時間切れと再開ができる",()=>{
 const g=game("beginner","quiz","extensions/complete",0.5);for(let i=0;i<5;i++){g.key(String(g.run("order[index].answer")+1));g.key("Enter");}assert.equal(g.run("state"),"result");assert.equal(g.run("score"),5);g.key("r");g.clock.now=10000;g.key("1");assert.equal(g.run("state"),"feedback");assert.equal(g.run("score"),0);g.key("Enter");assert.equal(g.run("index"),1);
});

test("冒険は持ち物と履歴を戻し、花と鍵で追加結末に進む",()=>{
 const g=game("beginner","story","extensions/complete");g.key("1");g.key("1");g.key("1");assert.equal(g.run('items.includes("鍵")'),true);g.key("b");assert.equal(g.run('items.includes("鍵")'),false);assert.equal(g.run("scene"),"key");g.key("1");g.key("2");g.key("1");g.key("3");assert.equal(g.run("scene"),"end");assert.match(g.run("message"),/花/);g.key("b");assert.equal(g.run("scene"),"clearing");assert.equal(g.run("items.length"),2);g.key("r");assert.equal(g.run("items.length"),0);
});

function solveBoard(g){
 const board=JSON.parse(g.run("JSON.stringify(board)")),player=JSON.parse(g.run("JSON.stringify(player)"));const floor=board.map(row=>row.map(c=>c==="B"?"g":c==="b"?".":c));const goals=[];let boxes=[];for(let y=0;y<board.length;y++)for(let x=0;x<board[y].length;x++){if(board[y][x]==="g"||board[y][x]==="B")goals.push(`${x},${y}`);if(board[y][x]==="b"||board[y][x]==="B")boxes.push(`${x},${y}`);}
 const dirs=[[1,0,"ArrowRight"],[-1,0,"ArrowLeft"],[0,1,"ArrowDown"],[0,-1,"ArrowUp"]],queue=[{x:player.x,y:player.y,boxes,path:[]}],seen=new Set();
 for(let i=0;i<queue.length;i++){const a=queue[i],id=`${a.x},${a.y}|${a.boxes.slice().sort().join(";")}`;if(seen.has(id))continue;seen.add(id);if(goals.every(x=>a.boxes.includes(x)))return a.path;
  for(const [dx,dy,key] of dirs){const x=a.x+dx,y=a.y+dy;if(floor[y][x]==="#")continue;const index=a.boxes.indexOf(`${x},${y}`),next=[...a.boxes];if(index>=0){const xx=x+dx,yy=y+dy;if(floor[yy][xx]==="#"||next.includes(`${xx},${yy}`))continue;next[index]=`${xx},${yy}`;}queue.push({x,y,boxes:next,path:[...a.path,key]});}
 }throw Error("No solution");
}
test("箱押しの2面は探索した手順をキー入力すると解け、戻すと盤面を復元する",()=>{
 const g=game("intermediate","sokoban","extensions/complete");for(let level=0;level<2;level++){const route=solveBoard(g);assert.ok(route.length);const before=g.run("JSON.stringify(board)");g.key(route[0]);g.key("u");assert.equal(g.run("JSON.stringify(board)"),before);assert.equal(g.run("steps"),0);for(const key of route)g.key(key);assert.equal(g.run("state"),"clear");if(level===0)g.key("Enter");}g.key("r");assert.equal(g.run("level"),0);
});

test("マインスイーパーは一定乱数でも初手と周囲が安全で難易度と旗を操作できる",()=>{
 const g=game("intermediate","minesweeper","extensions/complete",0);const cell=(x,y,type)=>g.click(51+x*42,51+y*42,type);cell(2,2);assert.equal(g.run("cells.flat().filter(c=>c.bomb).length"),4);assert.equal(g.run("neighbors(2,2).every(([x,y])=>!cells[y][x].bomb)"),true);assert.equal(g.run("cells[2][2].bomb"),false);g.clock.now=2000;assert.match(g.show(),/2秒/);g.key("d");assert.equal(g.run("size"),8);cell(3,3);assert.equal(g.run("cells.flat().filter(c=>c.bomb).length"),10);assert.equal(g.run("neighbors(3,3).every(([x,y])=>!cells[y][x].bomb)"),true);g.key("r");cell(0,0,"contextmenu");assert.equal(g.run("cells[0][0].flag"),true);cell(0,0);assert.equal(g.run("first"),true);cell(0,0,"contextmenu");cell(0,0);assert.equal(g.run("first"),false);
});

test("落ちものは実キーで4つの正方形を並べ2行消し、再開できる",()=>{
 const g=game("advanced","falling-blocks","extensions/complete",0);for(const count of [-3,-1,1,3]){for(let i=0;i<Math.abs(count);i++)g.key(count<0?"ArrowLeft":"ArrowRight");g.key(" ");}assert.equal(g.run("game.lines"),2);assert.equal(g.run("game.score"),200);assert.equal(g.run("game.state"),"clear");g.key("r");assert.equal(g.run("game.lines"),0);
});

test("探索RPGは依頼・戦闘・レベルアップ・鍵・扉を入力で完了する",()=>{
 const g=game("advanced","quest-rpg","extensions/complete");g.key(" ");assert.equal(g.run("game.quest"),1);g.key("ArrowDown");g.key("ArrowRight");g.key("ArrowRight");g.key(" ");assert.equal(g.run("game.state"),"battle");g.key("a");g.key("a");assert.equal(g.run("game.enemyDead"),true);assert.equal(g.run("game.level"),2);assert.equal(g.run("game.player.maxHp"),12);
 for(const k of ["ArrowRight","ArrowRight","ArrowUp","ArrowRight"," "])g.key(k);assert.equal(g.run("game.hasItem"),true);
 for(const k of ["ArrowDown","ArrowLeft","ArrowLeft","ArrowLeft","ArrowUp","ArrowRight"," "])g.key(k);assert.equal(g.run("game.key"),true);
 for(const k of ["ArrowDown","ArrowRight","ArrowRight","ArrowRight","ArrowDown","ArrowRight"," "])g.key(k);assert.equal(g.run("game.state"),"clear");g.key("r");assert.equal(g.run("game.level"),1);
});

test("戦術ゲームは壁越し移動を防ぎ、回復・射程・行動回数を扱う",()=>{
 const g=game("advanced","tactics","extensions/complete");const click=(x,y)=>g.click(65+x*60,50+y*60);click(1,1);click(3,1);assert.equal(g.run("game.selected.x"),1);click(1,2);assert.equal(g.run("game.selected.y"),2);click(1,1);assert.equal(g.run("game.selected.y"),2);
 g.run('game.units[1].x=1;game.units[1].y=3;game.units[1].hp=4');g.key("h");click(1,3);assert.equal(g.run("game.units[1].hp"),6);assert.equal(g.run("game.units[0].acted"),true);g.key("h");click(1,3);assert.equal(g.run("game.units[1].hp"),6);
 g.key("Enter");assert.equal(g.run("game.units[0].acted"),false);assert.equal(g.run('game.units[1].kind'),"archer");g.key("r");assert.equal(g.run("game.state"),"playing");
});

test("サッカーはゴール範囲外で反射し、両方向の得点と3点勝利を処理する",()=>{
 const g=game("advanced","soccer","extensions/complete");g.run('game.ball.x=59;game.ball.y=100;game.ball.vx=-4');g.tick();assert.equal(g.run("game.ball.x"),58);assert.ok(g.run("game.ball.vx")>0);assert.equal(g.run("game.opponentScore"),0);
 g.run('game.ball.x=41;game.ball.y=225;game.ball.vx=-4');g.tick();assert.equal(g.run("game.opponentScore"),1);g.tick();assert.equal(g.run("game.opponentScore"),1);
 for(let i=0;i<3;i++){g.run('game.ball.x=759;game.ball.y=225;game.ball.vx=4');g.tick();}assert.equal(g.run("game.score"),3);assert.equal(g.run("game.state"),"clear");g.key("r");assert.equal(g.run("game.score"),0);
});

test("物語は表示のない数字では持ち物と履歴を変えない",()=>{
 const g=game("beginner","story","extensions/complete");const before=g.run('JSON.stringify({scene,items,history})');g.key("3");assert.equal(g.run('JSON.stringify({scene,items,history})'),before);g.key("1");g.key("1");const previous=g.run('JSON.stringify({scene,items,history})');g.key("3");assert.equal(g.run('JSON.stringify({scene,items,history})'),previous);
});

test("戦術ゲームは両方の味方を操作し、敵を倒して勝利できる",()=>{
 const g=game("advanced","tactics","extensions/complete");const click=(x,y)=>g.click(65+x*60,50+y*60);let turns=0;
 while(g.run('game.state === "playing"')&&turns++<30){
  for(let i=0;i<2;i++){
   let all=JSON.parse(g.run('JSON.stringify(game.units)'));let unit=all[i];if(unit.hp<=0)continue;click(unit.x,unit.y);
   const enemies=()=>JSON.parse(g.run('JSON.stringify(game.units.filter(u=>u.side==="enemy"&&u.hp>0))'));
   let living=enemies(),range=unit.kind==="archer"?2:1;let target=living.find(a=>Math.abs(a.x-unit.x)+Math.abs(a.y-unit.y)<=range);
   if(target){click(target.x,target.y);if(g.run('game.state!=="playing"'))break;}
   let choices=[];for(let y=0;y<5;y++)for(let x=0;x<6;x++)if(g.run(`game.reachable(game.units[${i}],${x},${y})`))choices.push({x,y,dist:Math.min(...living.map(t=>Math.abs(t.x-x)+Math.abs(t.y-y)))});
   choices.sort((a,b)=>a.dist-b.dist);if(choices.length){click(choices[0].x,choices[0].y);unit=JSON.parse(g.run(`JSON.stringify(game.units[${i}])`));}
   living=enemies();target=living.find(a=>Math.abs(a.x-unit.x)+Math.abs(a.y-unit.y)<=range);if(target&&!g.run(`game.units[${i}].acted`))click(target.x,target.y);
  }
  if(g.run('game.state === "playing"'))g.key("Enter");
 }
 assert.equal(g.run("game.state"),"clear",`turns ${turns}, units ${g.run("JSON.stringify(game.units)")}`);
});

test("8教材の変更手順から基本5段階と発展3段階の見本を再現できる",()=>{
 const games=[["beginner","quiz"],["beginner","story"],["intermediate","sokoban"],["intermediate","minesweeper"],["advanced","falling-blocks"],["advanced","quest-rpg"],["advanced","tactics"],["advanced","soccer"]];
 const read=p=>fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n");const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#x27);/g,m=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":"\"","&#x27;":"'"})[m]);
 for(const [level,name] of games){const folder=path.join(root,"examples",level,name);let code=read(path.join(root,"template/script.js"));
  for(const [dir,count] of [["",5],["extensions",3]]){const page=read(path.join(folder,dir,"tutorial.html"));const sections=[...page.matchAll(/<section><h2>ステップ (\d)：[\s\S]*?<\/section>/g)];assert.equal(sections.length,count,name);
   for(let i=0;i<count;i++){const section=sections[i][0],pairs=[...section.matchAll(/<details class="old-code"><summary>変更前のコードを確認する<\/summary><p>変更前（確認用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre><\/details><p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/g)];assert.ok(pairs.length,name);
    for(const p of pairs){const old=decode(p[1]),after=decode(p[2]);assert.equal(code.split(old).length,2,`${name} ${dir} ${i+1}`);code=code.replace(old,after);}
    assert.equal(code,read(path.join(folder,dir,`step${i+1}/script.js`)),`${name} ${dir} ${i+1}`);for(const f of ["index.html","style.css","script.js"])assert.ok(fs.existsSync(path.join(folder,dir,`step${i+1}`,f)));
   }assert.equal(code,read(path.join(folder,dir,"complete/script.js")));}
 }
});

test("サッカーはキー操作だけで3点取り、ためとフォーカス解除を扱う",()=>{
 const g=game("advanced","soccer","extensions/complete");let frames=0,kicks=0;
 while(g.run('game.state === "playing"')&&frames++<3000){
  const b=JSON.parse(g.run('JSON.stringify(game.ball)')),p=JSON.parse(g.run('JSON.stringify(game.player)'));
  const tx=Math.max(66,Math.min(730,b.x-24)),ty=Math.max(76,Math.min(374,b.y));
  for(const [key,active] of [["ArrowRight",tx-p.x>2],["ArrowLeft",tx-p.x< -2],["ArrowDown",ty-p.y>2],["ArrowUp",ty-p.y< -2]])active?g.key(key):g.release(key);
  if(Math.hypot(b.x-p.x,b.y-p.y)<=30 && b.x>p.x && Math.abs(b.y-p.y)<3){g.key(" ");g.release(" ");kicks++;}g.tick();
 }
 assert.equal(g.run("game.state"),"clear");assert.equal(g.run("game.score"),3);assert.ok(kicks>0);g.key("r");g.key(" ");for(let i=0;i<60;i++)g.tick();assert.equal(g.run("game.charge"),60);g.key("ArrowRight");g.blur();assert.equal(g.run("game.charging"),false);assert.equal(g.run('Object.keys(game.keys).length'),0);g.key("r");assert.equal(g.run("game.stamina"),100);
});

test("マインスイーパーの一括開きは旗の誤配置で爆弾を開く",()=>{
 const g=game("intermediate","minesweeper","extensions/complete");g.run('first=false; cells=Array.from({length:5},()=>Array.from({length:5},()=>({bomb:false,open:false,flag:false,count:0})));cells[0][0].bomb=true;counts();cells[1][1].open=true;cells[0][1].flag=true');g.click(51+42,51+42);assert.equal(g.run("state"),"over");
});

test("落ちものの回転は壁と固定ブロックに重なると無効",()=>{
 const g=game("advanced","falling-blocks","extensions/complete");g.run('game.piece=new Piece(shapes[1]);game.piece.x=0;game.piece.y=0;game.board.cells[1][0]=1');const before=g.run('JSON.stringify(game.piece.shape)');g.key("ArrowUp");assert.equal(g.run('JSON.stringify(game.piece.shape)'),before);
});

test("サッカーのゴールは球全体が線を越え、縦の開口に収まるときだけ入る",()=>{
 const g=game("advanced","soccer","extensions/complete");g.run('game.ball.x=50;game.ball.y=225;game.ball.vx=0');g.tick();assert.equal(g.run("game.opponentScore"),0);g.run('game.ball.x=42;game.ball.y=225;game.ball.vx=0');g.tick();assert.equal(g.run("game.opponentScore"),0);g.run('game.ball.x=41.9;game.ball.y=225;game.ball.vx=0');g.tick();assert.equal(g.run("game.opponentScore"),1);
 for(const y of [177,273]){g.run(`game.ball.x=57;game.ball.y=${y};game.ball.vx=-1`);g.tick();assert.equal(g.run("game.ball.x"),58);assert.equal(g.run("game.opponentScore"),1);}
 for(const y of [178,272]){g.run(`game.ball.x=758.1;game.ball.y=${y};game.ball.vx=0`);g.tick();}assert.equal(g.run("game.score"),2);g.key(" ");g.run('game.state="over"; game.ball.x=game.player.x+20; game.ball.vx=0');g.release(" ");assert.equal(g.run("game.ball.vx"),0);assert.equal(g.run("game.charging"),false);
});

test("探索RPGは物の名前を表示し、取得した宝のマスを通れる",()=>{
 const g=game("advanced","quest-rpg","extensions/complete");const shown=g.show();for(const label of ["人","宝","扉","店","敵"])assert.ok(shown.includes(label),label);g.run('game.hasItem=true');assert.equal(g.run('game.blocked(5,1)'),false);g.run('game.hasItem=false;game.key=true');assert.equal(g.run('game.blocked(5,1)'),false);
});

test("各教材の図は基本2枚・発展1枚で、画像と説明のリンクがある",()=>{
 const games=[["beginner","quiz"],["beginner","story"],["intermediate","sokoban"],["intermediate","minesweeper"],["advanced","falling-blocks"],["advanced","quest-rpg"],["advanced","tactics"],["advanced","soccer"]];
 for(const [level,name] of games)for(const [sub,count] of [["",2],["extensions",1]]){
  const folder=path.join(root,"examples",level,name,sub),html=fs.readFileSync(path.join(folder,"tutorial.html"),"utf8");const figures=[...html.matchAll(/<figure class="learning-diagram"[\s\S]*?<\/figure>/g)];assert.equal(figures.length,count,`${name} ${sub}`);
  for(const f of figures){assert.match(f[0],/<figcaption[^>]*>図：/);assert.match(f[0],/alt="[^"]+"/);assert.match(f[0],/role="region" tabindex="0"/);const src=f[0].match(/<img src="([^"]+)"/)[1];const svg=fs.readFileSync(path.resolve(folder,src),"utf8"),view=svg.match(/viewBox="0 0 (\d+) (\d+)"/);assert.ok(view);assert.match(f[0],new RegExp(`width="${view[1]}" height="${view[2]}"`));}
 }
});

test("戦術の敵は1体につき1回攻撃し、倒れた味方は選べない",()=>{
 const g=game("advanced","tactics","extensions/complete");g.run('game.units[0].x=0;game.units[0].y=0;game.units[1].hp=0;game.units[2].x=1;game.units[2].y=0;game.units[3].hp=0');g.click(65+60,50+180);assert.equal(g.run("game.selected"),null);g.key("Enter");assert.equal(g.run("game.units[0].hp"),4);assert.equal(g.run("game.state"),"playing");
});

test("RPGの店と薬は所持金と最大HPを守り、倒した敵は再戦しない",()=>{
 const g=game("advanced","quest-rpg","extensions/complete");g.key("ArrowDown");g.key("ArrowDown");g.key(" ");assert.equal(g.run("game.money"),2);assert.equal(g.run("game.potions"),1);g.key(" ");assert.equal(g.run("game.potions"),1);g.key("ArrowRight");g.key("ArrowRight");g.key(" ");assert.equal(g.run("game.state"),"battle");g.key("a");g.key("h");assert.equal(g.run("game.player.hp"),8);assert.equal(g.run("game.potions"),0);g.key("a");assert.equal(g.run("game.enemyDead"),true);g.key(" ");assert.equal(g.run("game.state"),"playing");
});

test("落ちもの基本版は実キーだけで2行そろえてクリア",()=>{
 const g=game("advanced","falling-blocks","complete",0);for(const count of [-3,-1,1,3]){for(let i=0;i<Math.abs(count);i++)g.key(count<0?"ArrowLeft":"ArrowRight");for(let i=0;i<13;i++)g.key("ArrowDown");}assert.equal(g.run("game.state"),"clear");assert.equal(g.run("game.lines"),2);
});

test("探索RPG基本版は依頼を受けて宝を届け、鍵で扉を開ける",()=>{
 const g=game("advanced","quest-rpg","complete");for(const k of [" ","ArrowDown","ArrowRight","ArrowRight","ArrowRight","ArrowUp","ArrowRight"," "])g.key(k);assert.equal(g.run("game.hasItem"),true);for(const k of ["ArrowDown","ArrowLeft","ArrowLeft","ArrowLeft","ArrowUp","ArrowRight"," "])g.key(k);assert.equal(g.run("game.key"),true);for(const k of ["ArrowDown","ArrowRight","ArrowRight","ArrowRight","ArrowDown","ArrowRight"," "])g.key(k);assert.equal(g.run("game.state"),"clear");
});

test("サッカー基本版もキー操作だけで先に3点を取れる",()=>{
 const g=game("advanced","soccer","complete");let frames=0;
 while(g.run('game.state === "playing"')&&frames++<3000){const b=JSON.parse(g.run('JSON.stringify(game.ball)')),p=JSON.parse(g.run('JSON.stringify(game.player)'));const tx=Math.max(66,Math.min(730,b.x-24)),ty=Math.max(76,Math.min(374,b.y));for(const [key,active] of [["ArrowRight",tx-p.x>2],["ArrowLeft",tx-p.x< -2],["ArrowDown",ty-p.y>2],["ArrowUp",ty-p.y< -2]])active?g.key(key):g.release(key);if(Math.hypot(b.x-p.x,b.y-p.y)<=30&&b.x>p.x&&Math.abs(b.y-p.y)<3)g.key(" ");g.tick();}
 assert.equal(g.run("game.state"),"clear");assert.equal(g.run("game.score"),3);
});

test("戦術ゲーム基本版はキーとクリック操作で敵を全員倒せる",()=>{
 const g=game("advanced","tactics","complete");const actions=[[1,1],[1,2],[1,3],[1,4],"Enter",[1,2],[1,3],[1,4],[0,4],"Enter",[1,3],[2,3],[1,4],[0,4],"Enter",[1,4],[1,3],[0,4],[0,3],[1,3],"Enter",[1,4],[0,4],[0,3],"Enter",[0,4],[0,3],[0,2],"Enter",[0,4],[1,4],[0,3],[0,2],[0,4],"Enter",[1,4],[0,4],[0,3]];
 for(const action of actions){if(action==="Enter")g.key(action);else g.click(65+action[0]*60,50+action[1]*60);}
 assert.equal(g.run("game.state"),"clear");
});


test("サッカーの両ゴールは濃い枠色で描かれる",()=>{
 for(const stage of ["step1","complete","extensions/step1","extensions/complete"]){const g=game("advanced","soccer",stage);g.show();const goals=g.strokes.filter(s=>s.args[2]===20&&s.args[3]===110);assert.equal(goals.length,2,stage);assert.ok(goals.every(s=>s.color==="#26334a"),stage);}
});

test("落ちものの次の形の描画後も結果文字は濃い色になる",()=>{
 for(const stage of ["extensions/step3","extensions/complete"]){const g=game("advanced","falling-blocks",stage);g.run('game.state="clear"');g.show();const result=g.colors.find(x=>x.text.includes("クリア！"));assert.ok(result);assert.equal(result.color,"#26334a",stage);}
});
