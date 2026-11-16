"use strict";
const assert = require("node:assert/strict");

function assertReadingPage(html) {
  assert.doesNotMatch(html, /<(?:canvas|iframe|object|embed)\b/i);
  const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map((m) => m[0]);
  const loaded = new Set();
  for (const script of scripts) {
    const file = script.match(/^<script src="(?:\.\.\/)*(?:tutorial\/)?(small-tasks|workshop-effects)\.js(?:\?v=[a-z0-9-]+)?" defer><\/script>$/);
    assert.ok(file, "教材UI用のローカルスクリプトを使う");
    assert.ok(!loaded.has(file[1]), file[1] + " の重複");
    loaded.add(file[1]);
  }
}

module.exports = { assertReadingPage };
