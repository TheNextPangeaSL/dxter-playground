import { useStore } from "@nanostores/react";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import {
  $gameState,
  $config,
  $grid,
  $stats,
  $isFinished,
  $budgetRemaining,
  $budgetBarPercent,
  $canAskDxter,
  $iterations,
  handleCellClick,
  askDxter,
  restartGame,
  goToLanding,
  viewResults,
} from "@/stores/gameStore";
import type { Cell } from "@/types/game";
import { FLIP_COST, DXTER_COST, getBudgetRemaining } from "@/types/game";
import DxterAnimationModal from "./DxterAnimationModal";
import HowItWorksModal from "./HowItWorksModal";
import {
  getTileColor,
  getTileTextColor,
  isOptimumFound as checkOptimumFound,
} from "@/lib/grid";

// ---------------------------------------------------------------------------
// Difficulty badge labels
// ---------------------------------------------------------------------------
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

// ---------------------------------------------------------------------------
// GameBoard – Main game screen (matches Game.png mock)
// ---------------------------------------------------------------------------

export default function GameBoard() {
  const config = useStore($config);
  const grid = useStore($grid);
  const stats = useStore($stats);
  const isFinished = useStore($isFinished);
  const budgetRemaining = useStore($budgetRemaining);
  const budgetBarPercent = useStore($budgetBarPercent);
  const canAskDxter = useStore($canAskDxter);
  const iterations = useStore($iterations);

  const [timer, setTimer] = useState("00:00");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showDxterAnimation, setShowDxterAnimation] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Timer logic
  useEffect(() => {
    const gameState = $gameState.get();
    if (!gameState.startedAt || gameState.isFinished) return;

    const update = () => {
      const elapsed = Math.floor((Date.now() - gameState.startedAt!) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      setTimer(`${mins}:${secs}`);
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished]);

  // Show game-over modal when game finishes
  useEffect(() => {
    if (isFinished && !showGameOverModal) {
      // Small delay for dramatic effect
      const t = setTimeout(() => setShowGameOverModal(true), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isFinished]);

  const onCellClick = useCallback(
    (row: number, col: number) => {
      if (isFinished) return;
      handleCellClick({ row, col });
    },
    [isFinished],
  );

  const handleAskDxter = useCallback(() => {
    if (!canAskDxter) return;
    setShowDxterAnimation(true);
  }, [canAskDxter]);

  const handleDxterApply = useCallback(() => {
    askDxter();
    setShowDxterAnimation(false);
  }, []);

  const handleDxterClose = useCallback(() => {
    setShowDxterAnimation(false);
  }, []);

  const revealedCount = useMemo(() => {
    let count = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.revealed) count++;
      }
    }
    return count;
  }, [grid]);

  const handlePlayAgain = useCallback(() => {
    setShowGameOverModal(false);
    restartGame();
  }, []);

  const handleViewResults = useCallback(() => {
    setShowGameOverModal(false);
    viewResults();
  }, []);

  if (!grid.length) return null;

  // Best value display
  const bestValue = isFinite(stats.bestValueFound)
    ? stats.bestValueFound
    : null;

  const foundOptimum =
    bestValue !== null &&
    checkOptimumFound(stats.bestValueFound, stats.optimumValue, "minimize");

  const budgetExhausted =
    getBudgetRemaining(config, stats) < FLIP_COST && !foundOptimum;

  return (
    <div className="min-h-dvh bg-[#f5f7fa] p-3 sm:p-5 lg:p-6">
      <div className="game-container max-w-[1400px] mx-auto">
        {/* ── Header Bar ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e5e7eb]">
          {/* Left: Back */}
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
            <span className="hidden sm:inline">Back to Start</span>
          </button>

          {/* Center: Title + Difficulty badge */}
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-display font-bold text-slate-800">
              DxTER: The Optimization Game
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#177B7D] text-white">
              {DIFFICULTY_LABELS[config.difficulty] ?? config.difficulty}
            </span>
          </div>

          {/* Right: Timer + Restart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
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
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-mono tabular-nums">{timer}</span>
            </div>
            <button
              onClick={() => {
                setShowGameOverModal(false);
                restartGame();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 border border-[#e5e7eb] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
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
              <span className="hidden sm:inline">Restart</span>
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex flex-col lg:flex-row">
          {/* ── Left: Grid Area ── */}
          <div className="flex-1 p-4 sm:p-6">
            {/* Grid header bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
              <h2 className="text-sm sm:text-base font-display font-bold text-slate-800">
                Optimization Grid
              </h2>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg
                  className="w-3.5 h-3.5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <circle cx="12" cy="12" r="9" />
                </svg>
                {config.gridSize} &times; {config.gridSize} tiles
              </div>

              {/* Goal badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#177B7D] text-white text-xs font-semibold">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941"
                  />
                </svg>
                Goal: Find Minimum
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span className="font-medium">Range:</span>
                <span>0 → 100</span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 ml-auto text-[11px] text-slate-500">
                <LegendItem
                  bgColor="#ffffff"
                  borderColor="#e5e7eb"
                  label="Unflipped"
                />
                <LegendItem
                  bgColor="#D1D5DB"
                  borderColor="#D1D5DB"
                  label="Low value"
                />
                <LegendItem
                  bgColor="#7FC7C3"
                  borderColor="#7FC7C3"
                  label="Close"
                />
                <LegendItem
                  bgColor="#177B7D"
                  borderColor="#177B7D"
                  label="Minimum"
                />
                <LegendItem
                  bgColor="#ffffff"
                  borderColor="#177B7D"
                  label="DxTER pick"
                  dashed
                  showBulb
                />
              </div>
            </div>

            {/* Grid */}
            <div className="w-full max-w-[min(100%,640px)]">
              <Grid
                grid={grid}
                gridSize={config.gridSize}
                onCellClick={onCellClick}
                isFinished={isFinished}
                bestFoundValue={stats.bestValueFound}
              />
            </div>
          </div>

          {/* ── Right: Sidebar ── */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-[#e5e7eb] p-4 sm:p-6">
            {/* Budget remaining */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  Budget remaining
                </span>
                {/* Info icon */}
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
              </div>
              <div className="text-3xl sm:text-4xl font-display font-bold text-slate-800 mb-2">
                ${budgetRemaining}
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${budgetBarPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">Iterations</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 4.235a2.25 2.25 0 01-1.944 1.128H9.414a2.25 2.25 0 01-1.944-1.128L5 14.5m14 0H5"
                    />
                  </svg>
                  {iterations}
                </span>
              </div>
            </div>

            {/* Best value found */}
            <div className="best-value-card mb-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white/80">
                  Lowest value found
                </span>
                {/* Trophy icon */}
                <svg
                  className="w-5 h-5 text-white/60"
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
              <div className="text-4xl font-display font-bold text-white">
                {bestValue !== null ? bestValue : "—"}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#e5e7eb] my-5" />

            {/* Ask DxTER button */}
            <button
              onClick={handleAskDxter}
              disabled={!canAskDxter}
              className="btn-dxter mb-2"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
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
                Ask DxTER
              </span>
              <span className="cost-badge">${DXTER_COST}</span>
            </button>

            <p className="text-xs text-slate-400 text-center mb-5">
              Get 3 recommendations
            </p>

            {/* Cost per action */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Cost per action
              </h4>
              <div className="flex items-center justify-between py-1.5 text-sm text-slate-600">
                <span className="flex items-center gap-2">
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
                      d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
                    />
                  </svg>
                  Flip tile
                </span>
                <span className="font-semibold">${FLIP_COST}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-sm text-slate-600">
                <span className="flex items-center gap-2">
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
                  Ask DxTER
                </span>
                <span className="font-semibold">${DXTER_COST}</span>
              </div>
            </div>

            {/* How it works link */}
            <button
              onClick={() => setShowHowItWorks(true)}
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
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
              How it works
            </button>
          </aside>
        </div>
      </div>

      {/* ── How It Works Modal ── */}
      <HowItWorksModal
        open={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      {/* ── DxTER Animation Modal ── */}
      <DxterAnimationModal
        open={showDxterAnimation}
        previewOnly={false}
        revealedCount={revealedCount}
        recommendationCount={config.suggestionsPerStep}
        onApply={handleDxterApply}
        onClose={handleDxterClose}
      />

      {/* ── Game Over Modal ── */}
      {showGameOverModal && (
        <GameOverModal
          bestValue={bestValue}
          optimumValue={stats.optimumValue}
          iterations={iterations}
          dxterUsed={stats.dxterUsed}
          foundOptimum={foundOptimum}
          budgetExhausted={budgetExhausted}
          onPlayAgain={handlePlayAgain}
          onViewResults={handleViewResults}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Game Over Modal (matches GameOver.png mock)
// ---------------------------------------------------------------------------

function GameOverModal({
  bestValue,
  optimumValue,
  iterations,
  dxterUsed,
  foundOptimum,
  budgetExhausted,
  onPlayAgain,
  onViewResults,
}: {
  bestValue: number | null;
  optimumValue: number;
  iterations: number;
  dxterUsed: boolean;
  foundOptimum: boolean;
  budgetExhausted: boolean;
  onPlayAgain: () => void;
  onViewResults: () => void;
}) {
  const best = bestValue ?? 100;
  // For minimize: optimum is 0, worst is 100. pct = how close to 0 from 100.
  const pct = Math.max(0, Math.min(100, Math.round(100 - best)));

  return (
    <div className="modal-overlay">
      <div className="modal-content text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {foundOptimum ? (
            <div className="w-14 h-14 rounded-2xl bg-[#177B7D]/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#177B7D]"
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
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-display font-bold text-slate-800 mb-1">
          {foundOptimum
            ? "Minimum Found!"
            : budgetExhausted
              ? "Budget Exhausted"
              : "Game Over"}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {foundOptimum
            ? "Congratulations! You found the global minimum."
            : "You have run out of budget and can no longer run experiments."}
        </p>

        {/* Distance to optimum */}
        <div className="glass p-4 mb-5 text-left">
          <p className="text-sm font-medium text-slate-600 mb-3 text-center">
            Distance to optimum
          </p>
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">Your best</p>
              <p className="text-3xl font-display font-bold text-slate-800">
                {best}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">Global min</p>
              <p className="text-3xl font-display font-bold text-[#177B7D]">
                {optimumValue}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="progress-bar mb-1.5">
            <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-500 text-center">
            {pct}% of optimum reached
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="stat-card">
            <p className="text-xs text-slate-400 mb-0.5">Lowest value</p>
            <p className="text-xl font-display font-bold text-slate-800">
              {best}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-400 mb-0.5">Iterations</p>
            <p className="text-xl font-display font-bold text-slate-800">
              {iterations}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-400 mb-0.5">DxTER used</p>
            <p className="text-xl font-display font-bold text-slate-800">
              {dxterUsed ? (
                <svg
                  className="w-5 h-5 text-green-500 mx-auto"
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
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 px-5 py-3 border border-[#e5e7eb] text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Play Again
          </button>
          <button
            onClick={onViewResults}
            className="flex-1 px-5 py-3 bg-[#177B7D] hover:bg-[#155e5f] text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            View Results
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend Item
// ---------------------------------------------------------------------------

function LegendItem({
  bgColor,
  borderColor,
  label,
  dashed,
  showBulb,
}: {
  bgColor: string;
  borderColor: string;
  label: string;
  dashed?: boolean;
  showBulb?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-4 h-4 rounded relative"
        style={{
          backgroundColor: bgColor,
          border: `${dashed ? "1.5px dashed" : "1.5px solid"} ${borderColor}`,
        }}
      >
        {showBulb && (
          <svg
            className="absolute -top-1 -right-1 w-2.5 h-2.5 text-[#177B7D]"
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
        )}
      </div>
      <span>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid Component – renders the NxN grid of cells using CSS grid
// ---------------------------------------------------------------------------

function Grid({
  grid,
  gridSize,
  onCellClick,
  isFinished,
  bestFoundValue,
}: {
  grid: Cell[][];
  gridSize: number;
  onCellClick: (row: number, col: number) => void;
  isFinished: boolean;
  bestFoundValue: number;
}) {
  const gap = gridSize <= 12 ? 5 : gridSize <= 16 ? 4 : 3;

  return (
    <div
      className="w-full"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {grid.flatMap((row) =>
        row.map((cell) => (
          <GridCell
            key={`${cell.row}-${cell.col}`}
            cell={cell}
            gridSize={gridSize}
            onClick={onCellClick}
            isFinished={isFinished}
            bestFoundValue={bestFoundValue}
          />
        )),
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GridCell – a single cell in the grid (memoized for performance)
// ---------------------------------------------------------------------------

const GridCell = memo(function GridCell({
  cell,
  gridSize,
  onClick,
  isFinished,
  bestFoundValue,
}: {
  cell: Cell;
  gridSize: number;
  onClick: (row: number, col: number) => void;
  isFinished: boolean;
  bestFoundValue: number;
}) {
  const handleClick = useCallback(() => {
    onClick(cell.row, cell.col);
  }, [onClick, cell.row, cell.col]);

  // Build class names
  let className = "cell";
  if (cell.revealed) className += " cell--revealed";
  if (cell.suggested && !cell.revealed) className += " cell--suggested";
  if (cell.isBestFound && cell.revealed) className += " cell--best";
  if (cell.isOptimum && cell.revealed && isFinished)
    className += " cell--optimum";
  if (isFinished && !cell.revealed) className += " cell--disabled";

  // Determine background color using the 3-tier system
  let backgroundColor = "#ffffff";
  if (cell.revealed) {
    backgroundColor = getTileColor(
      cell.value,
      bestFoundValue,
      cell.isBestFound,
    );
  }

  // Text color
  const textColor = cell.revealed
    ? getTileTextColor(backgroundColor)
    : "#9ca3af";

  // Font size based on grid size
  const fontSize =
    gridSize <= 12 ? 14 : gridSize <= 16 ? 11 : gridSize <= 20 ? 9 : 7;
  const showValue = cell.revealed && gridSize <= 20;

  return (
    <div
      className={className}
      style={{
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: gridSize <= 16 ? "6px" : "4px",
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Tile ${cell.row + 1},${cell.col + 1}${cell.revealed ? ` value ${cell.value}` : " unflipped"}`}
    >
      {/* Value number */}
      {showValue && cell.revealed && (
        <span
          className="font-semibold leading-none font-display"
          style={{
            fontSize: `${fontSize}px`,
            color: textColor,
          }}
        >
          {cell.value}
        </span>
      )}

      {/* Flip cost badge on suggested tiles */}
      {cell.suggested && !cell.revealed && (
        <>
          {/* Bulb icon */}
          <span
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: "-5px",
              right: "-5px",
              width: gridSize <= 12 ? "16px" : "13px",
              height: gridSize <= 12 ? "16px" : "13px",
            }}
          >
            <svg
              className="text-[#177B7D]"
              style={{
                width: gridSize <= 12 ? "14px" : "11px",
                height: gridSize <= 12 ? "14px" : "11px",
              }}
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
          </span>
        </>
      )}
    </div>
  );
});
