"use strict";

document.querySelectorAll(".lesson-task").forEach((task) => {
  const button = task.querySelector(".task-copy-button");
  const code = task.querySelector(".task-code code");
  const status = task.querySelector(".task-copy-status");
  if (!button || !code || !status) return;
  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(code.textContent);
      status.textContent = "コピーしました。";
    } catch (_) {
      try {
        const selection = typeof window.getSelection === "function" ? window.getSelection() : null;
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(code);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (_) {
      }
      status.textContent = "自動でコピーできませんでした。コードを選択して Ctrl+C（Mac は Command+C）でコピーしてください。";
    }
  });
});
