const EPSILON = 1e-10;

export function gaussJordan(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("Enter at least one equation.");
  }

  const width = input[0]?.length;
  if (!width || width < 2 || input.some((row) => row.length !== width)) {
    throw new Error("Every row must contain the same number of values.");
  }

  const matrix = input.map((row) =>
    row.map((value) => {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        throw new Error("Every matrix entry must be a valid number.");
      }
      return number;
    }),
  );

  const steps = [{ label: "Starting augmented matrix", matrix: clone(matrix) }];
  let pivotRow = 0;

  for (let column = 0; column < width - 1 && pivotRow < matrix.length; column += 1) {
    let bestRow = pivotRow;
    for (let row = pivotRow + 1; row < matrix.length; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[bestRow][column])) {
        bestRow = row;
      }
    }

    if (nearZero(matrix[bestRow][column])) continue;

    if (bestRow !== pivotRow) {
      [matrix[pivotRow], matrix[bestRow]] = [matrix[bestRow], matrix[pivotRow]];
      steps.push({
        label: `Swap R${pivotRow + 1} and R${bestRow + 1}`,
        matrix: clone(matrix),
      });
    }

    const pivot = matrix[pivotRow][column];
    if (!nearZero(pivot - 1)) {
      matrix[pivotRow] = matrix[pivotRow].map((value) => clean(value / pivot));
      steps.push({
        label: `Scale R${pivotRow + 1} by ${formatNumber(1 / pivot)}`,
        matrix: clone(matrix),
      });
    }

    for (let row = 0; row < matrix.length; row += 1) {
      if (row === pivotRow || nearZero(matrix[row][column])) continue;
      const factor = matrix[row][column];
      matrix[row] = matrix[row].map((value, index) =>
        clean(value - factor * matrix[pivotRow][index]),
      );
      steps.push({
        label: `R${row + 1} ← R${row + 1} ${factor < 0 ? "+" : "−"} ${formatNumber(Math.abs(factor))}R${pivotRow + 1}`,
        matrix: clone(matrix),
      });
    }

    pivotRow += 1;
  }

  const result = classify(matrix);
  steps.push({ label: "Reduced row echelon form", matrix: clone(matrix) });
  return { matrix, steps, ...result };
}

function classify(matrix) {
  const variables = matrix[0].length - 1;
  const contradictory = matrix.some(
    (row) => row.slice(0, variables).every(nearZero) && !nearZero(row[variables]),
  );

  if (contradictory) {
    return {
      type: "none",
      summary: "No solution",
      detail: "The system contains a contradiction.",
      solutions: [],
    };
  }

  const pivots = matrix.filter((row) => row.slice(0, variables).some((value) => !nearZero(value)));
  if (pivots.length < variables) {
    return {
      type: "infinite",
      summary: "Infinitely many solutions",
      detail: `${variables - pivots.length} free ${variables - pivots.length === 1 ? "variable remains" : "variables remain"}.`,
      solutions: [],
    };
  }

  const solutions = Array.from({ length: variables }, (_, column) => {
    const row = matrix.find((candidate) => !nearZero(candidate[column]));
    return clean(row?.[variables] ?? 0);
  });

  return {
    type: "unique",
    summary: "Unique solution",
    detail: "Every variable has a pivot.",
    solutions,
  };
}

function clone(matrix) {
  return matrix.map((row) => [...row]);
}

function clean(value) {
  if (nearZero(value)) return 0;
  const integer = Math.round(value);
  return Math.abs(value - integer) < EPSILON ? integer : value;
}

function nearZero(value) {
  return Math.abs(value) < EPSILON;
}

export function formatNumber(value) {
  if (nearZero(value)) return "0";
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(4)).toString();
}