// ---------------------------------------------------------------------------
// BuscaÓptimos – DxTER Oracle-Guided Optimizer
// ---------------------------------------------------------------------------
// Instead of a real Bayesian Optimizer (GP + EI), DxTER uses an
// "oracle-guided" strategy: it peeks at the actual grid values (which
// are precomputed) and progressively narrows its suggestions from
// "good" to "great" to "optimal" as the player reveals more cells.
//
// This creates a satisfying demo experience where:
//   - First ask:  suggestions are clearly better than random (~top 30%)
//   - Second ask: suggestions improve noticeably (~top 15%)
//   - Third ask:  suggestions are near-optimal (~top 5%)
//   - Later asks: can pinpoint the global optimum
//
// The player perceives DxTER as "learning" from revealed data, when in
// reality DxTER always knows the landscape but strategically withholds
// the best answers to create a rewarding progression arc.
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
// Default optimizer configuration (kept for API compatibility)
// ---------------------------------------------------------------------------

export const DEFAULT_OPTIMIZER_CONFIG: OptimizerConfig = {
  lengthScale: 0.2,
  signalVariance: 2.0,
  noiseVariance: 0.05,
  explorationWeight: 2.5,
};

// ---------------------------------------------------------------------------
// Lightweight GP (kept for predictAt visualization API)
// ---------------------------------------------------------------------------

/**
 * Squared Exponential (RBF) kernel.
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
// Deterministic seeded PRNG (for reproducible shuffling within a game)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Acquisition functions (exported for API compatibility)
// ---------------------------------------------------------------------------

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

function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

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
// Lightweight Gaussian Process (for predictAt API only)
// ---------------------------------------------------------------------------

type Matrix = number[][];

function identityMatrix(n: number, scale: number = 1.0): Matrix {
  const mat: Matrix = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = new Array(n).fill(0) as number[];
    row[i] = scale;
    mat.push(row);
  }
  return mat;
}

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
        if (diag <= 0) return null;
        L[i]![j] = Math.sqrt(diag);
      } else {
        L[i]![j] = (a[i]![j]! - sum) / L[j]![j]!;
      }
    }
  }
  return L;
}

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

function choleskySolve(L: Matrix, b: number[]): number[] {
  const z = forwardSolve(L, b);
  return backwardSolve(L, z);
}

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

  fit(observations: Observation[]): void {
    this.observations = [...observations];
    const n = observations.length;
    if (n === 0) {
      this.L = null;
      this.alpha = null;
      return;
    }

    const yValues = observations.map((o) => o.y);
    this.yMean = yValues.reduce((sum, v) => sum + v, 0) / n;

    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const yRange = yMax - yMin;
    const variance =
      yValues.reduce((sum, v) => sum + (v - this.yMean) ** 2, 0) / n;
    const sampleStd = Math.sqrt(variance);
    this.yStd = Math.max(sampleStd, yRange * 0.5, 15);

    const yNormalized = yValues.map((v) => (v - this.yMean) / this.yStd);

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

    const noiseMatrix = identityMatrix(n, this.config.noiseVariance);
    const Ky = matAdd(K, noiseMatrix);

    let L = choleskyDecomposition(Ky);
    let jitter = 1e-6;
    while (L === null && jitter < 1) {
      const jitterMat = identityMatrix(n, jitter);
      L = choleskyDecomposition(matAdd(Ky, jitterMat));
      jitter *= 10;
    }

    if (L === null) {
      this.L = null;
      this.alpha = null;
      return;
    }

    this.L = L;
    this.alpha = choleskySolve(L, yNormalized);
  }

  predict(xNew: [number, number]): SurrogatePrediction {
    const n = this.observations.length;
    if (n === 0 || this.L === null || this.alpha === null) {
      return {
        mean: this.yMean,
        std: Math.sqrt(this.config.signalVariance) * this.yStd,
        acquisition: 0,
      };
    }

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

    let meanNorm = 0;
    for (let i = 0; i < n; i++) {
      meanNorm += kStar[i]! * this.alpha[i]!;
    }

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

    const mean = meanNorm * this.yStd + this.yMean;
    const std = stdNorm * this.yStd;

    return { mean, std, acquisition: 0 };
  }
}

// ---------------------------------------------------------------------------
// Oracle-Guided Bayesian Optimizer
// ---------------------------------------------------------------------------
// DxTER uses the actual grid values to produce suggestions that are
// genuinely helpful. The "learning" illusion comes from progressively
// narrowing the selection window as more cells are revealed.
// ---------------------------------------------------------------------------

export class BayesianOptimizer {
  private gp: GaussianProcess;
  private observations: Observation[] = [];
  private objective: ObjectiveDirection;
  private gridSize: number;
  /** Number of times suggest() has been called (= DxTER asks) */
  private askCount: number = 0;
  /** Seeded PRNG for deterministic-but-varied suggestions */
  private rng: () => number;

  constructor(
    gridSize: number,
    objective: ObjectiveDirection,
    config: Partial<OptimizerConfig> = {},
  ) {
    this.gridSize = gridSize;
    this.objective = objective;
    this.rng = mulberry32(Date.now());

    const adaptedConfig: Partial<OptimizerConfig> = {
      ...config,
      lengthScale: config.lengthScale ?? Math.max(0.15, 5.0 / gridSize),
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
    this.askCount = 0;
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
   * Uses an oracle-guided strategy: DxTER peeks at the actual grid values
   * and selects from progressively better cells as the player reveals more.
   *
   * The progression creates a satisfying arc:
   *   Ask 1 (0 obs):  "Good" cells — clearly better than random
   *   Ask 2 (3 obs):  "Great" cells — noticeable improvement
   *   Ask 3 (6 obs):  "Near-optimal" cells — getting warm!
   *   Ask 4+ (9+ obs): Can include the global optimum
   */
  suggest(grid: Cell[][], count: number): GridPosition[] {
    this.askCount++;

    // Fit the GP for predictAt() compatibility
    if (this.observations.length > 0) {
      this.gp.fit(this.observations);
    }

    // Collect unrevealed cells and sort by value
    const unrevealed = this.getUnrevealedSorted(grid);
    if (unrevealed.length === 0) return [];
    if (unrevealed.length <= count) {
      return unrevealed.map((c) => ({ row: c.row, col: c.col }));
    }

    const nObs = this.observations.length;

    // -----------------------------------------------------------------
    // Progress factor: how "learned" DxTER pretends to be
    // Reaches 1.0 after roughly one-observation-per-grid-row of data.
    // askCount also contributes — each consultation makes DxTER "smarter".
    // -----------------------------------------------------------------
    const dataProgress = Math.min(1, nObs / this.gridSize);
    const askProgress = Math.min(1, this.askCount / 4);
    const progress = Math.min(1, Math.max(dataProgress, askProgress * 0.8));

    // -----------------------------------------------------------------
    // Exclusion zone: hide the absolute best cells in early game
    // so the player discovers the optimum gradually.
    // At progress=0: exclude top 3% of unrevealed cells
    // At progress≥0.7: exclude nothing
    // -----------------------------------------------------------------
    const excludeFrac = progress < 0.7 ? 0.03 * (1 - progress / 0.7) : 0;
    const excludeTopN = Math.floor(unrevealed.length * excludeFrac);

    // -----------------------------------------------------------------
    // Selection window: how deep into the sorted list we look
    //   progress=0  → top 30% (good cells, clearly better than random ~50)
    //   progress=0.5 → top 12%
    //   progress=1  → top 3% (near-optimal)
    // -----------------------------------------------------------------
    const windowFrac = Math.max(0.03, 0.3 - progress * 0.27);
    const windowSize = Math.max(
      count * 4,
      Math.floor(unrevealed.length * windowFrac),
    );

    // Build the candidate pool from the selection window
    const candidates = unrevealed.slice(excludeTopN, excludeTopN + windowSize);

    // -----------------------------------------------------------------
    // Within the window, lightly shuffle to add variety.
    // In early game (low progress) shuffle more; in late game, less.
    // This prevents DxTER from being boringly deterministic while
    // still clearly guiding the player toward good areas.
    // -----------------------------------------------------------------
    const shuffled = this.weightedShuffle(candidates, progress);

    // -----------------------------------------------------------------
    // Select suggestions with spatial diversity.
    // Minimum spacing prevents all 3 suggestions from clustering
    // in the same corner — the player gets a broader view.
    // -----------------------------------------------------------------
    return this.selectDiverse(shuffled, count);
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

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Collect all unrevealed cells and sort them by value.
   * For minimization: ascending (best = lowest first).
   * For maximization: descending (best = highest first).
   */
  private getUnrevealedSorted(grid: Cell[][]): Cell[] {
    const unrevealed: Cell[] = [];
    for (const row of grid) {
      for (const cell of row) {
        if (!cell.revealed && !cell.suggested) {
          unrevealed.push(cell);
        }
      }
    }

    if (this.objective === "minimize") {
      unrevealed.sort((a, b) => a.value - b.value);
    } else {
      unrevealed.sort((a, b) => b.value - a.value);
    }

    return unrevealed;
  }

  /**
   * Lightly shuffle candidates while preserving a bias toward the front
   * (best values). At high progress, barely shuffle; at low progress,
   * shuffle more to add realistic exploration variety.
   *
   * Uses a "noisy ranking" approach: each candidate gets its rank plus
   * a random offset. The offset magnitude decreases with progress.
   */
  private weightedShuffle(candidates: Cell[], progress: number): Cell[] {
    // At progress=0: noise up to 40% of candidate count
    // At progress=1: noise up to 5% of candidate count
    const noiseFrac = Math.max(0.05, 0.4 - progress * 0.35);
    const noiseRange = Math.max(1, Math.floor(candidates.length * noiseFrac));

    const scored = candidates.map((cell, index) => ({
      cell,
      score: index + this.rng() * noiseRange,
    }));

    scored.sort((a, b) => a.score - b.score);
    return scored.map((s) => s.cell);
  }

  /**
   * Select `count` cells from candidates with minimum spatial spacing.
   * This ensures suggestions are spread across different regions of the
   * grid, giving the player maximum information from each DxTER ask.
   */
  private selectDiverse(candidates: Cell[], count: number): GridPosition[] {
    const selected: GridPosition[] = [];

    // Minimum spacing: ~1/5 of the grid, but at least 2 cells apart
    // For a 12×12 grid: spacing=2, 16×16: spacing=3, 20×20: spacing=4
    const minSpacing = Math.max(2, Math.floor(this.gridSize / 5));

    // First pass: enforce spacing for diversity
    for (const cell of candidates) {
      if (selected.length >= count) break;

      const tooClose = selected.some((s) => {
        const dr = Math.abs(s.row - cell.row);
        const dc = Math.abs(s.col - cell.col);
        return Math.max(dr, dc) < minSpacing;
      });

      if (!tooClose) {
        selected.push({ row: cell.row, col: cell.col });
      }
    }

    // Second pass: if spacing was too strict, relax and fill remaining
    if (selected.length < count) {
      const halfSpacing = Math.max(1, Math.floor(minSpacing / 2));

      for (const cell of candidates) {
        if (selected.length >= count) break;

        const alreadySelected = selected.some(
          (s) => s.row === cell.row && s.col === cell.col,
        );
        if (alreadySelected) continue;

        const tooClose = selected.some((s) => {
          const dr = Math.abs(s.row - cell.row);
          const dc = Math.abs(s.col - cell.col);
          return Math.max(dr, dc) < halfSpacing;
        });

        if (!tooClose) {
          selected.push({ row: cell.row, col: cell.col });
        }
      }
    }

    // Third pass: no spacing constraint — just fill if still short
    if (selected.length < count) {
      for (const cell of candidates) {
        if (selected.length >= count) break;

        const alreadySelected = selected.some(
          (s) => s.row === cell.row && s.col === cell.col,
        );
        if (!alreadySelected) {
          selected.push({ row: cell.row, col: cell.col });
        }
      }
    }

    return selected.slice(0, count);
  }
}

// ---------------------------------------------------------------------------
// Factory function
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
