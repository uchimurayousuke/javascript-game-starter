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

function setupLessonFigure(figure) {
  const controls = figure.querySelector(".lesson-figure-controls");
  const frames = [...figure.querySelectorAll("[data-figure-frame]")];
  const buttons = [...controls.querySelectorAll("[data-figure-pick]")];
  const result = figure.querySelector("[data-figure-result]");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const frame = frames.find(item => item.dataset.figureFrame === button.dataset.figurePick);
      for (const item of frames) item.toggleAttribute("hidden", item !== frame);
      for (const choice of buttons) choice.setAttribute("aria-pressed", String(choice === button));
      result.textContent = frame.dataset.frameLabel;
    });
  }
  controls.hidden = false;
}

function setupStepPreview(preview) {
  const screen = preview.querySelector(".step-preview-screen");
  const image = screen.querySelector("img");
  const result = preview.querySelector("[data-preview-result]");
  const controls = preview.querySelector(".step-preview-controls");
  const previous = controls.querySelector('[data-preview-action="previous"]');
  const current = controls.querySelector('[data-preview-action="current"]');
  const advance = controls.querySelector('[data-preview-action="advance"]');
  const play = controls.querySelector('[data-preview-action="play"]');
  const frames = screen.dataset.frames.split(",").map(Number);
  const columns = Number(screen.dataset.columns);
  const code = [...preview.querySelectorAll("[data-preview-code]")];
  let position = 0, timer = null;

  function show(before, announce = true) {
    const frame = before ? Number(screen.dataset.previous) : frames[position];
    screen.style.setProperty("--tile-x", frame % columns);
    screen.style.setProperty("--tile-y", Math.floor(frame / columns));
    previous.setAttribute("aria-pressed", String(before));
    current.setAttribute("aria-pressed", String(!before));
    for (const example of code) example.hidden = example.dataset.previewCode !== (before ? "previous" : "current");
    if (announce) {
      const caption = before ? screen.dataset.previousLabel : position === 0 ? screen.dataset.currentLabel : `${screen.dataset.action}　${position + 1} / ${frames.length}`;
      result.textContent = caption;
      screen.setAttribute("aria-label", caption);
    }
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
    if (play) play.textContent = "動きを見る";
  }

  function showNext() {
    position = (position + 1) % frames.length;
    show(false);
  }

  function startPlayback() {
    if (timer !== null) {
      stop();
      show(false);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      position = frames.length - 1;
      show(false);
      return;
    }
    position = 0;
    show(false);
    play.textContent = "止める";
    const next = () => {
      position += 1;
      const finished = position === frames.length - 1;
      show(false, finished);
      if (finished) stop();
      else timer = setTimeout(next, 220);
    };
    timer = setTimeout(next, 220);
  }

  previous.addEventListener("click", () => { stop(); position = 0; show(true); });
  current.addEventListener("click", () => { stop(); position = 0; show(false); });
  if (advance) advance.addEventListener("click", () => { stop(); showNext(); });
  if (play) play.addEventListener("click", startPlayback);
  function loadImage() {
    image.addEventListener("load", () => { controls.hidden = false; }, { once: true });
    image.addEventListener("error", () => {
      result.textContent = "画面を読み込めませんでした。「見本を別ページで開く」から確かめられます。";
    }, { once: true });
    image.src = image.dataset.src;
  }
  if (window.location.hash === `#${preview.id}`) preview.open = true;
  if (preview.open) loadImage();
  preview.addEventListener("toggle", () => {
    if (preview.open) {
      if (!image.getAttribute("src")) loadImage();
    } else if (timer !== null) {
      stop();
      show(false);
    }
  });
}

for (const figure of document.querySelectorAll(".lesson-figure[data-lesson-figure]")) setupLessonFigure(figure);
for (const preview of document.querySelectorAll(".step-preview")) setupStepPreview(preview);
for (const details of document.querySelectorAll(".lesson-operation-video")) {
  const video = details.querySelector("video");
  if (window.location.hash === `#${details.id}`) details.open = true;
  details.addEventListener("toggle", () => { if (!details.open) video.pause(); });
}
