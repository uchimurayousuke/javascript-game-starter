"use strict";

(() => {
  const script = document.currentScript;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const hover = matchMedia("(hover: hover)");
  const style = getComputedStyle(document.body);
  const color = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  const palette = {
    fill: color("--lesson-step-gold", "#ffd35a"),
    shade: color("--lesson-line-soft", "#c5e3ee"),
    line: color("--workshop-edge", "#1e293b"),
    accent: color("--lesson-link", "#146bb5"),
  };
  const rubberBand = [
    { offset: 0, scale: "1 1" },
    { offset: 0.3, scale: "1.07 .95" },
    { offset: 0.4, scale: ".96 1.04" },
    { offset: 0.5, scale: "1.035 .975" },
    { offset: 0.65, scale: ".99 1.015" },
    { offset: 0.75, scale: "1.015 .99" },
    { offset: 1, scale: "1 1" },
  ];
  const flip = [
    { offset: 0, transform: "perspective(600px) rotateX(11deg)", transformOrigin: "top" },
    { offset: 0.4, transform: "perspective(600px) rotateX(-3deg)", transformOrigin: "top" },
    { offset: 0.6, transform: "perspective(600px) rotateX(2deg)", transformOrigin: "top" },
    { offset: 0.8, transform: "perspective(600px) rotateX(-1deg)", transformOrigin: "top" },
    { offset: 1, transform: "perspective(600px) rotateX(0deg)", transformOrigin: "top" },
  ];
  const animations = new Map();
  const lastBurst = new WeakMap();
  let sakugaReady;
  let confettiReady;
  let activeConfetti;

  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const asset = document.createElement("script");
      asset.src = new URL(path, script.src).href;
      asset.addEventListener("load", resolve, { once: true });
      asset.addEventListener("error", () => {
        asset.remove();
        reject();
      }, { once: true });
      document.head.append(asset);
    });
  }

  const mayAnimate = target => target?.isConnected && !document.hidden && !motion.matches;

  function visiblePoint(target, across, down) {
    const bounds = target.getBoundingClientRect();
    const x = bounds.left + bounds.width * across;
    const y = bounds.top + bounds.height * down;
    if (!bounds.width || !bounds.height || x < 0 || x > innerWidth || y < 0 || y > innerHeight) return null;
    return { x, y };
  }

  function animate(target, frames, duration, easing = "ease-out") {
    if (!mayAnimate(target) || typeof target.animate !== "function") return;
    animations.get(target)?.cancel();
    const animation = target.animate(frames, { duration, easing });
    animations.set(target, animation);
    function clear() {
      if (animations.get(target) === animation) animations.delete(target);
    }
    animation.finished.then(clear, clear);
  }

  function paint(target, across, down, draw, stillCurrent = () => true) {
    if (!mayAnimate(target) || !visiblePoint(target, across, down) || typeof Path2D !== "function") return;

    const time = performance.now();
    if (time - (lastBurst.get(target) ?? -Infinity) < 290) return;
    lastBurst.set(target, time);
    sakugaReady ??= loadScript("vendor/sakuga-vfx/core.js").then(() => {
      const effects = globalThis.SakugaFX;
      Object.assign(effects.P, palette);
      return effects;
    }).catch(() => { sakugaReady = null; });

    void sakugaReady.then(effects => {
      if (!effects || !mayAnimate(target) || !stillCurrent() || performance.now() - time > 750) return;
      const point = visiblePoint(target, across, down);
      if (point) draw(effects, point.x + scrollX, point.y + scrollY);
    });
  }

  function celebrate(target, across = 0.5, stillCurrent) {
    paint(target, across, 0.5, (effects, x, y) => {
      effects.burst(x, y - 11, { r: 13, spikes: 9, life: 0.29 });
      effects.shards(x, y - 11, { n: 5, speed: 95, size: 4, arc: 2.1, grav: 165, life: 0.42 });
    }, stillCurrent);
  }

  function sparkle(target, across = 0.95, stillCurrent) {
    paint(target, across, 0.15, (effects, x, y) => {
      effects.kira(x - 6, y - 5, { r: 8, life: 0.36 });
      effects.ticks(x, y, { n: 3, r: 5, len: 13, dir: -1.1, life: 0.3 });
    }, stillCurrent);
  }

  function ring(target, across, down, stillCurrent) {
    paint(target, across, down, (effects, x, y) => {
      effects.ring(x, y, { rx: 12, ry: 7, life: 0.33, w: 3 });
    }, stillCurrent);
  }

  function paperBurst(target, stillCurrent) {
    if (!mayAnimate(target) || activeConfetti) return;
    const time = performance.now();
    confettiReady ??= loadScript("vendor/canvas-confetti/confetti.browser.js")
      .then(() => globalThis.confetti)
      .catch(() => { confettiReady = null; });
    void confettiReady.then(confetti => {
      if (!confetti || activeConfetti || !mayAnimate(target) || !stillCurrent() || performance.now() - time > 750) return;
      const point = visiblePoint(target, 0.9, 0.5);
      if (!point) return;

      const canvas = document.createElement("canvas");
      canvas.className = "workshop-confetti";
      canvas.width = 144;
      canvas.height = 108;
      canvas.setAttribute("aria-hidden", "true");
      const left = Math.max(0, Math.min(point.x - canvas.width / 2, innerWidth - canvas.width));
      const top = Math.max(0, Math.min(point.y - 78, innerHeight - canvas.height));
      Object.assign(canvas.style, {
        position: "fixed", left: left + "px", top: top + "px",
        pointerEvents: "none", zIndex: "100",
      });
      const launch = confetti.create(canvas, { disableForReducedMotion: true });
      activeConfetti = launch;
      document.body.append(canvas);
      const finished = launch({
        particleCount: 14, startVelocity: 13, spread: 78, gravity: 0.85, ticks: 38, scalar: 0.64,
        colors: [palette.fill, palette.shade, palette.accent],
        shapes: ["star", "square", "circle"],
        origin: { x: (point.x - left) / canvas.width, y: (point.y - top) / canvas.height },
      });
      function clear() {
        canvas.remove();
        if (activeConfetti === launch) activeConfetti = null;
      }
      Promise.resolve(finished).then(clear, clear);
    });
  }

  function matched(heading, stillCurrent) {
    celebrate(heading, 0.78, stillCurrent);
    paperBurst(heading, stillCurrent);
  }

  function copied(button) {
    sparkle(button, 0.95, () => button.dataset.copyState === "copied");
  }

  function openFold(summary) {
    const details = summary.parentElement;
    if (details.open) return;
    requestAnimationFrame(() => {
      if (!details.open || !mayAnimate(details)) return;
      if (details.matches(".workbook-quiz, .exercise-hint, .exercise-answer, .lesson-mobile-toc")) {
        animate(summary, flip, 290);
      }
      ring(summary, 0.94, 0.46, () => details.open);
    });
  }

  function highlightStep(link) {
    const anchor = document.getElementById(link.hash.slice(1));
    const section = anchor?.matches(".toc-anchor") ? anchor.nextElementSibling : anchor;
    const heading = section?.matches("h1, h2") ? section : section?.querySelector("h1, h2");
    requestAnimationFrame(() => {
      animate(heading, [
        { boxShadow: "inset 0 -4px 0 " + palette.fill },
        { boxShadow: "inset 0 0 0 transparent" },
      ], 460);
      sparkle(heading, 0.94);
    });
  }

  function reactToClick(event) {
    const control = event.target.closest?.("summary, button, a");
    if (event.defaultPrevented || !mayAnimate(control)) return;
    if (control.matches("summary")) {
      openFold(control);
    } else if (control.matches("a[download]")) {
      sparkle(control);
    } else if (control.matches('a[href^="#"]:not([href="#"])')) {
      highlightStep(control);
    } else if (control.matches("button[data-diagram-choice], button[data-figure-pick], button[data-visual-action], button[data-preview-action], button[data-diagram-play]")) {
      ring(control, 0.92, 0.18);
      animate(control, rubberBand, 310);
    }
  }

  function reactToCard(event) {
    const card = event.target.closest?.(".workshop-route, .catalog-page main article");
    if (!card || card.contains(event.relatedTarget)) return;
    const decoration = card.querySelector(".catalog-badge") ?? card.querySelector("img");
    animate(decoration, rubberBand, 360);
  }

  document.addEventListener("click", reactToClick);
  document.addEventListener("focusin", reactToCard);
  document.addEventListener("pointerover", event => {
    if (hover.matches && event.pointerType !== "touch") reactToCard(event);
  });
  document.addEventListener("change", event => {
    if (event.target.matches("select#chapter, select#file-kind")) sparkle(event.target);
  });
  document.addEventListener("play", event => {
    if (event.target.matches("video")) ring(event.target, 0.94, 0.12);
  }, true);
  motion.addEventListener?.("change", () => {
    document.querySelector(".sakuga-fx")?.toggleAttribute("hidden", motion.matches);
    if (!motion.matches) return;
    activeConfetti?.reset();
    for (const animation of animations.values()) animation.cancel();
  });

  globalThis.WorkshopEffects = { celebrate, copied, matched };
})();
