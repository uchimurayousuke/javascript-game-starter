"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function unzipStored(buffer,count=3,flags=0){
 const eocd=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));assert.ok(eocd>=0);assert.equal(buffer.readUInt16LE(eocd+8),count);assert.equal(buffer.readUInt16LE(eocd+10),count);assert.equal(buffer.readUInt16LE(eocd+20),0);
 let pos=buffer.readUInt32LE(eocd+16);const files=new Map();
 for(let i=0;i<count;i++){
  assert.equal(buffer.readUInt32LE(pos),0x02014b50);assert.equal(buffer.readUInt16LE(pos+8),flags);assert.equal(buffer.readUInt16LE(pos+10),0);assert.equal(buffer.readUInt16LE(pos+12),0);assert.equal(buffer.readUInt16LE(pos+14),33);
  const checksum=buffer.readUInt32LE(pos+16),size=buffer.readUInt32LE(pos+24),nameLength=buffer.readUInt16LE(pos+28),extra=buffer.readUInt16LE(pos+30),comment=buffer.readUInt16LE(pos+32),local=buffer.readUInt32LE(pos+42),name=buffer.subarray(pos+46,pos+46+nameLength).toString("utf8");
  assert.equal(buffer.readUInt32LE(local),0x04034b50);assert.equal(buffer.readUInt16LE(local+6),flags);assert.equal(buffer.subarray(local+30,local+30+nameLength).toString("utf8"),name);const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28),data=buffer.subarray(start,start+size);assert.equal(crc32(data),checksum);assert.ok(!files.has(name));files.set(name,data);pos+=46+nameLength+extra+comment;
 }
 assert.equal(pos,eocd);return files;
}
test("ZIPにはLFにそろえたひな型3ファイルだけが直下に入る",()=>{
 const zip=fs.readFileSync(path.join(root,"downloads/my-game.zip")),files=unzipStored(zip);assert.deepEqual([...files.keys()],["index.html","style.css","script.js"]);
 for(const [name,data] of files){const expected=fs.readFileSync(path.join(root,"template",name),"utf8").replace(/\r\n?/g,"\n");assert.equal(data.toString("utf8"),expected,name);}
});
test("4つのページからひな型ZIPをダウンロードでき、入口から教材を開ける",()=>{
 for(const [file,zip] of [["教材を開く.html","downloads/my-game.zip"],["learning/index.html","../downloads/my-game.zip"],["learning/setup.html","../downloads/my-game.zip"],["tutorial/index.html","../downloads/my-game.zip"]]){
  const page=read(file);assert.ok(page.includes(`href="${zip}" download="my-game.zip"`),file);assert.ok(fs.existsSync(path.resolve(root,path.dirname(file),zip)),file);
 }
 const entry=read("教材を開く.html");for(const dest of ["learning/index.html","tutorial/index.html","examples/index.html","features/index.html"])assert.ok(entry.includes(`href="${dest}"`),dest);
 assert.doesNotMatch(entry,/<(?:canvas|iframe|object|embed|script)\b/i);assert.match(read("README.md"),/教材を開く\.html/);
 assert.match(read("learning/setup.html"),/1・2のコピーは不要/);assert.match(read("tutorial/index.html"),/手順2のコピーは不要/);
});
