"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (x) => ({"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"', "&#39;":"'", "&#x27;":"'"}[x]));
const levelOf = game => (["target", "bounce", "timing", "typing", "number-guess"].includes(game) ? "beginner" : ["breakout", "shooting", "snake", "memory", "shop"].includes(game) ? "intermediate" : "advanced");
const examplePath = p => `${levelOf(p.split("/")[0])}/${p}`;
const pages = ["tutorial/index.html", ...["target", "bounce", "breakout", "shooting", "platformer", "platformer/extensions", "timing", "typing", "number-guess", "snake", "memory", "shop", "escape", "tower-defense", "card-battle", "racing"].map((p) => `examples/${examplePath(p)}/tutorial.html`)];
const rowPattern = /<div class="change-row change-(removed|added|same|hunk)"><span class="change-label">([^<]*)<\/span><span class="change-code">([^<]*)<\/span><\/div>/g;
const rowSource = '(?:<div class="change-row change-(?:removed|added|same|hunk)"><span class="change-label">[^<]*</span><span class="change-code">[^<]*</span></div>)*';
const viewSource = `<div class="change-view" aria-label="コードの変更の比較"><p class="change-view-title">比較（読むための表示）</p>(${rowSource})</div>`;
const rows = (html) => [...html.matchAll(rowPattern)].map(([, kind, label, code]) => ({ kind, label: decode(label), code: code === '（空行）' ? '' : decode(code) }));
const lines = (text) => text.replace(/\n$/, "").split("\n");
const equal = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const at = (array, part, index) => equal(array.slice(index, index + part.length), part);

function checkComparison(oldCode, newCode, view, location) {
  const oldLines = lines(oldCode), newLines = lines(newCode), groups = [];
  let current;
  for (const item of rows(view)) {
    const labels = { removed: "− 消す", added: "＋ 追加", same: "そのまま", hunk: "比較する場所" };
    assert.equal(item.label, labels[item.kind], location);
    if (item.kind === "hunk") { current = []; groups.push(current); }
    else { assert.ok(current, location); current.push(item); }
  }
  assert.ok(groups.length, location);
  assert.ok(groups.flat().some((x) => x.kind === "added" || x.kind === "removed"), location);
  let oi = 0, ni = 0;
  for (const group of groups) {
    const o = group.filter((x) => x.kind !== "added").map((x) => x.code);
    const n = group.filter((x) => x.kind !== "removed").map((x) => x.code);
    let found = null;
    for (let a = oi; a <= oldLines.length && !found; a++) {
      if (!at(oldLines, o, a)) continue;
      for (let b = ni; b <= newLines.length; b++) {
        if (at(newLines, n, b) && equal(oldLines.slice(oi, a), newLines.slice(ni, b))) { found = [a, b]; break; }
      }
    }
    assert.ok(found, `${location}: 表示した行が元のコードと一致しません`);
    oi = found[0] + o.length; ni = found[1] + n.length;
  }
  assert.ok(equal(oldLines.slice(oi), newLines.slice(ni)), `${location}: 変更行が省略されています`);
}

test("全17ページに読み方と安全なコピー欄があり、比較の各行がコードと一致する", () => {
  const pair = new RegExp(viewSource + '(?:</details>)?<details class="old-code"><summary>変更前のコード全体を確認する</summary><p>変更前（確認用）：</p><pre><code>([\\s\\S]*?)</code></pre></details><p>変更後（コピー用）：</p><pre><code>([\\s\\S]*?)</code></pre>', 'g');
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /コードの比較の読み方/);
    assert.ok(html.indexOf('class="change-guide"') < html.indexOf('class="change-view"'), `${page}: 凡例は最初の比較の前`);
    assert.match(html, /赤い行だけを消すのではなく/);
    assert.match(html, /code-changes\.css/);
    assert.match(html, /change-added/); assert.match(html, /change-removed/); assert.match(html, /change-same/);
    const folded = new RegExp('<details class="change-fold"><summary>行ごとの比較を見る（消す (\\d+) 行・追加 (\\d+) 行）</summary>' + viewSource + '</details>', 'g');
    const folds = [...html.matchAll(folded)];
    assert.equal(folds.length, (html.match(/<details class="change-fold">/g) || []).length, page);
    for (const fold of folds) {
      const displayed = rows(fold[3]);
      assert.equal(displayed.filter((x) => x.kind === 'removed').length, Number(fold[1]), page);
      assert.equal(displayed.filter((x) => x.kind === 'added').length, Number(fold[2]), page);
    }
    for (const match of html.matchAll(/<pre><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/g)) assert.doesNotMatch(match[1], /<[^>]+>/, `${page}: コピー欄に装飾タグ`);
    if (page === "tutorial/index.html") continue;
    const matches = [...html.matchAll(pair)];
    assert.ok(matches.length > 0, page);
    for (const [i, match] of matches.entries()) checkComparison(decode(match[2]), decode(match[3]), match[1], `${page}: ${i + 1}`);
    assert.equal((html.match(/<details class="old-code">/g) || []).length, matches.length, page);
  }
});

test("各ステップ全体の差分も実際の前後のコードに対応する", () => {
  for (const game of ["target", "bounce", "breakout", "shooting", "platformer", "timing", "typing", "number-guess", "snake", "memory", "shop", "escape", "tower-defense", "card-battle", "racing"]) {
    const page = read(`examples/${examplePath(game)}/tutorial.html`);
    const sections = [...page.matchAll(/<section><h2>ステップ (\d)[\s\S]*?<\/section>/g)];
    let previous = read("template/script.js");
    for (const section of sections) {
      const step = section[1];
      assert.match(section[0], /<h3>この段階で変えるところ<\/h3><p>[\s\S]*?<\/p><details class="change-fold">/, `${game}: ${step} 全体は折りたたむ`);
      const match = section[0].match(new RegExp(viewSource));
      assert.ok(match, `${game}: ${step}`);
      const next = read(`examples/${examplePath(game)}/step${step}/script.js`);
      checkComparison(previous, next, match[1], `${game}: ${step} 全体`);
      const reference = section[0].match(/<details><summary>この段階の script\.js 全文を確認する<\/summary><pre><code>([\s\S]*?)<\/code><\/pre><\/details>/);
      assert.ok(reference, `${game}: ${step} 全文の見本`);
      assert.equal(decode(reference[1]), next, `${game}: ${step} 全文の見本`);
      previous = next;
    }
  }
});

test("コインキャッチの比較は各手順の変更範囲と一致する", () => {
  const page = read("tutorial/index.html");
  const instruction = new RegExp(viewSource + '(?:</details>)?<p class="copy-label">[^<]+</p><pre><code\\b([^>]*)>([\\s\\S]*?)</code></pre>', 'g');
  const matches = [...page.matchAll(instruction)];
  assert.equal(matches.length, 25);
  const files = Object.fromEntries(["index.html", "style.css", "script.js"].map((name) => [name, read(`template/${name}`).trimEnd() + "\n"]));
  for (const [i, match] of matches.entries()) {
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, decode(v)]));
    const code = decode(match[3]).replace(/\n$/, ""), file = attrs["data-file"], action = attrs["data-action"];
    const source = files[file]; let old, next;
    if (action === "replace-file") {
      old = source.replace(/\n$/, ""); next = code; files[file] = code.trimEnd() + "\n";
    } else if (action === "replace-function") {
      const found = [...source.matchAll(new RegExp('^function ' + attrs["data-name"] + '\\([^\\n]*\\) \\{\\n[\\s\\S]*?^\\}', 'gm'))];
      assert.equal(found.length, 1); old = found[0][0]; next = code;
      files[file] = source.slice(0, found[0].index) + code + source.slice(found[0].index + old.length);
    } else {
      const array = source.split("\n"), anchor = attrs["data-anchor"], index = array.indexOf(anchor);
      assert.ok(index >= 0); assert.equal(array.lastIndexOf(anchor), index);
      const add = code.split("\n"), gap = attrs["data-gap"] === "blank" ? [""] : [];
      old = anchor;
      if (action === "insert-after-line") { next = [anchor, ...gap, ...add].join("\n"); array.splice(index + 1, 0, ...gap, ...add); }
      else if (action === "insert-before-line") { next = [...add, ...gap, anchor].join("\n"); array.splice(index, 0, ...add, ...gap); }
      else { assert.equal(action, "replace-line"); next = code; array.splice(index, 1, ...add); }
      files[file] = array.join("\n");
    }
    checkComparison(old, next, match[1], `コインキャッチ: ${i + 1}`);
  }
});

test("比較欄は選択できず、文字色と背景のコントラストが4.5以上", () => {
  const css = read("tutorial/code-changes.css");
  assert.match(css, /\.change-view\s*\{[^}]*user-select:\s*none/s);
  assert.match(css, /\.change-label\s*\{[^}]*white-space:\s*nowrap/s);
  function luminance(hex) {
    const rgb = hex.match(/[0-9a-f]{2}/gi).map((x) => parseInt(x, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  for (const kind of ["added", "removed", "same", "hunk"]) {
    const rule = css.match(new RegExp('\\.change-' + kind + '\\s*\\{([^}]*)\\}'))[1];
    const foreground = rule.match(/(?:^|;)\s*color:\s*(#[0-9a-f]{6})/i)[1];
    const background = rule.match(/(?:^|;)\s*background:\s*(#[0-9a-f]{6})/i)[1];
    const border = rule.match(/(?:^|;)\s*border-color:\s*(#[0-9a-f]{6})/i)[1];
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, `${kind} contrast`);
    const edges = [luminance(border), luminance(background)].sort((a, b) => b - a);
    assert.ok((edges[0] + 0.05) / (edges[1] + 0.05) >= 3, `${kind} border contrast`);
  }
});
