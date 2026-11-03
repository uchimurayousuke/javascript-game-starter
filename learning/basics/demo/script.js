const button = document.querySelector("#add");
const score = document.querySelector("#score");
let points = 0;
button.addEventListener("click", () => {
  points += 1;
  score.textContent = points;
});
