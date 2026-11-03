"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),zlib=require("node:zlib");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const attribute=(markup,name)=>{const match=markup.match(new RegExp(`\\b${name}="([^"]*)"`));assert.ok(match,`${name}: ${markup}`);return match[1];};
const absolute=(page,relative)=>path.resolve(root,path.dirname(page),relative);
function pngCheck(file){
 const bytes=fs.readFileSync(file),signature=Buffer.from([137,80,78,71,13,10,26,10]);
 assert.deepEqual(bytes.subarray(0,8),signature,file);
 let offset=8,width=0,height=0,finished=false;const data=[];
 while(offset+12<=bytes.length){
  const size=bytes.readUInt32BE(offset),type=bytes.toString("ascii",offset+4,offset+8),end=offset+12+size;
  assert.ok(end<=bytes.length,`truncated PNG: ${file}`);
  if(type==="IHDR"){assert.equal(size,13);width=bytes.readUInt32BE(offset+8);height=bytes.readUInt32BE(offset+12);}
  if(type==="IDAT")data.push(bytes.subarray(offset+8,offset+8+size));
  offset=end;if(type==="IEND"){finished=true;break;}
 }
 assert.ok(width>=200&&height>=100,`small PNG: ${file}`);assert.ok(finished&&offset===bytes.length,`incomplete PNG: ${file}`);
 assert.ok(zlib.inflateSync(Buffer.concat(data)).length>0,`empty PNG: ${file}`);
}
test("作例と共通機能の完成版ごとに対応する68枚の画像がある",()=>{
 const seen=new Set();
 for(const [category,count] of [["examples",31],["features",36]]){
  const page=`${category}/index.html`,html=read(page),cards=[...html.matchAll(/<article>([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length,count,page);
  for(const [,card] of cards){
   const image=card.match(/<img\b[^>]*>/),link=card.match(/<a\b[^>]*href="([^"]+\/complete\/index\.html)"/);
   assert.ok(image&&link,`画像または完成版がない: ${page}`);assert.match(card,/<h3>[^<]+<\/h3>/);
   const expected=`${category}-${link[1].replace(/\/complete\/index\.html$/,"").replaceAll("/","-")}.png`;
   const src=attribute(image[0],"src"),file=absolute(page,src);assert.equal(path.basename(file),expected);assert.ok(fs.existsSync(absolute(page,link[1])));
   assert.equal(attribute(image[0],"alt"),"");assert.ok(!seen.has(file));seen.add(file);pngCheck(file);
  }
 }
 const page="examples/index.html",feature=read(page).match(/<section class="catalog-feature">([\s\S]*?)<\/section>/);
 assert.ok(feature);assert.match(feature[1],/コインキャッチ/);assert.match(feature[1],/href="\.\.\/tutorial\/05-game\/index\.html"/);
 const image=feature[1].match(/<img\b[^>]*>/);assert.ok(image);const file=absolute(page,attribute(image[0],"src"));
 assert.equal(path.basename(file),"examples-beginner-coin-catch.png");assert.ok(fs.existsSync(absolute(page,"../tutorial/05-game/index.html")));assert.ok(!seen.has(file));seen.add(file);pngCheck(file);
 const directory=path.join(root,"tutorial/catalog-thumbnails"),files=fs.readdirSync(directory).filter(f=>f.endsWith(".png")).map(f=>path.join(directory,f));
 assert.equal(seen.size,68);assert.deepEqual([...seen].sort(),files.sort());
});
test("両方の入口の3ルートと工房の絵が同じ行き先に対応する",()=>{
 const routes=new Map([["route-grammar.svg","learning/basics.html"],["route-games.svg","examples/index.html"],["route-features.svg","features/index.html"]]);
 const art=new Set();
 for(const page of ["教材を開く.html","learning/index.html"]){
  const html=read(page),hero=html.match(/<div class="workshop-hero">([\s\S]*?)<\/div>\s*<nav class="workshop-routes"/);assert.ok(hero,page);
  const heroImage=hero[1].match(/<img\b[^>]*>/);assert.ok(heroImage);const heroFile=absolute(page,attribute(heroImage[0],"src"));
  assert.equal(path.basename(heroFile),"workshop-hero.svg");assert.equal(attribute(heroImage[0],"alt"),"");art.add(heroFile);
  const nav=html.match(/<nav class="workshop-routes"[^>]*>([\s\S]*?)<\/nav>/);assert.ok(nav);assert.ok(attribute(nav[0],"aria-label"));
  const links=[...nav[1].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];assert.equal(links.length,3,page);
  const found=new Set();
  for(const [,tag,content] of links){
   const image=content.match(/<img\b[^>]*>/);assert.ok(image);assert.match(content,/<strong>[^<]+<\/strong>/);
   const imageFile=absolute(page,attribute(image[0],"src")),name=path.basename(imageFile);assert.ok(routes.has(name));assert.ok(!found.has(name));found.add(name);art.add(imageFile);
   assert.equal(absolute(page,attribute(tag,"href")),path.join(root,routes.get(name)));assert.equal(attribute(image[0],"alt"),"");
   assert.ok(fs.existsSync(imageFile));assert.ok(fs.existsSync(path.join(root,routes.get(name))));
  }
 }
 assert.equal(art.size,4);
 for(const file of art){const svg=fs.readFileSync(file,"utf8");assert.match(svg,/<svg\b[^>]*\bviewBox="0 0 \d+ \d+"/);assert.match(svg,/<title\b[^>]*>[^<]+<\/title>/);assert.match(svg,/<desc\b[^>]*>[^<]+<\/desc>/);assert.doesNotMatch(svg,/<(?:script|image)\b/i);}
});
