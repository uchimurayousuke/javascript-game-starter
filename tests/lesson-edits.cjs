"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const chapters = require("../tutorial/compare/chapters.json");

const root = path.resolve(__dirname, "..");
const fileNames = ["index.html", "style.css", "script.js"];
const read = file => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const entities = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'", "#10": "\n" };
const decode = value => value.replace(/&(amp|lt|gt|quot|#39|#x27|#10);/g, (_, key) => entities[key]);

function applyLessonEdits(files, section, label) {
  const blocks = [...section.matchAll(/<pre class="(?:task-code|coin-copy)"><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g)];
  assert.ok(blocks.length, label + " has code to copy");
  for (const [, attributes, source] of blocks) {
    const fields = Object.fromEntries([...attributes.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, decode(value)]));
    const file = fields["data-small-file"];
    const marker = fields["data-small-match"];
    const separator = fields["data-small-separator"];
    const action = fields["data-small-action"];
    const code = decode(source);
    assert.ok(Object.hasOwn(files, file), label + " edits a starter file");
    assert.ok(marker && files[file].split(marker).length === 2, label + " has one matching marker: " + marker);
    assert.equal(typeof separator, "string", label + " specifies spacing");
    assert.ok(["replace", "before", "after"].includes(action), label + " describes the edit");
    const replacement = action === "replace" ? code : action === "before" ? code + separator + marker : marker + separator + code;
    files[file] = files[file].replace(marker, () => replacement);
  }
}

function starterFolder(page) {
  if (page === "tutorial/extensions/tutorial.html" || page === "learning/combine/tutorial.html") return "tutorial/05-game";
  if (page.startsWith("examples/") && page.endsWith("/extensions/tutorial.html")) {
    return path.posix.join(path.posix.dirname(page), "../complete");
  }
  return "template";
}

function verifyLessonSteps(page) {
  const items = chapters.filter(chapter => chapter.page === page);
  const html = read(page);
  const sections = [...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].map(section => section[0]);
  const start = starterFolder(page);
  const files = Object.fromEntries(fileNames.map(file => [file, read(start + "/" + file)]));
  assert.ok(items.length, page + " has lessons");
  if (page === "tutorial/index.html") {
    const preparation = sections.find(section => section.startsWith('<section id="preparation"'));
    assert.ok(preparation, page + " preparation");
    applyLessonEdits(files, preparation, "preparation");
  }

  const edited = new Set(["script.js"]);
  if (page === "tutorial/index.html") for (const name of fileNames) edited.add(name);
  for (const chapter of items) {
    const section = sections.find(section => section.includes("?chapter=" + chapter.id + '"'));
    assert.ok(section, chapter.id);
    for (const [, file] of section.matchAll(/data-small-file="([^"]+)"/g)) edited.add(file);
    applyLessonEdits(files, section, chapter.id);
    const stageFolder = path.posix.dirname(chapter.game);
    for (const file of fileNames) assert.ok(fs.existsSync(path.join(root, stageFolder, file)), chapter.id + " has " + file);
    for (const file of edited) assert.equal(files[file], read(stageFolder + "/" + file), chapter.id + " " + file);
    new vm.Script(files["script.js"], { filename: chapter.id + ".js" });
  }
  if (page !== "tutorial/index.html") {
    const complete = path.posix.join(path.posix.dirname(page), "complete/script.js");
    assert.equal(files["script.js"], read(complete), page + " reaches the completed game");
  }
  return items;
}

module.exports = { applyLessonEdits, verifyLessonSteps };
