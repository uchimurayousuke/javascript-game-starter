"use strict";
const { verifyLessonSteps } = require("./lesson-edits.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const chapters = require("../tutorial/compare/chapters.json");
const pages = [...new Set(chapters.map(chapter => chapter.page))].filter(page => page !== "learning/debug/index.html");

test("107本の制作教材に以前の比較や全文の欄が残っていない", () => {
  assert.equal(pages.length, 107);
  for (const page of pages) {
    assert.doesNotMatch(read(page), /class="(?:task-reference|coin-reference|change-guide|instruction-code|old-code|change-fold|change-view)"|以前の比較|説明用の抜粋/, page);
  }
});

test("制作教材の小作業を順に適用すると375段階の見本を再現する", () => {
  let steps = 0;
  for (const page of pages) steps += verifyLessonSteps(page).length;
  assert.equal(steps, 375);
});
test("比較欄は選択できず、文字色と背景のコントラストが4.5以上", () => {
  const css = read("tutorial/code-changes.css");
  const tokens = read("tutorial/learning-layout.css");
  assert.match(css, /\.change-view\s*\{[^}]*user-select:\s*none/s);
  assert.match(css, /\.change-label\s*\{[^}]*white-space:\s*nowrap/s);
  function luminance(hex) {
    const rgb = hex.match(/[0-9a-f]{2}/gi).map((x) => parseInt(x, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function color(rule, property) {
    const declaration = rule.match(new RegExp('(?:^|;)\\s*' + property + ':\\s*(#[0-9a-f]{6}|var\\(--[\\w-]+\\))', 'i'));
    assert.ok(declaration, `${property} is declared`);
    const token = declaration[1].match(/^var\((--[\w-]+)\)$/);
    if (!token) return declaration[1];
    const value = tokens.match(new RegExp('(?:^|[;{])\\s*' + token[1] + ':\\s*(#[0-9a-f]{6})\\s*;', 'i'));
    assert.ok(value, `${token[1]} is defined`);
    return value[1];
  }
  for (const kind of ["added", "removed", "same", "hunk"]) {
    const rule = css.match(new RegExp('\\.change-' + kind + '\\s*\\{([^}]*)\\}'))[1];
    const foreground = color(rule, "color");
    const background = color(rule, "background");
    const border = color(rule, "border-color");
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, `${kind} contrast`);
    const edges = [luminance(border), luminance(background)].sort((a, b) => b - a);
    assert.ok((edges[0] + 0.05) / (edges[1] + 0.05) >= 3, `${kind} border contrast`);
  }
});
