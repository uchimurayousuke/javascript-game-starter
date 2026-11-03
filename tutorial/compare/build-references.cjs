"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const chapters = JSON.parse(fs.readFileSync(path.join(__dirname, "chapters.json"), "utf8"));
const references = chapters.map(chapter => ({
  ...chapter,
  files: Object.fromEntries(Object.entries(chapter.sources).map(([name, source]) => [name, fs.readFileSync(path.join(root, source), "utf8")]))
}));
const output = JSON.stringify(references).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
fs.writeFileSync(path.join(__dirname, "references.js"), `"use strict";\nglobalThis.CHAPTER_REFERENCES = ${output};\n`, "utf8");
process.stdout.write(`${references.length} chapters\n`);
