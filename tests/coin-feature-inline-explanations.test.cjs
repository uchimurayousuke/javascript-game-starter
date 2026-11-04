"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (x) => ({"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"', "&#39;":"'", "&#x27;":"'"}[x]));

test("コイン発展と共通機能の抜粋は近くのコピー用コードと一致する", () => {
  for (const file of ["tutorial/extensions/tutorial.html", ...["menu", "help", "countdown", "results", "health-bar", "image-swap", "image-layout"].map((name) => `features/beginner/${name}/tutorial.html`), "features/intermediate/image-background/tutorial.html"]) {
    const page = fs.readFileSync(path.join(root, file), "utf8");
    const lessons = [...page.matchAll(/<section><h2>ステップ \d[\s\S]*?<\/section>/g)];
    assert.equal(lessons.length, 3, file);
    for (const lesson of lessons) {
      const edits = [...lesson[0].matchAll(/<h4>変更 \d+：[^<]+<\/h4>([\s\S]*?)(?=<h4>変更|<details><summary>この段階の script\.js 全文)/g)];
      assert.ok(edits.length > 0, file);
      assert.doesNotMatch(lesson[0], /<h3>コードの意味<\/h3>/, file);
      for (const edit of edits) {
        const block = edit[1].match(/<p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/);
        assert.ok(block, file);
        const excerpts = [...edit[1].matchAll(/<pre class="reading-code"><code>([\s\S]*?)<\/code><\/pre><p>([\s\S]*?)<\/p>/g)];
        if (excerpts.length) {
          assert.match(edit[1], /説明用の抜粋/);
          assert.match(edit[1], /<details class="instruction-code"><summary>比較とコピー用コードを開く<\/summary>/);
          for (const excerpt of excerpts) {
            assert.ok(excerpt[2].trim(), file);
            for (const line of decode(excerpt[1]).split("\n").map((x) => x.trim()).filter(Boolean)) {
              assert.ok(decode(block[1]).split("\n").some((x) => x.trim().includes(line)), `${file}: ${line}`);
            }
          }
        } else {
          assert.match(edit[1], /<\/code><\/pre><p>(?!変更後)[\s\S]*?<\/p>/, `${file}: コピー用コードの直後に説明`);
        }
      }
    }
  }
});

test("残機、得点、会話、入力、保存の抜粋は各段階のコピー用コードと一致する", () => {
 for (const [level, name] of [["beginner", "lives"], ["beginner", "score-combo"], ["beginner", "dialog"], ["beginner", "input-edges"], ["advanced", "save-file"]]) {
  const page = fs.readFileSync(path.join(root, `features/${level}/${name}/tutorial.html`), "utf8");
  const lessons = [...page.matchAll(/<section><h2>ステップ \d[\s\S]*?<\/section>/g)];
  assert.equal(lessons.length, 3);
  for (const lesson of lessons) {
    const section = lesson[0];
    assert.doesNotMatch(section, /<h3>コードの意味<\/h3>/);
    assert.match(section, /説明用の抜粋/);
    assert.match(section, /<details class="instruction-code"><summary>比較とコピー用コードを開く<\/summary>/);
    const block = section.match(/<p>変更後（コピー用）：<\/p><pre><code>([\s\S]*?)<\/code><\/pre>/);
    assert.ok(block);
    const excerpts = [...section.matchAll(/<pre class="reading-code"><code>([\s\S]*?)<\/code><\/pre><p>([\s\S]*?)<\/p>/g)];
    assert.ok(excerpts.length >= 1);
    for (const excerpt of excerpts) {
      assert.ok(excerpt[2].trim());
      for (const line of decode(excerpt[1]).split("\n").map((x) => x.trim()).filter(Boolean)) {
        assert.ok(decode(block[1]).split("\n").some((x) => x.trim().includes(line)), `${name}: ${line}`);
      }
    }
  }
 }
});

test("移動した図への従来のリンク先を保つ", () => {
  for (const name of ["lives", "score-combo", "dialog", "input-edges"]) {
    const page = fs.readFileSync(path.join(root, `features/beginner/${name}/tutorial.html`), "utf8");
    assert.ok(page.includes(`id="diagram-feature-${name}"`), name);
    assert.ok(page.includes(`id="feature-${name}"`), name);
  }
});
