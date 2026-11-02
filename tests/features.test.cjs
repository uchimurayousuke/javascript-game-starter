"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
function demo(level,name,options={}){
 const listeners={},clock={now:0},drawn=[],storage=options.storage,window={addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn)};
 if(storage!==undefined)Object.defineProperty(window,"localStorage",{get:()=>{if(storage===false)throw Error("unavailable");return storage;}});
 if(options.Audio)window.AudioContext=options.Audio;
 const ctx={clearRect(){},fillRect(){},fillText(value){drawn.push(String(value));},beginPath(){},arc(){},fill(){},strokeRect(){},save(){},restore(){},translate(){},rotate(){}};
 const canvas={width:800,height:450,style:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:10,top:20,width:400,height:225}),addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn),setPointerCapture(){}};
 const c=vm.createContext({window,document:{querySelector:()=>canvas},performance:{now:()=>clock.now},requestAnimationFrame(){},Math});vm.runInContext(fs.readFileSync(path.join(root,'features',level,name,'complete/script.js'),'utf8'),c);
 const fire=(type,e={})=>{for(const fn of listeners[type]||[])fn({repeat:false,preventDefault(){},...e});};
 return {clock,show:()=>{drawn.length=0;vm.runInContext('draw()',c);return drawn.join(' ');},run:s=>vm.runInContext(s,c),key:key=>fire('keydown',{key}),keyup:key=>fire('keyup',{key}),click:(x,y)=>fire('click',{clientX:10+x/2,clientY:20+y/2}),pointer:(type,id,x,y)=>fire(type,{pointerId:id,clientX:10+x/2,clientY:20+y/2}),blur:()=>fire('blur'),tick:(n=1)=>{for(let i=0;i<n;i++)vm.runInContext('update()',c);}};
}

test('メニューと遊び方は選択、クリック、戻る操作を処理する',()=>{
 const g=demo('beginner','menu');g.key('ArrowDown');g.key('Enter');assert.equal(g.run('state'),'help');g.key('Escape');g.click(300,170);assert.equal(g.run('state'),'game');g.key('ArrowRight');g.tick();assert.equal(g.run('gameX'),103);g.keyup('ArrowRight');g.key('Escape');assert.equal(g.run('state'),'menu');
 const h=demo('beginner','help');h.key('h');assert.equal(h.run('state'),'help');h.key('Escape');h.key('Enter');assert.equal(h.run('state'),'playing');h.key('ArrowRight');h.tick();assert.equal(h.run('gameX'),103);h.keyup('ArrowRight');h.key('Escape');assert.equal(h.run('state'),'title');
});

test('カウントは3秒で始まり、結果から再挑戦とメニューへ戻る',()=>{
 const g=demo('beginner','countdown');g.key('Enter');g.clock.now=2999;g.tick();assert.equal(g.run('state'),'countdown');assert.equal(g.run('x'),100);g.clock.now=3000;g.tick();assert.equal(g.run('state'),'playing');assert.equal(g.run('x'),102);
 const r=demo('beginner','results');for(let i=0;i<3;i++)r.key(' ');assert.equal(r.run('state'),'result');r.key('m');assert.equal(r.run('state'),'menu');r.key('Enter');assert.equal(r.run('score'),0);
});

test('ステージは順番に開き、一時停止中は経過時間を増やさない',()=>{
 const s=demo('intermediate','stage-select');s.key('ArrowRight');s.key('Enter');assert.equal(s.run('state'),'select');s.key('ArrowLeft');s.key('Enter');s.key(' ');assert.equal(s.run('unlocked'),2);s.key('Escape');s.key('ArrowRight');s.key('Enter');assert.equal(s.run('state'),'playing');
 const p=demo('intermediate','pause');p.clock.now=2000;p.tick();p.key('p');const x=p.run('x');p.clock.now=12000;p.tick();assert.equal(p.run('elapsed()'),2000);assert.equal(p.run('x'),x);p.key('p');p.clock.now=20000;p.tick();assert.equal(p.run('state'),'over');
});

test('難易度選択が速度へ反映される',()=>{
 const g=demo('intermediate','difficulty');g.key('Enter');g.tick();assert.equal(g.run('x'),102);g.key('r');g.key('ArrowRight');g.key('Enter');g.tick();assert.equal(g.run('x'),104);
});

test('保存は壊れた値や利用不可を扱い、専用キーだけを削除する',()=>{
 const values=new Map([['other','keep']]);const storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.has(k)?values.get(k):null,removeItem:k=>values.delete(k)};const g=demo('intermediate','save',{storage});g.key(' ');g.key('s');g.key('r');g.key('l');assert.equal(g.run('best'),1);values.set('game-example-best-v1','{"best":-5}');g.key('l');assert.equal(g.run('best'),1);assert.match(g.run('message'),/不正/);g.key('d');assert.equal(values.get('other'),'keep');const off=demo('intermediate','save',{storage:false});off.key('s');assert.match(off.run('message'),/できません/);off.key('l');assert.match(off.run('message'),/読み込めません/);
});

test('音声APIがない環境を知らせ、失敗も受け止める',async()=>{
 const none=demo('intermediate','sound');none.key(' ');assert.match(none.run('message'),/使えません/);
 class Failed {constructor(){throw Error('no audio');}}const bad=demo('intermediate','sound',{Audio:Failed});bad.key(' ');assert.match(bad.run('message'),/できません/);
 let starts=0,stops=0;class Audio {constructor(){this.state='running';this.currentTime=0;this.destination={};}createOscillator(){return {frequency:{},connect(){},start(){starts++;},stop(){stops++;}};}createGain(){return {gain:{},connect(){}};}}
 const ok=demo('intermediate','sound',{Audio});ok.key(' ');assert.equal(starts,1);assert.equal(stops,1);ok.key('m');ok.key(' ');assert.equal(starts,1);
});

test('暗転中の重複入力を防ぎ、粒は期限で消える',()=>{
 const f=demo('advanced','fade');f.key('Enter');f.key('Enter');f.tick(21);assert.equal(f.run('scene'),'B');f.key('Enter');f.tick(21);assert.equal(f.run('scene'),'B');assert.equal(f.run('phase'),'idle');
 const p=demo('advanced','particles');p.click(300,200);assert.equal(p.run('particles.length'),8);p.tick(30);assert.equal(p.run('particles.length'),0);
});

test('複数pointerとキーは独立し、cancelとblurで解除される',()=>{
 const g=demo('advanced','touch-controls');g.pointer('pointerdown',1,100,330);g.pointer('pointerdown',2,270,330);g.tick();assert.equal(g.run('x'),400);g.pointer('pointerup',1,100,330);g.tick();assert.equal(g.run('x'),403);g.pointer('pointercancel',2,270,330);g.tick();assert.equal(g.run('x'),403);g.key('ArrowLeft');g.pointer('pointerdown',3,270,330);g.tick();assert.equal(g.run('x'),403);g.blur();g.tick();assert.equal(g.run('x'),403);
});



test('保存の最大値は自分で生成して保存して読み戻せる',()=>{
 const values=new Map();const storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.has(k)?values.get(k):null,removeItem:k=>values.delete(k)};const g=demo('intermediate','save',{storage});g.run('score=9999; best=9999');g.key(' ');assert.equal(g.run('score'),9999);g.key('s');g.key('r');g.key('l');assert.equal(g.run('best'),9999);
});

test('粒は1回最大8個で合計100を超えず、時間が来れば消える',()=>{
 const g=demo('advanced','particles');for(let i=0;i<14;i++)g.click(300,200);assert.equal(g.run('particles.length'),100);g.tick(30);assert.equal(g.run('particles.length'),0);
});

test('音声の再開拒否を非同期でも知らせる',async()=>{
 class Rejected {constructor(){this.state='suspended';}resume(){return Promise.reject(Error('blocked'));}}
 const g=demo('intermediate','sound',{Audio:Rejected});g.key(' ');await new Promise(resolve=>setImmediate(resolve));assert.match(g.run('message'),/再生できません/);
});

test('操作不能な保存と壊れたJSONでも記録を壊さない',()=>{
 const values=new Map([['game-example-best-v1','broken']]);const storage={getItem:k=>values.get(k)??null,setItem(){throw Error('denied');},removeItem(){throw Error('denied');}};const g=demo('intermediate','save',{storage});g.key(' ');g.key('l');assert.equal(g.run('best'),1);assert.match(g.run('message'),/読み込めません/);g.key('s');assert.match(g.run('message'),/保存できません/);g.key('d');assert.equal(g.run('best'),1);assert.match(g.run('message'),/消せません/);
});


test('メニューと音・保存・カウントは操作ヒントを固定表示する',()=>{
 const m=demo('beginner','menu');assert.match(m.show(),/ゲームメニュー/);assert.match(m.show(),/Enter・クリック/);
 const sound=demo('intermediate','sound');sound.key(' ');assert.match(sound.show(),/Space: 音を試す/);
 const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k)};const save=demo('intermediate','save',{storage});save.key('s');assert.match(save.show(),/Space: 得点/);
 const timer=demo('beginner','countdown');timer.key('Enter');timer.clock.now=3000;timer.tick();assert.match(timer.show(),/R: はじめから/);
});
