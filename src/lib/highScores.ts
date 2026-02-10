// ---------------------------------------------------------------------------
// DxTER: The Optimization Game – High Scores (localStorage persistence)
// ---------------------------------------------------------------------------

import type { Difficulty } from "@/types/game";

/** A single high score entry */
export interface HighScoreEntry {
  /** Unique ID for the entry */
  id: string;
  /** Player / session name */
  playerName: string;
  /** Difficulty level played */
  difficulty: Difficulty;
  /** Grid size (e.g. 12, 16, 20) */
  gridSize: number;
  /** Best value found (0-100) */
  bestValue: number;
  /** Whether the global minimum was found */
  foundOptimum: boolean;
  /** Efficiency score (0-100) */
  efficiencyScore: number;
  /** Raw score (0-100) — how close to the optimum */
  score: number;
  /** Budget spent */
  budgetSpent: number;
  /** Total budget available */
  budgetTotal: number;
  /** Number of iterations (cells flipped) */
  iterations: number;
  /** Whether DxTER was used */
  dxterUsed: boolean;
  /** Duration in milliseconds */
  durationMs: number;
  /** ISO timestamp of when the game ended */
  timestamp: string;
}

const STORAGE_KEY = "dxter_high_scores";
const MAX_ENTRIES = 50;

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

/** Load all high scores from localStorage */
export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HighScoreEntry[];
  } catch {
    return [];
  }
}

/** Save the full list of high scores to localStorage */
function saveHighScores(scores: HighScoreEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

// ---------------------------------------------------------------------------
// Add / Remove
// ---------------------------------------------------------------------------

/** Generate a simple unique ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Add a new high score entry.
 * Entries are sorted by efficiency score (desc), then by score (desc).
 * Only the top MAX_ENTRIES are kept.
 */
export function addHighScore(
  entry: Omit<HighScoreEntry, "id" | "timestamp">,
): HighScoreEntry {
  const scores = loadHighScores();

  const newEntry: HighScoreEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  scores.push(newEntry);
  scores.sort((a, b) => {
    // Primary: efficiency score descending
    if (b.efficiencyScore !== a.efficiencyScore)
      return b.efficiencyScore - a.efficiencyScore;
    // Secondary: score descending
    if (b.score !== a.score) return b.score - a.score;
    // Tertiary: fewer iterations is better
    return a.iterations - b.iterations;
  });

  // Keep only the top entries
  const trimmed = scores.slice(0, MAX_ENTRIES);
  saveHighScores(trimmed);

  return newEntry;
}

/** Remove a high score entry by ID */
export function removeHighScore(id: string): void {
  const scores = loadHighScores();
  const filtered = scores.filter((s) => s.id !== id);
  saveHighScores(filtered);
}

/** Clear all high scores */
export function clearHighScores(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get high scores filtered by difficulty, sorted best-first */
export function getHighScoresByDifficulty(
  difficulty: Difficulty,
): HighScoreEntry[] {
  return loadHighScores().filter((s) => s.difficulty === difficulty);
}

/** Get the top N high scores across all difficulties */
export function getTopHighScores(limit: number = 10): HighScoreEntry[] {
  return loadHighScores().slice(0, limit);
}

/** Get the rank (1-based) of a specific entry among all scores */
export function getScoreRank(id: string): number | null {
  const scores = loadHighScores();
  const index = scores.findIndex((s) => s.id === id);
  return index === -1 ? null : index + 1;
}

/** Get the rank of a specific entry within its difficulty */
export function getScoreRankInDifficulty(id: string): number | null {
  const scores = loadHighScores();
  const entry = scores.find((s) => s.id === id);
  if (!entry) return null;

  const sameLevel = scores.filter((s) => s.difficulty === entry.difficulty);
  const index = sameLevel.findIndex((s) => s.id === id);
  return index === -1 ? null : index + 1;
}

/**
 * Check if a given efficiency score would make it into the top N
 * for a specific difficulty.
 */
export function isNewHighScore(
  efficiencyScore: number,
  difficulty: Difficulty,
  topN: number = 10,
): boolean {
  const scores = getHighScoresByDifficulty(difficulty);
  if (scores.length < topN) return true;
  const lowestTop = scores[topN - 1];
  return lowestTop ? efficiencyScore > lowestTop.efficiencyScore : true;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Format duration in ms to a mm:ss string */
export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/** Format a timestamp ISO string to a short localized date */
export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
