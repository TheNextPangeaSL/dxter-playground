// ---------------------------------------------------------------------------
// BuscaÓptimos – Bayesian Optimizer (Guided Mode)
// ---------------------------------------------------------------------------
// Implements a simplified Gaussian Process surrogate model with an
// Expected Improvement (EI) acquisition function. This runs entirely
// client-side to suggest the next best cells for the player to reveal.
// ---------------------------------------------------------------------------

import type {
  GridPosition,
  ObjectiveDirection,
  OptimizerConfig,
  Observation,
  SurrogatePrediction,
  Cell,
} from "@/types/game";

// ---------------------------------------------------------------------------
// Default optimizer configuration
// ---------------------------------------------------------------------------

export const DEFAULT_OPTIMIZER_CONFIG: OptimizerConfig = {
  lengthScale: 0.15,
  signalVariance: 1.0,
  noiseVariance: 0.01,
  explorationWeight: 2.0,
};

// ---------------------------------------------------------------------------
// Kernel Functions
// ---------------------------------------------------------------------------

/**
 * Squared Exponential (RBF / Gaussian) kernel.
 * k(x, x') = σ² · exp(-||x - x'||² / (2·l²))
 */
function rbfKernel(
  a: [number, number],
  b: [number, number],
  lengthScale: number,
  signalVariance: number,
): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const sqDist = dx * dx + dy * dy;
  return signalVariance * Math.exp(-sqDist / (2 * lengthScale * lengthScale));
}

// ---------------------------------------------------------------------------
// Matrix Utilities (small dense matrices – sufficient for our grid sizes)
// ---------------------------------------------------------------------------

type Matrix = number[][];

/** Create an n×n identity matrix scaled by a factor */
function identityMatrix(n: number, scale: number = 1.0): Matrix {
  const mat: Matrix = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = new Array(n).fill(0) as number[];
    row[i] = scale;
    mat.push(row);
  }
  return mat;
}

/** Add two matrices element-wise */
function matAdd(a: Matrix, b: Matrix): Matrix {
  const n = a.length;
  const result: Matrix = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      row.push(a[i]![j]! + b[i]![j]!);
    }
    result.push(row);
  }
  return result;
}

/**
 * Cholesky decomposition of a symmetric positive-definite matrix.
 * Returns the lower-triangular matrix L such that A = L · Lᵀ.
 * Uses the Cholesky–Banachiewicz algorithm.
 */
function choleskyDecomposition(a: Matrix): Matrix | null {
  const n = a.length;
  const L: Matrix = [];
  for (let i = 0; i < n; i++) {
    L.push(new Array(n).fill(0) as number[]);
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i]![k]! * L[j]![k]!;
      }

      if (i === j) {
        const diag = a[i]![i]! - sum;
        if (diag <= 0) {
          // Matrix is not positive definite; add jitter and retry
          return null;
        }
        L[i]![j] = Math.sqrt(diag);
      } else {
        L[i]![j] = (a[i]![j]! - sum) / L[j]![j]!;
      }
    }
  }

  return L;
}

/**
 * Solve L · x = b via forward substitution (L is lower-triangular).
 */
function forwardSolve(L: Matrix, b: number[]): number[] {
  const n = b.length;
  const x: number[] = new Array(n).fill(0) as number[];

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) {
      sum += L[i]![j]! * x[j]!;
    }
    x[i] = (b[i]! - sum) / L[i]![i]!;
  }

  return x;
}

/**
 * Solve Lᵀ · x = b via backward substitution (L is lower-triangular).
 */
function backwardSolve(L: Matrix, b: number[]): number[] {
  const n = b.length;
  const x: number[] = new Array(n).fill(0) as number[];

  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += L[j]![i]! * x[j]!;
    }
    x[i] = (b[i]! - sum) / L[i]![i]!;
  }

  return x;
}

/**
 * Solve A · x = b where A = L · Lᵀ (Cholesky solve).
 * First solve L · z = b, then Lᵀ · x = z.
 */
function choleskySolve(L: Matrix, b: number[]): number[] {
  const z = forwardSolve(L, b);
  return backwardSolve(L, z);
}

// ---------------------------------------------------------------------------
// Standard Normal CDF and PDF (for Expected Improvement)
// ---------------------------------------------------------------------------

/**
 * Approximation of the standard normal CDF Φ(x).
 * Uses the Abramowitz & Stegun approximation (error < 7.5e-8).
 */
function normalCDF(x: number): number {
  if (x < -8) return 0;
  if (x > 8) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;
  const y =
    1.0 -
    (a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5) *
      Math.exp((-absX * absX) / 2);

  return 0.5 * (1 + sign * y);
}

/**
 * Standard normal PDF φ(x).
 */
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// ---------------------------------------------------------------------------
// Gaussian Process
// ---------------------------------------------------------------------------

export class GaussianProcess {
  private config: OptimizerConfig;
  private observations: Observation[] = [];
  private L: Matrix | null = null;
  private alpha: number[] | null = null;
  private yMean: number = 0;
  private yStd: number = 1;

  constructor(config: Partial<OptimizerConfig> = {}) {
    this.config = { ...DEFAULT_OPTIMIZER_CONFIG, ...config };
  }

  /**
   * Fit the GP to the current set of observations.
   * Computes the Cholesky decomposition and alpha vector needed for prediction.
   */
  fit(observations: Observation[]): void {
    this.observations = [...observations];
    const n = observations.length;

    if (n === 0) {
      this.L = null;
      this.alpha = null;
      return;
    }

    // Normalize y values for numerical stability
    const yValues = observations.map((o) => o.y);
    this.yMean = yValues.reduce((sum, v) => sum + v, 0) / n;

    const variance =
      yValues.reduce((sum, v) => sum + (v - this.yMean) ** 2, 0) / n;
    this.yStd = Math.sqrt(variance) || 1;

    const yNormalized = yValues.map((v) => (v - this.yMean) / this.yStd);

    // Build the kernel matrix K(X, X)
    const K: Matrix = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(
          rbfKernel(
            observations[i]!.x,
            observations[j]!.x,
            this.config.lengthScale,
            this.config.signalVariance,
          ),
        );
      }
      K.push(row);
    }

    // Add noise to the diagonal: K + σ²_n · I
    const noiseMatrix = identityMatrix(n, this.config.noiseVariance);
    const Ky = matAdd(K, noiseMatrix);

    // Try Cholesky decomposition; add jitter if needed
    let L = choleskyDecomposition(Ky);
    let jitter = 1e-6;
    while (L === null && jitter < 1) {
      const jitterMat = identityMatrix(n, jitter);
      L = choleskyDecomposition(matAdd(Ky, jitterMat));
      jitter *= 10;
    }

    if (L === null) {
      // Fallback: we can't decompose, predictions will use prior only
      this.L = null;
      this.alpha = null;
      return;
    }

    this.L = L;
    this.alpha = choleskySolve(L, yNormalized);
  }

  /**
   * Predict the mean and standard deviation at a new point.
   */
  predict(xNew: [number, number]): SurrogatePrediction {
    const n = this.observations.length;

    if (n === 0 || this.L === null || this.alpha === null) {
      return {
        mean: this.yMean,
        std: Math.sqrt(this.config.signalVariance) * this.yStd,
        acquisition: 0,
      };
    }

    // k* = [k(x*, x₁), ..., k(x*, xₙ)]
    const kStar: number[] = [];
    for (let i = 0; i < n; i++) {
      kStar.push(
        rbfKernel(
          xNew,
          this.observations[i]!.x,
          this.config.lengthScale,
          this.config.signalVariance,
        ),
      );
    }

    // Predictive mean: μ* = k*ᵀ · α
    let meanNorm = 0;
    for (let i = 0; i < n; i++) {
      meanNorm += kStar[i]! * this.alpha[i]!;
    }

    // Predictive variance: σ*² = k(x*, x*) - v · v  where L · v = k*
    const kSelf = rbfKernel(
      xNew,
      xNew,
      this.config.lengthScale,
      this.config.signalVariance,
    );
    const v = forwardSolve(this.L, kStar);
    let vDotV = 0;
    for (let i = 0; i < n; i++) {
      vDotV += v[i]! * v[i]!;
    }
    const varianceNorm = Math.max(0, kSelf - vDotV);
    const stdNorm = Math.sqrt(varianceNorm);

    // De-normalize
    const mean = meanNorm * this.yStd + this.yMean;
    const std = stdNorm * this.yStd;

    return { mean, std, acquisition: 0 };
  }
}

// ---------------------------------------------------------------------------
// Acquisition Functions
// ---------------------------------------------------------------------------

/**
 * Expected Improvement (EI) acquisition function.
 *
 * EI(x) = (μ(x) - f_best - ξ) · Φ(Z) + σ(x) · φ(Z)
 *   where Z = (μ(x) - f_best - ξ) / σ(x)
 *
 * For minimization we negate: EI(x) = (f_best - μ(x) - ξ) · Φ(Z) + σ(x) · φ(Z)
 *   where Z = (f_best - μ(x) - ξ) / σ(x)
 */
export function expectedImprovement(
  prediction: SurrogatePrediction,
  bestValue: number,
  objective: ObjectiveDirection,
  xi: number = 0.01,
): number {
  const { mean, std } = prediction;

  if (std < 1e-12) return 0;

  let improvement: number;
  if (objective === "maximize") {
    improvement = mean - bestValue - xi;
  } else {
    improvement = bestValue - mean - xi;
  }

  const Z = improvement / std;
  const ei = improvement * normalCDF(Z) + std * normalPDF(Z);

  return Math.max(0, ei);
}

/**
 * Upper Confidence Bound (UCB) acquisition function.
 * UCB(x) = μ(x) + κ·σ(x)   (for maximization)
 * UCB(x) = -μ(x) + κ·σ(x)  (for minimization, we maximize the negative)
 */
export function upperConfidenceBound(
  prediction: SurrogatePrediction,
  objective: ObjectiveDirection,
  kappa: number = 2.0,
): number {
  const { mean, std } = prediction;

  if (objective === "maximize") {
    return mean + kappa * std;
  } else {
    return -mean + kappa * std;
  }
}

// ---------------------------------------------------------------------------
// Bayesian Optimizer (main interface for guided mode)
// ---------------------------------------------------------------------------

export class BayesianOptimizer {
  private gp: GaussianProcess;
  private observations: Observation[] = [];
  private objective: ObjectiveDirection;
  private gridSize: number;

  constructor(
    gridSize: number,
    objective: ObjectiveDirection,
    config: Partial<OptimizerConfig> = {},
  ) {
    this.gridSize = gridSize;
    this.objective = objective;

    // Adapt length scale to grid size
    const adaptedConfig: Partial<OptimizerConfig> = {
      ...config,
      lengthScale: config.lengthScale ?? Math.max(0.05, 3.0 / gridSize),
    };

    this.gp = new GaussianProcess(adaptedConfig);
  }

  /**
   * Add a new observation from a revealed cell.
   */
  addObservation(position: GridPosition, value: number): void {
    const xNorm: [number, number] = [
      position.col / (this.gridSize - 1),
      position.row / (this.gridSize - 1),
    ];
    this.observations.push({ x: xNorm, y: value });
  }

  /**
   * Clear all observations and reset the model.
   */
  reset(): void {
    this.observations = [];
  }

  /**
   * Get the current best observed value.
   */
  getBestObservedValue(): number {
    if (this.observations.length === 0) {
      return this.objective === "maximize" ? -Infinity : Infinity;
    }

    const values = this.observations.map((o) => o.y);
    return this.objective === "maximize"
      ? Math.max(...values)
      : Math.min(...values);
  }

  /**
   * Suggest the next best cells to reveal.
   *
   * This fits the GP to all observations, evaluates the acquisition function
   * at every unrevealed cell, and returns the top-K positions.
   *
   * @param grid - The current game grid (to know which cells are unrevealed)
   * @param count - How many suggestions to return
   * @returns Array of suggested GridPositions sorted by acquisition value (descending)
   */
  suggest(grid: Cell[][], count: number): GridPosition[] {
    if (this.observations.length === 0) {
      return this.suggestInitialPoints(grid, count);
    }

    // Fit the GP to current observations
    this.gp.fit(this.observations);

    const bestValue = this.getBestObservedValue();

    // Evaluate acquisition function at every unrevealed cell
    // For large grids, we subsample candidates for performance
    const candidates = this.getCandidateCells(grid);
    const scored: Array<{ position: GridPosition; acquisition: number }> = [];

    for (const cell of candidates) {
      const xNorm: [number, number] = [
        cell.col / (this.gridSize - 1),
        cell.row / (this.gridSize - 1),
      ];

      const prediction = this.gp.predict(xNorm);

      // Use Expected Improvement as the primary acquisition function
      const ei = expectedImprovement(prediction, bestValue, this.objective);

      // Add a UCB bonus weighted by exploration factor for diversity
      const ucb = upperConfidenceBound(prediction, this.objective, 1.0);

      // Combined acquisition: primarily EI, with a small UCB component
      const acquisition = ei + 0.1 * Math.max(0, ucb);

      scored.push({
        position: { row: cell.row, col: cell.col },
        acquisition,
      });
    }

    // Sort by acquisition value (highest = most promising)
    scored.sort((a, b) => b.acquisition - a.acquisition);

    // Enforce minimum spacing between suggestions for diversity
    const selected: GridPosition[] = [];
    const minSpacing = Math.max(2, Math.floor(this.gridSize / 10));

    for (const candidate of scored) {
      if (selected.length >= count) break;

      const tooClose = selected.some((s) => {
        const dr = Math.abs(s.row - candidate.position.row);
        const dc = Math.abs(s.col - candidate.position.col);
        return dr < minSpacing && dc < minSpacing;
      });

      if (!tooClose) {
        selected.push(candidate.position);
      }
    }

    // If we didn't get enough due to spacing constraints, relax and fill
    if (selected.length < count) {
      for (const candidate of scored) {
        if (selected.length >= count) break;
        const alreadySelected = selected.some(
          (s) =>
            s.row === candidate.position.row &&
            s.col === candidate.position.col,
        );
        if (!alreadySelected) {
          selected.push(candidate.position);
        }
      }
    }

    return selected.slice(0, count);
  }

  /**
   * Get the GP's prediction at a specific grid position.
   * Useful for visualization (uncertainty heatmap, etc.).
   */
  predictAt(position: GridPosition): SurrogatePrediction {
    const xNorm: [number, number] = [
      position.col / (this.gridSize - 1),
      position.row / (this.gridSize - 1),
    ];
    return this.gp.predict(xNorm);
  }

  /**
   * Generate initial suggestions using a space-filling Latin Hypercube-like strategy.
   * Used before any observations exist.
   */
  private suggestInitialPoints(grid: Cell[][], count: number): GridPosition[] {
    const suggestions: GridPosition[] = [];

    // Place points in a spread-out pattern
    const offsets = this.generateSpreadPoints(count);

    for (const [xFrac, yFrac] of offsets) {
      const row = Math.min(
        this.gridSize - 1,
        Math.max(0, Math.round(yFrac * (this.gridSize - 1))),
      );
      const col = Math.min(
        this.gridSize - 1,
        Math.max(0, Math.round(xFrac * (this.gridSize - 1))),
      );

      const cell = grid[row]?.[col];
      if (cell && !cell.revealed) {
        const alreadyAdded = suggestions.some(
          (s) => s.row === row && s.col === col,
        );
        if (!alreadyAdded) {
          suggestions.push({ row, col });
        }
      }
    }

    // Fill remaining with evenly spaced grid points
    if (suggestions.length < count) {
      for (let i = 1; i <= count - suggestions.length + 5; i++) {
        for (let j = 1; j <= count - suggestions.length + 5; j++) {
          if (suggestions.length >= count) break;
          const row = Math.round((i * this.gridSize) / (count + 1));
          const col = Math.round((j * this.gridSize) / (count + 1));
          if (
            row >= 0 &&
            row < this.gridSize &&
            col >= 0 &&
            col < this.gridSize
          ) {
            const cell = grid[row]?.[col];
            if (cell && !cell.revealed) {
              const alreadyAdded = suggestions.some(
                (s) => s.row === row && s.col === col,
              );
              if (!alreadyAdded) {
                suggestions.push({ row, col });
              }
            }
          }
        }
        if (suggestions.length >= count) break;
      }
    }

    return suggestions.slice(0, count);
  }

  /**
   * Generate well-spread fractional coordinates for initial sampling.
   * Uses a simple stratified approach.
   */
  private generateSpreadPoints(count: number): Array<[number, number]> {
    const points: Array<[number, number]> = [];

    // Start with corners and center
    const keyPoints: Array<[number, number]> = [
      [0.5, 0.5], // center
      [0.2, 0.2], // top-left area
      [0.8, 0.2], // top-right area
      [0.2, 0.8], // bottom-left area
      [0.8, 0.8], // bottom-right area
      [0.5, 0.2], // top center
      [0.2, 0.5], // left center
      [0.8, 0.5], // right center
      [0.5, 0.8], // bottom center
      [0.35, 0.35], // inner offsets
      [0.65, 0.35],
      [0.35, 0.65],
      [0.65, 0.65],
    ];

    for (let i = 0; i < Math.min(count, keyPoints.length); i++) {
      points.push(keyPoints[i]!);
    }

    return points;
  }

  /**
   * Get candidate cells for acquisition function evaluation.
   * For very large grids, subsamples to keep computation tractable.
   */
  private getCandidateCells(grid: Cell[][]): Cell[] {
    const unrevealed: Cell[] = [];
    for (const row of grid) {
      for (const cell of row) {
        if (!cell.revealed) {
          unrevealed.push(cell);
        }
      }
    }

    // If the grid is manageable, evaluate everything
    const maxCandidates = 2000;
    if (unrevealed.length <= maxCandidates) {
      return unrevealed;
    }

    // For very large grids, use a stratified subsample
    // First, always include cells near observed points (local exploitation)
    const nearObserved: Set<string> = new Set();
    const radius = Math.max(2, Math.floor(this.gridSize / 15));

    for (const obs of this.observations) {
      const obsRow = Math.round(obs.x[1] * (this.gridSize - 1));
      const obsCol = Math.round(obs.x[0] * (this.gridSize - 1));

      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const r = obsRow + dr;
          const c = obsCol + dc;
          if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
            nearObserved.add(`${r},${c}`);
          }
        }
      }
    }

    const localCandidates = unrevealed.filter((cell) =>
      nearObserved.has(`${cell.row},${cell.col}`),
    );

    // Then, add a uniform random subsample for global exploration
    const remaining = unrevealed.filter(
      (cell) => !nearObserved.has(`${cell.row},${cell.col}`),
    );
    const globalBudget = Math.max(200, maxCandidates - localCandidates.length);

    // Deterministic subsampling using stride
    const stride = Math.max(1, Math.floor(remaining.length / globalBudget));
    const globalCandidates: Cell[] = [];
    for (
      let i = 0;
      i < remaining.length && globalCandidates.length < globalBudget;
      i += stride
    ) {
      globalCandidates.push(remaining[i]!);
    }

    return [...localCandidates, ...globalCandidates];
  }
}

// ---------------------------------------------------------------------------
// Factory function for convenience
// ---------------------------------------------------------------------------

/**
 * Create a new BayesianOptimizer instance configured for a game session.
 */
export function createOptimizer(
  gridSize: number,
  objective: ObjectiveDirection,
  config?: Partial<OptimizerConfig>,
): BayesianOptimizer {
  return new BayesianOptimizer(gridSize, objective, config);
}
