"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const decode = (text) => text.replace(/&(?:amp|lt|gt|quot|#x27|#39|#10|#13);/g, (x) => ({"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"', "&#x27;":"'", "&#39;":"'", "&#10;":"\n", "&#13;":"\r"}[x]));

function tasks(section) {
  return [...section.matchAll(/<pre class="task-code"><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g)].map((m) => ({
    attrs: Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], decode(a[2])])),
    code: decode(m[2]),
  }));
}

function apply(source, item) {
  const { attrs, code } = item, old = attrs["data-small-match"], sep = attrs["data-small-separator"];
  assert.equal(attrs["data-small-file"], "script.js");
  assert.ok(old && source.indexOf(old) >= 0, "目印が存在する");
  assert.equal(source.indexOf(old), source.lastIndexOf(old), "目印は1か所に決まる");
  const action = attrs["data-small-action"];
  assert.ok(["replace", "before", "after"].includes(action));
  const replacement = action === "replace" ? code : action === "before" ? code + sep + old : old + sep + code;
  return source.replace(old, () => replacement);
}

test("発展と組み合わせの小作業を順に行うと各段階の見本になる", () => {
  for (const [file, folder, count] of [["tutorial/extensions/tutorial.html", "tutorial/extensions", 3], ["learning/combine/tutorial.html", "learning/combine", 4]]) {
    const page = read(file), sections = [...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    assert.equal(sections.length, count, file);
    let source = read("tutorial/05-game/script.js");
    for (const [i, section] of sections.entries()) {
      const edits = tasks(section[0]);
      assert.ok(edits.length > 0, file);
      for (const edit of edits) source = apply(source, edit);
      assert.equal(source, read(`${folder}/step${i + 1}/script.js`), `${file} step ${i + 1}`);
      assert.match(section[0], /<p class="task-check">/);
      assert.match(section[0], /<details class="task-reference">/);
    }
  }
});

test("組み合わせの保存機能は各小作業の直後にも起動できる", () => {
  const page = read("learning/combine/tutorial.html");
  const sections = [...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
  let source = read("learning/combine/step2/script.js");
  const contextFor = () => {
    const ctx = new Proxy({}, { get: () => () => {} });
    const canvas = { width: 800, height: 450, getContext: () => ctx };
    return { document: { querySelector: () => canvas, addEventListener() {} },
      window: { addEventListener() {} }, localStorage: { getItem: () => null, setItem() {} },
      requestAnimationFrame() {}, console };
  };
  for (const edit of tasks(sections[2][0])) {
    source = apply(source, edit);
    assert.doesNotThrow(() => vm.runInNewContext(source, contextFor()), "小作業の直後に起動できる");
  }
  assert.equal(source, read("learning/combine/step3/script.js"));
});

test("デバッグの修正は答えの中にあり、各壊れたファイルを修正版にする", () => {
  const page = read("learning/debug/index.html");
  for (const name of ["syntax", "name", "input", "score", "reset", "image"]) {
    const section = page.match(new RegExp(`<section id="${name}">([\\s\\S]*?)</section>`))[1];
    const edits = tasks(section); assert.equal(edits.length, 1, name);
    const answer = section.indexOf('<details><summary>答えと変更箇所</summary>');
    assert.ok(answer >= 0 && answer < section.indexOf('<div class="lesson-task">'), name);
    assert.equal(apply(read(`learning/debug/${name}/broken/script.js`), edits[0]), read(`learning/debug/${name}/fixed/script.js`), name);
  }
});

test("デバッグの見出しは原因を明かさず、画像は作業前に準備できる", () => {
  const page = read("learning/debug/index.html");
  for (const [id, symptom] of [["syntax", "青い四角が表示されない"], ["name", "得点が表示されない"], ["image", "青い画像が表示されない"]]) {
    assert.match(page, new RegExp(`<section id="${id}">[\\s\\S]*?<h2>${symptom}</h2>`));
  }
  for (const answer of ["閉じ括弧が足りない", "変数名が違う", "画像の場所が違う"]) assert.doesNotMatch(page, new RegExp(answer));
  const combine = read("learning/combine/tutorial.html");
  const stage = [...combine.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)][3][0];
  const imageLink = stage.indexOf('href="step4/assets/coin.png"');
  const firstTask = stage.indexOf('<div class="lesson-task">');
  assert.ok(imageLink >= 0 && imageLink < firstTask, "画像の準備は作業を始める前に案内する");
});

test("文法例は独立した例としてコードと説明が隣接する", () => {
  for (const [file, count] of [["learning/basics.html", 4], ["learning/basics/html.html", 8], ["learning/basics/css.html", 9], ["learning/basics/javascript.html", 29]]) {
    const page = read(file);
    const blocks = [...page.matchAll(/<pre\b[^>]*class="task-code"><code data-code-example>([\s\S]*?)<\/code><\/pre><button\b[^>]*hidden>コードをコピー<\/button><span class="task-copy-status" role="status" aria-live="polite"><\/span><p>([\s\S]*?)<\/p>/g)];
    assert.equal(blocks.length, count, file);
    for (const block of blocks) assert.ok(block[1].trim() && block[2].trim(), file);
    assert.doesNotMatch(page, /data-small-action=/, file);
  }
  const practice = read("learning/practice.html");
  assert.match(practice, /<pre class="task-code"><code data-code-example>if \(score ___ 5\)/);
  assert.doesNotMatch(practice, /data-small-action=/);
});

test("コピーはコード本文だけを使い、失敗時は選択を案内する", async () => {
  const script = read("tutorial/small-tasks.js");
  for (const mode of ["clipboard", "manual", "no-selection"]) {
    let copied = null, selected = null, handler = null;
    const code = { textContent: "  score += 1;\n" }, status = { textContent: "" };
    const button = { hidden: true, addEventListener: (_, fn) => { handler = fn; } };
    const task = { querySelector: (selector) => ({".task-copy-button":button, ".task-code code":code, ".task-copy-status":status}[selector] || null) };
    const selection = { removeAllRanges() {}, addRange(range) { selected = range.node; } };
    const document = { querySelectorAll: () => [task, { querySelector: () => null }], createRange: () => ({ selectNodeContents(node) { this.node = node; } }) };
    const navigator = mode === "clipboard" ? { clipboard: { writeText: async (text) => { copied = text; } } } : {};
    const window = mode === "no-selection" ? {} : { getSelection: () => selection };
    vm.runInNewContext(script, { document, navigator, window });
    assert.equal(button.hidden, false); await handler();
    if (mode === "clipboard") { assert.equal(copied, code.textContent); assert.equal(status.textContent, "コピーしました。"); }
    else { assert.equal(selected, mode === "manual" ? code : null); assert.match(status.textContent, /Ctrl\+C/); assert.match(status.textContent, /自動でコピーできませんでした/); }
  }
});
