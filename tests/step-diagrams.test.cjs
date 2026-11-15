"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../tutorial/small-tasks.js"), "utf8");
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup() {
  const motions = [];
  const motionPreference = { matches: false };
  const announcement = { textContent: "" };

  function button() {
    return { pressed: false, addEventListener(_, click) { this.click = click; }, setAttribute(_, value) { this.pressed = value === "true"; } };
  }

  const frames = [50, 60, 70].map((value, index) => {
    const marker = {
      dataset: { diagramPosition: String(value) },
      animate(keyframes) {
        let finish, cancel;
        const finished = new Promise((resolve, reject) => { finish = resolve; cancel = reject; });
        motions.push({ keyframes, finish });
        return { finished, cancel };
      }
    };
    return {
      hidden: index !== 0,
      querySelector: selector => ({ textContent: selector === "[data-diagram-equation]" ? `${value} >= 60` : value < 60 ? "まだ届かない" : "届いた" }),
      querySelectorAll: () => [marker]
    };
  });
  const choices = frames.map(button);
  choices[0].pressed = true;
  const play = button();
  const controls = { hidden: true, querySelectorAll: () => choices, querySelector: () => play };
  const details = { open: true, addEventListener(_, toggle) { this.toggle = toggle; } };
  const figure = {
    dataset: { stepDiagram: "track" },
    querySelector: selector => selector === ".step-diagram-controls" ? controls : announcement,
    querySelectorAll: () => frames,
    closest: () => details,
    animate() {}
  };
  vm.runInNewContext(source, {
    document: { querySelectorAll: selector => selector === ".step-diagram[data-step-diagram]" ? [figure] : [] },
    window: { matchMedia: () => motionPreference },
    clearTimeout,
    setTimeout
  });
  return { choices, frames, motions, announcement, motionPreference, details, visible: () => frames.findIndex(frame => !frame.hidden) };
}

test("数値の移動が終わると、図と式と結果が同じケースに切り替わる", async () => {
  const diagram = setup();
  diagram.choices[1].click();
  assert.equal(diagram.visible(), 0);
  assert.equal(diagram.choices[0].pressed, true);
  assert.equal(diagram.motions[0].keyframes[0].left, "50%");
  assert.equal(diagram.motions[0].keyframes[1].left, "60%");
  diagram.motions[0].finish();
  await tick();
  assert.equal(diagram.visible(), 1);
  assert.equal(diagram.choices[1].pressed, true);
  assert.equal(diagram.announcement.textContent, "60 >= 60。届いた");
});

test("選び直しと閉じる操作は古い移動を取り消し、動きを減らす設定ではすぐ切り替える", async () => {
  const diagram = setup();
  diagram.choices[1].click();
  diagram.choices[2].click();
  diagram.motions[0].finish();
  await tick();
  assert.equal(diagram.visible(), 0);
  diagram.motions[1].finish();
  await tick();
  assert.equal(diagram.visible(), 2);
  diagram.choices[0].click();
  diagram.details.open = false;
  diagram.details.toggle({ currentTarget: diagram.details });
  diagram.motions[2].finish();
  await tick();
  assert.equal(diagram.visible(), 2);
  diagram.motionPreference.matches = true;
  diagram.details.open = true;
  diagram.choices[0].click();
  assert.equal(diagram.visible(), 0);
  assert.equal(diagram.motions.length, 3);
  assert.equal(diagram.announcement.textContent, "50 >= 60。まだ届かない");
});
