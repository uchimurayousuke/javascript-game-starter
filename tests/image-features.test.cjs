"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const root=path.resolve(__dirname,'..');
function demo(level,name,stage='complete',pointer=true){
 const listeners={},clock={now:0},imgs=[],calls=[],texts=[];const on=(type,fn)=>(listeners[type]??=[]).push(fn);
 class StubImage {constructor(){this.ready=false;imgs.push(this);}set src(value){assert.equal(typeof this.onload,'function');assert.equal(typeof this.onerror,'function');this.url=value;}get src(){return this.url;}}
 const ctx={clearRect(){},fillRect(...a){calls.push({op:'fillRect',args:a,color:this.fillStyle});},strokeRect(...a){calls.push({op:'strokeRect',args:a});},fillText(t){texts.push(String(t));},beginPath(){},arc(){},fill(){},drawImage(...a){assert.equal(a[0].ready,true,'未読込の画像を描かない');calls.push({op:'drawImage',args:a});},save(){calls.push({op:'save'});},restore(){calls.push({op:'restore'});},translate(...a){calls.push({op:'translate',args:a});},scale(...a){calls.push({op:'scale',args:a});},rotate(...a){calls.push({op:'rotate',args:a});}};
 const canvas={width:800,height:450,style:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:10,top:20,width:400,height:225}),addEventListener:on,setPointerCapture(){}};const win={addEventListener:on};if(pointer)win.PointerEvent=function(){};
 const c=vm.createContext({document:{querySelector:()=>canvas},window:win,Image:StubImage,performance:{now:()=>clock.now},requestAnimationFrame(){},Math});vm.runInContext(fs.readFileSync(path.join(root,'features',level,name,stage,'script.js'),'utf8'),c);
 const fire=(type,e={})=>{for(const fn of listeners[type]||[])fn({repeat:false,preventDefault(){},...e});};return {clock,imgs,calls,texts,run:s=>vm.runInContext(s,c),key:key=>fire('keydown',{key}),keyup:key=>fire('keyup',{key}),pointer:(type,id,x,y)=>fire(type,{pointerId:id,clientX:10+x/2,clientY:20+y/2}),mouse:(type,x,y)=>fire(type,{clientX:10+x/2,clientY:20+y/2}),blur:()=>fire('blur'),click:(x,y)=>fire('click',{clientX:10+x/2,clientY:20+y/2}),tick:()=>vm.runInContext('update()',c),show:()=>{calls.length=0;texts.length=0;vm.runInContext('draw()',c);},load:(i,w,h)=>{const im=imgs[i];im.naturalWidth=w;im.naturalHeight=h;im.ready=true;im.onload();},fail:i=>imgs[i].onerror()};
}

test('画像は待機中と失敗時に描かず、古い読込結果が再開後を上書きしない',()=>{
 const g=demo('beginner','image-swap');assert.equal(g.imgs.length,2);g.show();assert.equal(g.calls.filter(c=>c.op==='drawImage').length,0);g.key('r');assert.equal(g.imgs.length,4);g.load(0,64,64);assert.equal(g.run('images[0].status'),'loading');g.fail(2);g.show();assert.match(g.texts.join(' '),/読み込めません/);g.key(' ');g.load(3,96,64);g.show();assert.equal(g.calls.filter(c=>c.op==='drawImage').length,1);
});

test('画像配置の引き伸ばしと比率維持の中央配置が一致する',()=>{
 const g=demo('beginner','image-layout');g.load(0,96,64);g.show();let image=g.calls.find(c=>c.op==='drawImage');assert.deepEqual(image.args.slice(1),[250,120,240,180]);g.key('b');g.show();image=g.calls.find(c=>c.op==='drawImage');assert.deepEqual(image.args.slice(1),[250,130,240,160]);
});

test('背景のcontainとcoverは中心を合わせ、その上に人を描く',()=>{
 const g=demo('intermediate','image-background');g.load(0,800,600);g.show();let i=g.calls.findIndex(c=>c.op==='drawImage');assert.deepEqual(g.calls[i].args.slice(1),[100,0,600,450]);assert.ok(g.calls.slice(i+1).some(c=>c.op==='fillRect'&&c.args[0]===380));g.key('c');g.show();i=g.calls.findIndex(c=>c.op==='drawImage');assert.deepEqual(g.calls[i].args.slice(1),[0,-75,800,600]);
});

test('画像を差し替えても中心基準の当たり判定は変わらない',()=>{
 const g=demo('intermediate','image-hitbox');g.load(0,64,64);g.load(1,96,64);for(let i=0;i<35;i++)g.key('ArrowRight');assert.equal(g.run('overlaps()'),false);g.key('ArrowRight');assert.equal(g.run('overlaps()'),true);g.key('h');g.show();assert.deepEqual(g.calls.find(c=>c.op==='strokeRect').args,[472,203,32,44]);g.key(' ');assert.equal(g.run('overlaps()'),true);g.show();assert.deepEqual(g.calls.find(c=>c.op==='strokeRect').args,[472,203,32,44]);assert.deepEqual(g.calls.find(c=>c.op==='drawImage').args.slice(1),[440,193,96,64]);
});

test('HPは0〜100に収まり、50ならバーは150ピクセル',()=>{
 const g=demo('beginner','health-bar');for(const k of ['d','d','d','h','h'])g.key(k);assert.equal(g.run('hp'),50);g.show();assert.ok(g.calls.some(c=>c.op==='fillRect'&&c.args[2]===150));for(let i=0;i<10;i++)g.key('d');assert.equal(g.run('hp'),0);for(let i=0;i<10;i++)g.key('h');assert.equal(g.run('hp'),100);
});

test('ボタンは押し始めと終了、pointer IDと無効状態を区別する',()=>{
 const g=demo('intermediate','buttons');g.pointer('pointerdown',1,100,170);g.pointer('pointerup',1,300,180);assert.equal(g.run('count'),0);g.pointer('pointerdown',1,300,180);g.pointer('pointerup',1,100,170);assert.equal(g.run('count'),0);g.pointer('pointerdown',1,300,180);g.pointer('pointerup',2,300,180);assert.equal(g.run('count'),0);g.pointer('pointerup',1,300,180);assert.equal(g.run('count'),1);g.pointer('pointerdown',1,300,180);g.pointer('pointercancel',1,300,180);g.pointer('pointerup',1,300,180);assert.equal(g.run('count'),1);g.key('d');g.key('Enter');assert.equal(g.run('count'),1);g.key('d');g.key('Enter');assert.equal(g.run('count'),2);
 const fallback=demo('intermediate','buttons','complete',false);fallback.mouse('mousedown',300,180);fallback.mouse('mouseup',300,180);assert.equal(fallback.run('count'),1);
});

test('円と四角は距離30の接触を含み、離れた場合は含まない',()=>{
 const g=demo('intermediate','collision');for(let i=0;i<18;i++)g.key('ArrowRight');assert.equal(g.run('nearest().distance'),40);g.key('ArrowRight');assert.equal(g.run('nearest().distance'),30);g.show();assert.match(g.texts.join(' '),/接触/);g.key('ArrowLeft');g.show();assert.match(g.texts.join(' '),/離れている/);
});

test('中間地点の右向き通過と危険区域、RとNを処理する',()=>{
 const g=demo('intermediate','checkpoint');g.key('ArrowRight');for(let i=0;i<107;i++)g.tick();assert.equal(g.run('saved'),420);g.keyup('ArrowRight');g.key('ArrowLeft');for(let i=0;i<20;i++)g.tick();g.keyup('ArrowLeft');assert.equal(g.run('saved'),420);g.key('r');assert.equal(g.run('x'),420);g.key('ArrowRight');for(let i=0;i<61;i++)g.tick();assert.equal(g.run('x'),603);g.tick();assert.equal(g.run('x'),420);g.key('n');assert.equal(g.run('x'),80);assert.equal(g.run('saved'),80);
});

test('スプライトはシートを検証し、移動・停止・再開に応じて切り出す',()=>{
 const g=demo('advanced','sprite-animation');g.load(0,256,64);g.key('ArrowRight');g.tick();g.clock.now=200;g.tick();assert.equal(g.run('frame'),1);g.show();assert.deepEqual(g.calls.find(c=>c.op==='drawImage').args.slice(1,5),[64,0,64,64]);g.keyup('ArrowRight');g.tick();assert.equal(g.run('frame'),0);g.clock.now=500;g.key('ArrowRight');g.tick();assert.equal(g.run('frame'),0);g.clock.now=700;g.tick();assert.equal(g.run('frame'),1);g.key('r');g.load(1,255,64);g.show();assert.equal(g.calls.some(c=>c.op==='drawImage'),false);assert.match(g.texts.join(' '),/大きさ/);
});

test('画像の反転と回転は中心で行い、描画状態を戻す',()=>{
 const g=demo('advanced','image-transform');g.load(0,64,64);g.key('f');g.key('a');g.show();assert.deepEqual(g.calls.find(c=>c.op==='translate').args,[400,225]);assert.equal(g.calls.find(c=>c.op==='rotate').args[0],Math.PI/4);assert.deepEqual(g.calls.find(c=>c.op==='scale').args,[-1,1]);const draw=g.calls.findIndex(c=>c.op==='drawImage'),restore=g.calls.findIndex(c=>c.op==='restore');assert.ok(draw<restore);assert.deepEqual(g.calls[draw].args.slice(1),[-32,-32,64,64]);g.key('r');assert.equal(g.run('flip'),false);
});

test('経過時間方式は30fpsと60fpsで同じ距離、長時間停止は上限を適用する',()=>{
 for(const fps of [30,60]){const g=demo('advanced','delta-time');for(let i=1;i<=fps;i++){g.clock.now=i*1000/fps;g.tick();}assert.ok(Math.abs(g.run('x')-220)<1e-8);g.clock.now+=5000;g.tick();assert.ok(Math.abs(g.run('x')-226)<1e-8);g.key('r');g.tick();assert.equal(g.run('x'),100);}
});

test('カメラは端を越えず、縮小表示のクリックを世界座標に直す',()=>{
 const g=demo('advanced','camera');g.key('ArrowRight');for(let i=0;i<50;i++)g.tick();g.keyup('ArrowRight');g.key('ArrowDown');for(let i=0;i<25;i++)g.tick();g.keyup('ArrowDown');assert.equal(g.run('camera.x'),200);assert.equal(g.run('camera.y'),100);g.click(100,50);assert.equal(g.run('clicked.x'),300);assert.equal(g.run('clicked.y'),150);g.key('r');assert.equal(g.run('camera.x'),0);assert.equal(g.run('clicked'),null);
});

test('幅や高さが0の画像は失敗として扱い描画しない',()=>{
 const g=demo('beginner','image-swap');g.load(0,0,64);g.show();assert.equal(g.run('images[0].status'),'error');assert.equal(g.calls.some(c=>c.op==='drawImage'),false);
});

test('ボタンのホバーは領域を離れると解除され、途中キャンセルでも押下しない',()=>{
 const g=demo('intermediate','buttons');g.pointer('pointermove',1,300,180);assert.equal(g.run('hover'),true);g.pointer('pointerleave',1,100,180);assert.equal(g.run('hover'),false);g.pointer('pointerdown',1,300,180);g.blur();g.pointer('pointerup',1,300,180);assert.equal(g.run('count'),0);
});

test('画像を使う各見本は読込失敗でも画像を描かず案内する',()=>{
 for(const [level,name] of [['beginner','image-swap'],['beginner','image-layout'],['intermediate','image-background'],['intermediate','image-hitbox'],['advanced','sprite-animation'],['advanced','image-transform']]){const g=demo(level,name);g.fail(0);g.show();assert.equal(g.calls.some(c=>c.op==='drawImage'),false,name);assert.match(g.texts.join(' '),/読.*ません/,name);}
});

test('アニメーションは画像の読込待ちと寸法不足を区別する',()=>{
 const g=demo('advanced','sprite-animation');g.show();assert.match(g.texts.join(' '),/読み込み中/);assert.equal(g.calls.some(c=>c.op==='drawImage'),false);g.load(0,192,64);g.show();assert.match(g.texts.join(' '),/大きさ/);assert.equal(g.calls.some(c=>c.op==='drawImage'),false);
});

test('12作例のすべての段階を画像未読込のまま起動・描画できる',()=>{
 const groups=[['beginner',['image-swap','image-layout','health-bar']],['intermediate',['image-background','image-hitbox','buttons','collision','checkpoint']],['advanced',['sprite-animation','image-transform','delta-time','camera']]];
 for(const [level,names] of groups)for(const name of names)for(const stage of ['step1','step2','step3','complete']){const g=demo(level,name,stage);assert.doesNotThrow(()=>g.show(),`${name}/${stage}`);}
});

test('スプライトは読込中や不正な画像では移動せず、準備後に先頭から始める',()=>{
 const g=demo('advanced','sprite-animation');g.key('ArrowRight');g.clock.now=1000;g.tick();assert.equal(g.run('x'),400);g.show();assert.doesNotMatch(g.texts.join(' '),/コマ:/);g.load(0,256,64);g.tick();assert.equal(g.run('x'),403);assert.equal(g.run('frame'),0);g.clock.now=1200;g.tick();assert.equal(g.run('frame'),1);
 const h=demo('advanced','sprite-animation');h.load(0,255,64);h.key('ArrowRight');h.tick();assert.equal(h.run('x'),400);h.show();assert.doesNotMatch(h.texts.join(' '),/コマ:/);assert.match(h.texts.join(' '),/大きさ/);
});

test('画像配置と背景の切替後も現在の方法を表示する',()=>{
 const a=demo('beginner','image-layout');a.show();assert.match(a.texts.join(' '),/引き伸ばす/);a.key('b');a.show();assert.match(a.texts.join(' '),/形を変えずに収める/);
 const b=demo('intermediate','image-background');b.show();assert.match(b.texts.join(' '),/全体を収める/);b.key('c');b.show();assert.match(b.texts.join(' '),/画面を埋める/);
});
