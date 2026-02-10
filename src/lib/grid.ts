// ---------------------------------------------------------------------------
// BuscaÓptimos – Grid Logic Module
// ---------------------------------------------------------------------------
// Handles grid initialization, cell revealing, score calculation,
// and all mutations on the game grid state.
// ---------------------------------------------------------------------------

import type {
  Cell,
  GameConfig,
  GameState,
  GameStats,
  GridPosition,
  RevealEntry,
  ObjectiveDirection,
} from "@/types/game";
import { createEmptyStats } from "@/types/game";
import {
  evaluateGrid,
  normalizeValue,
  type GridEvaluation,
} from "@/lib/functions";

// ---------------------------------------------------------------------------
// Grid Initialization
// ---------------------------------------------------------------------------

/**
 * Build the full Cell[][] grid for a given game configuration.
 * Evaluates the benchmark function at every position and determines
 * the global optimum based on the objective direction.
 */
export function initializeGrid(config: GameConfig): {
  grid: Cell[][];
  evaluation: GridEvaluation;
  optimumPosition: GridPosition;
  optimumValue: number;
} {
  const { gridSize, benchmarkFunction, objective } = config;
  const evaluation = evaluateGrid(benchmarkFunction, gridSize);
  const { values, min, max } = evaluation;

  // Determine the global optimum position based on objective direction
  const optimumPosition: GridPosition =
    objective === "maximize"
      ? { ...evaluation.maxPosition }
      : { ...evaluation.minPosition };

  const optimumValue =
    objective === "maximize" ? evaluation.max : evaluation.min;

  // Build the Cell grid
  const grid: Cell[][] = [];

  for (let row = 0; row < gridSize; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < gridSize; col++) {
      const value = values[row]![col]!;
      // For "minimize" objectives, we invert the normalized value so that
      // the best (lowest) values appear as "hot" on the heatmap.
      let normalizedValue = normalizeValue(value, min, max);
      if (objective === "minimize") {
        normalizedValue = 1 - normalizedValue;
      }

      const isOptimum =
        row === optimumPosition.row && col === optimumPosition.col;

      rowCells.push({
        row,
        col,
        value,
        normalizedValue,
        revealed: false,
        suggested: false,
        isOptimum,
        isBestFound: false,
        revealOrder: null,
      });
    }
    grid.push(rowCells);
  }

  return { grid, evaluation, optimumPosition, optimumValue };
}

// ---------------------------------------------------------------------------
// Initial Game State
// ---------------------------------------------------------------------------

/**
 * Create a fully initialized GameState ready for playing.
 */
export function createGameState(config: GameConfig): GameState {
  const { grid, optimumPosition, optimumValue } = initializeGrid(config);

  const stats: GameStats = {
    ...createEmptyStats(),
    bestValueFound:
      config.objective === "maximize" ? -Infinity : Infinity,
    optimumValue,
    optimumPosition,
  };

  return {
    phase: "playing",
    config: { ...config },
    grid,
    stats,
    isFinished: false,
    startedAt: Date.now(),
    finishedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Cell Reveal Logic
// ---------------------------------------------------------------------------

/**
 * Check whether a cell at the given position can be revealed.
 */
export function canRevealCell(state: GameState, position: GridPosition): boolean {
  if (state.isFinished) return false;
  if (state.stats.attemptsUsed >= state.config.maxAttempts) return false;

  const cell = getCell(state.grid, position);
  if (!cell) return false;
  if (cell.revealed) return false;

  return true;
}

/**
 * Reveal a cell at the given position and return the updated game state.
 * This is a pure function — it returns a new state object without mutating the input.
 */
export function revealCell(
  state: GameState,
  position: GridPosition
): GameState {
  if (!canRevealCell(state, position)) {
    return state;
  }

  const { row, col } = position;
  const cell = state.grid[row]![col]!;
  const newAttemptsUsed = state.stats.attemptsUsed + 1;

  // Deep-clone the grid (shallow per row, deep per cell being modified)
  const newGrid = state.grid.map((r) => r.map((c) => ({ ...c })));

  // Reveal the target cell
  const targetCell = newGrid[row]![col]!;
  targetCell.revealed = true;
  targetCell.revealOrder = newAttemptsUsed;

  // Determine if this is a new best value
  const isBetter = isValueBetter(
    cell.value,
    state.stats.bestValueFound,
    state.config.objective
  );

  let newBestValue = state.stats.bestValueFound;
  let newBestPosition = state.stats.bestPosition;

  if (isBetter) {
    newBestValue = cell.value;
    newBestPosition = { row, col };

    // Clear old best marker
    if (state.stats.bestPosition) {
      const oldBest = newGrid[state.stats.bestPosition.row]![state.stats.bestPosition.col]!;
      oldBest.isBestFound = false;
    }

    // Set new best marker
    targetCell.isBestFound = true;
  }

  // Build the reveal history entry
  const revealEntry: RevealEntry = {
    step: newAttemptsUsed,
    position: { row, col },
    value: cell.value,
    bestSoFar: isBetter ? cell.value : state.stats.bestValueFound,
    wasSuggested: cell.suggested,
  };

  // Clear all suggestion markers after a reveal (they will be recalculated)
  for (const r of newGrid) {
    for (const c of r) {
      c.suggested = false;
    }
  }

  // Calculate new score
  const newScore = calculateScore(
    newBestValue,
    state.stats.optimumValue,
    state.config.objective,
    state.grid
  );

  // Check if game is finished
  const isFinished =
    newAttemptsUsed >= state.config.maxAttempts ||
    isOptimumFound(newBestValue, state.stats.optimumValue, state.config.objective);

  const newStats: GameStats = {
    attemptsUsed: newAttemptsUsed,
    bestValueFound: newBestValue,
    bestPosition: newBestPosition,
    optimumValue: state.stats.optimumValue,
    optimumPosition: state.stats.optimumPosition,
    score: newScore,
    revealHistory: [...state.stats.revealHistory, revealEntry],
  };

  return {
    ...state,
    grid: newGrid,
    stats: newStats,
    isFinished,
    finishedAt: isFinished ? Date.now() : null,
    phase: isFinished ? "results" : state.phase,
  };
}

// ---------------------------------------------------------------------------
// Suggestion Markers (for Guided Mode)
// ---------------------------------------------------------------------------

/**
 * Mark specific cells as "suggested" by Dxter.
 * Returns a new grid with updated suggestion markers.
 */
export function setSuggestions(
  grid: Cell[][],
  suggestions: GridPosition[]
): Cell[][] {
  const newGrid = grid.map((r) => r.map((c) => ({ ...c, suggested: false })));

  for (const pos of suggestions) {
    const cell = newGrid[pos.row]?.[pos.col];
    if (cell && !cell.revealed) {
      cell.suggested = true;
    }
  }

  return newGrid;
}

/**
 * Clear all suggestion markers from the grid.
 */
export function clearSuggestions(grid: Cell[][]): Cell[][] {
  return grid.map((r) =>
    r.map((c) => (c.suggested ? { ...c, suggested: false } : c))
  );
}

// ---------------------------------------------------------------------------
// Reveal All (End of Game)
// ---------------------------------------------------------------------------

/**
 * Reveal all cells in the grid. Used when the game ends to show the
 * full landscape to the player.
 */
export function revealAllCells(grid: Cell[][]): Cell[][] {
  return grid.map((r) =>
    r.map((c) => ({
      ...c,
      revealed: true,
      suggested: false,
    }))
  );
}

// ---------------------------------------------------------------------------
// Score Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the player's score as a percentage [0, 100].
 *
 * Score = 100 means the player found the exact global optimum.
 * Score = 0 means the player's best is as far from the optimum as possible.
 *
 * For maximization:  score = ((bestFound - worst) / (optimum - worst)) * 100
 * For minimization:  score = ((worst - bestFound) / (worst - optimum)) * 100
 */
export function calculateScore(
  bestFound: number,
  optimumValue: number,
  objective: ObjectiveDirection,
  grid: Cell[][]
): number {
  // If no value has been found yet, score is 0
  if (!isFinite(bestFound)) return 0;

  // Find the worst value in the grid to normalize the score
  const allValues = grid.flatMap((r) => r.map((c) => c.value));
  const gridMin = Math.min(...allValues);
  const gridMax = Math.max(...allValues);

  if (objective === "maximize") {
    const range = gridMax - gridMin;
    if (range === 0) return 100;
    return Math.max(0, Math.min(100, ((bestFound - gridMin) / range) * 100));
  } else {
    const range = gridMax - gridMin;
    if (range === 0) return 100;
    return Math.max(0, Math.min(100, ((gridMax - bestFound) / range) * 100));
  }
}

/**
 * Check whether the exact optimum has been found.
 */
export function isOptimumFound(
  bestFound: number,
  optimumValue: number,
  objective: ObjectiveDirection
): boolean {
  // Use a small relative tolerance for floating point comparison
  const tolerance = 1e-10;
  return Math.abs(bestFound - optimumValue) <= tolerance * (1 + Math.abs(optimumValue));
}

// ---------------------------------------------------------------------------
// Comparison Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if `newValue` is better than `currentBest`
 * given the objective direction.
 */
export function isValueBetter(
  newValue: number,
  currentBest: number,
  objective: ObjectiveDirection
): boolean {
  if (objective === "maximize") {
    return newValue > currentBest;
  } else {
    return newValue < currentBest;
  }
}

// ---------------------------------------------------------------------------
// Grid Access Helpers
// ---------------------------------------------------------------------------

/**
 * Safely get a cell from the grid, returning null if out of bounds.
 */
export function getCell(grid: Cell[][], position: GridPosition): Cell | null {
  const row = grid[position.row];
  if (!row) return null;
  return row[position.col] ?? null;
}

/**
 * Get all revealed cells from the grid, sorted by reveal order.
 */
export function getRevealedCells(grid: Cell[][]): Cell[] {
  const revealed: Cell[] = [];
  for (const row of grid) {
    for (const cell of row) {
      if (cell.revealed && cell.revealOrder !== null) {
        revealed.push(cell);
      }
    }
  }
  return revealed.sort((a, b) => (a.revealOrder ?? 0) - (b.revealOrder ?? 0));
}

/**
 * Get all unrevealed cells from the grid.
 */
export function getUnrevealedCells(grid: Cell[][]): Cell[] {
  const unrevealed: Cell[] = [];
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.revealed) {
        unrevealed.push(cell);
      }
    }
  }
  return unrevealed;
}

/**
 * Count total number of cells in the grid.
 */
export function getTotalCells(grid: Cell[][]): number {
  if (grid.length === 0) return 0;
  return grid.length * (grid[0]?.length ?? 0);
}

/**
 * Get the percentage of cells that have been revealed.
 */
export function getRevealedPercentage(grid: Cell[][]): number {
  const total = getTotalCells(grid);
  if (total === 0) return 0;
  const revealed = getRevealedCells(grid).length;
  return (revealed / total) * 100;
}

// ---------------------------------------------------------------------------
// Neighbor Utilities
// ---------------------------------------------------------------------------

/**
 * Get the 4-connected neighbors (up, down, left, right) of a position.
 */
export function getNeighbors4(
  position: GridPosition,
  gridSize: number
): GridPosition[] {
  const { row, col } = position;
  const neighbors: GridPosition[] = [];

  if (row > 0) neighbors.push({ row: row - 1, col });
  if (row < gridSize - 1) neighbors.push({ row: row + 1, col });
  if (col > 0) neighbors.push({ row, col: col - 1 });
  if (col < gridSize - 1) neighbors.push({ row, col: col + 1 });

  return neighbors;
}

/**
 * Get the 8-connected neighbors (including diagonals) of a position.
 */
export function getNeighbors8(
  position: GridPosition,
  gridSize: number
): GridPosition[] {
  const { row, col } = position;
  const neighbors: GridPosition[] = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
        neighbors.push({ row: nr, col: nc });
      }
    }
  }

  return neighbors;
}

// ---------------------------------------------------------------------------
// Distance Utilities
// ---------------------------------------------------------------------------

/**
 * Euclidean distance between two grid positions.
 */
export function gridDistance(a: GridPosition, b: GridPosition): number {
  const dr = a.row - b.row;
  const dc = a.col - b.col;
  return Math.sqrt(dr * dr + dc * dc);
}

/**
 * Manhattan distance between two grid positions.
 */
export function manhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}
