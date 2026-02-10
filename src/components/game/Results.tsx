import { useStore } from "@nanostores/react";
import { useEffect, useState, useMemo } from "react";
import {
  $gameState,
  $config,
  $stats,
  $lastSavedHighScore,
  goToLanding,
  restartGame,
} from "@/stores/gameStore";
import { DIFFICULTY_PRESETS, getPlayerArchetype } from "@/types/game";
import type { Difficulty } from "@/types/game";
import { isOptimumFound } from "@/lib/grid";
import { valueToColor } from "@/lib/functions";
import {
  loadHighScores,
  getHighScoresByDifficulty,
  formatDate,
} from "@/lib/highScores";

// ---------------------------------------------------------------------------
// Results – End-of-game screen (matches PantallaFinal.png mock)
// ---------------------------------------------------------------------------

const DIFFICULTY_TABS: Difficulty[] = ["easy", "medium", "hard"];

export default function Results() {
  const gameState = useStore($gameState);
  const config = useStore($config);
  const stats = useStore($stats);
  const lastSaved = useStore($lastSavedHighScore);

  const [animateIn, setAnimateIn] = useState(false);
  const [scoreTab, setScoreTab] = useState<Difficulty | "all">(
    config.difficulty,
  );

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Calculate duration
  const durationMs =
    gameState.startedAt && gameState.finishedAt
      ? gameState.finishedAt - gameState.startedAt
      : gameState.startedAt
        ? Date.now() - gameState.startedAt
        : 0;
  const durationSec = Math.round(durationMs / 1000);
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const durationDisplay = `${mins}:${String(secs).padStart(2, "0")}`;

  const foundOptimum = isOptimumFound(
    stats.bestValueFound,
    stats.optimumValue,
    "minimize",
  );

  // Efficiency score
  const budgetFraction = stats.budgetSpent / config.budget;
  const efficiencyScore = Math.max(
    0,
    Math.min(100, Math.round(stats.score * (1 - budgetFraction * 0.5))),
  );

  // Player archetype
  const archetype = getPlayerArchetype(stats, config, foundOptimum);

  // Comparison: typical optimized run iterations (rough estimate)
  const typicalIterations = Math.max(
    Math.round(config.gridSize * 1.2),
    stats.iterations - 3,
  );

  const preset = DIFFICULTY_PRESETS[config.difficulty];

  // High scores
  const highScores = useMemo(() => {
    if (scoreTab === "all") return loadHighScores();
    return getHighScoresByDifficulty(scoreTab);
  }, [scoreTab, lastSaved]);

  // Build board overview data
  const boardData = useMemo(() => {
    const grid = gameState.grid;
    if (!grid || grid.length === 0) return null;

    // Collect cells that were player-revealed (have a revealOrder)
    const playerRevealed: { row: number; col: number; order: number }[] = [];
    for (const row of grid) {
      for (const cell of row) {
        if (cell.revealOrder !== null) {
          playerRevealed.push({
            row: cell.row,
            col: cell.col,
            order: cell.revealOrder,
          });
        }
      }
    }

    return {
      grid,
      gridSize: grid.length,
      playerRevealed,
      optimumPosition: stats.optimumPosition,
      bestPosition: stats.bestPosition,
    };
  }, [gameState.grid, stats.optimumPosition, stats.bestPosition]);

  return (
    <div className="min-h-dvh bg-[#f5f7fa]">
      {/* ── Header Bar ── */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <h1 className="text-base sm:text-lg font-display font-bold text-slate-800">
            DxTER The Optimization Game
          </h1>
          <button
            onClick={goToLanding}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Menu
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div
        className={`max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 transition-all duration-700 ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Trophy Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-[#177B7D]/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#177B7D]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-2.752 0m0 0a6.726 6.726 0 01-2.749-1.35"
              />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 mb-2">
            {foundOptimum
              ? "You found the global minimum!"
              : `You reached ${stats.bestValueFound} — optimum was ${stats.optimumValue}`}
          </h2>

          {/* Tags */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm text-slate-500">
            <span className="px-2.5 py-0.5 rounded-full bg-[#177B7D] text-white text-xs font-semibold">
              {preset.label}
            </span>
            <span className="text-slate-400">&middot;</span>
            <span>
              {config.gridSize} &times; {config.gridSize} grid
            </span>
            <span className="text-slate-400">&middot;</span>
            <span>Goal: Find the global minimum within budget</span>
          </div>
        </div>

        {/* ── Stats Row: Your Run + Archetype ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 mb-8">
          {/* Your Run Card */}
          <div className="glass p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-display font-bold text-slate-800">
                Your Run
              </h3>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  foundOptimum
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {foundOptimum ? "Success" : "Incomplete"}
              </span>
            </div>

            {/* Big stats */}
            <div className="grid grid-cols-3 gap-6 mb-5">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">
                  Lowest Value Found
                </p>
                <p className="text-4xl font-display font-bold text-[#177B7D]">
                  {stats.bestValueFound}
                </p>
                {foundOptimum && (
                  <p className="text-xs text-[#177B7D] font-medium mt-1 flex items-center justify-center gap-1">
                    Global Minimum
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Total Iterations</p>
                <p className="text-4xl font-display font-bold text-slate-800">
                  {stats.iterations}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Budget Spent</p>
                <p className="text-4xl font-display font-bold text-slate-800">
                  ${stats.budgetSpent}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  of ${config.budget}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#e5e7eb] pt-4 flex items-center gap-8">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg
                  className="w-4 h-4 text-[#177B7D]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                  />
                </svg>
                <span>DxTER Used</span>
                <span className="font-semibold">
                  {stats.dxterUsed ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Time Taken</span>
                <span className="font-semibold">{durationDisplay}</span>
              </div>
            </div>
          </div>

          {/* Archetype Card */}
          <div className="archetype-card flex flex-col items-center justify-center">
            {/* Avatar / Emoji */}
            <div className="text-5xl mb-3">{archetype.emoji}</div>
            <h3 className="text-xl font-display font-bold text-white mb-1">
              {archetype.title}
            </h3>
            <p className="text-sm text-white/70 mb-5 text-center leading-relaxed">
              {archetype.description}
            </p>

            {/* Efficiency Score */}
            <div className="bg-white/15 rounded-xl px-6 py-3 w-full text-center">
              <p className="text-xs text-white/60 mb-0.5">Efficiency Score</p>
              <p className="text-4xl font-display font-bold text-white">
                {efficiencyScore}%
              </p>
            </div>
          </div>
        </div>

        {/* ── Board Overview (Heatmap) ── */}
        {boardData && (
          <div className="glass p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-slate-800">
                Board Overview
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded-sm border-2 border-white"
                    style={{ boxShadow: "0 0 0 1.5px #177B7D" }}
                  />
                  Your clicks
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" />
                  Global min
                </span>
              </div>
            </div>

            {/* Color scale legend */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-400">Low</span>
              <div
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{
                  background:
                    "linear-gradient(to right, rgb(30,58,95), rgb(37,99,235), rgb(34,197,94), rgb(234,179,8), rgb(239,68,68), rgb(255,20,147))",
                }}
              />
              <span className="text-xs text-slate-400">High</span>
            </div>

            {/* Grid */}
            <div className="flex justify-center">
              <div
                className="inline-grid gap-[1px] bg-slate-200 rounded-lg overflow-hidden p-[1px]"
                style={{
                  gridTemplateColumns: `repeat(${boardData.gridSize}, 1fr)`,
                }}
              >
                {boardData.grid.flatMap((row) =>
                  row.map((cell) => {
                    const isPlayerRevealed = cell.revealOrder !== null;
                    const isOptimum =
                      cell.row === boardData.optimumPosition.row &&
                      cell.col === boardData.optimumPosition.col;
                    const isBest =
                      boardData.bestPosition !== null &&
                      cell.row === boardData.bestPosition.row &&
                      cell.col === boardData.bestPosition.col;

                    // Compute cell size based on grid size
                    const cellSize =
                      boardData.gridSize <= 12
                        ? 36
                        : boardData.gridSize <= 16
                          ? 28
                          : 22;

                    const fontSize =
                      boardData.gridSize <= 12
                        ? 10
                        : boardData.gridSize <= 16
                          ? 8
                          : 7;

                    return (
                      <div
                        key={`${cell.row}-${cell.col}`}
                        className="relative flex items-center justify-center"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: valueToColor(cell.normalizedValue),
                          boxShadow: isPlayerRevealed
                            ? "inset 0 0 0 2px rgba(255,255,255,0.85)"
                            : undefined,
                        }}
                        title={`(${cell.row}, ${cell.col}) = ${cell.value}${isOptimum ? " ★ Global Min" : ""}${isPlayerRevealed ? ` · Click #${cell.revealOrder}` : ""}`}
                      >
                        {/* Optimum star marker */}
                        {isOptimum && (
                          <span
                            className="absolute z-20 text-yellow-300 drop-shadow-md"
                            style={{
                              fontSize: cellSize * 0.65,
                              lineHeight: 1,
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              textShadow:
                                "0 0 3px rgba(0,0,0,0.5), 0 0 6px rgba(234,179,8,0.6)",
                            }}
                          >
                            ★
                          </span>
                        )}

                        {/* Player revealed indicator: show order number */}
                        {isPlayerRevealed && !isOptimum && (
                          <span
                            className="relative z-10 font-bold text-white"
                            style={{
                              fontSize,
                              textShadow: "0 0 3px rgba(0,0,0,0.6)",
                            }}
                          >
                            {cell.revealOrder}
                          </span>
                        )}

                        {/* If it's both optimum and player-revealed, show the order below */}
                        {isPlayerRevealed && isOptimum && (
                          <span
                            className="absolute bottom-0 right-0 z-30 font-bold text-white bg-black/40 rounded-tl px-0.5"
                            style={{ fontSize: fontSize - 1, lineHeight: 1.2 }}
                          >
                            {cell.revealOrder}
                          </span>
                        )}

                        {/* Best found indicator (ring) — only if different from optimum */}
                        {isBest && !isOptimum && (
                          <span
                            className="absolute inset-0 z-10 rounded-sm"
                            style={{
                              boxShadow:
                                "inset 0 0 0 2px #177B7D, 0 0 4px rgba(23,123,125,0.5)",
                            }}
                          />
                        )}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>

            {/* Grid info */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span>
                {boardData.playerRevealed.length} of{" "}
                {boardData.gridSize * boardData.gridSize} cells explored (
                {Math.round(
                  (boardData.playerRevealed.length /
                    (boardData.gridSize * boardData.gridSize)) *
                    100,
                )}
                %)
              </span>
              <span>
                Global min at ({boardData.optimumPosition.row},{" "}
                {boardData.optimumPosition.col})
              </span>
            </div>
          </div>
        )}

        {/* ── How You Compare ── */}
        <div className="glass p-6 mb-8">
          <h3 className="text-lg font-display font-bold text-slate-800 mb-5">
            How You Compare
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Your run bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Your Run (with DxTER)
                </span>
                <span className="text-sm text-slate-500">
                  {stats.iterations} iterations
                </span>
              </div>
              <div className="w-full h-9 bg-[#e5e7eb] rounded-lg overflow-hidden">
                <div
                  className="comparison-bar bg-[#177B7D]"
                  style={{
                    width: `${Math.min(100, Math.max(15, (stats.iterations / Math.max(stats.iterations, typicalIterations)) * 100))}%`,
                    transition: animateIn ? "width 1s ease-out 0.5s" : "none",
                  }}
                >
                  {stats.iterations}
                </div>
              </div>
            </div>

            {/* Typical run bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Typical Optimized Run
                </span>
                <span className="text-sm text-slate-500">
                  {typicalIterations} iterations
                </span>
              </div>
              <div className="w-full h-9 bg-[#e5e7eb] rounded-lg overflow-hidden">
                <div
                  className="comparison-bar bg-slate-500"
                  style={{
                    width: `${Math.min(100, Math.max(15, (typicalIterations / Math.max(stats.iterations, typicalIterations)) * 100))}%`,
                    transition: animateIn ? "width 1s ease-out 0.7s" : "none",
                  }}
                >
                  {typicalIterations}
                </div>
              </div>
            </div>
          </div>

          {/* Insight message */}
          <div className="mt-5 flex items-start gap-2 bg-[#177B7D]/5 border border-[#177B7D]/10 rounded-lg p-3">
            <svg
              className="w-4 h-4 text-[#177B7D] shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
              />
            </svg>
            <p className="text-sm text-slate-600">
              Smart experimentation with DxTER helps reach the minimum with
              fewer attempts
            </p>
          </div>
        </div>

        {/* ── Leaderboard ── */}
        <div className="glass p-6 mb-8">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <h3 className="text-lg font-display font-bold text-slate-800">
                Leaderboard
              </h3>
            </div>
            {/* Tabs */}
            <div className="flex gap-2">
              {(["all", ...DIFFICULTY_TABS] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setScoreTab(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    scoreTab === t
                      ? "bg-[#177B7D] text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {t === "all" ? "All" : DIFFICULTY_PRESETS[t].label}
                </button>
              ))}
            </div>
          </div>

          {highScores.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              <p className="text-3xl mb-2">🎮</p>
              <p>No scores yet for this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 pr-2">#</th>
                    <th className="pb-2 pr-2">Player</th>
                    <th className="pb-2 pr-2">Difficulty</th>
                    <th className="pb-2 pr-2 text-right">Best</th>
                    <th className="pb-2 pr-2 text-right">Efficiency</th>
                    <th className="pb-2 pr-2 text-right">Iterations</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {highScores.slice(0, 15).map((entry, i) => {
                    const isCurrentGame =
                      lastSaved !== null && entry.id === lastSaved.id;

                    return (
                      <tr
                        key={entry.id}
                        className={`border-t border-slate-50 transition-colors ${
                          isCurrentGame
                            ? "bg-[#177B7D]/5 ring-1 ring-[#177B7D]/20 rounded"
                            : "hover:bg-slate-50/50"
                        }`}
                      >
                        <td className="py-2.5 pr-2 text-slate-400 font-medium">
                          {i < 3 ? (
                            <span className="text-base">
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            i + 1
                          )}
                        </td>
                        <td className="py-2.5 pr-2 font-medium text-slate-700 truncate max-w-[120px]">
                          {entry.playerName}
                          {isCurrentGame && (
                            <span className="ml-1.5 text-[10px] font-semibold text-[#177B7D] bg-[#177B7D]/10 px-1.5 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-2">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded ${
                              entry.difficulty === "easy"
                                ? "bg-green-100 text-green-700"
                                : entry.difficulty === "medium"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {DIFFICULTY_PRESETS[entry.difficulty].label}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          <span className="font-semibold text-slate-700">
                            {entry.bestValue}
                          </span>
                          {entry.foundOptimum && (
                            <span className="ml-1 text-[#177B7D]">✓</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-2 text-right font-semibold text-[#177B7D]">
                          {entry.efficiencyScore}%
                        </td>
                        <td className="py-2.5 pr-2 text-right text-slate-500">
                          {entry.iterations}
                        </td>
                        <td className="py-2.5 text-right text-slate-400 text-xs">
                          {formatDate(entry.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={restartGame}
            className="group flex items-center gap-2 px-8 py-3.5 bg-[#177B7D] hover:bg-[#155e5f] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#177B7D]/20 hover:shadow-[#177B7D]/40 transition-all duration-200 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.016 4.657v4.992"
              />
            </svg>
            Play Again
          </button>

          <button
            onClick={goToLanding}
            className="px-6 py-3 border border-[#e5e7eb] text-slate-600 font-medium text-sm rounded-xl hover:bg-white hover:border-slate-300 transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
