"use strict";
const assert = require("node:assert/strict");

function assertReadingPage(html) {
  assert.doesNotMatch(html, /<(?:canvas|iframe|object|embed)\b/i);
  const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map((m) => m[0]);
  assert.ok(scripts.length <= 1, "教材の補助スクリプトは1本まで");
  for (const script of scripts) {
    assert.match(script, /^<script src="(?:\.\.\/)*(?:tutorial\/)?small-tasks\.js" defer><\/script>$/);
  }
}

module.exports = { assertReadingPage };
