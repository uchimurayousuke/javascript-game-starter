"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { assertReadingPage } = require("./reading-page-policy.cjs");

test("教材UI用スクリプトだけを許し、埋め込みと他のスクリプトを防ぐ", () => {
  assert.doesNotThrow(() => assertReadingPage('<script src="../../../tutorial/small-tasks.js" defer></script>'));
  assert.doesNotThrow(() => assertReadingPage('<p>スクリプトのない教材</p>'));
  assert.throws(() => assertReadingPage('<script src="game.js" defer></script>'));
  assert.throws(() => assertReadingPage('<script src="../../../tutorial/small-tasks.js" defer></script><script>game()</script>'));
  assert.throws(() => assertReadingPage('<canvas></canvas>'));
  assert.throws(() => assertReadingPage('<iframe></iframe>'));
});
