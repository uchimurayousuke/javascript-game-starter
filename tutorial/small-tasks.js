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
    if (button.dataset.copyState === "copied") globalThis.WorkshopEffects?.copied(button);
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

function setupStepDiagram(figure) {
  const controls = figure.querySelector(".step-diagram-controls");
  const frames = [...figure.querySelectorAll("[data-diagram-frame]")];
  const choices = [...controls.querySelectorAll("[data-diagram-choice]")];
  const play = controls.querySelector("[data-diagram-play]");
  const announcement = figure.querySelector("[data-diagram-announcement]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mode = figure.dataset.stepDiagram;
  let current = 0, timer = null, revision = 0, playing = false;
  let animations = [];

  function show(index) {
    frames[current].hidden = true;
    choices[current].setAttribute("aria-pressed", "false");
    current = index;
    const frame = frames[current];
    frame.hidden = false;
    choices[current].setAttribute("aria-pressed", "true");
    const rule = frame.querySelector("[data-diagram-equation]").textContent;
    const result = frame.querySelector("[data-diagram-result]").textContent;
    announcement.textContent = `${rule}。${result}`;
  }

  function clearAnimation() {
    for (const animation of animations) animation.cancel();
    animations = [];
  }

  function stop() {
    revision += 1;
    clearTimeout(timer);
    timer = null;
    playing = false;
    clearAnimation();
    play.textContent = "図を再生";
  }

  function change(index, complete = () => {}) {
    if (index === current || reduceMotion.matches || typeof figure.animate !== "function") {
      if (index !== current) show(index);
      complete();
      return;
    }

    const turn = revision;
    const previous = frames[current];
    const next = frames[index];
    const before = [...previous.querySelectorAll("[data-diagram-position]")];
    const after = [...next.querySelectorAll("[data-diagram-position]")];
    const property = mode === "track" ? "left" : "transform";
    const position = value => mode === "track" ? `${value}%` : `scaleX(${value / 100})`;
    animations = before.flatMap((marker, i) => {
      const from = marker.dataset.diagramPosition;
      const to = after[i].dataset.diagramPosition;
      if (from === to) return [];
      return [marker.animate([
        { [property]: position(from) }, { [property]: position(to) }
      ], { duration: 270, easing: "ease-in-out", fill: "forwards" })];
    });

    const moving = animations.length > 0;
    if (!moving) {
      show(index);
      const focus = [...next.querySelectorAll('[data-diagram-role]:not([data-diagram-role="neutral"])')];
      const highlighted = focus.length ? focus : [next.querySelector(".step-diagram-scene")];
      animations = highlighted.map(node => node.animate([
        { translate: "0 .25rem", opacity: .55 },
        { translate: "0 0", opacity: 1 }
      ], { duration: 210, easing: "ease-out" }));
    }

    function finish() {
      if (revision !== turn) return;
      if (moving) show(index);
      clearAnimation();
      complete();
    }

    Promise.all(animations.map(animation => animation.finished)).then(finish, finish);
  }

  for (const [index, button] of choices.entries()) {
    button.addEventListener("click", () => { stop(); change(index); });
  }

  play.addEventListener("click", () => {
    if (playing) { stop(); return; }
    stop();
    if (reduceMotion.matches) { change((current + 1) % frames.length); return; }
    show(0);
    playing = true;
    play.textContent = "止める";

    function schedule(index) {
      if (index >= frames.length) { stop(); return; }
      timer = setTimeout(() => change(index, () => schedule(index + 1)), 780);
    }

    schedule(1);
  });

  figure.closest("details")?.addEventListener("toggle", event => {
    if (!event.currentTarget.open) stop();
  });
  controls.hidden = false;
}

function setupStepPreview(preview) {
  const screen = preview.querySelector(".step-preview-screen");
  const gameDetails = screen.closest("details");
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
  if (gameDetails.open) loadImage();
  gameDetails.addEventListener("toggle", () => {
    if (gameDetails.open) {
      if (!image.getAttribute("src")) loadImage();
    } else if (timer !== null) {
      stop();
      show(false);
    }
  });
}

for (const figure of document.querySelectorAll(".lesson-figure[data-lesson-figure]")) setupLessonFigure(figure);
for (const figure of document.querySelectorAll(".step-diagram[data-step-diagram]")) setupStepDiagram(figure);
for (const preview of document.querySelectorAll(".step-preview")) setupStepPreview(preview);
for (const details of document.querySelectorAll(".lesson-operation-video")) {
  const video = details.querySelector("video");
  if (window.location.hash === `#${details.id}`) details.open = true;
  details.addEventListener("toggle", () => { if (!details.open) video.pause(); });
}
