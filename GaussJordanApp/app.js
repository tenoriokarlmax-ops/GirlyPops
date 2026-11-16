import { formatNumber, gaussJordan } from "./matrix.js";

const examples = {
  classic: {
    name: "Classic 3 × 3",
    matrix: [
      [2, 1, -1, 8],
      [-3, -1, 2, -11],
      [-2, 1, 2, -3],
    ],
  },
  infinite: {
    name: "Dependent system",
    matrix: [
      [1, 2, -1, 3],
      [2, 4, -2, 6],
      [-1, -2, 1, -3],
    ],
  },
  inconsistent: {
    name: "No solution",
    matrix: [
      [1, 1, 2],
      [2, 2, 5],
    ],
  },
};

const state = {
  rows: 3,
  variables: 3,
  matrix: examples.classic.matrix.map((row) => [...row]),
};

const matrixRoot = document.querySelector("#matrix-input");
const resultRoot = document.querySelector("#result");
const stepsRoot = document.querySelector("#steps");
const equationCount = document.querySelector("#equation-count");
const variableCount = document.querySelector("#variable-count");
const exampleSelect = document.querySelector("#example-select");

function renderMatrix() {
  equationCount.textContent = state.rows;
  variableCount.textContent = state.variables;
  matrixRoot.style.setProperty("--columns", state.variables + 1);
  matrixRoot.replaceChildren();

  for (let row = 0; row < state.rows; row += 1) {
    for (let column = 0; column <= state.variables; column += 1) {
      if (column === state.variables) {
        const divider = document.createElement("span");
        divider.className = "matrix-divider";
        divider.setAttribute("aria-hidden", "true");
        matrixRoot.append(divider);
      }

      const input = document.createElement("input");
      input.type = "number";
      input.step = "any";
      input.inputMode = "decimal";
      input.value = state.matrix[row]?.[column] ?? 0;
      input.setAttribute(
        "aria-label",
        column === state.variables
          ? `Equation ${row + 1} constant`
          : `Equation ${row + 1}, coefficient ${column + 1}`,
      );
      input.addEventListener("input", () => {
        state.matrix[row][column] = input.value;
        clearOutput();
      });
      matrixRoot.append(input);
    }
  }
}

function resize(nextRows, nextVariables) {
  state.matrix = Array.from({ length: nextRows }, (_, row) =>
    Array.from({ length: nextVariables + 1 }, (_, column) => {
      if (column === nextVariables) {
        return state.matrix[row]?.[state.variables] ?? 0;
      }
      return state.matrix[row]?.[column] ?? (row === column ? 1 : 0);
    }),
  );
  state.rows = nextRows;
  state.variables = nextVariables;
  exampleSelect.value = "";
  renderMatrix();
  clearOutput();
}

function solve() {
  try {
    const answer = gaussJordan(state.matrix);
    renderResult(answer);
    renderSteps(answer.steps);
    resultRoot.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    resultRoot.hidden = false;
    resultRoot.className = "result-card result-card--error";
    resultRoot.innerHTML = `<p class="eyebrow">Check your matrix</p><h2>${escapeHtml(error.message)}</h2>`;
    stepsRoot.hidden = true;
  }
}

function renderResult(answer) {
  resultRoot.hidden = false;
  resultRoot.className = `result-card result-card--${answer.type}`;

  const solutions =
    answer.type === "unique"
      ? `<div class="solution-grid">${answer.solutions
          .map(
            (value, index) =>
              `<div><span>x<sub>${index + 1}</sub></span><strong>${formatNumber(value)}</strong></div>`,
          )
          .join("")}</div>`
      : "";

  resultRoot.innerHTML = `
    <div>
      <p class="eyebrow">Analysis complete</p>
      <h2>${answer.summary}</h2>
      <p>${answer.detail}</p>
    </div>
    ${solutions}
  `;
}

function renderSteps(steps) {
  stepsRoot.hidden = false;
  stepsRoot.innerHTML = `
    <div class="section-heading">
      <div><p class="eyebrow">Row operations</p><h2>Solution path</h2></div>
      <span class="step-count">${steps.length} steps</span>
    </div>
    <div class="step-list">
      ${steps
        .map(
          (step, index) => `
            <details ${index === steps.length - 1 ? "open" : ""}>
              <summary><span>${String(index + 1).padStart(2, "0")}</span>${step.label}</summary>
              ${matrixMarkup(step.matrix)}
            </details>
          `,
        )
        .join("")}
    </div>
  `;
}

function matrixMarkup(matrix) {
  return `<div class="display-matrix" style="--columns:${matrix[0].length}">
    ${matrix
      .flatMap((row) =>
        row.map(
          (value, index) =>
            `${index === row.length - 1 ? '<i aria-hidden="true"></i>' : ""}<span>${formatNumber(value)}</span>`,
        ),
      )
      .join("")}
  </div>`;
}

function clearOutput() {
  resultRoot.hidden = true;
  stepsRoot.hidden = true;
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

document.querySelector("#solve-button").addEventListener("click", solve);
document.querySelector("#clear-button").addEventListener("click", () => {
  state.matrix = Array.from({ length: state.rows }, () =>
    Array.from({ length: state.variables + 1 }, () => 0),
  );
  exampleSelect.value = "";
  renderMatrix();
  clearOutput();
});

document.querySelectorAll("[data-dimension]").forEach((button) => {
  button.addEventListener("click", () => {
    const dimension = button.dataset.dimension;
    const delta = Number(button.dataset.delta);
    const next = Math.min(5, Math.max(2, state[dimension] + delta));
    resize(
      dimension === "rows" ? next : state.rows,
      dimension === "variables" ? next : state.variables,
    );
  });
});

exampleSelect.addEventListener("change", () => {
  const example = examples[exampleSelect.value];
  if (!example) return;
  state.rows = example.matrix.length;
  state.variables = example.matrix[0].length - 1;
  state.matrix = example.matrix.map((row) => [...row]);
  renderMatrix();
  clearOutput();
});

renderMatrix();
solve();