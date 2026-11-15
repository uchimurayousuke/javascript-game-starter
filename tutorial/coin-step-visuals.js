"use strict";

const coinVisualMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function coinVisualControls(figure, actions) {
  const controls = figure.querySelector(".coin-visual-controls");
  let moving = false;
  controls.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-visual-action]");
    if (!button || moving) return;
    moving = true;
    try {
      await actions[button.dataset.visualAction]();
    } finally {
      moving = false;
    }
  });
  controls.hidden = false;
}

function coinVisualSelect(figure, action) {
  for (const button of figure.querySelectorAll("[aria-pressed]")) {
    button.setAttribute("aria-pressed", String(button.dataset.visualAction === action));
  }
}

function coinVisualReport(figure, message) {
  figure.querySelector("[data-visual-result]").textContent = message;
  figure.querySelector("svg title").textContent = message;
}

function coinVisualAnimate(node, from, to, draw) {
  if (coinVisualMotion.matches || typeof node.animate !== "function") {
    draw();
    return;
  }
  const animation = node.animate([from, to], { duration: 320, easing: "ease-in-out", fill: "forwards" });
  return animation.finished.catch(() => {}).then(() => {
    draw();
    animation.cancel();
  });
}

function setupCoinArc(figure) {
  const stroke = figure.querySelector("[data-arc-stroke]");
  const label = figure.querySelector("[data-arc-value]");
  let offset = 50;
  function changeAngle(nextOffset, action, word, message) {
    if (nextOffset === offset) return;
    return coinVisualAnimate(stroke, { strokeDashoffset: offset }, { strokeDashoffset: nextOffset }, () => {
      offset = nextOffset;
      stroke.style.strokeDashoffset = offset;
      label.textContent = word;
      coinVisualReport(figure, message);
      coinVisualSelect(figure, action);
    });
  }
  coinVisualControls(figure, {
    half: () => changeAngle(50, "half", "半周", "Math.PI → 半周（180度）"),
    full: () => changeAngle(0, "full", "一周", "Math.PI * 2 → 一周（360度）"),
  });
}

function setupCoinFall(figure) {
  const coin = figure.querySelector("[data-fall-coin]");
  const label = figure.querySelector("[data-fall-y]");
  const start = Number(figure.dataset.visualMin);
  const end = Number(figure.dataset.visualMax);
  const scale = Number(figure.dataset.visualScale);
  let y = start;
  let speed = 3;

  function draw(position, message) {
    y = position;
    coin.setAttribute("transform", `translate(0 ${(y - start) * scale})`);
    label.textContent = String(y);
    coinVisualReport(figure, message);
  }

  function selectSpeed(nextSpeed) {
    speed = nextSpeed;
    coinVisualSelect(figure, `speed-${speed}`);
    draw(start, `今は ${start}。次のコマで ${speed} を足すと ${start + speed}。`);
  }

  function advance() {
    const nextY = y + speed;
    if (nextY > end) {
      coinVisualReport(figure, `今は ${y}。「戻す」で80から試せます。`);
      return;
    }
    const from = { transform: `translateY(${(y - start) * scale}px)` };
    const to = { transform: `translateY(${(nextY - start) * scale}px)` };
    return coinVisualAnimate(coin, from, to, () => draw(nextY, `${y} + ${speed} = ${nextY}。下へ${speed}。`));
  }

  coinVisualControls(figure, {
    advance,
    "speed-3": () => selectSpeed(3),
    "speed-6": () => selectSpeed(6),
    reset: () => selectSpeed(speed),
  });
}

function setupCoinKeys(figure) {
  const tray = figure.querySelector("[data-key-tray]");
  const label = figure.querySelector("[data-key-x]");
  const start = Number(label.textContent);
  const min = Number(figure.dataset.visualMin);
  const max = Number(figure.dataset.visualMax);
  const scale = Number(figure.dataset.visualScale);
  let x = start;

  function draw(position, message) {
    x = position;
    tray.setAttribute("transform", `translate(${(x - start) * scale} 0)`);
    label.textContent = String(x);
    coinVisualReport(figure, message);
  }

  function move(amount, direction, sign) {
    const nextX = x + amount;
    if (nextX < min || nextX > max) {
      coinVisualReport(figure, `左端の x は ${x}。もう一度試すときは「中央に戻す」を押そう。`);
      return;
    }
    const from = { transform: `translateX(${(x - start) * scale}px)` };
    const to = { transform: `translateX(${(nextX - start) * scale}px)` };
    return coinVisualAnimate(tray, from, to, () => draw(nextX, `${x} ${sign} 6 = ${nextX}。${direction}へ 6 動いた！`));
  }

  coinVisualControls(figure, {
    left: () => move(-6, "左", "−"),
    right: () => move(6, "右", "+"),
    reset: () => draw(start, `今は x = ${start}。左へ −6、右へ ＋6。`),
  });
}

function setupCoinScore(figure) {
  const test = figure.querySelector("[data-score-test]");
  const coins = figure.querySelectorAll("[data-score-coin]");
  function compare(score) {
    for (const coin of coins) coin.dataset.filled = String(Number(coin.dataset.scoreCoin) <= score);
    test.textContent = `${score} >= 5`;
    const cleared = score >= 5;
    figure.dataset.cleared = String(cleared);
    coinVisualReport(figure, cleared ? "5枚。5は5以上だからクリア！" : "4枚。目標は5枚。あと1枚！");
    coinVisualSelect(figure, `score-${score}`);
  }
  coinVisualControls(figure, { "score-4": () => compare(4), "score-5": () => compare(5) });
}

const coinVisualSetups = { arc: setupCoinArc, fall: setupCoinFall, keys: setupCoinKeys, score: setupCoinScore };
for (const figure of document.querySelectorAll("[data-coin-visual]")) {
  coinVisualSetups[figure.dataset.coinVisual](figure);
}
for (const details of document.querySelectorAll(".coin-operation-video")) {
  details.addEventListener("toggle", () => {
    if (!details.open) details.querySelector("video").pause();
  });
}
