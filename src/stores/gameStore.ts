// ---------------------------------------------------------------------------
// DxTER: The Optimization Game – Game State Store (nanostores)
// ---------------------------------------------------------------------------
// Centralized reactive state management for the entire game.
// Uses nanostores for lightweight, framework-agnostic reactivity
// that works seamlessly with Astro Islands (React components).
//
// Budget-based system: Flip tile = $2, Ask DxTER = $5
// Objective: always minimize (find the global minimum in 0-100 range)
// ---------------------------------------------------------------------------

import { atom, computed } from "nanostores";

import type {
  GameState,
  GameConfig,
  GamePhase,
  GameResult,
  GridPosition,
  Difficulty,
  BenchmarkFunction,
} from "@/types/game";
import { addHighScore, type HighScoreEntry } from "@/lib/highScores";
import {
  DIFFICULTY_PRESETS,
  FLIP_COST,
  DXTER_COST,
  createInitialGameState,
  getRandomBenchmarkFunction,
  getBudgetRemaining,
  canAffordFlip,
  canAffordDxter,
  getPlayerArchetype,
} from "@/types/game";
import {
  createGameState,
  revealCell,
  setSuggestions,
  clearSuggestions,
  revealAllCells,
  canRevealCell,
  isOptimumFound,
} from "@/lib/grid";
import { BayesianOptimizer, createOptimizer } from "@/lib/optimizer";
import { randomizeGaussianMixture } from "@/lib/functions";

// ---------------------------------------------------------------------------
// Core Game State Atom
// ---------------------------------------------------------------------------

/** The main game state – single source of truth */
export const $gameState = atom<GameState>(createInitialGameState());

/** The current Bayesian optimizer instance */
let optimizer: BayesianOptimizer | null = null;

// ---------------------------------------------------------------------------
// Last game result (for results screen)
// ---------------------------------------------------------------------------

export const $lastResult = atom<GameResult | null>(null);

/** The high score entry that was just saved (to highlight it in the table) */
export const $lastSavedHighScore = atom<HighScoreEntry | null>(null);

// ---------------------------------------------------------------------------
// Computed / Derived Stores
// ---------------------------------------------------------------------------

/** Current game phase */
export const $phase = computed($gameState, (state) => state.phase);

/** Current player name */
export const $playerName = computed($gameState, (state) => state.playerName);

/** Current game config */
export const $config = computed($gameState, (state) => state.config);

/** Current game grid */
export const $grid = computed($gameState, (state) => state.grid);

/** Current game stats */
export const $stats = computed($gameState, (state) => state.stats);

/** Whether the game is finished */
export const $isFinished = computed($gameState, (state) => state.isFinished);

/** Budget remaining */
export const $budgetRemaining = computed($gameState, (state) => {
  return getBudgetRemaining(state.config, state.stats);
});

/** Budget progress percentage (spent / total) */
export const $budgetProgressPercent = computed($gameState, (state) => {
  if (state.config.budget === 0) return 0;
  return (state.stats.budgetSpent / state.config.budget) * 100;
});

/** Budget remaining as a fraction for the progress bar (remaining / total) */
export const $budgetBarPercent = computed($gameState, (state) => {
  if (state.config.budget === 0) return 0;
  return (
    (getBudgetRemaining(state.config, state.stats) / state.config.budget) * 100
  );
});

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

/** Whether the player can afford to flip a tile */
export const $canFlip = computed($gameState, (state) => {
  return canAffordFlip(state.config, state.stats) && !state.isFinished;
});

/** Whether the player can afford to ask DxTER */
export const $canAskDxter = computed($gameState, (state) => {
  return canAffordDxter(state.config, state.stats) && !state.isFinished;
});

/** Number of iterations (experiments) performed */
export const $iterations = computed($gameState, (state) => {
  return state.stats.iterations;
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
  $lastSavedHighScore.set(null);
  optimizer = null;
}

/** Go to setup screen */
export function goToSetup(): void {
  setPhase("setup");
}

/** Set the player / session name */
export function setPlayerName(name: string): void {
  const current = $gameState.get();
  $gameState.set({ ...current, playerName: name });
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
    newConfig.budget = preset.budget;
    newConfig.suggestionsPerStep = preset.suggestionsPerStep;
  }

  $gameState.set({ ...current, config: newConfig });
}

/** Set the difficulty */
export function setDifficulty(difficulty: Difficulty): void {
  updateConfig({ difficulty });
}

/** Set the benchmark function (only in advanced mode) */
export function setBenchmarkFunction(fn: BenchmarkFunction): void {
  updateConfig({ benchmarkFunction: fn });
}

/** Toggle advanced mode */
export function setAdvancedMode(enabled: boolean): void {
  updateConfig({ advancedMode: enabled });
}

// ---------------------------------------------------------------------------
// Actions: Game Lifecycle
// ---------------------------------------------------------------------------

/** Start a new game with the current configuration */
export function startGame(): void {
  const current = $gameState.get();
  const config = { ...current.config };

  // If not in advanced mode, pick a random benchmark function
  if (!config.advancedMode) {
    config.benchmarkFunction = getRandomBenchmarkFunction();
  }

  // Always minimize
  config.objective = "minimize";

  // Randomize the Gaussian Mixture if selected
  if (config.benchmarkFunction === "gaussian_mixture") {
    randomizeGaussianMixture();
  }

  // Create the initialized game state
  const newState = createGameState(config);

  // Preserve the player name from the current state
  newState.playerName = current.playerName;

  // Initialize the optimizer (always guided by DxTER, suggestions on demand)
  optimizer = createOptimizer(config.gridSize, config.objective);

  $gameState.set(newState);
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

  const foundOptimum = isOptimumFound(
    current.stats.bestValueFound,
    current.stats.optimumValue,
    "minimize",
  );

  // Calculate efficiency score
  const efficiencyScore = calculateEfficiency(current);

  // Determine player archetype
  const archetype = getPlayerArchetype(
    current.stats,
    current.config,
    foundOptimum,
  );

  const durationMs = current.startedAt ? Date.now() - current.startedAt : 0;

  // Build the game result
  const result: GameResult = {
    playerName: current.playerName,
    config: { ...current.config },
    stats: { ...current.stats },
    durationMs,
    score: current.stats.score,
    foundOptimum,
    efficiencyScore,
    archetype,
  };

  $lastResult.set(result);

  // Save high score to localStorage
  const playerName = current.playerName.trim() || "Anonymous";
  const savedEntry = addHighScore({
    playerName,
    difficulty: current.config.difficulty,
    gridSize: current.config.gridSize,
    bestValue: current.stats.bestValueFound,
    foundOptimum,
    efficiencyScore,
    score: current.stats.score,
    budgetSpent: current.stats.budgetSpent,
    budgetTotal: current.config.budget,
    iterations: current.stats.iterations,
    dxterUsed: current.stats.dxterUsed,
    durationMs,
  });
  $lastSavedHighScore.set(savedEntry);

  $gameState.set({
    ...current,
    grid: revealedGrid,
    phase: "results",
    isFinished: true,
    finishedAt: Date.now(),
  });
}

/**
 * Transition from the game-over modal to the results screen.
 * Called when the user clicks "View Results" on the modal.
 */
export function viewResults(): void {
  endGame();
}

// ---------------------------------------------------------------------------
// Actions: Gameplay (Reveal Cells)
// ---------------------------------------------------------------------------

/**
 * Reveal a cell at the given position.
 * Costs FLIP_COST ($2) from the budget.
 * Does NOT auto-generate DxTER suggestions (player must ask explicitly).
 */
export function handleCellClick(position: GridPosition): void {
  const current = $gameState.get();

  // Check if this cell can be revealed
  if (!canRevealCell(current, position)) return;

  // Reveal the cell
  let newState = revealCell(current, position);

  // Add observation to the optimizer (use the raw value for GP, not the 0-100 value)
  if (optimizer) {
    const cell = current.grid[position.row]?.[position.col];
    if (cell) {
      // Use the normalized 0-100 value (not rawValue) so the GP always
      // works in a known, consistent scale regardless of the underlying
      // function's range. This prevents the GP from being wildly
      // overconfident when raw values happen to be near zero.
      optimizer.addObservation(position, cell.value);
    }
  }

  // If game is finished after this reveal, DON'T auto-transition.
  // The GameBoard component will show a game-over modal instead.
  $gameState.set(newState);
}

// ---------------------------------------------------------------------------
// Actions: DxTER Suggestions (Ask DxTER – costs $5)
// ---------------------------------------------------------------------------

/**
 * Ask DxTER for recommendations. Costs DXTER_COST ($5) from the budget.
 * Returns 3 recommended tiles highlighted on the grid.
 * Returns true if suggestions were generated, false if not enough budget.
 */
export function askDxter(): boolean {
  const current = $gameState.get();

  if (!canAffordDxter(current.config, current.stats)) return false;
  if (current.isFinished) return false;
  if (!optimizer) return false;

  // Deduct DxTER cost from budget
  const newStats = {
    ...current.stats,
    budgetSpent: current.stats.budgetSpent + DXTER_COST,
    dxterUsed: true,
    dxterAsks: current.stats.dxterAsks + 1,
  };

  // Check if budget is now exhausted (cannot afford even a flip)
  const newBudgetRemaining = current.config.budget - newStats.budgetSpent;
  const isFinished = newBudgetRemaining < FLIP_COST;

  // Fit the GP if there are observations, then generate suggestions
  const suggestions = optimizer.suggest(
    current.grid,
    current.config.suggestionsPerStep,
  );
  const gridWithSuggestions = setSuggestions(current.grid, suggestions);

  $gameState.set({
    ...current,
    stats: newStats,
    grid: gridWithSuggestions,
    isFinished,
  });

  return true;
}

/** Clear all suggestions from the grid */
export function clearAllSuggestions(): void {
  const current = $gameState.get();
  const clearedGrid = clearSuggestions(current.grid);
  $gameState.set({ ...current, grid: clearedGrid });
}

// ---------------------------------------------------------------------------
// Efficiency Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate an efficiency score (0-100).
 * Higher is better. Rewards finding high values with low budget usage.
 *
 * efficiency = score * (1 - budgetUsedFraction * 0.5)
 */
function calculateEfficiency(state: GameState): number {
  const budgetFraction = state.stats.budgetSpent / state.config.budget;
  const rawEfficiency = state.stats.score * (1 - budgetFraction * 0.5);
  return Math.max(0, Math.min(100, Math.round(rawEfficiency)));
}

// ---------------------------------------------------------------------------
// Actions: Quick Play (convenience shortcut)
// ---------------------------------------------------------------------------

/** Quick start a game with default settings */
export function quickStart(difficulty: Difficulty = "medium"): void {
  const preset = DIFFICULTY_PRESETS[difficulty];
  updateConfig({
    gridSize: preset.gridSize,
    budget: preset.budget,
    suggestionsPerStep: preset.suggestionsPerStep,
    difficulty,
    benchmarkFunction: getRandomBenchmarkFunction(),
    objective: "minimize",
    advancedMode: false,
  });
  startGame();
}

// ---------------------------------------------------------------------------
// Utility: Get the optimizer instance (for advanced visualization)
// ---------------------------------------------------------------------------

/** Get the current optimizer instance */
export function getOptimizer(): BayesianOptimizer | null {
  return optimizer;
}
