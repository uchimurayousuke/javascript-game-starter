"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const decode = s => s.replace(/&(amp|lt|gt|quot|#x27|#39|#10);/g, (_, x) => ({amp:"&",lt:"<",gt:">",quot:'"',"#x27":"'","#39":"'","#10":"\n"}[x]));
const page = read("tutorial/index.html");
const steps = ["01-draw", "02-update", "03-input", "04-collision", "05-game"];
const section = id => {
  const match = page.match(new RegExp('<section\\b[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</section>'));
  assert.ok(match, id);
  return match[1].split('<details class="coin-reference">')[0];
};
const blocks = text => [...text.matchAll(/<pre class="coin-copy"><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g)].map(m => ({
  attrs: Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], decode(x[2])])), code: decode(m[2])
}));
function boot(source) {
  const ctx = new Proxy({}, {get: (target, key) => key in target ? target[key] : () => {}, set: (target, key, value) => {target[key] = value; return true;}});
  const canvas = {width: 800, height: 450, getContext: () => ctx};
  const context = vm.createContext({document: {querySelector: () => canvas, addEventListener() {}}, window: {addEventListener() {}}, requestAnimationFrame() {}});
  new vm.Script(source).runInContext(context, { timeout: 1000 });
}
function apply(files, block) {
  const {attrs: a, code} = block, file = a["data-small-file"], match = a["data-small-match"], action = a["data-small-action"], sep = a["data-small-separator"];
  assert.ok(Object.hasOwn(files, file));
  assert.ok(match && files[file].includes(match), `missing marker: ${match}`);
  assert.equal(files[file].split(match).length, 2, `ambiguous marker: ${match}`);
  assert.doesNotMatch(code, /\/\/|\/\*|<!--/, "learner code does not contain comments");
  const replacement = action === "after" ? match + sep + code : action === "before" ? code + sep + match : action === "replace" ? code : null;
  assert.notEqual(replacement, null);
  files[file] = files[file].replace(match, () => replacement);
  boot(files["script.js"]);
}
test("主画面の小作業は各操作後に起動でき、各段階の完成ファイルを再現する", () => {
  const files = Object.fromEntries(["index.html", "style.css", "script.js"].map(f => [f, read("template/" + f)]));
  for (const [i, id] of ["preparation", ...steps.map((_, n) => `step-0${n + 1}`)].entries()) {
    const main = section(id), tasks = blocks(main);
    assert.ok(tasks.length >= 3, id);
    assert.equal((main.match(/class="coin-task"/g) || []).length, tasks.length);
    assert.equal((main.match(/class="coin-marker"/g) || []).length, tasks.length);
    assert.equal((main.match(/class="coin-copy-button"/g) || []).length, tasks.length);
    for (const block of tasks) apply(files, block);
    const expected = i === 0 ? steps[0] : steps[i - 1];
    for (const file of i === 0 ? ["index.html", "style.css"] : Object.keys(files)) assert.equal(files[file], read(`tutorial/${expected}/${file}`), `${id}: ${file}`);
  }
});
test("基本説明と図は小作業内で見え、比較は閉じた補助欄にある", () => {
  for (const id of ["preparation", ...steps.map((_, i) => `step-0${i + 1}`)]) {
    const main = section(id);
    assert.doesNotMatch(main, /説明用の抜粋|class="change-view"/);
    assert.match(main, /coin-marker-label/); assert.match(main, /coin-code-label/);
  }
  for (const [id, figure] of [["step-01", "coin-coordinates"], ["step-01", "coin-arc"], ["step-04", "coin-hit"]]) assert.ok(section(id).includes(`id="${figure}"`));
});

test("コピーはJS有効時だけ表示し、初出の用語を主画面で説明する", () => {
  const main = section("step-01");
  assert.match(main, /変数は値に名前を付けて覚える/);
  for (const term of ["playerWidth", "getContext", "fillRect", "arc"]) assert.ok(main.includes(term));
  const second = section("step-02");
  assert.match(second, /coinY - coinRadius/); assert.match(second, /左が右より大きい/);
  assert.doesNotMatch(section("step-04"), /移動部分の空行を整える/);
  assert.equal((page.match(/class="coin-copy-button" hidden/g) || []).length, (page.match(/class="coin-task"/g) || []).length);
  assert.match(read("tutorial/coin-small-tasks.js"), /button\.hidden = false/);
});

test("主画面のコードを折り返し、初めて見える変化をその場で確認できる", () => {
  const css = read("tutorial/coin-small-tasks.css");
  assert.match(css, /\.coin-task \.coin-marker,\s*\.coin-task \.coin-copy,[\s\S]*?white-space:\s*pre-wrap;\s*overflow-wrap:\s*anywhere;/);
  for (const [id, title, expected] of [["step-01", "受け皿を描く", "青い受け皿"], ["step-02", "落とす", "コインが下へ動く"]]) {
    const text = section(id).split(`<h4>${title}</h4>`)[1].split('<div class="coin-task">')[0];
    assert.match(text, /coin-check/); assert.ok(text.includes(expected));
    if (id === "step-02") assert.match(text, /80 → 83 → 86/);
  }
});
