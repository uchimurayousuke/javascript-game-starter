"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const { hasInlineExplanation } = require("./lesson-explanation.cjs");

test("コイン発展と共通機能でコピー用コードの近くに説明がある", () => {
  const files = ["tutorial/extensions/tutorial.html", ...["menu","help","countdown","results","health-bar","image-swap","image-layout"].map(name => "features/beginner/" + name + "/tutorial.html"), "features/intermediate/image-background/tutorial.html"];
  for (const file of files) {
    const page = fs.readFileSync(path.join(root, file), "utf8");
    const lessons = [...page.matchAll(/<section><h2>ステップ \d[\s\S]*?<\/section>/g)];
    assert.equal(lessons.length, 3, file);
    for (const [section] of lessons) {
      assert.ok(hasInlineExplanation(section), file + " のコピー用コードの近くに説明がある");
      assert.doesNotMatch(section, /説明用の抜粋|class="instruction-code"/, file);
    }
  }
});

test("残機、得点、会話、入力、保存の小作業はコードの近くで説明する", () => {
  const files = [...["lives","score-combo","dialog","input-edges"].map(name => "features/beginner/" + name + "/tutorial.html"), "features/advanced/save-file/tutorial.html"];
  for (const file of files) {
    const page = fs.readFileSync(path.join(root, file), "utf8");
    const lessons = [...page.matchAll(/<section><h2>ステップ \d[\s\S]*?<\/section>/g)];
    assert.equal(lessons.length, 3, file);
    for (const [section] of lessons) {
      assert.ok(hasInlineExplanation(section), file + " のコピー用コードの近くに説明がある");
      assert.doesNotMatch(section, /説明用の抜粋|class="instruction-code"/, file);
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
