// ---------------------------------------------------------------------------
// BuscaÓptimos – Benchmark Functions Library
// ---------------------------------------------------------------------------
// Each function takes (x, y) in a normalized [0, 1] domain and maps them
// to the appropriate mathematical domain internally. All functions return
// a scalar value representing the objective surface.
//
// DESIGN CRITERIA for gameplay:
//   1. Single global minimum (only ONE cell at value 0 after normalization)
//   2. Minimum NOT at the center of the domain
//   3. Well-separated local minima at different depths (traps for the player)
//   4. Good dynamic range so values spread well across 0-100 after discretization
//   5. Interesting landscape that rewards exploration guided by Dxter
// ---------------------------------------------------------------------------

import type { BenchmarkFunction } from "@/types/game";

/** Metadata describing a benchmark function */
export interface FunctionMeta {
  id: BenchmarkFunction;
  name: string;
  description: string;
  /** The mathematical domain [min, max] for both x and y */
  domain: [number, number];
  /** Whether the interesting feature is a minimum or maximum */
  naturalOptimum: "minimum" | "maximum";
  /** Number of local optima (approximate) */
  localOptimaCount: number;
}

/** A benchmark function evaluator */
export interface BenchmarkEvaluator {
  meta: FunctionMeta;
  /** Evaluate at normalized coordinates (x, y) ∈ [0, 1]² */
  evaluate: (xNorm: number, yNorm: number) => number;
}

// ---------------------------------------------------------------------------
// Helper: map [0,1] → [domainMin, domainMax]
// ---------------------------------------------------------------------------

function denormalize(norm: number, min: number, max: number): number {
  return min + norm * (max - min);
}

// ---------------------------------------------------------------------------
// 1. Styblinski-Tang Function
//    f(x,y) = 0.5 * (x⁴ - 16x² + 5x + y⁴ - 16y² + 5y)
//    Domain: [-5, 5]
//    Global min at (-2.9035, -2.9035) ≈ -78.33
//    Normalized min position ≈ (0.21, 0.21) — upper-left quadrant
//
//    Has a deceptive local minimum near (2.75, 2.75) at a much higher value,
//    creating an interesting trap. Good separation between global and local min.
// ---------------------------------------------------------------------------

function styblinskiTangRaw(x: number, y: number): number {
  return 0.5 * (x ** 4 - 16 * x * x + 5 * x + y ** 4 - 16 * y * y + 5 * y);
}

const styblinskiTang: BenchmarkEvaluator = {
  meta: {
    id: "styblinski_tang",
    name: "Styblinski-Tang",
    description:
      "Superficie con trampas simétricas: un mínimo local atractivo compite con el óptimo real escondido en la esquina opuesta. Ideal para demostrar la diferencia entre búsqueda local y global.",
    domain: [-5, 5],
    naturalOptimum: "minimum",
    localOptimaCount: 4,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const x = denormalize(xNorm, -5, 5);
    const y = denormalize(yNorm, -5, 5);
    return styblinskiTangRaw(x, y);
  },
};

// ---------------------------------------------------------------------------
// 2. Eggholder Function
//    f(x,y) = -(y+47)·sin(√|x/2+(y+47)|) - x·sin(√|x-(y+47)|)
//    Domain: [-512, 512]
//    Global min at (512, 404.23) ≈ -959.64
//    Normalized min position ≈ (1.0, 0.89) — bottom-right edge
//
//    Extremely deceptive landscape with many deep local minima at very
//    different depths scattered across the domain. One of the hardest
//    benchmark functions — perfect for showcasing Dxter's guidance.
// ---------------------------------------------------------------------------

function eggholderRaw(x: number, y: number): number {
  return (
    -(y + 47) * Math.sin(Math.sqrt(Math.abs(x / 2 + (y + 47)))) -
    x * Math.sin(Math.sqrt(Math.abs(x - (y + 47))))
  );
}

const eggholder: BenchmarkEvaluator = {
  meta: {
    id: "eggholder",
    name: "Eggholder",
    description:
      "Paisaje extremadamente engañoso con muchos valles profundos de diferente profundidad. El mínimo global está oculto cerca del borde del mapa, lejos de los valles más evidentes.",
    domain: [-512, 512],
    naturalOptimum: "minimum",
    localOptimaCount: 50,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const x = denormalize(xNorm, -512, 512);
    const y = denormalize(yNorm, -512, 512);
    return eggholderRaw(x, y);
  },
};

// ---------------------------------------------------------------------------
// 3. Beale Function (log-compressed)
//    f(x,y) = (1.5-x+xy)² + (2.25-x+xy²)² + (2.625-x+xy³)²
//    Domain: [-4.5, 4.5]
//    Global min at (3, 0.5), f* = 0
//    Normalized min position ≈ (0.83, 0.56) — off-center right
//
//    The raw Beale function has extreme range (~0 to ~170000) which
//    would compress all interesting structure into a tiny fraction of
//    the normalized scale. We apply log(1 + f) compression to preserve
//    the topology while spreading values across the full 0-100 range.
//    Result: the cell at the minimum is clearly distinguishable from
//    its neighbors (value 0 vs 4-8 vs 20+).
// ---------------------------------------------------------------------------

function bealeRaw(x: number, y: number): number {
  return (
    (1.5 - x + x * y) ** 2 +
    (2.25 - x + x * y * y) ** 2 +
    (2.625 - x + x * y ** 3) ** 2
  );
}

const beale: BenchmarkEvaluator = {
  meta: {
    id: "beale",
    name: "Beale",
    description:
      "Función con un pozo afilado descentrado a la derecha del mapa. La superficie crece rápidamente en todas direcciones, haciendo difícil localizar el mínimo sin una estrategia de búsqueda eficiente.",
    domain: [-4.5, 4.5],
    naturalOptimum: "minimum",
    localOptimaCount: 1,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const x = denormalize(xNorm, -4.5, 4.5);
    const y = denormalize(yNorm, -4.5, 4.5);
    // Log compression to avoid extreme range dominating normalization
    return Math.log(1 + bealeRaw(x, y));
  },
};

// ---------------------------------------------------------------------------
// 4. Michalewicz Function (m=2)
//    f(x,y) = -sin(x)·sin⁴(x²/π) - sin(y)·sin⁴(2y²/π)
//    Domain: [0, π]
//    Global min at ≈ (2.20, 1.57) ≈ -1.73
//    Normalized min position ≈ (0.70, 0.50) — off-center right
//
//    Uses m=2 (exponent 2m=4) instead of the standard m=10 to ensure
//    the ridges are wide enough to be captured on a 12-20 cell grid.
//    Creates narrow valleys ("ridges") that require precise exploration.
//    The global minimum sits at the intersection of two ridges.
// ---------------------------------------------------------------------------

function michalewiczRaw(x: number, y: number): number {
  const m = 2;
  return (
    -Math.sin(x) * Math.sin((x * x) / Math.PI) ** (2 * m) -
    Math.sin(y) * Math.sin((2 * y * y) / Math.PI) ** (2 * m)
  );
}

const michalewicz: BenchmarkEvaluator = {
  meta: {
    id: "michalewicz",
    name: "Michalewicz",
    description:
      "Superficie con crestas estrechas que forman valles profundos. El mínimo global se encuentra donde dos crestas se cruzan, requiriendo una exploración precisa para localizarlo.",
    domain: [0, Math.PI],
    naturalOptimum: "minimum",
    localOptimaCount: 4,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const x = denormalize(xNorm, 0, Math.PI);
    const y = denormalize(yNorm, 0, Math.PI);
    return michalewiczRaw(x, y);
  },
};

// ---------------------------------------------------------------------------
// 5. Schwefel Function
//    f(x,y) = 418.9829·2 - Σ xᵢ·sin(√|xᵢ|)
//    Domain: [-500, 500]
//    Global min at (420.9687, 420.9687) ≈ 0
//    Normalized min position ≈ (0.92, 0.92) — bottom-right corner area
//
//    The global minimum is far from the center and far from the next
//    best local minimum. This makes it extremely deceptive: local
//    search strategies are drawn to false minima on the opposite side
//    of the domain. Excellent for the game.
// ---------------------------------------------------------------------------

function schwefelRaw(x: number, y: number): number {
  const d = 2;
  const sum =
    x * Math.sin(Math.sqrt(Math.abs(x))) + y * Math.sin(Math.sqrt(Math.abs(y)));
  return 418.9829 * d - sum;
}

const schwefel: BenchmarkEvaluator = {
  meta: {
    id: "schwefel",
    name: "Schwefel",
    description:
      "Función con el óptimo global alejado del centro y del siguiente mejor mínimo local. Engañosa para estrategias de búsqueda local.",
    domain: [-500, 500],
    naturalOptimum: "minimum",
    localOptimaCount: 20,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const x = denormalize(xNorm, -500, 500);
    const y = denormalize(yNorm, -500, 500);
    return schwefelRaw(x, y);
  },
};

// ---------------------------------------------------------------------------
// 6. Gaussian Mixture (procedurally generated, NEGATED)
//    A sum of several inverted 2D Gaussians creating wells of different depths.
//    Domain: [0, 1] (already normalized)
//
//    IMPORTANT: The function is NEGATED so that the Gaussian peaks become
//    wells (minima). This way, the player must find the deepest well —
//    the most prominent Gaussian component. Without negation, the game
//    would minimize a sum of positive Gaussians, whose minimum is the
//    boring flat area far from all peaks (89/256 cells at value 0!).
//    With negation: exactly 1 cell at value 0, clear target.
// ---------------------------------------------------------------------------

interface GaussianComponent {
  cx: number;
  cy: number;
  amplitude: number;
  sigmaX: number;
  sigmaY: number;
}

/** Deterministic pseudo-random based on a seed */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createGaussianMixtureComponents(
  seed: number = 42,
  count: number = 7,
): GaussianComponent[] {
  const rand = seededRandom(seed);
  const components: GaussianComponent[] = [];
  for (let i = 0; i < count; i++) {
    components.push({
      cx: 0.1 + rand() * 0.8,
      cy: 0.1 + rand() * 0.8,
      amplitude: 0.3 + rand() * 0.7,
      sigmaX: 0.04 + rand() * 0.12,
      sigmaY: 0.04 + rand() * 0.12,
    });
  }
  return components;
}

let cachedGaussianComponents: GaussianComponent[] | null = null;
let cachedGaussianSeed: number = -1;

function getGaussianComponents(seed: number = 42): GaussianComponent[] {
  if (cachedGaussianComponents !== null && cachedGaussianSeed === seed) {
    return cachedGaussianComponents;
  }
  cachedGaussianComponents = createGaussianMixtureComponents(seed);
  cachedGaussianSeed = seed;
  return cachedGaussianComponents;
}

function gaussianMixtureRaw(
  x: number,
  y: number,
  components: GaussianComponent[],
): number {
  let total = 0;
  for (const g of components) {
    const dx = (x - g.cx) / g.sigmaX;
    const dy = (y - g.cy) / g.sigmaY;
    total += g.amplitude * Math.exp(-0.5 * (dx * dx + dy * dy));
  }
  return total;
}

const gaussianMixture: BenchmarkEvaluator = {
  meta: {
    id: "gaussian_mixture",
    name: "Mezcla Gaussiana",
    description:
      "Paisaje con múltiples pozos de diferente profundidad y anchura. El mínimo global está en el pozo más profundo. Simula un proceso real con varias zonas prometedoras.",
    domain: [0, 1],
    naturalOptimum: "minimum",
    localOptimaCount: 7,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const components = getGaussianComponents(42);
    // Negate: peaks become wells, deepest well is the global minimum
    return -gaussianMixtureRaw(xNorm, yNorm, components);
  },
};

// ---------------------------------------------------------------------------
// 7. Sinusoidal (superposed sine waves, NEGATED)
//    A combination of sine/cosine waves with an asymmetric envelope.
//    Domain: [0, 1] (already normalized)
//
//    NEGATED so that the tallest peak becomes the deepest well (minimum).
//    The asymmetric envelope at (0.4, 0.6) concentrates the deepest
//    features in a specific region, creating a natural exploration target
//    that isn't at the center of the grid.
// ---------------------------------------------------------------------------

function sinusoidalRaw(x: number, y: number): number {
  const scale = 2 * Math.PI;
  const term1 = Math.sin(3 * scale * x) * Math.cos(2 * scale * y) * 0.4;
  const term2 =
    Math.sin(5 * scale * x + 1.2) * Math.sin(4 * scale * y + 0.8) * 0.25;
  const term3 = Math.cos(2 * scale * (x + y)) * 0.2;
  const term4 = Math.sin(7 * scale * x) * Math.cos(6 * scale * y) * 0.15;
  // Add a broad envelope so it's not perfectly symmetric
  const envelope = Math.exp(-2 * ((x - 0.4) ** 2 + (y - 0.6) ** 2));
  return (term1 + term2 + term3 + term4) * (0.5 + 0.5 * envelope) + 0.5;
}

const sinusoidal: BenchmarkEvaluator = {
  meta: {
    id: "sinusoidal",
    name: "Sinusoidal",
    description:
      "Ondas sinusoidales superpuestas con una envolvente asimétrica. Muchos mínimos locales con un valle global sutil concentrado en una región específica del mapa.",
    domain: [0, 1],
    naturalOptimum: "minimum",
    localOptimaCount: 40,
  },
  evaluate(xNorm: number, yNorm: number): number {
    // Negate: tallest peak becomes deepest well
    return -sinusoidalRaw(xNorm, yNorm);
  },
};

// ---------------------------------------------------------------------------
// Registry: all functions accessible by ID
// ---------------------------------------------------------------------------

export const BENCHMARK_FUNCTIONS: Record<
  BenchmarkFunction,
  BenchmarkEvaluator
> = {
  styblinski_tang: styblinskiTang,
  eggholder,
  beale,
  michalewicz,
  schwefel,
  gaussian_mixture: gaussianMixture,
  sinusoidal,
};

/** Get a benchmark evaluator by its ID */
export function getBenchmarkFunction(
  id: BenchmarkFunction,
): BenchmarkEvaluator {
  return BENCHMARK_FUNCTIONS[id];
}

/** Get metadata for all available functions */
export function getAllFunctionMetas(): FunctionMeta[] {
  return Object.values(BENCHMARK_FUNCTIONS).map((f) => f.meta);
}

// ---------------------------------------------------------------------------
// Grid evaluation utilities
// ---------------------------------------------------------------------------

export interface GridEvaluation {
  /** The raw 2D array of values [row][col] */
  values: number[][];
  /** Minimum value in the grid */
  min: number;
  /** Maximum value in the grid */
  max: number;
  /** Position (row, col) of the global minimum */
  minPosition: { row: number; col: number };
  /** Position (row, col) of the global maximum */
  maxPosition: { row: number; col: number };
}

/**
 * Evaluate a benchmark function over the entire grid and return
 * the raw values along with global min/max information.
 */
export function evaluateGrid(
  functionId: BenchmarkFunction,
  gridSize: number,
): GridEvaluation {
  const fn = getBenchmarkFunction(functionId);
  const values: number[][] = [];

  let globalMin = Infinity;
  let globalMax = -Infinity;
  let minPos = { row: 0, col: 0 };
  let maxPos = { row: 0, col: 0 };

  for (let row = 0; row < gridSize; row++) {
    const rowValues: number[] = [];
    for (let col = 0; col < gridSize; col++) {
      // Map grid indices to [0, 1] normalized coordinates
      const xNorm = col / (gridSize - 1);
      const yNorm = row / (gridSize - 1);
      const value = fn.evaluate(xNorm, yNorm);
      rowValues.push(value);

      if (value < globalMin) {
        globalMin = value;
        minPos = { row, col };
      }
      if (value > globalMax) {
        globalMax = value;
        maxPos = { row, col };
      }
    }
    values.push(rowValues);
  }

  return {
    values,
    min: globalMin,
    max: globalMax,
    minPosition: minPos,
    maxPosition: maxPos,
  };
}

/**
 * Normalize a value to [0, 1] given the grid's min and max.
 * Returns 0 for the minimum and 1 for the maximum.
 */
export function normalizeValue(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/**
 * Map a normalized value [0, 1] to a heatmap CSS color.
 * Uses a multi-stop gradient: cold blue → green → yellow → red → hot pink.
 */
export function valueToColor(normalized: number): string {
  // Clamp to [0, 1]
  const t = Math.max(0, Math.min(1, normalized));

  // Define color stops: [position, r, g, b]
  const stops: [number, number, number, number][] = [
    [0.0, 30, 58, 95], // deep blue
    [0.2, 37, 99, 235], // blue
    [0.4, 34, 197, 94], // green
    [0.6, 234, 179, 8], // yellow
    [0.8, 239, 68, 68], // red
    [1.0, 255, 20, 147], // hot pink
  ];

  // Find the two stops we're between
  let lower = stops[0]!;
  let upper = stops[stops.length - 1]!;

  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i]![0] && t <= stops[i + 1]![0]) {
      lower = stops[i]!;
      upper = stops[i + 1]!;
      break;
    }
  }

  // Interpolate
  const range = upper[0] - lower[0];
  const frac = range === 0 ? 0 : (t - lower[0]) / range;

  const r = Math.round(lower[1] + frac * (upper[1] - lower[1]));
  const g = Math.round(lower[2] + frac * (upper[2] - lower[2]));
  const b = Math.round(lower[3] + frac * (upper[3] - lower[3]));

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Regenerate the Gaussian Mixture with a new random seed.
 * Call this at the start of each new game to get a fresh landscape.
 */
export function randomizeGaussianMixture(seed?: number): void {
  const newSeed = seed ?? Math.floor(Math.random() * 2147483646) + 1;
  cachedGaussianComponents = createGaussianMixtureComponents(newSeed);
  cachedGaussianSeed = newSeed;
}
