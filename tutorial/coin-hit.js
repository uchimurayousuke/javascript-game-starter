"use strict";

const coinHitDemo = document.querySelector("[data-coin-hit-demo]");
const coinHitStill = document.querySelector("[data-coin-hit-still]");

if (coinHitDemo && coinHitStill) {
  const token = coinHitDemo.querySelector("[data-coin-hit-token]");
  const centerLabel = coinHitDemo.querySelector("[data-coin-hit-center]");
  const bottomLabel = coinHitDemo.querySelector("[data-coin-hit-bottom]");
  const gap = coinHitDemo.querySelector("[data-coin-hit-gap]");
  const readout = coinHitDemo.querySelector(".coin-hit-readout");
  const sum = coinHitDemo.querySelector("[data-coin-hit-sum]");
  const comparison = coinHitDemo.querySelector("[data-coin-hit-comparison]");
  const result = coinHitDemo.querySelector("[data-coin-hit-result]");
  const lower = coinHitDemo.querySelector("[data-coin-hit-lower]");
  const reset = coinHitDemo.querySelector("[data-coin-hit-reset]");

  const startY = 370;
  const coinRadius = 14;
  const playerY = 385;
  const diagramStep = Number(token.dataset.step);
  let coinY = startY;

  function drawCoinHit() {
    const bottomY = coinY + coinRadius;
    const caught = bottomY >= playerY;
    const lowered = coinY > startY;

    token.setAttribute("transform", `translate(0 ${(coinY - startY) * diagramStep})`);
    centerLabel.textContent = String(coinY);
    bottomLabel.textContent = String(bottomY);
    gap.setAttribute("visibility", caught ? "hidden" : "visible");

    sum.textContent = `${coinY} + ${coinRadius} = ${bottomY}`;
    comparison.textContent = `${bottomY} >= ${playerY}`;
    result.textContent = caught ? "キャッチ！ ぴったり届いた" : "あと1ピクセルで届く";
    readout.dataset.caught = String(caught);
    lower.setAttribute("aria-disabled", String(lowered));
    reset.setAttribute("aria-disabled", String(!lowered));
  }

  lower.addEventListener("click", () => {
    if (coinY !== startY) return;
    coinY += 1;
    drawCoinHit();
  });

  reset.addEventListener("click", () => {
    if (coinY === startY) return;
    coinY = startY;
    drawCoinHit();
  });

  drawCoinHit();
  coinHitStill.hidden = true;
  coinHitDemo.hidden = false;
}
