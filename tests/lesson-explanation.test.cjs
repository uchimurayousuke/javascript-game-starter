"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { hasInlineExplanation } = require("./lesson-explanation.cjs");

test("抜粋の直後と短いコピー用コードの直後の説明を認識する", () => {
  const excerpt = '<div class="reading-walkthrough"><pre class="reading-code"><code>score += 1;</code></pre><p>得点を1増やします。</p></div>';
  const direct = '<p>変更後（コピー用）：</p><pre><code>score += 1;</code></pre><p>得点を1増やします。</p>';
  const task = '<div class="lesson-task"><pre class="task-code"><code data-small-file="script.js">score += 1;</code></pre><button type="button" hidden>コードをコピー</button><span class="task-copy-status"></span><p>得点を1増やします。</p></div>';
  assert.equal(hasInlineExplanation(excerpt), true);
  assert.equal(hasInlineExplanation(direct), true);
  assert.equal(hasInlineExplanation(task), true);
  assert.equal(hasInlineExplanation(direct.replace('<p>得点を1増やします。</p>', '')), false);
  assert.equal(hasInlineExplanation(excerpt.replace('<p>得点を1増やします。</p>', '')), false);
  assert.equal(hasInlineExplanation(task.replace('<p>得点を1増やします。</p>', '')), false);
});
