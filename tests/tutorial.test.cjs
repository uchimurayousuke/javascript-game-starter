"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const steps = ["01-draw", "02-update", "03-input", "04-collision", "05-game"];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const normalize = (text) => text.replace(/\r\n/g, "\n").trimEnd() + "\n";
const tutorial = read("tutorial/index.html");

function decode(text) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" };
  return text.replace(/&(amp|lt|gt|quot|#39);/g, (_, name) => entities[name]);
}

function codeBlocks(html) {
  return Array.from(html.matchAll(/<pre><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g), (match) => ({
    attributes: Object.fromEntries(
      Array.from(match[1].matchAll(/([\w-]+)="([^"]*)"/g), (attribute) => [attribute[1], decode(attribute[2])]),
    ),
    code: decode(match[2]).replace(/\r\n/g, "\n").replace(/\n$/, ""),
  }));
}

function functionSource(source, name) {
  // The lessons explicitly replace from a function declaration through its
  // unindented closing brace. Nested blocks in the examples are indented.
  const pattern = new RegExp("^function " + name + "\\([^\\n]*\\) \\{\\n[\\s\\S]*?^\\}", "gm");
  const matches = Array.from(source.matchAll(pattern));
  assert.equal(matches.length, 1, "function must exist once: " + name);
  return matches[0];
}

function applyInstruction(source, block) {
  const action = block.attributes["data-action"];
  if (action === "replace-file") return normalize(block.code);
  if (action === "replace-function") {
    const name = block.attributes["data-name"];
    const match = functionSource(source, name);
    assert.ok(block.code.startsWith("function " + name + "("));
    return source.slice(0, match.index) + block.code + source.slice(match.index + match[0].length);
  }

  const anchor = block.attributes["data-anchor"];
  const lines = source.split("\n");
  const index = lines.indexOf(anchor);
  assert.ok(index >= 0, "instruction's anchor must exist as a complete line: " + anchor);
  assert.equal(lines.lastIndexOf(anchor), index, "anchor must be unambiguous");
  const code = block.code.split("\n");
  const gap = block.attributes["data-gap"] === "blank" ? [""] : [];
  if (action === "insert-after-line") lines.splice(index + 1, 0, ...gap, ...code);
  else if (action === "insert-before-line") lines.splice(index, 0, ...code, ...gap);
  else if (action === "replace-line") lines.splice(index, 1, ...code);
  else assert.fail("unknown instruction: " + action);
  return lines.join("\n");
}

const lessons = Array.from(tutorial.matchAll(/<section\b[^>]*data-step="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g));

test("the published instructions reproduce all three files at every step", async (t) => {
  assert.deepEqual(lessons.map((lesson) => lesson[1]), steps);
  const files = Object.fromEntries(["index.html", "style.css", "script.js"].map((file) => [file, normalize(read(file))]));
  const preparation = tutorial.match(/<section id="preparation"[^>]*>([\s\S]*?)<\/section>/)[1];
  const preparationBlocks = codeBlocks(preparation);
  assert.equal(preparationBlocks.length, 2, "HTML and CSS preparation must be present");
  for (const block of preparationBlocks) {
    const file = block.attributes["data-file"];
    files[file] = applyInstruction(files[file], block);
  }

  for (const lesson of lessons) {
    await t.test(lesson[1], () => {
      const blocks = codeBlocks(lesson[2]);
      assert.ok(blocks.length > 0, "lesson must publish executable instructions");
      for (const block of blocks) {
        const file = block.attributes["data-file"];
        assert.equal(file, "script.js");
        files[file] = applyInstruction(files[file], block);
      }
      for (const file of Object.keys(files)) {
        assert.equal(normalize(files[file]), normalize(read("tutorial/" + lesson[1] + "/" + file)), lesson[1] + "/" + file);
      }
      new vm.Script(files["script.js"], { filename: lesson[1] + "/script.js" });
      assert.equal(functionSource(files["script.js"], "gameLoop")[0], functionSource(normalize(read("script.js")), "gameLoop")[0]);
    });
  }
});

test("reading pages and game pages stay separate", () => {
  assert.doesNotMatch(tutorial, /<(?:canvas|iframe|object|embed|script)\b/i);
  const requiredHeadings = ["目標", "編集するファイルと場所", "追加または置換するコード", "コードの意味", "保存・再読み込み後の確認", "小さな練習"];
  for (const lesson of lessons) {
    const headings = Array.from(lesson[2].matchAll(/<h3>\d\. ([^<]+)<\/h3>/g), (match) => match[1]);
    assert.deepEqual(headings, requiredHeadings);
  }
  for (const step of steps) {
    const html = read("tutorial/" + step + "/index.html");
    assert.doesNotMatch(html, /STEP|編集する|<nav\b|<h[1-6]\b/);
    const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
    assert.equal((body.match(/<canvas\b/g) || []).length, 1);
    assert.equal(body.replace(/<canvas\b[^>]*>[\s\S]*?<\/canvas>/, "").replace(/<\/?main>/g, "").trim(), "");
  }
});

function checkLink(file, link) {
  assert.doesNotMatch(link, /^[a-z]+:/i, "links and assets must work locally");
  const [relative, fragment] = link.split("#");
  const target = relative ? path.resolve(root, path.dirname(file), decodeURIComponent(relative)) : path.join(root, file);
  assert.ok(fs.existsSync(target), file + " links to missing file " + link);
  if (fragment) {
    assert.ok(read(path.relative(root, target)).includes('id="' + fragment + '"'), "missing anchor: " + link);
  }
}

test("HTML, source-code links, README links and anchors resolve locally", () => {
  const pages = ["index.html", "tutorial/index.html", ...steps.map((step) => "tutorial/" + step + "/index.html")];
  for (const file of pages) {
    const html = read(file).replace(/<pre>[\s\S]*?<\/pre>/g, "");
    for (const match of html.matchAll(/(?:href|src)="([^"]*)"/g)) checkLink(file, decode(match[1]));
  }
  for (const file of ["README.md", "tutorial/README.md"]) {
    for (const match of read(file).matchAll(/\]\(([^)]+)\)/g)) checkLink(file, match[1]);
  }
});
