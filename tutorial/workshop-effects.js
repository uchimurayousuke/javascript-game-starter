"use strict";

(() => {
  const effects = globalThis.SakugaFX;
  if (!effects || typeof Path2D !== "function") return;

  const style = getComputedStyle(document.body);
  const colors = {
    fill: "--lesson-step-gold",
    shade: "--lesson-line-soft",
    line: "--workshop-edge",
    accent: "--lesson-link",
  };
  for (const [color, variable] of Object.entries(colors)) {
    const value = style.getPropertyValue(variable).trim();
    if (value) effects.P[color] = value;
  }

  function pointInView(target, across, down) {
    if (!target || effects.calm || document.hidden) return null;

    const point = effects.at(target, across, down);
    const x = point.x - scrollX;
    const y = point.y - scrollY;
    if (!point.w || !point.h || x < 0 || x > innerWidth || y < 0 || y > innerHeight) return null;

    return point;
  }

  function celebrate(target, across = 0.5) {
    const point = pointInView(target, across, 0.5);
    if (!point) return;

    const y = point.y - 11;
    effects.burst(point.x, y, { r: 13, spikes: 9, life: 0.29 });
    effects.shards(point.x, y, { n: 5, speed: 95, size: 4, arc: 2.1, grav: 165, life: 0.42 });
  }

  function copied(button) {
    const point = pointInView(button, 0.95, 0.15);
    if (!point) return;

    effects.kira(point.x - 6, point.y - 5, { r: 8, life: 0.36 });
    effects.ticks(point.x, point.y, { n: 3, r: 5, len: 13, dir: -1.1, life: 0.3 });
  }

  globalThis.WorkshopEffects = { celebrate, copied };
})();
