"use strict";
(function () {
  const entries = globalThis.CHAPTER_REFERENCES;
  const engine = globalThis.CompareEngine;
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const el = id => document.getElementById(id);
  const chapter = el("chapter"), kind = el("file-kind"), file = el("file-input"), input = el("own-code");
  const ignore = el("ignore-space"), ignoreBlank = el("ignore-blank"), filter = el("differences-only"), button = el("compare-button");
  const status = el("status"), result = el("result"), output = el("diff-output"), count = el("result-count");
  const description = el("chapter-description"), back = el("back-link"), game = el("game-link"), resultGame = el("result-game-link"), help = el("matching-help");
  const stepContext = el("step-context"), expectationHeading = el("expectation-heading"), expectations = el("step-expectations");
  let hasInput = false, pending = false, revision = 0, comparison = null;

  function setStatus(message) { status.textContent = message; }
  function clearResult() {
    comparison = null;
    result.hidden = true;
    output.replaceChildren();
    help.hidden = true;
  }
  function clearInput() {
    revision++;
    pending = false;
    hasInput = false;
    input.value = "";
    file.value = "";
    button.disabled = false;
    clearResult();
  }
  function updateChapter() {
    clearInput();
    const entry = byId.get(chapter.value);
    back.hidden = !entry;
    game.hidden = !entry;
    if (!entry) {
      back.removeAttribute("href"); game.removeAttribute("href");
      stepContext.hidden = true;
      expectations.replaceChildren();
      description.textContent = "教材から開くと、そのステップが選ばれます。";
      setStatus("比べるステップを選んでください。");
      return;
    }
    const debug = entry.page === "learning/debug/index.html";
    description.textContent = `教材：${entry.title} / ${entry.stepLabel}`;
    expectationHeading.textContent = debug ? "この練習の修正版で確認すること" : "このステップが終わったとき";
    const list = document.createDocumentFragment();
    for (const text of entry.expectations) { const item = document.createElement("li"); item.textContent = text; list.append(item); }
    expectations.replaceChildren(list);
    stepContext.hidden = false;
    back.textContent = debug ? "元の練習へ戻る" : "元のステップへ戻る";
    game.textContent = debug ? "この練習の修正版を開く" : "このステップの見本ゲームを開く";
    resultGame.textContent = game.textContent;
    back.href = `../../${entry.page}#${encodeURIComponent(entry.anchor)}`;
    game.href = `../../${entry.game}`;
    resultGame.href = game.href;
    setStatus(`${kind.value}を選ぶか、コードを貼り付けてください。`);
  }
  function expectedKind(name) {
    const lower = name.toLowerCase();
    if (lower.endsWith(".js")) return "script.js";
    if (lower.endsWith(".css")) return "style.css";
    if (lower.endsWith(".html") || lower.endsWith(".htm")) return "index.html";
    return null;
  }
  function cell(side, line, state, other) {
    const box = document.createElement("div");
    box.className = `diff-cell diff-${state}`;
    const label = document.createElement("p");
    label.className = "diff-label";
    const display = {same:"同じ", changed:"違う", own:"自分だけ", reference:"見本だけ"};
    const name = side === "own" ? "自分" : "見本";
    label.textContent = line ? `${name} ${line.number}行目：${display[state]}` : `${name}：行なし`;
    box.append(label);
    if (!line) return box;
    const pre = document.createElement("pre");
    if (line.text.length > 24) pre.tabIndex = 0;
    pre.setAttribute("aria-label", `${name}の${line.number}行目`);
    const code = document.createElement("code");
    if (state === "changed" && other) {
      const parts = side === "own" ? engine.changedParts(line.text, other.text) : engine.changedParts(other.text, line.text);
      const end = side === "own" ? parts.endA : parts.endB;
      code.append(document.createTextNode(line.text.slice(0, parts.start)));
      const mark = document.createElement("mark");
      mark.textContent = line.text.slice(parts.start, end);
      code.append(mark, document.createTextNode(line.text.slice(end)));
    } else code.textContent = line.text;
    pre.append(code);
    box.append(pre);
    return box;
  }
  function showRows() {
    if (!comparison) return;
    const visible = comparison.rows.filter(row => !filter.checked || row.kind !== "same");
    const fragment = document.createDocumentFragment();
    for (const row of visible) {
      const pair = document.createElement("div");
      pair.className = "diff-row";
      pair.append(cell("own", row.own, row.kind, row.ref), cell("reference", row.ref, row.kind, row.own));
      fragment.append(pair);
    }
    output.replaceChildren(fragment);
    count.textContent = visible.length ? `${visible.length}組の行を表示しています。` : "表示する違いはありません。";
  }

  let group, previousPage = "";
  for (const entry of entries) {
    if (entry.page !== previousPage) {
      group = document.createElement("optgroup");
      group.label = entry.title;
      chapter.append(group);
      previousPage = entry.page;
    }
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = entry.stepLabel;
    group.append(option);
  }
  chapter.addEventListener("change", updateChapter);
  kind.addEventListener("change", () => {
    clearInput();
    setStatus(`${kind.value}を選ぶか、コードを貼り付けてください。`);
  });
  input.addEventListener("input", () => {
    revision++;
    pending = false;
    button.disabled = false;
    file.value = "";
    hasInput = true;
    clearResult();
    setStatus(`${kind.value}の入力を受け付けました。「比べる」を押してください。`);
  });
  file.addEventListener("change", async () => {
    revision++;
    const current = revision, selected = file.files[0];
    pending = false;
    button.disabled = false;
    hasInput = false;
    input.value = "";
    clearResult();
    if (!selected) { setStatus("ファイルを選ぶか、コードを貼り付けてください。"); return; }
    const detected = expectedKind(selected.name);
    if (detected && detected !== kind.value) {
      file.value = "";
      setStatus(`選んだファイルは${detected}ですが、比較する種類は${kind.value}です。種類を合わせて選び直してください。`);
      return;
    }
    if (selected.size > engine.MAX_CHARS) {
      file.value = "";
      setStatus("ファイルが大きすぎます。120KBまでに分けてください。");
      return;
    }
    pending = true;
    button.disabled = true;
    setStatus(`${kind.value}を読み込み中です。`);
    try {
      const text = await selected.text();
      if (current !== revision) return;
      engine.linesOf(text);
      input.value = text;
      hasInput = true;
      setStatus(`${kind.value}を読み込みました。「比べる」を押してください。`);
    } catch (error) {
      if (current !== revision) return;
      file.value = "";
      setStatus(error instanceof RangeError ? error.message : "ファイルを読み込めません。もう一度選ぶか、コードを貼り付けてください。");
    } finally {
      if (current === revision) { pending = false; button.disabled = false; }
    }
  });
  ignore.addEventListener("change", () => { clearResult(); setStatus("空白の扱いを変えました。もう一度「比べる」を押してください。"); });
  ignoreBlank.addEventListener("change", () => { clearResult(); setStatus("空白行の扱いを変えました。もう一度「比べる」を押してください。"); });
  filter.addEventListener("change", showRows);
  button.addEventListener("click", () => {
    clearResult();
    const entry = byId.get(chapter.value);
    if (!entry) { setStatus("比べるステップを選んでください。"); return; }
    if (pending) { setStatus("ファイルの読み込みが終わるまで待ってください。"); return; }
    if (!hasInput) { setStatus(`${kind.value}を選ぶか、コードを貼り付けてください。`); return; }
    try {
      comparison = engine.compare(input.value, entry.files[kind.value], {type:kind.value, ignoreWhitespace:ignore.checked, ignoreBlankLines:ignoreBlank.checked});
      const ignored = [];
      if (comparison.ignoredWhitespace) ignored.push("行頭・行末の空白");
      if (comparison.ignoredBlankLines) ignored.push("空白だけの行");
      const how = ignored.length ? `（${ignored.join("と")}を無視）` : "";
      const warning = comparison.whitespaceUnavailable ? (kind.value === "script.js" ? " 複数行の文字列や判別が難しい記号があるため、空白をそのまま比べました。" : " HTML・CSSは空白をそのまま比べました。") : "";
      setStatus((comparison.identical ? `見本と同じです${how}。` : `見本との違いがあります${how}。`) + warning);
      filter.checked = true;
      result.hidden = false;
      help.hidden = !comparison.identical;
      showRows();
      result.focus();
    } catch (error) { setStatus(error instanceof RangeError ? error.message : "比較できませんでした。入力を確かめてください。"); }
  });
  const requested = new URLSearchParams(window.location.search).get("chapter");
  if (requested && byId.has(requested)) { chapter.value = requested; updateChapter(); }
  else {
    updateChapter();
    if (requested) setStatus("指定されたステップが見つかりません。一覧から選び直してください。");
  }
})();
