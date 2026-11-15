"use strict";

document.querySelectorAll(".coin-task").forEach((task) => {
  const button = task.querySelector(".coin-copy-button");
  const code = task.querySelector(".coin-copy code");
  const status = task.querySelector(".coin-copy-status");
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
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      status.textContent = "自動でコピーできませんでした。コードを選択して Ctrl+C（Mac は Command+C）でコピーしてください。";
    } finally {
      copying = false;
    }
  });
});
