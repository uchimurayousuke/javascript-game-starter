"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const root=path.resolve(__dirname,'..');
function game(level,name,stage='complete',random=()=>0.5){
 const listeners={},clock={now:0},drawn=[];const on=(type,fn)=>(listeners[type]??=[]).push(fn);const ctx={clearRect(){},fillRect(){},strokeRect(){},fillText(value){drawn.push(String(value));},beginPath(){},arc(){},fill(){}};const canvas={width:800,height:450,getContext:()=>ctx,getBoundingClientRect:()=>({left:10,top:20,width:400,height:225}),addEventListener:on};const math=Object.create(Math);math.random=random;
 const c=vm.createContext({document:{querySelector:()=>canvas},window:{addEventListener:on},performance:{now:()=>clock.now},requestAnimationFrame(){},Math:math});vm.runInContext(fs.readFileSync(path.join(root,'examples',level,name,stage,'script.js'),'utf8'),c);
 const fire=(type,e)=>{for(const fn of listeners[type]||[])fn({repeat:false,preventDefault(){},...e});};return {clock,drawn,show:()=>{drawn.length=0;vm.runInContext('draw()',c);return drawn.join(' ');},run:s=>vm.runInContext(s,c),key:(key,e={})=>fire('keydown',{key,...e}),click:(x,y,type='click')=>fire(type,{clientX:10+x/2,clientY:20+y/2}),tick:()=>vm.runInContext('update()',c)};
}

test('リズムは開始後8拍を2レーンで一度ずつ判定し、期限と再開を扱う',()=>{
 const g=game('intermediate','rhythm','extensions/complete');g.key('Enter');for(let i=0;i<8;i++){g.clock.now=2000+i*600;g.key(i%2?'f':'d');g.key(i%2?'f':'d');}g.tick();assert.equal(g.run('state'),'result');assert.equal(g.run('score'),10);g.key('r');assert.equal(g.run('score'),0);g.key('Enter');g.clock.now+=2150;g.key('d');assert.equal(g.run('score'),1);assert.equal(g.run('message'),'Good');
 const h=game('intermediate','rhythm','extensions/complete');h.key('Enter');h.clock.now=2151;h.tick();assert.equal(h.run('judged[0]'),true);assert.equal(h.run('score'),0);
});

test('お絵かきロジック2問はヒントから一意で、クリックで完成できる',()=>{
 const g=game('intermediate','nonogram','extensions/complete');const solutions=JSON.parse(g.run('JSON.stringify(puzzles)'));
 const runs=row=>{let a=[],n=0;for(const v of [...row,0])if(v)n++;else if(n){a.push(n);n=0;}return a.join(',');};
 const all=Array.from({length:32},(_,i)=>Array.from({length:5},(_,x)=>(i>>x)&1));
 for(let p=0;p<2;p++){
  const sol=solutions[p],rowHints=sol.map(runs),colHints=Array.from({length:5},(_,x)=>runs(sol.map(r=>r[x]))),choices=rowHints.map(h=>all.filter(r=>runs(r)===h));let count=0;
  const search=(rows)=>{if(rows.length===5){if(colHints.every((h,x)=>runs(rows.map(r=>r[x]))===h))count++;return;}for(const row of choices[rows.length])search([...rows,row]);};search([]);assert.equal(count,1);
  g.key(String(p+1));g.click(181,111,'contextmenu');assert.equal(g.run('cells[0][0]'),2);g.key('u');assert.equal(g.run('cells[0][0]'),0);
  for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(sol[y][x])g.click(181+x*54,111+y*54);assert.equal(g.run('state'),'clear');g.key('r');assert.equal(g.run('state'),'playing');
 }
});

test('爆弾迷路は実キーで箱を壊し、敵を倒して出口へ到達する',()=>{
 for(const stage of ['complete','extensions/complete']){
  const g=game('advanced','bomb-maze',stage);g.key('ArrowRight');g.key('b');g.key('ArrowDown');g.key('ArrowLeft');g.clock.now=2000;g.tick();assert.equal(g.run('game.boxes.size'),0);g.clock.now=2500;g.tick();for(const k of ['ArrowUp','ArrowRight','ArrowRight','b','ArrowLeft','ArrowDown','ArrowLeft'])g.key(k);g.clock.now=4500;g.tick();assert.equal(g.run('game.enemy.alive'),false,stage);g.clock.now=5000;g.tick();for(const k of ['ArrowDown','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowDown','ArrowDown'])g.key(k);assert.equal(g.run('game.state'),'clear',stage);g.key('r');assert.equal(g.run('game.enemy.alive'),true);assert.equal(g.run('game.boxes.size'),1);
 }
});

test('爆弾の同時期限と大きな時間経過、爆風の消滅を扱う',()=>{
 const g=game('advanced','bomb-maze','extensions/step2');for(const k of ['ArrowRight','b','ArrowDown','b','ArrowLeft','ArrowDown'])g.key(k);assert.equal(g.run('game.bombs.length'),2);g.clock.now=3000;g.tick();assert.equal(g.run('game.bombs.length'),0);assert.equal(g.run('game.flames.length'),0);assert.equal(g.run('game.boxes.size'),0);assert.equal(g.run('game.state'),'playing');
});

function matching(board){const found=new Set();for(let y=0;y<6;y++)for(let x=0;x<6;x++){const v=board[y][x];if(x<=3&&v===board[y][x+1]&&v===board[y][x+2])for(let i=0;i<3;i++)found.add(y*6+x+i);if(y<=3&&v===board[y+1][x]&&v===board[y+2][x])for(let i=0;i<3;i++)found.add((y+i)*6+x);}return found;}
function validSwap(board){for(let y=0;y<6;y++)for(let x=0;x<6;x++)for(const [dx,dy] of [[1,0],[0,1]]){if(x+dx>=6||y+dy>=6)continue;const b=board.map(r=>[...r]);[b[y][x],b[y+dy][x+dx]]=[b[y+dy][x+dx],b[y][x]];if(matching(b).size)return [x,y,x+dx,y+dy];}return null;}
test('3つそろえは実際の交換で複数回消し、120点でクリアする',()=>{
 for(const stage of ['complete','extensions/complete']){let seed=1;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),g=game('advanced','match3',stage,random);let turns=0;
  while(g.run('game.state === "playing"')&&turns++<10){const cells=JSON.parse(g.run('JSON.stringify(game.board.cells)')),move=validSwap(cells);assert.ok(move);const [x,y,a,b]=move;g.click(81+x*50,66+y*50);g.click(81+a*50,66+b*50);}
  assert.equal(g.run('game.state'),'clear');assert.ok(g.run('game.score')>=120);assert.ok(turns>=2);g.key('r');assert.equal(g.run('game.moves'),10);
 }
});

test('交換の失敗は戻して1手使い、選択変更は手数を減らさない',()=>{
 const g=game('advanced','match3','extensions/complete');const before=g.run('JSON.stringify(game.board.cells)');g.click(81,66);g.click(181,66);assert.equal(g.run('game.moves'),10);g.click(81,66);g.click(131,66);assert.equal(g.run('game.moves'),9);assert.equal(g.run('JSON.stringify(game.board.cells)'),before);
 const fixed=game('advanced','match3','complete',()=>0);fixed.click(81+4*50,66);fixed.click(81+4*50,66+50);assert.ok(fixed.run('game.score')>0);assert.ok(fixed.run('game.board.hasMove()'));assert.equal(fixed.run('game.board.matches().size'),0);
});

test('交換パズルの期限と一度だけの列消去を扱う',()=>{
 const g=game('advanced','match3','extensions/complete');g.click(81,66);g.key('c');assert.equal(g.run('game.special'),false);const moves=g.run('game.moves');g.click(81,66);g.key('c');assert.equal(g.run('game.moves'),moves);g.key('r');g.clock.now=60000;g.click(81,66);assert.equal(g.run('game.state'),'over');assert.equal(g.run('game.selected'),null);
});

test('十字の3つそろえは交差を二重に数えない',()=>{
 const g=game('advanced','match3','complete');g.run('game.board.cells=Array.from({length:6},(_,y)=>Array.from({length:6},(_,x)=>(x+2*y)%4));game.board.cells[2][1]=4;game.board.cells[2][2]=4;game.board.cells[2][3]=4;game.board.cells[1][2]=4;game.board.cells[3][2]=4');const found=JSON.parse(g.run('JSON.stringify([...game.board.matches()])'));assert.deepEqual(found.sort((a,b)=>a-b),[8,13,14,15,20]);
});

test('クリア直前に失敗した交換は戻り、残り0なら終了する',()=>{
 const g=game('advanced','match3','complete');g.run('game.score=110;game.moves=1');const before=g.run('JSON.stringify(game.board.cells)');g.click(81,66);g.click(131,66);assert.equal(g.run('game.score'),110);assert.equal(g.run('game.moves'),0);assert.equal(g.run('game.state'),'over');assert.equal(g.run('game.selected'),null);assert.equal(g.run('JSON.stringify(game.board.cells)'),before);
});

test('リズムの長押し反復は得点せず、時刻差60と150は境界に含む',()=>{
 const g=game('intermediate','rhythm','extensions/complete');g.key('Enter');g.clock.now=2060;g.key('d',{repeat:true});assert.equal(g.run('score'),0);g.key('d');assert.equal(g.run('message'),'Perfect');g.clock.now=2750;g.key('f');assert.equal(g.run('message'),'Good');assert.equal(g.run('score'),2);
});

test('リズム基本版はSpaceで8拍を入力してクリアできる',()=>{
 const g=game('intermediate','rhythm');g.key('Enter');for(let i=0;i<8;i++){g.clock.now=2000+i*600;g.key(' ');}g.tick();assert.equal(g.run('state'),'result');assert.equal(g.run('score'),8);assert.match(g.run('message'),/クリア/);g.key('r');assert.equal(g.run('state'),'ready');
});

test('お絵かきロジック基本版はヒントの盤面をクリックして完成する',()=>{
 const g=game('intermediate','nonogram');const solution=JSON.parse(g.run('JSON.stringify(puzzles[0])'));for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(solution[y][x])g.click(181+x*54,111+y*54);assert.equal(g.run('state'),'clear');g.key('r');assert.equal(g.run('state'),'playing');
});


test('リズム結果は再開キーを表示し、出口では文字が重ならない',()=>{
 const r=game('intermediate','rhythm','extensions/complete');r.key('Enter');for(let i=0;i<8;i++){r.clock.now=2000+i*600;r.key(i%2?'f':'d');}r.tick();assert.match(r.show(),/R: 再開/);
 const b=game('advanced','bomb-maze');assert.match(b.show(),/出口/);b.run('game.player.x=7;game.player.y=5');b.show();assert.equal(b.drawn.includes('出口'),false);assert.equal(b.drawn.includes('自'),true);
});
