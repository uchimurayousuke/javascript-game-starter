"use strict";
(function (global) {
  function makeShortcut(href) {
    if (typeof href !== "string" || /[\r\n\u2028\u2029]/.test(href) || /%0[ad]|%e2%80%a[89]/i.test(href)) throw new Error("invalid address");
    const address = new URL(href);
    if (!["file:", "http:", "https:"].includes(address.protocol) || address.username || address.password) throw new Error("invalid address");
    return `[InternetShortcut]\r\nURL=${address.href}\r\n`;
  }
  function makeZip(filename, content) {
    const encoder = new TextEncoder();
    const name = encoder.encode(filename), data = encoder.encode(content);
    if (!name.length || name.length > 65535 || data.length > 0xffffffff - name.length - 128) throw new Error("invalid size");
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    const centralOffset = 30 + name.length + data.length;
    const centralSize = 46 + name.length;
    const bytes = new Uint8Array(centralOffset + centralSize + 22);
    const view = new DataView(bytes.buffer);
    const u16 = (offset, value) => view.setUint16(offset, value, true);
    const u32 = (offset, value) => view.setUint32(offset, value, true);
    u32(0, 0x04034b50); u16(4, 20); u16(6, 0x0800); u16(8, 0); u16(10, 0); u16(12, 33);
    u32(14, crc); u32(18, data.length); u32(22, data.length); u16(26, name.length); u16(28, 0);
    bytes.set(name, 30); bytes.set(data, 30 + name.length);
    const c = centralOffset;
    u32(c, 0x02014b50); u16(c + 4, 20); u16(c + 6, 20); u16(c + 8, 0x0800); u16(c + 10, 0); u16(c + 12, 0); u16(c + 14, 33);
    u32(c + 16, crc); u32(c + 20, data.length); u32(c + 24, data.length); u16(c + 28, name.length); u16(c + 30, 0); u16(c + 32, 0);
    u16(c + 34, 0); u16(c + 36, 0); u32(c + 38, 0); u32(c + 42, 0); bytes.set(name, c + 46);
    const e = centralOffset + centralSize;
    u32(e, 0x06054b50); u16(e + 4, 0); u16(e + 6, 0); u16(e + 8, 1); u16(e + 10, 1); u32(e + 12, centralSize); u32(e + 16, centralOffset); u16(e + 20, 0);
    return bytes;
  }
  const api = Object.freeze({makeShortcut, makeZip});
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;
  const buttons = document.querySelectorAll(".save-lesson-shortcut");
  const names = new Map([["entry", "教材を開く"], ["learning", "学びの入口"], ["setup", "準備と操作"], ["coin", "コインキャッチの教材"]]);
  if (typeof Blob === "undefined" || typeof TextEncoder === "undefined" || typeof URL.createObjectURL !== "function" || typeof URL.revokeObjectURL !== "function") return;
  for (const button of buttons) {
    const filename = names.get(button.dataset.shortcut);
    if (!filename) continue;
    button.hidden = false;
    button.addEventListener("click", () => {
      const status = document.getElementById(button.dataset.status);
      let objectUrl;
      try {
        const content = makeShortcut(global.location.href);
        const zip = makeZip(`${filename}.url`, content);
        objectUrl = URL.createObjectURL(new Blob([zip], {type:"application/zip"}));
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `${filename}-ショートカット.zip`;
        link.hidden = true;
        document.body.append(link);
        link.click();
        link.remove();
        if (status) status.textContent = "ZIPを展開し、中の.urlファイルをデスクトップに置いてください。";
      } catch (error) {
        if (status) status.textContent = "このページのショートカットを保存できません。教材を開く.htmlかブックマークを使ってください。";
      } finally {
        if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
    });
  }
})(globalThis);
