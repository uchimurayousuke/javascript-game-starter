"use strict";
(function (global) {
  const MAX_CHARS = 120 * 1024;
  const MAX_LINES = 600;
  const MAX_LINE = 3000;

  function linesOf(value) {
    if (typeof value !== "string") throw new TypeError("文字を入力してください。");
    if (value.length > MAX_CHARS) throw new RangeError("文字数が多すぎます。120,000文字程度までに分けてください。");
    const text = value.replace(/\r\n?/g, "\n").replace(/\n$/, "");
    if (!text) return [];
    const lines = text.split("\n");
    if (lines.length > MAX_LINES) throw new RangeError("行が多すぎます。600行までに分けてください。");
    if (lines.some(line => line.length > MAX_LINE)) throw new RangeError("長すぎる行があります。1行は3000文字までにしてください。");
    return lines;
  }

  function whitespaceSafe(lines, type) {
    if (type !== "script.js") return false;
    const text = lines.join("\n");
    if (text.includes("`") || /\\\n/.test(text)) return false;
    for (const line of lines) {
      let quote = "", escape = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (quote) {
          if (escape) escape = false;
          else if (c === "\\") escape = true;
          else if (c === quote) quote = "";
        } else if (c === "/" && line[i + 1] === "/") break;
        else if (c === "/" && line[i + 1] === "*") return false;
        else if (c === "/" && line[i + 1] !== "=") {
          const before = line.slice(0, i).trimEnd();
          if (!before || /[=([{,:!?;]$/.test(before) || /\b(?:return|throw|case|yield)\s*$/.test(before)) return false;
        } else if (c === "'" || c === '"') quote = c;
      }
      if (quote) return false;
    }
    return true;
  }

  function compare(userText, referenceText, options = {}) {
    const own = linesOf(userText), ref = linesOf(referenceText);
    const requested = Boolean(options.ignoreWhitespace || options.ignoreBlankLines);
    const safe = requested && whitespaceSafe(own, options.type) && whitespaceSafe(ref, options.type);
    const ignore = Boolean(options.ignoreWhitespace) && safe;
    const ignoreBlank = Boolean(options.ignoreBlankLines) && safe;
    const clean = line => ignore ? line.replace(/^[ \t]+|[ \t]+$/g, "") : line;
    const prepare = lines => lines.map((text, index) => ({text, number:index + 1})).filter(line => !ignoreBlank || /[^ \t]/.test(line.text));
    const left = prepare(own), right = prepare(ref);
    const a = left.map(line => clean(line.text)), b = right.map(line => clean(line.text)), width = b.length + 1;
    const dp = new Uint16Array((a.length + 1) * width);
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        const pos = i * width + j;
        dp[pos] = a[i] === b[j] ? 1 + dp[(i + 1) * width + j + 1] : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
      }
    }
    const raw = [];
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) raw.push({kind:"same", own:left[i++], ref:right[j++]});
      else if (j === b.length || (i < a.length && dp[(i + 1) * width + j] >= dp[i * width + j + 1])) raw.push({kind:"own", own:left[i++], ref:null});
      else raw.push({kind:"reference", own:null, ref:right[j++]});
    }
    const rows = [];
    for (let at = 0; at < raw.length;) {
      if (raw[at].kind === "same") { rows.push(raw[at++]); continue; }
      const left = [], right = [];
      while (at < raw.length && raw[at].kind !== "same") {
        if (raw[at].own) left.push(raw[at].own); else right.push(raw[at].ref);
        at++;
      }
      for (let k = 0; k < Math.max(left.length, right.length); k++) {
        rows.push({kind:left[k] && right[k] ? "changed" : left[k] ? "own" : "reference", own:left[k] || null, ref:right[k] || null});
      }
    }
    return {rows, identical:rows.every(row => row.kind === "same"), ignoredWhitespace:ignore, ignoredBlankLines:ignoreBlank, whitespaceUnavailable:requested && !safe};
  }

  function changedParts(a, b) {
    const left = Array.from(a), right = Array.from(b);
    let start = 0, endA = left.length, endB = right.length;
    while (start < endA && start < endB && left[start] === right[start]) start++;
    while (endA > start && endB > start && left[endA - 1] === right[endB - 1]) { endA--; endB--; }
    return {start:left.slice(0,start).join("").length, endA:left.slice(0,endA).join("").length, endB:right.slice(0,endB).join("").length};
  }

  const api = Object.freeze({compare, changedParts, linesOf, whitespaceSafe, MAX_CHARS, MAX_LINES, MAX_LINE});
  global.CompareEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
