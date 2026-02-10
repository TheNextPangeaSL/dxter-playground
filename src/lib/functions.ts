// ---------------------------------------------------------------------------
// BuscaÓptimos – Benchmark Functions Library
// ---------------------------------------------------------------------------
// Each function takes (x, y) in a normalized [0, 1] domain and maps them
// to the appropriate mathematical domain internally. All functions return
// a scalar value representing the objective surface.
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
// 1. Rastrigin Function
//    f(x,y) = 20 + x² + y² - 10(cos(2πx) + cos(2πy))
//    Domain: [-5.12, 5.12]   Global min: f(0,0) = 0
// ---------------------------------------------------------------------------

function rastriginRaw(x: number, y: number): number {
  const A = 10;
  const n = 2;
  return A * n + (x * x - A * Math.cos(2 * Math.PI * x)) + (y * y - A * Math.cos(2 * Math.PI * y));
}

const rastrigin: BenchmarkEvaluator = {
  meta: {
    id: "rastrigin",
    name: "Rastrigin",
    description:
      "Función altamente multimodal con muchos óptimos locales distribuidos regularmente. Difícil de optimizar sin una estrategia global.",
    domain: [-5.12, 5.12],
    naturalOptimum: "minimum",
    localOptimaCount: 50,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const x = denormalize(xNorm, -5.12, 5.12);
    const y = denormalize(yNorm, -5.12, 5.12);
    return rastriginRaw(x, y);
  },
};

// ---------------------------------------------------------------------------
// 2. Ackley Function
//    Domain: [-5, 5]   Global min: f(0,0) = 0
// ---------------------------------------------------------------------------

function ackleyRaw(x: number, y: number): number {
  const a = 20;
  const b = 0.2;
  const c = 2 * Math.PI;
  const sum1 = x * x + y * y;
  const sum2 = Math.cos(c * x) + Math.cos(c * y);
  return -a * Math.exp(-b * Math.sqrt(0.5 * sum1)) - Math.exp(0.5 * sum2) + a + Math.E;
}

const ackley: BenchmarkEvaluator = {
  meta: {
    id: "ackley",
    name: "Ackley",
    description:
      "Superficie casi plana con muchos mínimos locales y un estrecho óptimo global en el centro. Perfecta para demostrar exploración vs explotación.",
    domain: [-5, 5],
    naturalOptimum: "minimum",
    localOptimaCount: 30,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const x = denormalize(xNorm, -5, 5);
    const y = denormalize(yNorm, -5, 5);
    return ackleyRaw(x, y);
  },
};

// ---------------------------------------------------------------------------
// 3. Rosenbrock Function (Banana function)
//    f(x,y) = (1-x)² + 100(y - x²)²
//    Domain: [-2, 2]   Global min: f(1,1) = 0
// ---------------------------------------------------------------------------

function rosenbrockRaw(x: number, y: number): number {
  return (1 - x) ** 2 + 100 * (y - x * x) ** 2;
}

const rosenbrock: BenchmarkEvaluator = {
  meta: {
    id: "rosenbrock",
    name: "Rosenbrock",
    description:
      "Función con un valle estrecho y curvado (forma de banana). El óptimo global se encuentra dentro del valle, difícil de localizar con precisión.",
    domain: [-2, 2],
    naturalOptimum: "minimum",
    localOptimaCount: 1,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const x = denormalize(xNorm, -2, 2);
    const y = denormalize(yNorm, -2, 2);
    return rosenbrockRaw(x, y);
  },
};

// ---------------------------------------------------------------------------
// 4. Himmelblau Function
//    f(x,y) = (x² + y - 11)² + (x + y² - 7)²
//    Domain: [-5, 5]   Four identical global minima ≈ 0
// ---------------------------------------------------------------------------

function himmelblauRaw(x: number, y: number): number {
  return (x * x + y - 11) ** 2 + (x + y * y - 7) ** 2;
}

const himmelblau: BenchmarkEvaluator = {
  meta: {
    id: "himmelblau",
    name: "Himmelblau",
    description:
      "Función con cuatro óptimos globales idénticos distribuidos simétricamente. Ideal para demostrar la capacidad de exploración multimodal.",
    domain: [-5, 5],
    naturalOptimum: "minimum",
    localOptimaCount: 4,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const x = denormalize(xNorm, -5, 5);
    const y = denormalize(yNorm, -5, 5);
    return himmelblauRaw(x, y);
  },
};

// ---------------------------------------------------------------------------
// 5. Schwefel Function
//    f(x,y) = 418.9829·2 - Σ xᵢ·sin(√|xᵢ|)
//    Domain: [-500, 500]   Global min at (420.9687, 420.9687)
// ---------------------------------------------------------------------------

function schwefelRaw(x: number, y: number): number {
  const d = 2;
  const sum = x * Math.sin(Math.sqrt(Math.abs(x))) + y * Math.sin(Math.sqrt(Math.abs(y)));
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
// 6. Gaussian Mixture (procedurally generated)
//    A sum of several 2D Gaussians with random centers, amplitudes and widths.
//    Domain: [0, 1] (already normalized)
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

function createGaussianMixtureComponents(seed: number = 42, count: number = 7): GaussianComponent[] {
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

function gaussianMixtureRaw(x: number, y: number, components: GaussianComponent[]): number {
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
      "Paisaje suave con múltiples picos de diferentes alturas y anchuras. Simula un proceso real con varias zonas prometedoras.",
    domain: [0, 1],
    naturalOptimum: "maximum",
    localOptimaCount: 7,
  },
  evaluate(xNorm: number, yNorm: number): number {
    const components = getGaussianComponents(42);
    return gaussianMixtureRaw(xNorm, yNorm, components);
  },
};

// ---------------------------------------------------------------------------
// 7. Sinusoidal (superposed sine waves)
//    A combination of sine/cosine waves creating an interesting landscape.
//    Domain: [0, 1] (already normalized)
// ---------------------------------------------------------------------------

function sinusoidalRaw(x: number, y: number): number {
  const scale = 2 * Math.PI;
  const term1 = Math.sin(3 * scale * x) * Math.cos(2 * scale * y) * 0.4;
  const term2 = Math.sin(5 * scale * x + 1.2) * Math.sin(4 * scale * y + 0.8) * 0.25;
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
      "Ondas sinusoidales superpuestas con una envolvente asimétrica. Muchos óptimos locales con un pico global sutil.",
    domain: [0, 1],
    naturalOptimum: "maximum",
    localOptimaCount: 40,
  },
  evaluate(xNorm: number, yNorm: number): number {
    return sinusoidalRaw(xNorm, yNorm);
  },
};

// ---------------------------------------------------------------------------
// Registry: all functions accessible by ID
// ---------------------------------------------------------------------------

export const BENCHMARK_FUNCTIONS: Record<BenchmarkFunction, BenchmarkEvaluator> = {
  rastrigin,
  ackley,
  rosenbrock,
  himmelblau,
  schwefel,
  gaussian_mixture: gaussianMixture,
  sinusoidal,
};

/** Get a benchmark evaluator by its ID */
export function getBenchmarkFunction(id: BenchmarkFunction): BenchmarkEvaluator {
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
export function evaluateGrid(functionId: BenchmarkFunction, gridSize: number): GridEvaluation {
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
export function normalizeValue(value: number, min: number, max: number): number {
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
    [0.0, 30, 58, 95],    // deep blue
    [0.2, 37, 99, 235],   // blue
    [0.4, 34, 197, 94],   // green
    [0.6, 234, 179, 8],   // yellow
    [0.8, 239, 68, 68],   // red
    [1.0, 255, 20, 147],  // hot pink
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
