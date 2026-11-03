"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function unzipStored(buffer,count=3,flags=0){
 const eocd=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));assert.ok(eocd>=0);assert.equal(buffer.readUInt16LE(eocd+8),count);assert.equal(buffer.readUInt16LE(eocd+10),count);assert.equal(buffer.readUInt16LE(eocd+20),0);
 let pos=buffer.readUInt32LE(eocd+16);const files=new Map();
 for(let i=0;i<count;i++){
  assert.equal(buffer.readUInt32LE(pos),0x02014b50);assert.equal(buffer.readUInt16LE(pos+4)>>>8,3);assert.equal(buffer.readUInt16LE(pos+8),flags);assert.equal(buffer.readUInt16LE(pos+10),0);assert.equal(buffer.readUInt16LE(pos+12),0);assert.equal(buffer.readUInt16LE(pos+14),33);assert.equal(buffer.readUInt32LE(pos+38),0o100644*65536);
  const checksum=buffer.readUInt32LE(pos+16),size=buffer.readUInt32LE(pos+24),nameLength=buffer.readUInt16LE(pos+28),extra=buffer.readUInt16LE(pos+30),comment=buffer.readUInt16LE(pos+32),local=buffer.readUInt32LE(pos+42),name=buffer.subarray(pos+46,pos+46+nameLength).toString("utf8");
  assert.equal(buffer.readUInt32LE(local),0x04034b50);assert.equal(buffer.readUInt16LE(local+6),flags);assert.equal(buffer.subarray(local+30,local+30+nameLength).toString("utf8"),name);const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28),data=buffer.subarray(start,start+size);assert.equal(crc32(data),checksum);assert.ok(!files.has(name));files.set(name,data);pos+=46+nameLength+extra+comment;
 }
 assert.equal(pos,eocd);return files;
}
test("ZIPにはLFにそろえたひな型3ファイルだけが直下に入る",()=>{
 const zip=fs.readFileSync(path.join(root,"downloads/my-game.zip")),files=unzipStored(zip);assert.deepEqual([...files.keys()],["index.html","style.css","script.js"]);
 for(const [name,data] of files){const expected=fs.readFileSync(path.join(root,"template",name),"utf8").replace(/\r\n?/g,"\n");assert.equal(data.toString("utf8"),expected,name);}
});
test("5つのページからひな型ZIPをダウンロードでき、入口から教材を開ける",()=>{
 for(const [file,zip] of [["index.html","downloads/my-game.zip"],["教材を開く.html","downloads/my-game.zip"],["learning/index.html","../downloads/my-game.zip"],["learning/setup.html","../downloads/my-game.zip"],["tutorial/index.html","../downloads/my-game.zip"]]){
  const page=read(file);assert.ok(page.includes(`href="${zip}" download="my-game.zip"`),file);assert.ok(fs.existsSync(path.resolve(root,path.dirname(file),zip)),file);
 }
 const entry=read("教材を開く.html");for(const dest of ["learning/index.html","tutorial/index.html","examples/index.html","features/index.html"])assert.ok(entry.includes(`href="${dest}"`),dest);
 assert.doesNotMatch(entry,/<(?:canvas|iframe|object|embed|script)\b/i);assert.match(read("README.md"),/https:\/\/uchimurayousuke\.github\.io\/javascript-game-starter\//);
 assert.match(read("learning/setup.html"),/展開したフォルダーを作業用にします/);assert.match(read("tutorial/index.html"),/ひな型のZIPを展開し、できたフォルダーを作業用にします/);
});
function directories(dir){return fs.readdirSync(dir,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>path.join(dir,x.name)).sort();}
function assetFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?assetFiles(path.join(dir,x.name)):[path.join(dir,x.name)]).sort();}
function normalized(file){return Buffer.from(fs.readFileSync(file,"utf8").replace(/\r\n?/g,"\n"),"utf8");}
test("98教材は準備欄から各教材に合う開始コードと画像を取得できる",()=>{
 const pages=[];
 for(const category of ["examples","features"])for(const level of directories(path.join(root,category)))for(const item of directories(level)){
  const tutorial=path.join(item,"tutorial.html");if(!fs.existsSync(tutorial))continue;
  pages.push({category,level:path.basename(level),name:path.basename(item),item,page:tutorial,extension:false});
  if(category==="examples")pages.push({category,level:path.basename(level),name:path.basename(item),item,page:path.join(item,"extensions/tutorial.html"),extension:true});
 }
 assert.equal(pages.filter(p=>p.category==="examples"&&!p.extension).length,31);
 assert.equal(pages.filter(p=>p.extension).length,31);
 assert.equal(pages.filter(p=>p.category==="features").length,36);
 const zipNames=new Set();let imageFeatures=0;
 for(const entry of pages){
  const {page,item,extension,category,level,name}=entry,html=fs.readFileSync(page,"utf8"),section=html.match(/<section><h2>始める前に<\/h2>([\s\S]*?)<\/section>/);
  assert.ok(section,`準備欄: ${page}`);
  const block=section[1].match(/<div class="starter-download">([\s\S]*?)<\/div>/);assert.ok(block,`ZIP案内: ${page}`);
  const link=block[1].match(/<a class="download-link" href="([^"]+)" download="([^"]+)">/);assert.ok(link,`ZIPリンク: ${page}`);
  const stylesheet=html.match(/<link rel="stylesheet" href="([^"]*starter\.css)">/);assert.ok(stylesheet);assert.equal(path.resolve(path.dirname(page),stylesheet[1]),path.join(root,"downloads/starter.css"));
  const assets=path.join(item,"complete/assets"),hasAssets=category==="features"&&fs.existsSync(assets);
  if(hasAssets)imageFeatures++;
  const zip=extension?`starters/example-${level}-${name}-extension.zip`:hasAssets?`starters/feature-${level}-${name}.zip`:"my-game.zip";
  const zipPath=path.join(root,"downloads",zip);assert.equal(path.resolve(path.dirname(page),link[1]),zipPath);assert.equal(link[2],path.basename(zipPath));zipNames.add(zip);
  assert.match(block[1],/ZIPを展開してできたフォルダーでindex\.htmlを開きます/);assert.match(block[1],/ZIPには.*3ファイル/);
  if(extension)assert.match(block[1],/基本編の完成版から始めます/);
  if(hasAssets)assert.match(block[1],/3ファイルと画像が入っています/);
  const source=extension?path.join(item,"complete"):path.join(root,"template"),images=hasAssets?assetFiles(assets):[];
  const files=unzipStored(fs.readFileSync(zipPath),3+images.length);
  const expected=new Map([...["index.html","style.css","script.js"].map(file=>[file,normalized(path.join(source,file))]),...images.map(file=>["assets/"+path.relative(assets,file).split(path.sep).join("/"),fs.readFileSync(file)])]);
  assert.deepEqual([...files.keys()].sort(),[...expected.keys()].sort(),page);
  for(const [file,data] of expected)assert.deepEqual(files.get(file),data,`${page}: ${file}`);
 }
 assert.equal(imageFeatures,6);assert.equal(zipNames.size,38);
});
test("コインキャッチ・文法・デバッグのZIPは見本の開始ファイルと一致する",()=>{
 const cases=[
  {zip:"coin-catch-complete.zip",source:"tutorial/05-game",pages:["tutorial/extensions/tutorial.html","learning/combine/tutorial.html"]},
  {zip:"basics-demo.zip",source:"learning/basics/demo",pages:["learning/basics/css.html","learning/basics/html.html"]},
  ...["syntax","name","input","score","reset","image"].map(name=>({zip:`debug-${name}.zip`,source:`learning/debug/${name}/broken`,pages:["learning/debug/index.html"],section:name}))
 ];
 assert.equal(cases.length,8);
 for(const item of cases){
  const source=path.join(root,item.source),assets=path.join(source,"assets"),images=fs.existsSync(assets)?assetFiles(assets):[];
  const zipPath=path.join(root,"downloads/starters",item.zip),files=unzipStored(fs.readFileSync(zipPath),3+images.length);
  const expected=new Map([...["index.html","style.css","script.js"].map(file=>[file,normalized(path.join(source,file))]),...images.map(file=>["assets/"+path.relative(assets,file).split(path.sep).join("/"),fs.readFileSync(file)])]);
  assert.deepEqual([...files.keys()].sort(),[...expected.keys()].sort(),item.zip);
  for(const [file,data] of expected)assert.deepEqual(files.get(file),data,`${item.zip}: ${file}`);
  for(const page of item.pages){
   const html=read(page),area=item.section?html.match(new RegExp(`<section id="${item.section}">[\\s\\S]*?<\\/section>`))?.[0]:html;assert.ok(area,`${page}: ${item.section}`);
   const links=[...area.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*download="([^"]+)"/g)].filter(m=>m[2]===item.zip);assert.equal(links.length,1,page);
   assert.equal(path.resolve(root,path.dirname(page),links[0][1]),zipPath);
  }
 }
 const combine=read("learning/combine/tutorial.html"),image=combine.match(/<a href="([^"]+)" download="coin\.png">/);assert.ok(image);
 assert.deepEqual(fs.readFileSync(path.resolve(root,"learning/combine",image[1])),fs.readFileSync(path.join(root,"learning/combine/step4/assets/coin.png")));
});
