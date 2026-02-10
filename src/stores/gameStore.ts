// ---------------------------------------------------------------------------
// BuscaÓptimos – Game State Store (nanostores)
// ---------------------------------------------------------------------------
// Centralized reactive state management for the entire game.
// Uses nanostores for lightweight, framework-agnostic reactivity
// that works seamlessly with Astro Islands (React components).
// ---------------------------------------------------------------------------

import { atom, computed, map } from "nanostores";

import type {
  GameState,
  GameConfig,
  GamePhase,
  GameMode,
  GameResult,
  ModeComparison,
  GridPosition,
  Cell,
  Difficulty,
  BenchmarkFunction,
  ObjectiveDirection,
} from "@/types/game";
import {
  DEFAULT_CONFIG,
  DIFFICULTY_PRESETS,
  createInitialGameState,
} from "@/types/game";
import {
  createGameState,
  revealCell,
  setSuggestions,
  clearSuggestions,
  revealAllCells,
  canRevealCell,
} from "@/lib/grid";
import {
  BayesianOptimizer,
  createOptimizer,
} from "@/lib/optimizer";
import { randomizeGaussianMixture } from "@/lib/functions";

// ---------------------------------------------------------------------------
// Core Game State Atom
// ---------------------------------------------------------------------------

/** The main game state – single source of truth */
export const $gameState = atom<GameState>(createInitialGameState());

/** The current Bayesian optimizer instance (guided mode) */
let optimizer: BayesianOptimizer | null = null;

// ---------------------------------------------------------------------------
// Comparison store (manual vs guided results)
// ---------------------------------------------------------------------------

export const $comparison = map<ModeComparison>({
  manual: null,
  guided: null,
});

// ---------------------------------------------------------------------------
// Computed / Derived Stores
// ---------------------------------------------------------------------------

/** Current game phase */
export const $phase = computed($gameState, (state) => state.phase);

/** Current game config */
export const $config = computed($gameState, (state) => state.config);

/** Current game grid */
export const $grid = computed($gameState, (state) => state.grid);

/** Current game stats */
export const $stats = computed($gameState, (state) => state.stats);

/** Whether the game is finished */
export const $isFinished = computed($gameState, (state) => state.isFinished);

/** Number of attempts remaining */
export const $attemptsRemaining = computed($gameState, (state) => {
  return state.config.maxAttempts - state.stats.attemptsUsed;
});

/** Progress percentage (attempts used / max) */
export const $progressPercent = computed($gameState, (state) => {
  if (state.config.maxAttempts === 0) return 0;
  return (state.stats.attemptsUsed / state.config.maxAttempts) * 100;
});

/** Whether the game is currently in guided mode */
export const $isGuidedMode = computed(
  $gameState,
  (state) => state.config.mode === "guided"
);

/** Whether there are any suggestions currently shown on the grid */
export const $hasSuggestions = computed($gameState, (state) => {
  return state.grid.some((row) => row.some((cell) => cell.suggested));
});

/** List of currently suggested positions */
export const $suggestedPositions = computed($gameState, (state) => {
  const positions: GridPosition[] = [];
  for (const row of state.grid) {
    for (const cell of row) {
      if (cell.suggested) {
        positions.push({ row: cell.row, col: cell.col });
      }
    }
  }
  return positions;
});

/** Current score as a formatted string */
export const $scoreDisplay = computed($gameState, (state) => {
  return state.stats.score.toFixed(1);
});

/** DxTER credits remaining */
export const $dxterCredits = computed($gameState, (state) => {
  return state.stats.dxterCredits;
});

// ---------------------------------------------------------------------------
// Actions: Navigation
// ---------------------------------------------------------------------------

/** Navigate to a specific game phase */
export function setPhase(phase: GamePhase): void {
  const current = $gameState.get();
  $gameState.set({ ...current, phase });
}

/** Go to landing page */
export function goToLanding(): void {
  $gameState.set(createInitialGameState());
  optimizer = null;
}

/** Go to setup screen */
export function goToSetup(): void {
  setPhase("setup");
}

// ---------------------------------------------------------------------------
// Actions: Configuration
// ---------------------------------------------------------------------------

/** Update the game configuration (during setup phase) */
export function updateConfig(partial: Partial<GameConfig>): void {
  const current = $gameState.get();
  const newConfig = { ...current.config, ...partial };

  // If difficulty changed, apply the preset values
  if (partial.difficulty && partial.difficulty !== current.config.difficulty) {
    const preset = DIFFICULTY_PRESETS[partial.difficulty];
    newConfig.gridSize = preset.gridSize;
    newConfig.maxAttempts = preset.maxAttempts;
    newConfig.suggestionsPerStep = preset.suggestionsPerStep;
  }

  $gameState.set({ ...current, config: newConfig });
}

/** Set the game mode */
export function setGameMode(mode: GameMode): void {
  updateConfig({ mode });
}

/** Set the difficulty */
export function setDifficulty(difficulty: Difficulty): void {
  updateConfig({ difficulty });
}

/** Set the benchmark function */
export function setBenchmarkFunction(fn: BenchmarkFunction): void {
  updateConfig({ benchmarkFunction: fn });
}

/** Set the objective direction */
export function setObjective(objective: ObjectiveDirection): void {
  updateConfig({ objective });
}

// ---------------------------------------------------------------------------
// Actions: Game Lifecycle
// ---------------------------------------------------------------------------

/** Start a new game with the current configuration */
export function startGame(): void {
  const current = $gameState.get();
  const config = current.config;

  // Randomize the Gaussian Mixture if selected
  if (config.benchmarkFunction === "gaussian_mixture") {
    randomizeGaussianMixture();
  }

  // Create the initialized game state
  const newState = createGameState(config);

  // Initialize the optimizer for guided mode
  if (config.mode === "guided") {
    optimizer = createOptimizer(config.gridSize, config.objective);
  } else {
    optimizer = null;
  }

  $gameState.set(newState);
}

/** Start a new game with specific config (for comparison mode) */
export function startGameWithConfig(config: GameConfig): void {
  const current = $gameState.get();
  $gameState.set({ ...current, config });
  startGame();
}

/** Restart the current game with the same config */
export function restartGame(): void {
  startGame();
}

/** End the game and go to results */
export function endGame(): void {
  const current = $gameState.get();

  // Reveal all cells
  const revealedGrid = revealAllCells(current.grid);

  // Build the game result
  const result: GameResult = {
    config: { ...current.config },
    stats: { ...current.stats },
    durationMs: current.startedAt
      ? Date.now() - current.startedAt
      : 0,
    score: current.stats.score,
  };

  // Store the result in the comparison
  const comparison = $comparison.get();
  if (current.config.mode === "manual") {
    $comparison.setKey("manual", result);
  } else {
    $comparison.setKey("guided", result);
  }

  $gameState.set({
    ...current,
    grid: revealedGrid,
    phase: "results",
    isFinished: true,
    finishedAt: Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Actions: Gameplay (Reveal Cells)
// ---------------------------------------------------------------------------

/**
 * Reveal a cell at the given position.
 * In guided mode, also triggers new suggestions after revealing.
 */
export function handleCellClick(position: GridPosition): void {
  const current = $gameState.get();

  // Check if this cell can be revealed
  if (!canRevealCell(current, position)) return;

  // Reveal the cell
  let newState = revealCell(current, position);

  // Add observation to the optimizer (guided mode)
  if (optimizer) {
    const cell = current.grid[position.row]?.[position.col];
    if (cell) {
      optimizer.addObservation(position, cell.value);
    }
  }

  // If game is finished after this reveal, end the game
  if (newState.isFinished) {
    const revealedGrid = revealAllCells(newState.grid);

    const result: GameResult = {
      config: { ...newState.config },
      stats: { ...newState.stats },
      durationMs: newState.startedAt
        ? Date.now() - newState.startedAt
        : 0,
      score: newState.stats.score,
    };

    const comparison = $comparison.get();
    if (newState.config.mode === "manual") {
      $comparison.setKey("manual", result);
    } else {
      $comparison.setKey("guided", result);
    }

    newState = {
      ...newState,
      grid: revealedGrid,
      phase: "results",
      finishedAt: Date.now(),
    };

    $gameState.set(newState);
    return;
  }

  // In guided mode, generate new suggestions
  if (optimizer && newState.config.mode === "guided") {
    const suggestions = optimizer.suggest(
      newState.grid,
      newState.config.suggestionsPerStep
    );
    const gridWithSuggestions = setSuggestions(newState.grid, suggestions);
    newState = { ...newState, grid: gridWithSuggestions };
  }

  $gameState.set(newState);
}

// ---------------------------------------------------------------------------
// Actions: Suggestions (Guided Mode)
// ---------------------------------------------------------------------------

/**
 * Manually trigger suggestion generation.
 * Useful for the initial suggestions before the player makes their first click.
 */
export function generateSuggestions(): void {
  const current = $gameState.get();
  if (!optimizer || current.config.mode !== "guided") return;

  const suggestions = optimizer.suggest(
    current.grid,
    current.config.suggestionsPerStep
  );
  const gridWithSuggestions = setSuggestions(current.grid, suggestions);

  $gameState.set({ ...current, grid: gridWithSuggestions });
}

/** Clear all suggestions from the grid */
export function clearAllSuggestions(): void {
  const current = $gameState.get();
  const clearedGrid = clearSuggestions(current.grid);
  $gameState.set({ ...current, grid: clearedGrid });
}

/**
 * Request a DxTER hint. Consumes 1 DxTER credit and generates suggestions.
 * Returns true if a hint was generated, false if no credits remain.
 */
export function requestHint(): boolean {
  const current = $gameState.get();
  if (current.stats.dxterCredits <= 0) return false;
  if (!optimizer) return false;

  // Consume one credit
  const newStats = {
    ...current.stats,
    dxterCredits: current.stats.dxterCredits - 1,
  };

  const suggestions = optimizer.suggest(
    current.grid,
    current.config.suggestionsPerStep
  );
  const gridWithSuggestions = setSuggestions(current.grid, suggestions);

  $gameState.set({ ...current, stats: newStats, grid: gridWithSuggestions });
  return true;
}

// ---------------------------------------------------------------------------
// Actions: Comparison Mode
// ---------------------------------------------------------------------------

/** Clear the comparison data */
export function clearComparison(): void {
  $comparison.set({ manual: null, guided: null });
}

/** Check if both modes have been played for comparison */
export const $canCompare = computed($comparison, (comp) => {
  return comp.manual !== null && comp.guided !== null;
});

// ---------------------------------------------------------------------------
// Actions: Quick Play (convenience shortcuts)
// ---------------------------------------------------------------------------

/** Quick start a manual game with default settings */
export function quickStartManual(
  difficulty: Difficulty = "medium",
  fn: BenchmarkFunction = "himmelblau"
): void {
  const preset = DIFFICULTY_PRESETS[difficulty];
  updateConfig({
    ...preset,
    difficulty,
    benchmarkFunction: fn,
    objective: "maximize",
    mode: "manual",
  });
  startGame();
}

/** Quick start a guided game with default settings */
export function quickStartGuided(
  difficulty: Difficulty = "medium",
  fn: BenchmarkFunction = "himmelblau"
): void {
  const preset = DIFFICULTY_PRESETS[difficulty];
  updateConfig({
    ...preset,
    difficulty,
    benchmarkFunction: fn,
    objective: "maximize",
    mode: "guided",
  });
  startGame();
}

// ---------------------------------------------------------------------------
// Utility: Get the optimizer instance (for advanced visualization)
// ---------------------------------------------------------------------------

/** Get the current optimizer instance (or null if not in guided mode) */
export function getOptimizer(): BayesianOptimizer | null {
  return optimizer;
}
