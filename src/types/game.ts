// ---------------------------------------------------------------------------
// DxTER: The Optimization Game – Core Game Types
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
  /** The hidden value of the objective function at this position (normalized 0-100) */
  value: number;
  /** Raw value before normalization */
  rawValue: number;
  /** Normalized value [0, 1] for internal color mapping */
  normalizedValue: number;
  /** Whether this cell has been revealed (flipped) by the player */
  revealed: boolean;
  /** Whether DxTER is suggesting this cell as the next experiment */
  suggested: boolean;
  /** Whether this cell holds the global optimum */
  isOptimum: boolean;
  /** Whether this is the best value found so far by the player */
  isBestFound: boolean;
  /** The order in which this cell was revealed (1-based), null if not revealed */
  revealOrder: number | null;
}

/** Objective direction – always minimize (find the global minimum) */
export type ObjectiveDirection = "maximize" | "minimize";

/** Available benchmark functions */
export type BenchmarkFunction =
  | "styblinski_tang"
  | "eggholder"
  | "beale"
  | "michalewicz"
  | "schwefel"
  | "gaussian_mixture"
  | "sinusoidal";

/** Difficulty presets */
export type Difficulty = "easy" | "medium" | "hard";

/** Game phase / screen */
export type GamePhase = "landing" | "setup" | "playing" | "results";

/** Cost constants */
export const FLIP_COST = 2;
export const DXTER_COST = 5;
export const DXTER_RECOMMENDATIONS = 3;

/** Configuration for a game session */
export interface GameConfig {
  /** Grid dimension (gridSize x gridSize) */
  gridSize: number;
  /** Total budget in dollars */
  budget: number;
  /** Which benchmark function is being used */
  benchmarkFunction: BenchmarkFunction;
  /** The objective – always minimize */
  objective: ObjectiveDirection;
  /** Difficulty preset that was selected */
  difficulty: Difficulty;
  /** Number of suggestions DxTER shows at a time */
  suggestionsPerStep: number;
  /** Whether advanced options were enabled (manual function selection) */
  advancedMode: boolean;
}

/** Statistics tracked during a game session */
export interface GameStats {
  /** Number of cells revealed (iterations / experiments) */
  iterations: number;
  /** Budget spent so far */
  budgetSpent: number;
  /** The best (lowest) value found so far (0-100 scale) */
  bestValueFound: number;
  /** Position of the best value found */
  bestPosition: GridPosition | null;
  /** The actual global optimum value of the function on this grid (0-100 scale) */
  optimumValue: number;
  /** Position of the global optimum */
  optimumPosition: GridPosition;
  /** Score as a percentage: how close the player got to the optimum [0, 100] */
  score: number;
  /** History of revealed values in order */
  revealHistory: RevealEntry[];
  /** Whether DxTER was used at least once */
  dxterUsed: boolean;
  /** Number of times DxTER was asked for suggestions */
  dxterAsks: number;
}

/** A single entry in the reveal history */
export interface RevealEntry {
  /** The step number (1-based) */
  step: number;
  /** Grid position that was revealed */
  position: GridPosition;
  /** The value at this position (0-100) */
  value: number;
  /** The best value found up to and including this step */
  bestSoFar: number;
  /** Whether this cell was a DxTER suggestion */
  wasSuggested: boolean;
}

/** The complete game state */
export interface GameState {
  /** Current phase of the application */
  phase: GamePhase;
  /** Player / session name */
  playerName: string;
  /** Game configuration (set during setup) */
  config: GameConfig;
  /** The full grid of cells */
  grid: Cell[][];
  /** Live game statistics */
  stats: GameStats;
  /** Whether the game is finished (budget exhausted or optimum found) */
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
// Result types
// ---------------------------------------------------------------------------

/** Player archetype based on play style */
export interface PlayerArchetype {
  /** Emoji or icon id */
  emoji: string;
  /** Archetype name */
  title: string;
  /** Short description */
  description: string;
}

/** Results for a completed game, used in the results screen */
export interface GameResult {
  /** Player / session name */
  playerName: string;
  /** The config used */
  config: GameConfig;
  /** Final stats */
  stats: GameStats;
  /** Duration in milliseconds */
  durationMs: number;
  /** Final score [0, 100] */
  score: number;
  /** Whether the global minimum was found */
  foundOptimum: boolean;
  /** Efficiency score as a percentage */
  efficiencyScore: number;
  /** Player archetype */
  archetype: PlayerArchetype;
}

// ---------------------------------------------------------------------------
// Difficulty presets
// ---------------------------------------------------------------------------

export interface DifficultyPreset {
  gridSize: number;
  budget: number;
  suggestionsPerStep: number;
  label: string;
  description: string;
  complexity: string;
}

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  easy: {
    gridSize: 12,
    budget: 100,
    suggestionsPerStep: DXTER_RECOMMENDATIONS,
    label: "Easy",
    description: "Explore freely and learn the mechanics.",
    complexity: "Simple patterns",
  },
  medium: {
    gridSize: 16,
    budget: 200,
    suggestionsPerStep: DXTER_RECOMMENDATIONS,
    label: "Medium",
    description: "Balance cost and information to find the optimum.",
    complexity: "Moderate complexity",
  },
  hard: {
    gridSize: 20,
    budget: 320,
    suggestionsPerStep: DXTER_RECOMMENDATIONS,
    label: "Hard",
    description: "High complexity and tight budget constraints.",
    complexity: "High complexity",
  },
};

// ---------------------------------------------------------------------------
// All available benchmark function IDs (for random selection)
// ---------------------------------------------------------------------------

export const ALL_BENCHMARK_FUNCTIONS: BenchmarkFunction[] = [
  "styblinski_tang",
  "eggholder",
  "beale",
  "michalewicz",
  "schwefel",
  "gaussian_mixture",
  "sinusoidal",
];

/** Pick a random benchmark function */
export function getRandomBenchmarkFunction(): BenchmarkFunction {
  const idx = Math.floor(Math.random() * ALL_BENCHMARK_FUNCTIONS.length);
  return ALL_BENCHMARK_FUNCTIONS[idx]!;
}

// ---------------------------------------------------------------------------
// Default / initial state factories
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG: GameConfig = {
  gridSize: 16,
  budget: 200,
  benchmarkFunction: "schwefel",
  objective: "minimize",
  difficulty: "medium",
  suggestionsPerStep: DXTER_RECOMMENDATIONS,
  advancedMode: false,
};

export function createEmptyStats(): GameStats {
  return {
    iterations: 0,
    budgetSpent: 0,
    bestValueFound: Infinity,
    bestPosition: null,
    optimumValue: 0,
    optimumPosition: { row: 0, col: 0 },
    score: 0,
    revealHistory: [],
    dxterUsed: false,
    dxterAsks: 0,
  };
}

export function createInitialGameState(): GameState {
  return {
    phase: "landing",
    playerName: "",
    config: { ...DEFAULT_CONFIG },
    grid: [],
    stats: createEmptyStats(),
    isFinished: false,
    startedAt: null,
    finishedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Helper: budget remaining
// ---------------------------------------------------------------------------

export function getBudgetRemaining(
  config: GameConfig,
  stats: GameStats,
): number {
  return config.budget - stats.budgetSpent;
}

export function canAffordFlip(config: GameConfig, stats: GameStats): boolean {
  return getBudgetRemaining(config, stats) >= FLIP_COST;
}

export function canAffordDxter(config: GameConfig, stats: GameStats): boolean {
  return getBudgetRemaining(config, stats) >= DXTER_COST;
}

// ---------------------------------------------------------------------------
// Archetype determination
// ---------------------------------------------------------------------------

export function getPlayerArchetype(
  stats: GameStats,
  config: GameConfig,
  foundOptimum: boolean,
): PlayerArchetype {
  const budgetUsedPct = (stats.budgetSpent / config.budget) * 100;
  const usedDxter = stats.dxterUsed;

  if (foundOptimum && budgetUsedPct <= 40 && usedDxter) {
    return {
      emoji: "🦊",
      title: "Strategist",
      description: "Balanced exploration with smart decision-making",
    };
  }

  if (foundOptimum && budgetUsedPct <= 30) {
    return {
      emoji: "🎯",
      title: "Sharpshooter",
      description: "Found the optimum with remarkable efficiency",
    };
  }

  if (foundOptimum && usedDxter) {
    return {
      emoji: "🤝",
      title: "Collaborator",
      description: "Great teamwork with DxTER to reach the goal",
    };
  }

  if (foundOptimum) {
    return {
      emoji: "🏆",
      title: "Champion",
      description: "Persevered and found the global minimum",
    };
  }

  if (stats.score >= 90) {
    return {
      emoji: "🔍",
      title: "Explorer",
      description: "Got very close — keep refining your strategy",
    };
  }

  if (usedDxter && stats.score >= 70) {
    return {
      emoji: "📊",
      title: "Analyst",
      description: "Good use of data, but the optimum eluded you",
    };
  }

  if (stats.iterations <= 3) {
    return {
      emoji: "🌱",
      title: "Newcomer",
      description: "Just getting started — try more experiments next time",
    };
  }

  return {
    emoji: "🧪",
    title: "Experimenter",
    description: "Keep experimenting — optimization takes persistence",
  };
}
