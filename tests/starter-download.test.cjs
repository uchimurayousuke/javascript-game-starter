"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const {makeShortcut,makeZip}=require("../downloads/shortcut.js");
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
test("4つのページからZIPを同じ名前でダウンロードし、共通ショートカットを使う",()=>{
 for(const [file,zip,script,key] of [["教材を開く.html","downloads/my-game.zip","downloads/shortcut.js","entry"],["learning/index.html","../downloads/my-game.zip","../downloads/shortcut.js","learning"],["learning/setup.html","../downloads/my-game.zip","../downloads/shortcut.js","setup"],["tutorial/index.html","../downloads/my-game.zip","../downloads/shortcut.js","coin"]]){
  const page=read(file);assert.ok(page.includes(`href="${zip}" download="my-game.zip"`),file);assert.ok(page.includes(`src="${script}" defer`),file);assert.ok(page.includes(`data-shortcut="${key}"`),file);assert.equal((page.match(/class="save-lesson-shortcut"/g)||[]).length,1,file);assert.ok(fs.existsSync(path.resolve(root,path.dirname(file),zip)),file);assert.ok(fs.existsSync(path.resolve(root,path.dirname(file),script)),file);
 }
 const entry=read("教材を開く.html");for(const dest of ["learning/index.html","tutorial/index.html","examples/index.html","features/index.html"])assert.ok(entry.includes(`href="${dest}"`),dest);
 assert.doesNotMatch(entry,/<(?:canvas|iframe|object|embed)\b/i);assert.match(read("README.md"),/教材を開く\.html/);
 assert.match(read("learning/setup.html"),/1・2のコピーは不要/);assert.match(read("tutorial/index.html"),/手順2のコピーは不要/);
 assert.doesNotMatch(read("downloads/shortcut.js"),/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage)\b/);
});
test("ショートカットは現在のfile/http/https URLのみを使い、改行と危険な形式を拒む",()=>{
 const href="file:///C:/Users/example/%E6%95%99%E6%9D%90/learning/index.html#lesson-section-1";assert.equal(makeShortcut(href),`[InternetShortcut]\r\nURL=${href}\r\n`);
 assert.equal(makeShortcut("https://example.org/lesson?q=1#step"),"[InternetShortcut]\r\nURL=https://example.org/lesson?q=1#step\r\n");assert.match(makeShortcut("http://localhost/lesson"),/^\[InternetShortcut\]/);
 for(const bad of ["javascript:alert(1)","data:text/plain,test","ftp://example.org/","https://example.org/\r\nURL=https://evil.test","https://example.org/%0aevil","https://example.org/%0Devil","https://example.org/%E2%80%A8","https://example.org/%E2%80%A9","https://user:pass@example.org/",""]){assert.throws(()=>makeShortcut(bad),bad);}
 const content=makeShortcut(href),first=Buffer.from(makeZip("学びの入口.url",content)),second=Buffer.from(makeZip("学びの入口.url",content));assert.deepEqual(first,second);const files=unzipStored(first,1,0x0800);assert.deepEqual([...files.keys()],["学びの入口.url"]);assert.equal(files.get("学びの入口.url").toString("utf8"),content);
});
test("各ボタンは固定名で現在のページのURLファイルをZIPに入れる",()=>{
 for(const [key,name,urlPath] of [["entry","教材を開く","%E6%95%99%E6%9D%90.html"],["learning","学びの入口","learning/index.html"],["setup","準備と操作","learning/setup.html"],["coin","コインキャッチの教材","tutorial/index.html"]]){
  const events={},status={textContent:""},button={hidden:true,dataset:{status:"status",shortcut:key},addEventListener:(type,fn)=>events[type]=fn},created=[],urls=[],revoked=[];
  const document={querySelectorAll:s=>{assert.equal(s,".save-lesson-shortcut");return [button];},getElementById:id=>id==="status"?status:null,createElement:tag=>{assert.equal(tag,"a");const a={click(){this.clicked=true;},remove(){this.removed=true;}};created.push(a);return a;},body:{append(){}}};
  class LocalURL extends URL {} LocalURL.createObjectURL=blob=>{urls.push(blob);return "blob:temporary";};LocalURL.revokeObjectURL=url=>revoked.push(url);
  class LocalBlob {constructor(parts,options){this.parts=parts;this.type=options.type;}}
  const href=`file:///C:/Users/example/${urlPath}`,context=vm.createContext({document,location:{href},URL:LocalURL,Blob:LocalBlob,TextEncoder,setTimeout:fn=>fn()});vm.runInContext(read("downloads/shortcut.js"),context);assert.equal(button.hidden,false);events.click();
  assert.equal(created.length,1);assert.equal(created[0].download,`${name}-ショートカット.zip`);assert.equal(created[0].href,"blob:temporary");assert.equal(created[0].clicked,true);assert.equal(created[0].removed,true);assert.equal(urls[0].type,"application/zip");const files=unzipStored(Buffer.from(urls[0].parts[0]),1,0x0800);assert.deepEqual([...files.keys()],[`${name}.url`]);assert.equal(files.get(`${name}.url`).toString("utf8"),`[InternetShortcut]\r\nURL=${href}\r\n`);assert.deepEqual(revoked,["blob:temporary"]);assert.match(status.textContent,/ZIPを展開/);assert.match(status.textContent,/デスクトップ/);
  context.location.href="javascript:alert(1)";events.click();assert.equal(created.length,1);assert.match(status.textContent,/保存できません/);
 }
});
