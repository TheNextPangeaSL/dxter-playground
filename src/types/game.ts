// ---------------------------------------------------------------------------
// BuscaÓptimos – Core Game Types
// ---------------------------------------------------------------------------

/** Coordinates on the grid */
export interface GridPosition {
  row: number;
  col: number;
}

/** A single cell in the game grid */
export interface Cell {
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based) */
  col: number;
  /** The hidden value of the objective function at this position */
  value: number;
  /** Normalized value [0, 1] for color mapping */
  normalizedValue: number;
  /** Whether this cell has been revealed by the player */
  revealed: boolean;
  /** Whether Dxter is suggesting this cell as the next experiment */
  suggested: boolean;
  /** Whether this cell holds the global optimum */
  isOptimum: boolean;
  /** Whether this is the best value found so far by the player */
  isBestFound: boolean;
  /** The order in which this cell was revealed (1-based), null if not revealed */
  revealOrder: number | null;
}

/** Game mode selection */
export type GameMode = "manual" | "guided";

/** Objective direction */
export type ObjectiveDirection = "maximize" | "minimize";

/** Available benchmark functions */
export type BenchmarkFunction =
  | "rastrigin"
  | "ackley"
  | "rosenbrock"
  | "himmelblau"
  | "schwefel"
  | "gaussian_mixture"
  | "sinusoidal";

/** Difficulty presets */
export type Difficulty = "easy" | "medium" | "hard";

/** Game phase / screen */
export type GamePhase = "landing" | "setup" | "playing" | "results";

/** Configuration for a game session */
export interface GameConfig {
  /** Grid dimension (gridSize x gridSize) */
  gridSize: number;
  /** Maximum number of clicks / experiments allowed */
  maxAttempts: number;
  /** Which benchmark function is being used */
  benchmarkFunction: BenchmarkFunction;
  /** Whether the player is trying to maximize or minimize */
  objective: ObjectiveDirection;
  /** The game mode */
  mode: GameMode;
  /** Difficulty preset that was selected */
  difficulty: Difficulty;
  /** Number of suggestions Dxter shows at a time (guided mode) */
  suggestionsPerStep: number;
}

/** Statistics tracked during a game session */
export interface GameStats {
  /** Number of cells revealed so far */
  attemptsUsed: number;
  /** The best (max or min depending on objective) value found so far */
  bestValueFound: number;
  /** Position of the best value found */
  bestPosition: GridPosition | null;
  /** The actual global optimum value of the function on this grid */
  optimumValue: number;
  /** Position of the global optimum */
  optimumPosition: GridPosition;
  /** Score as a percentage: how close the player got to the optimum [0, 100] */
  score: number;
  /** History of revealed values in order */
  revealHistory: RevealEntry[];
  /** DxTER credits remaining for requesting hints (guided mode) */
  dxterCredits: number;
}

/** A single entry in the reveal history */
export interface RevealEntry {
  /** The step number (1-based) */
  step: number;
  /** Grid position that was revealed */
  position: GridPosition;
  /** The value at this position */
  value: number;
  /** The best value found up to and including this step */
  bestSoFar: number;
  /** Whether this cell was a Dxter suggestion */
  wasSuggested: boolean;
}

/** The complete game state */
export interface GameState {
  /** Current phase of the application */
  phase: GamePhase;
  /** Game configuration (set during setup) */
  config: GameConfig;
  /** The full grid of cells */
  grid: Cell[][];
  /** Live game statistics */
  stats: GameStats;
  /** Whether the game is finished (attempts exhausted or optimum found) */
  isFinished: boolean;
  /** Timestamp when the game started */
  startedAt: number | null;
  /** Timestamp when the game ended */
  finishedAt: number | null;
}

// ---------------------------------------------------------------------------
// Gaussian Process / Bayesian Optimization types (for guided mode)
// ---------------------------------------------------------------------------

/** A single observed data point for the surrogate model */
export interface Observation {
  /** Input coordinates [x, y] normalized to [0, 1] */
  x: [number, number];
  /** Observed objective value */
  y: number;
}

/** Prediction from the surrogate model at a candidate point */
export interface SurrogatePrediction {
  /** Predicted mean */
  mean: number;
  /** Predicted standard deviation (uncertainty) */
  std: number;
  /** Acquisition function value (e.g. Expected Improvement) */
  acquisition: number;
}

/** Configuration for the Bayesian optimizer */
export interface OptimizerConfig {
  /** Kernel length-scale parameter */
  lengthScale: number;
  /** Kernel signal variance */
  signalVariance: number;
  /** Observation noise variance */
  noiseVariance: number;
  /** Exploration-exploitation trade-off parameter (for UCB) */
  explorationWeight: number;
}

// ---------------------------------------------------------------------------
// Result / comparison types
// ---------------------------------------------------------------------------

/** Results for a completed game, used in the results screen */
export interface GameResult {
  /** The config used */
  config: GameConfig;
  /** Final stats */
  stats: GameStats;
  /** Duration in milliseconds */
  durationMs: number;
  /** Final score [0, 100] */
  score: number;
}

/** Side-by-side comparison when both modes are played */
export interface ModeComparison {
  manual: GameResult | null;
  guided: GameResult | null;
}

// ---------------------------------------------------------------------------
// Difficulty presets
// ---------------------------------------------------------------------------

export const DIFFICULTY_PRESETS: Record<Difficulty, Pick<GameConfig, "gridSize" | "maxAttempts" | "suggestionsPerStep">> = {
  easy: {
    gridSize: 20,
    maxAttempts: 40,
    suggestionsPerStep: 3,
  },
  medium: {
    gridSize: 30,
    maxAttempts: 35,
    suggestionsPerStep: 3,
  },
  hard: {
    gridSize: 40,
    maxAttempts: 30,
    suggestionsPerStep: 2,
  },
};

// ---------------------------------------------------------------------------
// Default / initial state factories
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG: GameConfig = {
  gridSize: 30,
  maxAttempts: 35,
  benchmarkFunction: "himmelblau",
  objective: "maximize",
  mode: "manual",
  difficulty: "medium",
  suggestionsPerStep: 3,
};

export function createEmptyStats(): GameStats {
  return {
    attemptsUsed: 0,
    bestValueFound: -Infinity,
    bestPosition: null,
    optimumValue: 0,
    optimumPosition: { row: 0, col: 0 },
    score: 0,
    revealHistory: [],
    dxterCredits: 5,
  };
}

export function createInitialGameState(): GameState {
  return {
    phase: "landing",
    config: { ...DEFAULT_CONFIG },
    grid: [],
    stats: createEmptyStats(),
    isFinished: false,
    startedAt: null,
    finishedAt: null,
  };
}
