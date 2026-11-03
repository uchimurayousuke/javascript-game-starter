"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root,p),"utf8").replace(/\r\n/g,"\n");
const pages = {
  "tutorial/index.html": {"coin-coordinates":"coin-position", "coin-arc":"coin-arc", "coin-hit":"coin-catch"},
  "examples/beginner/target/tutorial.html": {"target-coordinate":"target-coordinate", "target-distance":"target-distance"},
  "examples/beginner/bounce/tutorial.html": {"bounce-wall":"bounce-wall", "bounce-paddle":"bounce-paddle"},
  "examples/intermediate/breakout/tutorial.html": {"brick-grid":"brick-grid", "brick-hit":"brick-hit"},
  "examples/intermediate/shooting/tutorial.html": {"shoot-motion":"shoot-motion", "shoot-hit":"shoot-hit"},
  "examples/advanced/platformer/tutorial.html": {"platformer-gravity":"platformer-gravity", "platformer-collision":"platformer-collision", "platformer-camera":"platformer-camera", "platformer-instances":"platformer-instances"},
  "examples/advanced/platformer/extensions/tutorial.html": {"extension-stomp":"extension-stomp", "extension-dash":"extension-dash", "extension-retry":"extension-retry"},
  "examples/beginner/timing/tutorial.html": {"timing-range":"timing-range", "timing-state":"timing-state"},
  "examples/beginner/typing/tutorial.html": {"typing-index":"typing-index", "typing-key":"typing-key"},
  "examples/beginner/number-guess/tutorial.html": {"number-compare":"number-compare", "number-range":"number-range"},
  "examples/intermediate/snake/tutorial.html": {"snake-move":"snake-move", "snake-grow":"snake-grow"},
  "examples/intermediate/memory/tutorial.html": {"memory-pair":"memory-pair", "memory-wait":"memory-wait", "memory-position":"memory-position", "memory-grid-index":"memory-grid-index", "memory-index-wrap":"memory-index-wrap", "shuffle-memory":"shared-shuffle"},
  "examples/intermediate/shop/tutorial.html": {"shop-product":"shop-product", "shop-money":"shop-money"},
  "examples/advanced/escape/tutorial.html": {"escape-classes":"escape-classes", "escape-flow":"escape-flow", "escape-items":"escape-items"},
  "examples/advanced/tower-defense/tutorial.html": {"tower-route":"tower-route", "tower-money":"tower-money", "tower-range":"tower-range"},
  "examples/advanced/card-battle/tutorial.html": {"card-effect":"card-effect", "card-turn":"card-turn", "card-piles":"card-piles", "shuffle-cards":"shared-shuffle"},
  "examples/advanced/racing/tutorial.html": {"race-direction":"race-direction", "race-checkpoints":"race-checkpoints", "race-classes":"race-classes", "race-road":"race-road"}
};
const illustration = name => read(`tutorial/illustrations/astra/${name}.svg`);
const figure = (file,id) => {
  const found=[...read(file).matchAll(new RegExp(`<figure class="learning-diagram" id="${id}"[^>]*>([\\s\\S]*?)</figure>`,"g"))];
  assert.equal(found.length,1,`${file}: ${id}`); return found[0][1];
};
const words = html => html.replace(/<[^>]+>/g," ").replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&").replace(/\s+/g," ");
const normalized = s => s.normalize("NFKC").replace(/−/g,"-").replace(/\s+/g,"");
const labels = svg => normalized([...svg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m=>m[1].replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&")).join(" "));
const assertLabels = (name, values) => {
  const text=labels(illustration(name));
  for(const value of values) assert.ok(text.includes(normalized(value)),`${name}: ${value}`);
};
const attrs = (svg,id) => {
  const all=[...svg.matchAll(/<(?:rect|circle|path)\b([^>]*)\/?\s*>/g)];
  const tag=all.find(([,a])=>new RegExp(`(?:^|\\s)id="${id}"`).test(a));
  assert.ok(tag,`図形 ${id}`);
  return Object.fromEntries([...tag[1].matchAll(/(?:^|\s)(x|y|width|height|cx|cy|r)="([\d.]+)"/g)].map(([,k,v])=>[k,Number(v)]));
};
const shapes = (svg, tag) => [...svg.matchAll(new RegExp(`<${tag}\\b([^>]*)/?>`,"g"))].map(([,a])=>({x:0,y:0,...Object.fromEntries([...a.matchAll(/(?:^|\s)(x|y|width|height|cx|cy|r)="([\d.]+)"/g)].map(([,k,v])=>[k,Number(v)]))}));
const near=(actual,expected) => assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

function setup(file, rect={left:0,top:0,width:800,height:450}) {
  const handlers={}, arcs=[]; const on=(type,fn)=>(handlers[type]??=[]).push(fn);
  const ctx={clearRect(){},fillRect(){},fillText(){},beginPath(){},fill(){},arc(...args){arcs.push(args);}};
  const canvas={width:800,height:450,getContext:()=>ctx,getBoundingClientRect:()=>rect,addEventListener:on};
  const context=vm.createContext({document:{querySelector:()=>canvas,addEventListener:on},window:{addEventListener:on},performance:{now:()=>0},requestAnimationFrame(){}});
  vm.runInContext(read(file),context);
  return {run:s=>vm.runInContext(s,context),fire:(type,e={})=>(handlers[type]||[]).forEach(f=>f({preventDefault(){},repeat:false,...e})),arcs};
}

test("全教材の図は説明と代替テキストを備え、ローカルの画像を参照する", () => {
  const css=read("tutorial/diagrams.css");
  assert.match(css,/\.diagram-scroll\s*\{[^}]*overflow-x:\s*auto/s);
  const imageRule=css.match(/\.diagram-scroll img\s*\{([^}]*)\}/s); assert.ok(imageRule);
  assert.match(imageRule[1],/max-width:\s*none/); assert.match(imageRule[1],/height:\s*auto/);
  const clamp=imageRule[1].match(/width:\s*clamp\(\s*([\d.]+)px\s*,\s*100%\s*,\s*([\d.]+)px\s*\)/); assert.ok(clamp);
  const minWidth=Number(clamp[1]), maxWidth=Number(clamp[2]);
  const displayedWidth=container=>Math.min(maxWidth,Math.max(minWidth,container));
  assert.ok(displayedWidth(360)>360,"狭い画面では小さく縮めずスクロール");
  for(const container of [1000,1100]) assert.ok(displayedWidth(container)<=container,`${container}px の本文幅に収まる`);
  assert.match(css,/\.diagram-scroll:focus-visible/); assert.match(css,/見切れるときは横に動かせます/);
  for(const [file,ids] of Object.entries(pages)){
    const page=read(file), cssLink=page.match(/<link rel="stylesheet" href="([^"]*diagrams\.css)">/);
    assert.ok(cssLink && fs.existsSync(path.resolve(root,path.dirname(file),cssLink[1])),file);
    assert.equal((page.match(/<figure class="learning-diagram"/g)||[]).length,Object.keys(ids).length);
    const pageIds=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]); assert.equal(new Set(pageIds).size,pageIds.length);
    for(const [id,asset] of Object.entries(ids)){
      const content=figure(file,id), img=content.match(/<img\b[^>]*src="([^"]+)"[^>]*alt="([^"]+)"[^>]*>/);
      assert.match(content,new RegExp(`<figcaption id="${id}-title">図：`)); assert.match(content,/<p>[^]*?<\/p>/);
      assert.match(content,/class="diagram-scroll" role="region" tabindex="0"/);
      assert.doesNotMatch(content,/<(?:script|canvas|iframe|svg)\b/i); assert.ok(img && img[2].length>10,`${id}: alt`);
      assert.equal(path.resolve(root,path.dirname(file),img[1]),path.resolve(root,`tutorial/illustrations/astra/${asset}.svg`));
      const svg=illustration(asset); assert.match(svg,/<title\b[^>]*>[^<]+<\/title>/); assert.match(svg,/<desc\b[^>]*>[^<]+<\/desc>/);
      assert.doesNotMatch(svg,/(?:href|src)="(?:https?:|\/\/)/i);
      const vb=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); assert.ok(vb);
      const width=img[0].match(/\bwidth="(\d+)"/), height=img[0].match(/\bheight="(\d+)"/);
      assert.ok(width && height && Number(width[1])===Number(vb[1]) && Number(height[1])===Number(vb[2]),`${asset}: 画像の寸法`);
      const sizes=[...svg.matchAll(/font-size(?:=":?|:\s*)(\d+)(?:px)?"?/g)].map(m=>Number(m[1]));
      assert.ok(sizes.length>0,`${asset}: フォントサイズ`);
      const primarySizes=sizes.filter(size=>size>=23); assert.ok(primarySizes.length>0,`${asset}: 主な文字`);
      assert.ok(Math.min(...primarySizes)*minWidth/Number(vb[1])>=17,`${asset}: 主な文字の表示サイズ`);
      assert.ok(Math.min(...sizes)*minWidth/Number(vb[1])>=14,`${asset}: 小さな注記の表示サイズ`);
    }
  }
});

test("コインの位置と大きさ、接触の境界は実際のコードと一致する", () => {
  const g=setup("tutorial/05-game/script.js"); g.run("start()");
  for(const [name,value] of Object.entries({playerX:345,playerY:385,playerWidth:110,playerHeight:18,coinX:400,coinY:80,coinRadius:14})) assert.equal(g.run(name),value);
  g.run("draw()"); assert.deepEqual(g.arcs.at(-1),[400,80,14,0,Math.PI*2]);
  const svg=illustration("coin-position"), rects=shapes(svg,"rect"), circles=shapes(svg,"circle"), screen=rects.find(r=>r.width===800&&r.height===450);
  assert.ok(screen); assert.ok(circles.some(c=>c.cx-screen.x===400&&c.cy-screen.y===80&&c.r===14));
  assert.ok(rects.some(r=>r.x-screen.x===345&&r.y-screen.y===385&&r.width===110&&r.height===18));
  assert.ok(circles.some(c=>c.r===140)); assert.ok(rects.some(r=>r.width===440&&r.height===72));
  assertLabels("coin-position",["横0・縦0","横400","縦80","半径14","左上:横345・縦385","幅110","高さ18","コイン(10倍)","受け皿(4倍)"]);
  assertLabels("coin-arc",["時計回り","π/2","180度=π","360度=2π"]);
  const arc=illustration("coin-arc");
  for(const [id,direction,circleId,edge] of [["half-bottom-left-arrow","left","半周-circle","bottom"],["half-left-up-arrow","up","半周-circle","left"],["full-bottom-left-arrow","left","1周-circle","bottom"],["full-top-right-arrow","right","1周-circle","top"],["full-right-down-arrow","down","1周-circle","right"]]){
    const tag=[...arc.matchAll(/<path\b([^>]*)\/?\s*>/g)].find(([,a])=>a.includes(`id="${id}"`));assert.ok(tag,id);
    const d=tag[1].match(/\bd="([^"]+)"/);assert.ok(d,id);
    const points=[...d[1].matchAll(/[ML]\s*([\d.]+)\s+([\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);assert.equal(points.length,3,id);
    const [[x,y],p,q]=points,circle=attrs(arc,circleId);
    if(direction==="left") assert.ok(x<p[0]&&x<q[0],id);
    if(direction==="right") assert.ok(x>p[0]&&x>q[0],id);
    if(direction==="up") assert.ok(y<p[1]&&y<q[1],id);
    if(direction==="down") assert.ok(y>p[1]&&y>q[1],id);
    if(edge==="bottom") near(y,circle.cy+circle.r);
    if(edge==="top") near(y,circle.cy-circle.r);
    if(edge==="left") near(x,circle.cx-circle.r);
    if(edge==="right") near(x,circle.cx+circle.r);
  }
  const hit=illustration("coin-catch"), cs=shapes(hit,"circle").filter(c=>c.r===110).sort((a,b)=>a.cx-b.cx), rs=shapes(hit,"rect"), boxes=rs.filter(r=>r.width===220&&r.height===220), boards=rs.filter(r=>r.width===440&&r.height===78);
  assert.equal(cs.length,2); assert.equal(boxes.length,2); assert.equal(boards.length,2);
  for(const [i,c] of cs.entries()){
    const box=boxes.find(r=>r.x+r.width/2===c.cx&&r.y+r.height/2===c.cy), board=boards.find(r=>c.cx>=r.x&&c.cx<=r.x+r.width);
    assert.ok(box&&board); assert.equal(box.y+box.height,c.cy+c.r);
    if(i===0) assert.equal(box.y+box.height,board.y); else assert.ok(box.y+box.height<board.y);
  }
  assertLabels("coin-catch",["371+14=385","370+14=384","385≥385","384≥385","キャッチ!","届かない","1のすき間"]);
  g.run("coinX=400; coinY=371"); assert.equal(g.run("coinTouchesPlayer()"),true);
  g.run("coinY=370"); assert.equal(g.run("coinTouchesPlayer()"),false);
  g.run("coinX=331; coinY=371"); assert.equal(g.run("coinTouchesPlayer()"),true);
  g.run("coinX=330.9"); assert.equal(g.run("coinTouchesPlayer()"),false);
  const text=words(figure("tutorial/index.html","coin-hit"));
  for(const term of ["coinY + coinRadius >= playerY","coinY - coinRadius <= playerY + playerHeight","coinX + coinRadius >= playerX","coinX - coinRadius <= playerX + playerWidth","371 + 14 = 385"]) assert.ok(text.includes(term),term);
});

test("的の座標変換と円周の当たりは図と実際の処理で合う", () => {
  const svg=illustration("target-coordinate"), d=attrs(svg,"display"), dp=attrs(svg,"display-click"), inside=attrs(svg,"internal"), ip=attrs(svg,"internal-click");
  assert.equal(inside.width/d.width,2); assert.equal((dp.cx-d.x)/d.width*400,200); assert.equal((ip.cx-inside.x)/inside.width*800,400);
  assertLabels("target-coordinate",["表示の幅400","左から200","内部の幅800","横400・縦225"]);
  const s=illustration("target-distance");
  for(const [n,edge] of [[35,true],[36,false]]){const c=attrs(s,`center-${n}`),point=attrs(s,`click-${n}`),target=attrs(s,`target-${n}`); assert.equal(point.cx-c.cx===target.r,edge); if(!edge) assert.ok(point.cx-c.cx>target.r);}
  assertLabels("target-distance",["距離35","距離36","35≤35","36≤35","1だけ外"]);
  const g=setup("examples/beginner/target/complete/script.js",{left:100,top:50,width:400,height:225});
  for(const [x,score] of [[300,1],[317.5,1],[318,0]]){g.run("start()");g.fire("click",{clientX:x,clientY:162.5});assert.equal(g.run("score"),score);}
});

test("壁・板の反射とブロックの配置・当たりは数値例と合う", () => {
  const s=illustration("bounce-wall");
  for(const [i,distance] of [[0,14],[1,10]]){const ball=attrs(s,`ball-${i}`),wall=attrs(s,`wall-${i}`); near((wall.x-ball.cx)/(ball.r/10),distance);}
  assertLabels("bounce-wall",["横786","横790","壁800","半径10"]);
  const p=illustration("bounce-paddle"),bounds=attrs(p,"ball-bounds"),board=attrs(p,"paddle");assert.equal(bounds.y+bounds.height,board.y);
  assertLabels("bounce-paddle",["下向き","ボールの下410","板の上410","同じ高さでもOK"]);
  const explanation=words(figure("examples/beginner/bounce/tutorial.html","bounce-paddle"));
  for(const term of ["dy > 0","y + radius >= paddleY","y - radius <= paddleY + 14","x + radius >= paddleX","x - radius <= paddleX + paddleWidth"]) assert.ok(explanation.includes(term),term);
  const bounce=setup("examples/beginner/bounce/complete/script.js");bounce.run("start(); x=786; y=225; dx=4; dy=0; update()");assert.equal(bounce.run("x"),790);assert.equal(bounce.run("dx"),-4);
  bounce.run("start(); x=400; y=396; dx=0; dy=4; update()");assert.equal(bounce.run("dy"),-4);assert.equal(bounce.run("score"),1);
  bounce.run("start(); x=400; y=404; dx=0; dy=-4; update()");assert.equal(bounce.run("score"),0);
  const grid=illustration("brick-grid"),a=attrs(grid,"brick-r0-c0"),b=attrs(grid,"brick-r0-c1"),c=attrs(grid,"brick-r1-c0"),scale=a.width/70;
  near((b.x-a.x)/scale,80);assert.ok((c.y-a.y)/scale>30, "行間は注記どおり拡大");
  assertLabels("brick-grid",["行1・列2","横240・縦85","行間を広げています"]);
  const hit=illustration("brick-hit"),brick=attrs(hit,"brick"),ball=attrs(hit,"ball"),box=attrs(hit,"ball-bounds"),k=brick.width/70;
  near(k,7);near(brick.height/k,20);near(ball.r/k,10);near((ball.cx-brick.x)/k,1);near((ball.cy-brick.y)/k,10);near(box.y+box.height,brick.y+brick.height);
  assertLabels("brick-hit",["右251≥ブロックの左240","左231≤右310","下105≥ブロックの上85","上85≤下105","7倍"]);
  const g=setup("examples/intermediate/breakout/complete/script.js");g.run("start()");assert.equal(g.run("bricks[10].x"),240);assert.equal(g.run("bricks[10].y"),85);
  g.run("x=241; y=95; dx=0; dy=0; update()");assert.equal(g.run("bricks[10].alive"),false);assert.equal(g.run("score"),1);
  g.run("start(); bricks=[{x:240,y:85,alive:true}]; x=230; y=95; dx=0; dy=0; update()");assert.equal(g.run("bricks[0].alive"),false);
});

test("弾と敵の移動、重なりと端だけの接触は図と処理が合う", () => {
  const motion=illustration("shoot-motion"), b0=attrs(motion,"bullet-before"), b1=attrs(motion,"bullet-after"), e0=attrs(motion,"enemy-before"), e1=attrs(motion,"enemy-after");
  assert.equal((b0.y-b1.y)/(e1.y-e0.y),8/2);
  assertLabels("shoot-motion",["弾は上へ8","敵は下へ2","前:縦108","後:縦100","前:縦103","後:縦105"]);
  const hit=illustration("shoot-hit");
  for(const [x,overlap] of [[100,true],[99,false]]){
    const bullet=attrs(hit,`bullet-${x}`), enemy=attrs(hit,`enemy-${x}`), scale=enemy.width/30;
    near(scale,8);near(bullet.width/scale,6);near(bullet.height/scale,12);
    near((enemy.x-bullet.x)/scale,105-x);near((enemy.y-bullet.y)/scale,5);
    assert.equal(bullet.x+bullet.width>enemy.x,overlap);
  }
  assertLabels("shoot-hit",["弾の左100・上100","弾の右106","弾の左99・上100","弾の右105","106>105","105>105","8倍"]);
  const text=words(figure("examples/intermediate/shooting/tutorial.html","shoot-hit"));
  for(const term of ["bullet.x < enemy.x + 30","bullet.x + 6 > enemy.x","bullet.y < enemy.y + 30","bullet.y + 12 > enemy.y","!bullet.hit","!enemy.hit"]) assert.ok(text.includes(term),term);
  const g=setup("examples/intermediate/shooting/complete/script.js");
  for(const [x,score] of [[100,1],[99,0]]){g.run(`start(); bullets=[{x:${x},y:108}]; enemies=[{x:105,y:103}]; spawnTimer=30; update()`);assert.equal(g.run("score"),score);}
});

test("ジャンプ・地形との衝突・カメラと敵の位置は実際の処理と合う", () => {
  const jump=setup("examples/advanced/platformer/step3/script.js");
  jump.run("start(); player.onGround=true; jumpPressed=true; player.update(terrain)");assert.equal(jump.run("player.vy"),-10.5);assert.equal(jump.run("player.y"),339.5);
  assertLabels("platformer-gravity",["-11","+0.5","-10.5","最初の移動","上へ10.5進む"]);
  jump.run("start(); player.x=268; player.onGround=true; right=true; player.update(terrain)");assert.equal(jump.run("player.x"),270);
  jump.run("start(); player.x=500; player.y=300; player.vy=-6; player.update(terrain)");assert.equal(jump.run("player.y"),295);assert.equal(jump.run("player.vy"),0);
  jump.run("start(); player.update(terrain)");assert.equal(jump.run("player.y"),350);assert.equal(jump.run("player.onGround"),true);
  assert.equal(jump.run("overlaps({x:0,y:0,width:10,height:10},{x:10,y:0,width:10,height:10})"),false);
  const collision=illustration("platformer-collision"),wall=attrs(collision,"wall"),person=attrs(collision,"player-wall"),floor=attrs(collision,"floor"),standing=attrs(collision,"player-floor");
  near(person.width/30,4);near(person.height/40,4);assert.equal(person.x+person.width,wall.x);assert.equal(standing.y+standing.height,floor.y);
  assertLabels("platformer-collision",["300-30=270","390-40=350","端だけの接触を含みません","4倍"]);
  const camera=illustration("platformer-camera"),world=attrs(camera,"world"),view=attrs(camera,"visible-range"),wp=attrs(camera,"world-player"),screen=attrs(camera,"screen"),sp=attrs(camera,"screen-player"),k=world.width/2400;
  near((view.x-world.x)/k,500);near(view.width/k,800);near((wp.x-world.x)/k,885);near((sp.x-screen.x)/screen.width*800,385);
  assertLabels("platformer-camera",["横500","横1300","左端885","左端は横385","885-500=385"]);
  const g=setup("examples/advanced/platformer/complete/script.js");g.run("start(); player.x=885; update()");assert.equal(g.run("cameraX"),500);assert.equal(g.run("player.x-cameraX"),385);
  g.run("start(); update()");assert.equal(g.run("cameraX"),0);g.run("start(); player.x=2370; update()");assert.equal(g.run("cameraX"),1600);
  g.run("start(); enemies[0].update()");assert.equal(g.run("enemies[0].x"),901);assert.equal(g.run("enemies[1].x"),1700);
  assertLabels("platformer-instances",["横900","横1700","850","990","1640","1780"]);
});

test("踏みつけ・ダッシュ・中間地点からの再開は図と処理が合う", () => {
  const stomp=illustration("extension-stomp");
  for(const [i,foot] of [[0,350],[1,362],[2,360]]){
    const enemy=attrs(stomp,`enemy-${i}`),person=attrs(stomp,`player-${i}`),scale=person.height/40;
    near(scale,4);near((person.y+person.height-enemy.y)/scale,foot-360);
  }
  assertLabels("extension-stomp",["足350","足362","足360","上360","上向き速度-8","横から触れる","上昇中","同じ高さでもOK"]);
  const dash=illustration("extension-dash"),a=attrs(dash,"start-0"),b=attrs(dash,"end-0"),c=attrs(dash,"start-1"),d=attrs(dash,"end-1");
  near((d.x-c.x)/(b.x-a.x),6/4);assertLabels("extension-dash",["速さ4","速さ6","両方でも速さ6"]);
  assertLabels("extension-retry",["失敗している","中間地点を通過済み","中間から再開","最初から開始","横1200","縦350","左端815"]);
  const g=setup("examples/advanced/platformer/extensions/complete/script.js");
  g.run("start(); player.x=900; player.y=310; player.vy=11.5; player.onGround=false; update()");assert.equal(g.run("enemies[0].alive"),false);assert.equal(g.run("player.y"),320);assert.equal(g.run("player.vy"),-8);
  g.run("start(); player.x=900; player.y=320; player.vy=0; player.onGround=false; update()");assert.equal(g.run("enemies[0].alive"),false);assert.equal(g.run("player.vy"),-8);
  g.run("start(); player.x=900; player.y=340; player.vy=0; update()");assert.equal(g.run("state"),"over");
  g.run("start(); player.x=900; player.y=350; player.vy=-8; update()");assert.equal(g.run("state"),"over");
  g.run("start(); right=true; update()");assert.equal(g.run("player.x"),84);g.run("start(); right=true; dashLeft=true; update()");assert.equal(g.run("player.x"),86);
  g.run("start(); right=true; dashRight=true; update()");assert.equal(g.run("player.x"),86);
  g.run("start(); checkpoint.active=true; coins[0].taken=true; score=1; enemies[0].stomp(); defeated=1; state='over'");
  g.fire("keydown",{code:"KeyR"});assert.equal(g.run("player.x"),1200);assert.equal(g.run("player.y"),350);assert.equal(g.run("cameraX"),815);assert.equal(g.run("score"),1);assert.equal(g.run("defeated"),1);assert.equal(g.run("enemies[0].alive"),false);
  g.fire("keydown",{code:"KeyR",repeat:true});assert.equal(g.run("player.x"),1200);g.fire("keydown",{code:"KeyR"});assert.equal(g.run("player.x"),80);assert.equal(g.run("score"),0);
});

test("新しい初心者3教材の図は、説明例と図形の位置関係が合う", () => {
  const timing=illustration("timing-range"), success=attrs(timing,"zone-500"), point=attrs(timing,"marker-center-500"), outside=attrs(timing,"zone-501"), outsidePoint=attrs(timing,"marker-center-501");
  assert.equal(point.cx,success.x+success.width);assert.ok(outsidePoint.cx>outside.x+outside.width);
  assertLabels("timing-range",["中心は横500","中心は横501","成功!","範囲外","1の間隔を広げています"]);
  assertLabels("timing-state",["Space","300〜500","やり直す"]);
  assert.match(words(figure("examples/beginner/timing/tutorial.html","timing-state")),/やり直しはRキー/);
  assertLabels("typing-index",["番号0","番号1","番号2","入力済み3文字","全部入力できた"]);
  assertLabels("typing-key",["次の文字はc","入力済み1文字","入力済み0文字","次はcのまま"]);
  const typing=words(figure("examples/beginner/typing/tutorial.html","typing-index"));assert.match(typing,/3文字目.*0に戻ります/);
  const compare=illustration("number-compare"), low=attrs(compare,"guess-point-8"),high=attrs(compare,"guess-point-15"),answer=attrs(compare,"answer-8");
  assert.ok(low.cx<answer.x+answer.width/2);assert.ok(high.cx>answer.x+answer.width/2);
  assertLabels("number-compare",["もっと大きい","もっと小さい","正解!","説明用の正解"]);
  assertLabels("number-range",["9〜20が候補","9〜14が候補","自動表示するという意味ではありません"]);
});

test("中級3教材の図は、体・カード・お金の説明例と合う", () => {
  const move=illustration("snake-move"), grow=illustration("snake-grow");
  for(const x of [2,3,4]) assert.ok(attrs(move,`before-segment-${x}`));
  for(const x of [3,4,5]) assert.ok(attrs(move,`after-segment-${x}`));
  for(const x of [2,3,4,5]) assert.ok(attrs(grow,`after-segment-${x}`));
  assertLabels("snake-move",["長さ3のまま","横5・縦4","Canvasのピクセル位置ではありません"]);
  assertLabels("snake-grow",["長さ4","食べ物","しっぽを残す"]);
  assertLabels("memory-pair",["AとA","AとB","一致","不一致","1秒待って2枚を閉じる"]);
  assertLabels("memory-wait",["3枚目","1000ミリ秒","1秒","選べない"]);
  assertLabels("memory-position",["横410","縦245","番号6","幅100・高さ110","すき間"]);
  assertLabels("shop-money",["所持金100・在庫0","所持金40・在庫3","所持金110・在庫1"]);
  assertLabels("shop-product",["仕入れ20","売値35","在庫3個","オブジェクト"]);
  assert.match(words(figure("examples/intermediate/memory/tutorial.html","memory-pair")),/ステップ3では固定.*ステップ4では毎回混ぜます/);
});

test("上級4教材の図はクラス・値・手順の具体例と合う", () => {
  assertLabels("escape-classes",["RoomObject","横60・縦105","横300・縦130","unlocked","ventOpen"]);
  assertLabels("escape-flow",["241","ドライバー","換気口","鍵"]);
  assertLabels("escape-items",["間違えても消えない","鍵"]);
  assertLabels("tower-route",["横100・縦300","横300・縦300","横300・縦100"]);
  assertLabels("tower-range",["距離120","範囲内","距離121","範囲外"]);
  assertLabels("tower-money",["60 → 40 → 20 → 0","1基20","所持金0"]);
  assertLabels("card-effect",["前18","後12","行動力","攻撃6","最大30"]);
  assertLabels("card-turn",["行動力2","手札3枚","攻撃6","倒れた敵は行動しません"]);
  assertLabels("card-piles",["合計9枚","残り2枚も捨てた後","山札3・手札3・捨て札3"]);
  assertLabels("race-direction",["横142・縦110","横140・縦112","横138・縦110","Math.PI"]);
  assertLabels("race-checkpoints",["横660・縦110","横660・縦350","横140・縦350","横140・縦110","2周"]);
  assertLabels("race-classes",["Checkpoint","Car","横140・縦110","nextCheckpoint = 0","laps = 0"]);
  const card=read("examples/advanced/card-battle/complete/script.js"),tower=read("examples/advanced/tower-defense/complete/script.js"),race=read("examples/advanced/racing/complete/script.js");
  assert.match(card,/while \(hand\.length > 0\) discard\.push\(hand\.pop\(\)\)/);
  assert.match(tower,/distance <= 120/);assert.match(race,/Math\.hypot\(x - this\.x, y - this\.y\) <= 45/);
});
