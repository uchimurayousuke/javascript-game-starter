"use strict";

document.querySelectorAll(".coin-task").forEach((task) => {
  const button = task.querySelector(".coin-copy-button");
  const code = task.querySelector(".coin-copy code");
  const status = task.querySelector(".coin-copy-status");
  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(code.textContent);
      status.textContent = "コピーしました。";
    } catch (_) {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      status.textContent = "自動でコピーできませんでした。コードを選択して Ctrl+C（Mac は Command+C）でコピーしてください。";
    }
  });
});
