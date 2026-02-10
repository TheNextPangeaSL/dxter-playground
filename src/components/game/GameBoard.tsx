import { useStore } from "@nanostores/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  $gameState,
  $config,
  $grid,
  $stats,
  $isFinished,
  $attemptsRemaining,
  $progressPercent,
  $isGuidedMode,
  $hasSuggestions,
  $dxterCredits,
  handleCellClick,
  generateSuggestions,
  requestHint,
  endGame,
  restartGame,
  goToLanding,
} from "@/stores/gameStore";
import type { Cell, GridPosition } from "@/types/game";
import { valueToColor } from "@/lib/functions";

// ---------------------------------------------------------------------------
// Difficulty badge labels
// ---------------------------------------------------------------------------
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

// ---------------------------------------------------------------------------
// GameBoard – Main game screen (mock-matching layout)
// ---------------------------------------------------------------------------

export default function GameBoard() {
  const config = useStore($config);
  const grid = useStore($grid);
  const stats = useStore($stats);
  const isFinished = useStore($isFinished);
  const attemptsRemaining = useStore($attemptsRemaining);
  const progressPercent = useStore($progressPercent);
  const isGuidedMode = useStore($isGuidedMode);
  const hasSuggestions = useStore($hasSuggestions);
  const dxterCredits = useStore($dxterCredits);

  const [showHeatShading, setShowHeatShading] = useState(false);
  const [timer, setTimer] = useState("00:00");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Generate initial suggestions in guided mode
  useEffect(() => {
    if (isGuidedMode && stats.attemptsUsed === 0 && !hasSuggestions) {
      generateSuggestions();
    }
  }, [isGuidedMode, stats.attemptsUsed, hasSuggestions]);

  const onCellClick = useCallback(
    (row: number, col: number) => {
      if (isFinished) return;
      handleCellClick({ row, col });
    },
    [isFinished]
  );

  const handleRequestHint = useCallback(() => {
    requestHint();
  }, []);

  if (!grid.length) return null;

  // Best value display
  const bestValue = isFinite(stats.bestValueFound)
    ? Math.round(stats.bestValueFound)
    : null;
  const bestPos = stats.bestPosition;

  return (
    <div className="min-h-dvh bg-[#f5f7fa] p-4 sm:p-6 lg:p-8">
      <div className="game-container max-w-[1400px] mx-auto">
        {/* ── Header Bar ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          {/* Left: Back */}
          <button
            onClick={goToLanding}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Start
          </button>

          {/* Center: Title + Difficulty badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-display font-bold text-slate-800">
              DxTER Demo Game
            </h1>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-dxter-800 text-white">
              {DIFFICULTY_LABELS[config.difficulty] ?? config.difficulty}
            </span>
          </div>

          {/* Right: Timer + Restart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono tabular-nums">{timer}</span>
            </div>
            <button
              onClick={restartGame}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 border border-[#e2e8f0] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.016 4.657v4.992" />
              </svg>
              Restart
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex flex-col lg:flex-row">
          {/* ── Left: Grid Area ── */}
          <div className="flex-1 p-6">
            {/* Grid header */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5">
              <h2 className="text-base font-display font-bold text-slate-800">
                Optimization Grid
              </h2>

              {/* Heat shading toggle */}
              <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showHeatShading}
                  onChange={(e) => setShowHeatShading(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-dxter-600"
                />
                Show relative heat shading
              </label>

              {/* Legend */}
              <div className="flex items-center gap-4 ml-auto text-xs text-slate-500">
                <LegendItem color="#ffffff" borderColor="#e2e8f0" label="Unflipped" />
                <LegendItem color="#ffffff" borderColor="#cbd5e1" label="Revealed" filled />
                <LegendItem color="#ffffff" borderColor="#f59e0b" label="Best found" />
                <LegendItem color="#ffffff" borderColor="#0d9488" label="Recommended" dashed />
              </div>
            </div>

            {/* Grid */}
            <div className="w-full max-w-[min(100%,700px)]">
              <Grid
                grid={grid}
                gridSize={config.gridSize}
                onCellClick={onCellClick}
                isFinished={isFinished}
                showHeatShading={showHeatShading}
              />
            </div>
          </div>

          {/* ── Right: Sidebar ── */}
          <aside className="w-full lg:w-80 xl:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#e2e8f0] p-6">
            {/* Run Status */}
            <h3 className="text-base font-display font-bold text-slate-800 mb-5">
              Run Status
            </h3>

            {/* Attempt Credits */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-dxter-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-dxter-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Attempt Credits</span>
                  <span className="text-xs text-slate-400">Remaining</span>
                </div>
                <span className="text-2xl font-display font-bold text-slate-800">
                  {attemptsRemaining}
                </span>
              </div>
            </div>

            {/* DxTER Credits */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">DxTER Credits</span>
                  <span className="text-xs text-slate-400">Remaining</span>
                </div>
                <span className="text-2xl font-display font-bold text-slate-800">
                  {dxterCredits}
                </span>
              </div>
            </div>

            {/* Attempts Used Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">Attempts Used</span>
                <span className="text-slate-600 font-mono tabular-nums">
                  {stats.attemptsUsed} / {config.maxAttempts}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor:
                      progressPercent > 80
                        ? "var(--color-error)"
                        : progressPercent > 50
                          ? "var(--color-warning)"
                          : "#0d9488",
                  }}
                />
              </div>
            </div>

            {/* Best Value Found Card */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-green-800">Best Value Found</span>
              </div>
              <div className="text-center">
                <span className="text-4xl font-display font-bold text-green-700">
                  {bestValue !== null ? bestValue : "—"}
                </span>
                {bestPos && (
                  <p className="text-xs text-green-600 mt-1">
                    Position: Row {bestPos.row + 1}, Col {bestPos.col + 1}
                  </p>
                )}
              </div>
            </div>

            {/* Win Condition */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Win Condition</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Find the global best tile before credits run out
              </p>
            </div>

            {/* DxTER Actions */}
            <h3 className="text-base font-display font-bold text-slate-800 mb-4">
              DxTER Actions
            </h3>

            <button
              onClick={handleRequestHint}
              disabled={dxterCredits <= 0 || isFinished}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer mb-3
                ${
                  dxterCredits > 0 && !isFinished
                    ? "bg-dxter-700 hover:bg-dxter-800 text-white shadow-sm"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }
              `}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                Request DxTER Hint
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                -1 credit
              </span>
            </button>

            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 border border-[#e2e8f0] hover:bg-slate-50 transition-colors cursor-pointer mb-5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Explain Hint
            </button>

            <p className="text-xs text-slate-400 leading-relaxed flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              DxTER uses Bayesian optimization to suggest the most promising tiles based on exploration and exploitation balance.
            </p>

            {/* End game button */}
            <div className="mt-8 pt-5 border-t border-[#e2e8f0]">
              <button
                onClick={endGame}
                className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 border border-[#e2e8f0] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                End Game
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend Item
// ---------------------------------------------------------------------------

function LegendItem({
  color,
  borderColor,
  label,
  filled,
  dashed,
}: {
  color: string;
  borderColor: string;
  label: string;
  filled?: boolean;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-4 h-4 rounded"
        style={{
          backgroundColor: filled ? "#f1f5f9" : color,
          border: `${dashed ? "1.5px dashed" : "1.5px solid"} ${borderColor}`,
        }}
      />
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
  showHeatShading,
}: {
  grid: Cell[][];
  gridSize: number;
  onCellClick: (row: number, col: number) => void;
  isFinished: boolean;
  showHeatShading: boolean;
}) {
  const gap = gridSize <= 20 ? 4 : gridSize <= 30 ? 3 : 2;

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
            showHeatShading={showHeatShading}
          />
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GridCell – a single cell in the grid (mock style)
// ---------------------------------------------------------------------------

const GridCell = ({
  cell,
  gridSize,
  onClick,
  isFinished,
  showHeatShading,
}: {
  cell: Cell;
  gridSize: number;
  onClick: (row: number, col: number) => void;
  isFinished: boolean;
  showHeatShading: boolean;
}) => {
  const handleClick = useCallback(() => {
    onClick(cell.row, cell.col);
  }, [onClick, cell.row, cell.col]);

  // Build class names
  let className = "cell";
  if (cell.revealed) className += " cell--revealed";
  if (cell.suggested && !cell.revealed) className += " cell--suggested";
  if (cell.isBestFound && cell.revealed) className += " cell--best";
  if (cell.isOptimum && cell.revealed && isFinished) className += " cell--optimum";
  if (isFinished && !cell.revealed) className += " cell--disabled";

  // Determine background for heat shading
  let backgroundColor = "#ffffff";
  if (showHeatShading && cell.revealed) {
    const color = valueToColor(cell.normalizedValue);
    backgroundColor = color;
  }
  if (isFinished && !cell.revealed && showHeatShading) {
    backgroundColor = valueToColor(cell.normalizedValue);
  }

  // Underline bar color
  let underlineColor = "#f59e0b"; // default orange for revealed
  if (cell.isBestFound && cell.revealed) {
    underlineColor = "#22c55e"; // green for best
  }

  // Value to display
  const displayValue = cell.revealed ? Math.round(cell.value) : null;

  // Font size based on grid size
  const fontSize = gridSize <= 15 ? 12 : gridSize <= 20 ? 10 : gridSize <= 25 ? 8 : 6;
  const showValue = cell.revealed && gridSize <= 25;

  return (
    <div
      className={className}
      style={{
        backgroundColor,
        opacity: isFinished && !cell.revealed ? 0.5 : 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: gridSize <= 25 ? "6px" : "3px",
        padding: "2px",
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Cell ${cell.row},${cell.col}${cell.revealed ? ` value ${cell.value.toFixed(2)}` : " hidden"}`}
    >
      {/* Value number */}
      {showValue && displayValue !== null && (
        <span
          className="font-mono font-bold text-slate-700 leading-none"
          style={{ fontSize: `${fontSize}px` }}
        >
          {displayValue}
        </span>
      )}

      {/* Underline bar for revealed cells */}
      {cell.revealed && gridSize <= 25 && (
        <div
          className="absolute bottom-[3px] left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: "60%",
            height: "2px",
            backgroundColor: underlineColor,
          }}
        />
      )}

      {/* Suggested lightbulb icon */}
      {cell.suggested && !cell.revealed && (
        <span
          className="flex items-center justify-center text-dxter-600 pointer-events-none"
          style={{ fontSize: gridSize <= 20 ? "14px" : gridSize <= 30 ? "10px" : "8px" }}
        >
          <svg
            className="text-dxter-600"
            style={{ width: gridSize <= 20 ? "16px" : "12px", height: gridSize <= 20 ? "16px" : "12px" }}
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
        </span>
      )}

      {/* Optimum marker */}
      {cell.isOptimum && cell.revealed && isFinished && (
        <span
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ fontSize: gridSize <= 20 ? "14px" : "10px" }}
        >
          💎
        </span>
      )}
    </div>
  );
};
