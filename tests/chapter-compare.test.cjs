"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),compareDir=path.join(root,"tutorial/compare"),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const engine=require("../tutorial/compare/diff.js");
const chapters=JSON.parse(read("tutorial/compare/chapters.json"));
const sandbox={};vm.runInNewContext(read("tutorial/compare/references.js"),sandbox);const data=sandbox.CHAPTER_REFERENCES;
test("全325ステップのリンクと終了時の見本データが、それぞれ正しいファイルを指す",()=>{
 assert.equal(chapters.length,325);assert.equal(data.length,325);assert.equal(new Set(chapters.map(c=>c.id)).size,325);
 const byPage=new Map();
 for(let i=0;i<chapters.length;i++){
  const c=chapters[i],d=data[i];assert.equal(d.id,c.id);assert.equal(d.title,c.title);assert.equal(d.chapter,c.chapter);assert.equal(d.stepLabel,c.stepLabel);assert.equal(JSON.stringify(d.expectations),JSON.stringify(c.expectations));assert.ok(c.expectations.length);
  for(const f of ["index.html","style.css","script.js"])assert.equal(d.files[f],read(c.sources[f]),`${c.id} ${f}`);
  const folder=path.posix.dirname(c.sources["script.js"]);assert.equal(c.game,`${folder}/index.html`);assert.ok(fs.existsSync(path.join(root,c.game)));
  const addedFeatures=new Set(["beginner/score-combo","beginner/lives","beginner/dialog","beginner/input-edges","intermediate/timer","intermediate/inventory","intermediate/spawner","intermediate/invincibility","advanced/tilemap","advanced/enemy-ai","advanced/hit-effects","advanced/save-file"].map(name=>`features/${name}/tutorial.html`));
  const base=addedFeatures.has(c.page)?folder:c.page.startsWith("tutorial/")||c.page==="learning/combine/tutorial.html"?"tutorial/05-game":c.page==="learning/debug/index.html"?folder:"template";
  assert.equal(c.sources["index.html"],`${base}/index.html`);assert.equal(c.sources["style.css"],`${base}/style.css`);
  const page=read(c.page);assert.ok(page.includes(`id="${c.anchor}"`),c.id);const parts=[...page.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];const chosen=parts.filter(m=>m[0].includes(`?chapter=${c.id}"`));assert.equal(chosen.length,1,c.id);
  const open=chosen[0][0].match(/^<section\b[^>]*>/)[0],sectionId=open.match(/\bid="([^"]+)"/),previous=page.slice(0,chosen[0].index).match(/<span class="toc-anchor" id="([^"]+)"><\/span>\s*$/);assert.equal(sectionId?sectionId[1]:previous&&previous[1],c.anchor,c.id);
  const heading=chosen[0][0].match(/<h2[^>]*>([\s\S]*?)<\/h2>/);assert.ok(heading,c.id);assert.equal(heading[1].replace(/<[^>]+>/g,"").replace(/&amp;/g,"&"),c.chapter,c.id);
  if(c.page!=="learning/debug/index.html"){
   const confirmation=chosen[0][0].match(/<h3[^>]*>[^<]*保存[^<]*(?:確認|確かめ)[^<]*<\/h3>([\s\S]*?)(?=<h3|<\/section>)/);assert.ok(confirmation,c.id);
   const plain=confirmation[1].replace(/<[^>]+>/g,"").replace(/&(?:amp|lt|gt|quot|#39|#x27);/g,x=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'","&#x27;":"'"}[x])).replace(/\s+/g," ");
   for(const expected of c.expectations)assert.ok(plain.includes(expected.replace(/\s+/g," ")),`${c.id}: ${expected}`);
   assert.match(c.stepLabel,/^ステップ [0-9]+/);
   assert.ok(chosen[0][0].includes("このステップ終了時の見本と自分のコードを比べる"));
  }else {assert.match(c.stepLabel,/^修正版：/);assert.equal(c.expectationSource,"練習問題と修正版");assert.ok(chosen[0][0].includes("この練習の修正版と自分のコードを比べる"));}
  const num=heading[1].match(/^ステップ ([0-9]+)/);if(num)assert.equal(path.posix.basename(folder),`step${num[1]}`,c.id);
  const stage=chosen[0][0].match(/data-stage="([^"]+)"/);if(stage)assert.equal(path.posix.basename(folder),stage[1],c.id);
  const coin=chosen[0][0].match(/data-step="([^"]+)"/);if(coin)assert.equal(path.posix.basename(folder),coin[1],c.id);
  const p=byPage.get(c.page)||[];p.push(c.id);byPage.set(c.page,p);
 }
 assert.equal(byPage.size,94);
 for(const [page,ids] of byPage){const links=[...read(page).matchAll(/class="chapter-compare-link"><a href="[^"]+\?chapter=([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(links,ids,page);}
});
test("削除・追加・変更と行番号を区別し、繰り返し行も崩さない",()=>{
 let r=engine.compare("a\nx\nb","a\nb");assert.deepEqual(r.rows.map(x=>x.kind),["same","own","same"]);assert.equal(r.rows[1].own.number,2);assert.equal(r.rows[2].ref.number,2);
 r=engine.compare("a\nb","a\nx\nb");assert.deepEqual(r.rows.map(x=>x.kind),["same","reference","same"]);assert.equal(r.rows[1].ref.number,2);
 r=engine.compare("a\nred\nb","a\nblue\nb");assert.deepEqual(r.rows.map(x=>x.kind),["same","changed","same"]);assert.equal(r.rows[1].own.number,2);assert.equal(r.rows[1].ref.number,2);
 r=engine.compare("x\nx\ny","x\ny");assert.deepEqual(r.rows.map(x=>x.kind),["same","own","same"]);assert.deepEqual(engine.changedParts("a😀z","a😁z"),{start:1,endA:3,endB:3});
});
test("改行と最後の改行を吸収し、文字列内の空白と空白行を消さない",()=>{
 assert.equal(engine.compare("a\r\nb\r\n","a\nb").identical,true);assert.equal(engine.compare("","").identical,true);
 let r=engine.compare("  let x = 1;  \n}","let x = 1;\n }",{type:"script.js",ignoreWhitespace:true});assert.equal(r.identical,true);assert.equal(r.ignoredWhitespace,true);
 r=engine.compare('const x = "a b";','const x = "ab";',{type:"script.js",ignoreWhitespace:true});assert.equal(r.identical,false);
 r=engine.compare('  ctx.fillText("移動 / R: 再開", 1, 2);\n  x = width / 2;','ctx.fillText("移動 / R: 再開", 1, 2);\nx = width / 2;',{type:"script.js",ignoreWhitespace:true});assert.equal(r.identical,true);assert.equal(r.ignoredWhitespace,true);
 r=engine.compare('  ctx.fillText("移動 / R: 再開", 1, 2);','ctx.fillText("移動 / R:再開", 1, 2);',{type:"script.js",ignoreWhitespace:true});assert.equal(r.identical,false);
 r=engine.compare('  const re = /"x"/;','const re = /"x"/;',{type:"script.js",ignoreWhitespace:true});assert.equal(r.whitespaceUnavailable,true);
 r=engine.compare("const x = `a\n b \n`;","const x = `a\nb\n`;",{type:"script.js",ignoreWhitespace:true});assert.equal(r.identical,false);assert.equal(r.whitespaceUnavailable,true);
 r=engine.compare("a\n\nb","a\nb",{type:"script.js",ignoreWhitespace:true});assert.equal(r.identical,false);
 r=engine.compare("a\n\nb","a\nb",{type:"script.js",ignoreBlankLines:true});assert.equal(r.identical,true);assert.equal(r.rows[1].own.number,3);assert.equal(r.rows[1].ref.number,2);
 r=engine.compare("const x = `a\n\nb`;","const x = `a\nb`;",{type:"script.js",ignoreBlankLines:true});assert.equal(r.identical,false);assert.equal(r.whitespaceUnavailable,true);
 r=engine.compare("  <p>x</p>","<p>x</p>",{type:"index.html",ignoreWhitespace:true});assert.equal(r.whitespaceUnavailable,true);assert.equal(r.identical,false);
});
test("上限内の600行を比較でき、過大入力と長い1行は拒否する",()=>{
 const a=Array.from({length:600},(_,i)=>`行${i%7}`).join("\n"),b=Array.from({length:600},(_,i)=>`行${(i+3)%7}`).join("\n");assert.ok(engine.compare(a,b).rows.length>=600);
 assert.throws(()=>engine.compare("x\n".repeat(601),""),/600行/);assert.throws(()=>engine.compare("x".repeat(3001),""),/3000文字/);assert.throws(()=>engine.compare("x".repeat(122881),""),/文字数/);
});
test("繰り返しと複数の変更があっても、両側の行と行番号を失わない",()=>{
 let seed=91;const next=()=>{seed=(seed*1664525+1013904223)>>>0;return seed;};
 for(let trial=0;trial<80;trial++){
  const a=Array.from({length:next()%25+1},()=>`項目${next()%5}`),b=Array.from({length:next()%25+1},()=>`項目${next()%5}`),rows=engine.compare(a.join("\n"),b.join("\n")).rows;
  assert.deepEqual(rows.filter(r=>r.own).map(r=>r.own.text),a);assert.deepEqual(rows.filter(r=>r.ref).map(r=>r.ref.text),b);
  assert.deepEqual(rows.filter(r=>r.own).map(r=>r.own.number),a.map((_,i)=>i+1));assert.deepEqual(rows.filter(r=>r.ref).map(r=>r.ref.number),b.map((_,i)=>i+1));
 }
});
class Element {
 constructor(tag="div"){this.tag=tag;this.children=[];this.listeners={};this.attributes={};this.hidden=false;this.disabled=false;this.checked=false;this.value="";this.files=[];this._text="";}
 set textContent(value){this._text=String(value);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join("");}
 set innerHTML(value){throw Error("HTMLを解釈しない");}
 append(...nodes){for(const node of nodes){if(node.tag==="#fragment")this.children.push(...node.children);else this.children.push(node);}}
 replaceChildren(...nodes){this._text="";this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attributes[k]=String(v);}removeAttribute(k){delete this.attributes[k];this[k]="";}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 focus(){this.focused=true;}
 fire(type){return Promise.all((this.listeners[type]||[]).map(fn=>fn({target:this})));}
}
function ui(query=""){
 const ids=["chapter","file-kind","file-input","own-code","ignore-space","ignore-blank","differences-only","compare-button","status","result","diff-output","result-count","chapter-description","back-link","game-link","result-game-link","matching-help","step-context","expectation-heading","step-expectations"], elements=Object.fromEntries(ids.map(id=>[id,new Element()]));elements["file-kind"].value="script.js";
 const document={getElementById:id=>elements[id],createElement:tag=>new Element(tag),createTextNode:text=>{const n=new Element("#text");n.textContent=text;return n;},createDocumentFragment:()=>new Element("#fragment")};
 const context=vm.createContext({document,window:{location:{search:query}},URLSearchParams,Uint16Array,Map,console});
 vm.runInContext(read("tutorial/compare/references.js"),context);vm.runInContext(read("tutorial/compare/diff.js"),context);vm.runInContext(read("tutorial/compare/compare.js"),context);
 return elements;
}
function every(node,fn){fn(node);node.children.forEach(child=>every(child,fn));}
test("章指定と種類別データ、入力更新、危険な文字列を文字として扱う",async()=>{
 const c=chapters[0],e=ui(`?chapter=${c.id}`);assert.equal(e.chapter.value,c.id);assert.match(e["chapter-description"].textContent,new RegExp(c.chapter));assert.ok(e["back-link"].href.includes(c.anchor));assert.ok(e["game-link"].href.includes(c.game));
 await e["compare-button"].fire("click");assert.match(e.status.textContent,/選ぶか/);
 e["own-code"].value='<img src=x onerror="alert(1)">';await e["own-code"].fire("input");await e["compare-button"].fire("click");assert.equal(e.result.hidden,false);assert.equal(e["differences-only"].checked,true);assert.equal(e.result.focused,true);assert.match(e["diff-output"].textContent,/<img src=x/);every(e["diff-output"],n=>assert.notEqual(n.tag,"img"));
 e["own-code"].value=data[0].files["script.js"];await e["own-code"].fire("input");assert.equal(e.result.hidden,true);await e["compare-button"].fire("click");assert.match(e.status.textContent,/見本と同じ/);assert.equal(e["matching-help"].hidden,false);assert.equal(e["diff-output"].children.length,0);e["differences-only"].checked=false;await e["differences-only"].fire("change");assert.ok(e["diff-output"].children.length>0);
 e["file-kind"].value="style.css";await e["file-kind"].fire("change");assert.equal(e.result.hidden,true);assert.equal(e["own-code"].value,"");await e["compare-button"].fire("click");assert.match(e.status.textContent,/style.css/);
 const invalid=ui("?chapter=missing");assert.match(invalid.status.textContent,/見つかりません/);assert.equal(invalid["game-link"].hidden,true);
});
test("コインのステップ03とデバッグ修正版は、それぞれの終了時点を表示する",()=>{
 const coin=chapters.find(c=>c.id==="tutorial-index-html-03-input"),view=ui(`?chapter=${coin.id}`);
 assert.match(view["chapter-description"].textContent,/ステップ 03/);assert.match(view["step-expectations"].textContent,/移動し、離すと止まります/);assert.match(view["step-expectations"].textContent,/得点はまだ増えません/);assert.equal(view["step-context"].hidden,false);
 const debug=chapters.find(c=>c.id==="learning-debug-index-html-input"),practice=ui(`?chapter=${debug.id}`);assert.match(practice["chapter-description"].textContent,/修正版/);assert.match(practice["expectation-heading"].textContent,/練習の修正版/);assert.match(practice["step-expectations"].textContent,/100から110/);assert.match(practice["game-link"].textContent,/修正版/);
});
test("種類違い、空ファイル、失敗、古い読込結果と入力超過を扱う",async()=>{
 const c=chapters[0],e=ui(`?chapter=${c.id}`);let called=0;
 e["file-input"].files=[{name:"style.css",size:1,text:()=>{called++;return Promise.resolve("x");}}];await e["file-input"].fire("change");assert.equal(called,0);assert.match(e.status.textContent,/種類/);
 e["file-input"].files=[{name:"script.js",size:0,text:async()=>""}];await e["file-input"].fire("change");await e["compare-button"].fire("click");assert.match(e.status.textContent,/違い/);
 e["file-input"].files=[{name:"script.js",size:1,text:async()=>{throw Error("bad");}}];await e["file-input"].fire("change");assert.match(e.status.textContent,/読み込めません/);
 e["file-input"].files=[{name:"script.js",size:123000,text:()=>{throw Error("読まない");}}];await e["file-input"].fire("change");assert.match(e.status.textContent,/大きすぎ/);
 let resolve;const slow=new Promise(r=>{resolve=r;});e["file-input"].files=[{name:"script.js",size:1,text:()=>slow}];const waiting=e["file-input"].fire("change");e["file-kind"].value="index.html";await e["file-kind"].fire("change");resolve("古いコード");await waiting;assert.equal(e["own-code"].value,"");assert.equal(e.result.hidden,true);
 let resolveChapter;const delayed=new Promise(r=>{resolveChapter=r;});e["file-input"].files=[{name:"index.html",size:1,text:()=>delayed}];const chapterRead=e["file-input"].fire("change");e.chapter.value=chapters[1].id;await e.chapter.fire("change");resolveChapter("前の章のコード");await chapterRead;assert.equal(e["own-code"].value,"");assert.ok(e["game-link"].href.includes(chapters[1].game));
 let resolveText;const delayedText=new Promise(r=>{resolveText=r;});e["file-input"].files=[{name:"index.html",size:1,text:()=>delayedText}];const inputRead=e["file-input"].fire("change");e["own-code"].value="新しく入力";await e["own-code"].fire("input");resolveText("前のファイル");await inputRead;assert.equal(e["own-code"].value,"新しく入力");
 e["own-code"].value="x\n".repeat(601);await e["own-code"].fire("input");await e["compare-button"].fire("click");assert.match(e.status.textContent,/600行/);
});
test("比較ページはローカルのスクリプトだけを読み、教材のコードを実行・送信しない",()=>{
 const html=read("tutorial/compare/index.html"),scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(scripts,["references.js","diff.js","compare.js"]);for(const f of scripts)assert.ok(fs.existsSync(path.join(compareDir,f)));const js=read("tutorial/compare/compare.js");assert.doesNotMatch(js,/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|eval|Function)\b/);assert.doesNotMatch(js,/innerHTML/);
});
