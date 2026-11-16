"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { assertReadingPage } = require("./reading-page-policy.cjs");

test("教材UI用スクリプトだけを許し、埋め込みと他のスクリプトを防ぐ", () => {
  assert.doesNotThrow(() => assertReadingPage('<script src="../../../tutorial/small-tasks.js" defer></script>'));
  assert.doesNotThrow(() => assertReadingPage('<script src="../../../tutorial/small-tasks.js?v=20261115-visuals" defer></script>'));
  assert.doesNotThrow(() => assertReadingPage('<script src="../../../tutorial/workshop-effects.js?v=20261116-ui-motion" defer></script><script src="../../../tutorial/small-tasks.js" defer></script>'));
  assert.doesNotThrow(() => assertReadingPage('<p>スクリプトのない教材</p>'));
  assert.throws(() => assertReadingPage('<script src="game.js" defer></script>'));
  assert.throws(() => assertReadingPage('<script src="workshop-effects.js" defer></script><script src="workshop-effects.js?v=older" defer></script>'));
  assert.throws(() => assertReadingPage('<script src="../../../tutorial/small-tasks.js" defer></script><script>game()</script>'));
  assert.throws(() => assertReadingPage('<canvas></canvas>'));
  assert.throws(() => assertReadingPage('<iframe></iframe>'));
});
