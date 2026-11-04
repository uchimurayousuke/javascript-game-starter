"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8").replace(/\r\n/g,"\n");
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g,v=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#x27;":"'","&#39;":"'"})[v]);
const blocks=(page,kind)=>[...read(page).matchAll(new RegExp(`<pre data-kind="${kind}"(?: data-expected="([^"]+)")?(?: class="task-code")?><code(?: data-code-example)?>([\\s\\S]*?)</code></pre>`,"g"))].map(m=>({expected:m[1]?JSON.parse(decode(m[1])):null,code:decode(m[2])}));
test("JavaScriptのConsole例はすべて独立してひな型のstartで実行できる",()=>{
 const samples=blocks("learning/basics/javascript.html","js-start");assert.ok(samples.length>=15);
 for(const [i,sample] of samples.entries()){
  const logs=[],template=read("template/script.js"),script=template.replace("function start() {\n}",`function start() {\n${sample.code}\n}`);assert.notEqual(script,template);
  const context=vm.createContext({document:{querySelector:()=>({width:800,height:450,getContext:()=>({clearRect(){}})})},requestAnimationFrame(){},console:{log:(...values)=>logs.push(JSON.parse(JSON.stringify(values)))}});
  vm.runInContext(script,context);assert.deepEqual(logs,sample.expected,`例 ${i+1}`);
 }
});
test("乱数の例は0以上1未満を0・1・2へ対応させる",()=>{
 const samples=blocks("learning/basics/javascript.html","js-start-random");assert.equal(samples.length,1);
 for(const [random,expected] of [[0,0],[0.5,1],[0.8,2],[0.999999,2]]){
  const logs=[],math=Object.create(Math);math.random=()=>random;const template=read("template/script.js"),script=template.replace("function start() {\n}",`function start() {\n${samples[0].code}\n}`);
  const context=vm.createContext({document:{querySelector:()=>({width:800,height:450,getContext:()=>({clearRect(){}})})},requestAnimationFrame(){},Math:math,console:{log:value=>logs.push(value)}});vm.runInContext(script,context);assert.deepEqual(logs,[expected]);
 }
});
test("見本のHTMLとボタンのコードは掲載したものと同じで、操作で得点が変わる",()=>{
 const html=blocks("learning/basics/html.html","html-file"),scripts=blocks("learning/basics/javascript.html","js-file");assert.equal(html.length,1);assert.equal(scripts.length,1);assert.equal(html[0].code,read("learning/basics/demo/index.html").trim());assert.equal(scripts[0].code,read("learning/basics/demo/script.js").trim());
 const events={},button={addEventListener:(type,callback)=>events[type]=callback},score={textContent:"0"};const context=vm.createContext({document:{querySelector:s=>s==="#add"?button:s==="#score"?score:null}});vm.runInContext(scripts[0].code,context);assert.equal(score.textContent,"0");events.click();assert.equal(Number(score.textContent),1);events.click();assert.equal(Number(score.textContent),2);
 const page=read("learning/basics/demo/index.html");for(const name of ["style.css","script.js","assets/coin.png"])assert.ok(page.includes(name)&&fs.existsSync(path.join(root,"learning/basics/demo",name)),name);
});
test("CSSの例は用途を明示し、見本と対応する",()=>{
 const samples=blocks("learning/basics/css.html","css-demo");assert.equal(samples.length,3);const css=read("learning/basics/demo/style.css");for(const sample of samples)for(const [,selector,declarations] of sample.code.matchAll(/([^{}]+)\{([^{}]+)\}/g)){const found=[...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].find(m=>m[1].trim()===selector.trim());assert.ok(found,selector);for(const declaration of declarations.split(";").map(x=>x.trim()).filter(Boolean))assert.ok(found[2].includes(declaration),declaration);}
});
const figSpecs=[
 ["html.html","tags","html-nesting",800],["html.html","document","html-document",850],["html.html","paths","html-paths",880],
 ["css.html","rules","css-rules",850],["css.html","box","css-box",850],["css.html","layout","css-layout",1010],["css.html","position","css-position",820],["css.html","cascade","css-cascade",960],
 ["javascript.html","values","js-variables",800],["javascript.html","values","js-number-string",960],["javascript.html","conditions","js-conditions",800],["javascript.html","loops","js-loop",860],["javascript.html","functions","js-function",830],["javascript.html","arrays","js-array",1010],["javascript.html","copies","js-reference",1220],["javascript.html","events","js-callback",880],["javascript.html","objects","js-object",810]
];
test("17図は該当の節にあり、代替文と拡大リンクとSVG寸法が一致する",()=>{
 for(const [file,section,name,height] of figSpecs){
  const page=read(`learning/basics/${file}`),part=page.match(new RegExp(`<section id="${section}">[\\s\\S]*?</section>`));assert.ok(part,section);const figure=part[0].match(new RegExp(`<figure class="learning-diagram" id="syntax-${name}"[\\s\\S]*?</figure>`));assert.ok(figure,name);
  const img=figure[0].match(/<img src="([^"]+)" width="(\d+)" height="(\d+)" alt="([^"]+)">/);assert.ok(img);assert.ok(img[4].length>10);assert.deepEqual(img.slice(2,4),["1200",String(height)]);assert.ok(figure[0].includes(`href="${img[1]}" target="_blank" rel="noopener"`));assert.match(figure[0],/class="diagram-scroll" role="region" tabindex="0"/);
  const asset=path.resolve(root,"learning/basics",img[1]);assert.equal(asset,path.resolve(root,`tutorial/illustrations/astra/${name}.svg`));const source=fs.readFileSync(asset,"utf8");assert.match(source,new RegExp(`viewBox="0 0 1200 ${height}"`));assert.match(source,/<title\b[^>]*>[^<]+<\/title>/);assert.match(source,/<desc\b[^>]*>[^<]+<\/desc>/);assert.doesNotMatch(source,/(?:href|src)="(?:https?:|\/\/)/i);
 }
 const array=read("learning/basics/javascript.html").match(/<figure class="learning-diagram" id="syntax-js-array"[\s\S]*?<\/figure>/)[0];assert.match(array,/alt="[^"]*追加[^"]*取り出す[^"]*"/);
});
