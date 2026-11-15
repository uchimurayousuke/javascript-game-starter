"use strict";

document.querySelectorAll(".lesson-task").forEach((task) => {
  const button = task.querySelector(".task-copy-button");
  const code = task.querySelector(".task-code code");
  const status = task.querySelector(".task-copy-status");
  if (!button || !code || !status) return;
  let copying = false;
  button.hidden = false;
  button.addEventListener("click", async () => {
    if (copying) return;
    copying = true;
    delete button.dataset.copyState;
    status.textContent = "";
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(code.textContent);
      button.dataset.copyState = "copied";
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
    } finally {
      copying = false;
    }
  });
});
