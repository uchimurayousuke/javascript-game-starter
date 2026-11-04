"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const pages=["tutorial/index.html","tutorial/extensions/tutorial.html","examples/index.html","features/index.html",...files(path.join(root,"examples")).filter(p=>p.endsWith("tutorial.html")),...files(path.join(root,"features")).filter(p=>p.endsWith("tutorial.html")),"learning/index.html","learning/setup.html","learning/basics.html","learning/basics/html.html","learning/basics/css.html","learning/basics/javascript.html","learning/debug/index.html","learning/combine/tutorial.html","learning/practice.html","learning/project.html"].map(p=>path.resolve(root,p));
test("すべての教材に本文への移動と、同じページ内の目次がある",()=>{
 assert.equal(new Set(pages).size,118);
 for(const p of pages){const page=fs.readFileSync(p,"utf8"),id=path.relative(root,p);assert.match(page,/class="lesson-page/);assert.match(page,/learning-layout\.css/);assert.match(page,/class="(?:lesson-skip|skip-link)" href="#[^"]+"/);assert.match(page,/<main id="lesson-main" tabindex="-1">/);assert.match(page,/class="lesson-breadcrumb" aria-label="今いる場所"/);
  const nav=page.match(/<nav (?:id="contents"|aria-label="このページの目次")[\s\S]*?<\/nav>/);assert.ok(nav,id);const ids=new Set([...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));const links=[...nav[0].matchAll(/href="#([^"]+)"/g)];assert.ok(links.length>=2,id);for(const [,target] of links)assert.ok(ids.has(target),`${id}: ${target}`);
 }
});
test("各図は元SVGを別タブで開け、ヒントや答えは閉じた状態",()=>{
 let count=0;for(const p of pages){const page=fs.readFileSync(p,"utf8");for(const [,figure] of page.matchAll(/(<figure class="learning-diagram"[\s\S]*?<\/figure>)/g)){count++;const image=figure.match(/<img[^>]*\bsrc="([^"]+\.svg)"/);assert.ok(image,p);assert.ok(figure.includes(`href="${image[1]}" target="_blank" rel="noopener"`),p);assert.match(figure,/alt="[^"]+"/);assert.doesNotMatch(figure,/図[はを]横にスクロールできます/);}
  const id=path.relative(root,p).split(path.sep).join("/");
  const guide=/<div class="change-guide"><details(?: open)?><summary>コードの比較の読み方<\/summary>/g;
  if(id.startsWith("features/")&&id.endsWith("/tutorial.html"))assert.equal([...page.matchAll(guide)].length,1,p);
  const otherDetails=page.replace(guide,'<div class="change-guide"><details><summary>コードの比較の読み方</summary>');
  for(const [,tag] of otherDetails.matchAll(/(<details\b[^>]*>)/g))assert.doesNotMatch(tag,/\bopen\b/,p);
 }assert.ok(count>=100);
});

test("狭い画面の目次は閉じたまま、広い画面と同じ節へ移動できる",()=>{
 for(const p of pages){const page=fs.readFileSync(p,"utf8");const mobile=page.match(/<details class="lesson-mobile-toc"><summary>このページの目次を開く<\/summary><nav[^>]*>([\s\S]*?)<\/nav><\/details>/);assert.ok(mobile,p);const desktop=page.match(/<nav (?:id="contents"|aria-label="このページの目次")[^>]*>([\s\S]*?)<\/nav>/g);assert.ok(desktop&&desktop.length>=2,p);const hrefs=html=>[...html.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(hrefs(mobile[1]),hrefs(desktop[desktop.length-1]),p);}
});
