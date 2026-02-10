import { useStore } from "@nanostores/react";
import { useEffect, useRef, useState } from "react";
import {
  $gameState,
  $config,
  $stats,
  $comparison,
  $canCompare,
  goToLanding,
  goToSetup,
  restartGame,
  startGame,
  updateConfig,
  clearComparison,
} from "@/stores/gameStore";
import type { Cell, GameResult, ModeComparison } from "@/types/game";
import { valueToColor } from "@/lib/functions";
import { getAllFunctionMetas } from "@/lib/functions";

// ---------------------------------------------------------------------------
// Results – End-of-game screen
// ---------------------------------------------------------------------------

export default function Results() {
  const gameState = useStore($gameState);
  const config = useStore($config);
  const stats = useStore($stats);
  const comparison = useStore($comparison);
  const canCompare = useStore($canCompare);

  const [animateScore, setAnimateScore] = useState(false);
  const [showFullGrid, setShowFullGrid] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "comparison" | "grid">(
    "summary"
  );

  const functionMetas = getAllFunctionMetas();
  const functionMeta = functionMetas.find(
    (f) => f.id === config.benchmarkFunction
  );

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateScore(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Calculate duration
  const durationMs =
    gameState.startedAt && gameState.finishedAt
      ? gameState.finishedAt - gameState.startedAt
      : gameState.startedAt
        ? Date.now() - gameState.startedAt
        : 0;
  const durationSec = Math.round(durationMs / 1000);
  const durationDisplay =
    durationSec >= 60
      ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
      : `${durationSec}s`;

  // Distance from best found to optimum
  const distanceToOptimum =
    stats.bestPosition && stats.optimumPosition
      ? Math.sqrt(
          (stats.bestPosition.row - stats.optimumPosition.row) ** 2 +
            (stats.bestPosition.col - stats.optimumPosition.col) ** 2
        )
      : null;

  // Score tier
  const scoreTier = getScoreTier(stats.score);

  // Other mode label
  const otherMode = config.mode === "manual" ? "guided" : "manual";
  const otherModeLabel =
    otherMode === "manual" ? "🖐️ Modo Manual" : "🤖 Modo Guiado por Dxter";

  const handlePlayOtherMode = () => {
    updateConfig({ mode: otherMode });
    startGame();
  };

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8 animate-[fade-in_0.5s_ease-out]">
        <div className="text-5xl mb-3">{scoreTier.emoji}</div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
          {scoreTier.title}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
          {scoreTier.message}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span>
            {config.mode === "manual" ? "🖐️ Manual" : "🤖 Guiado por Dxter"}
          </span>
          <span>·</span>
          <span>{functionMeta?.name ?? config.benchmarkFunction}</span>
          <span>·</span>
          <span>
            {config.gridSize}×{config.gridSize}
          </span>
        </div>
      </div>

      {/* Animated Score Display */}
      <div
        className={`
          relative mb-10 transition-all duration-1000 ease-out
          ${animateScore ? "scale-100 opacity-100" : "scale-75 opacity-0"}
        `}
      >
        <div className="relative w-40 h-40 sm:w-48 sm:h-48">
          <ScoreRing score={stats.score} animate={animateScore} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-display font-bold text-slate-800 tabular-nums">
              {animateScore ? stats.score.toFixed(1) : "0.0"}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              Puntuación
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-6">
        <TabButton
          active={activeTab === "summary"}
          onClick={() => setActiveTab("summary")}
          label="📊 Resumen"
        />
        <TabButton
          active={activeTab === "grid"}
          onClick={() => setActiveTab("grid")}
          label="🗺️ Mapa"
        />
        {(canCompare || comparison.manual || comparison.guided) && (
          <TabButton
            active={activeTab === "comparison"}
            onClick={() => setActiveTab("comparison")}
            label="⚔️ Comparar"
          />
        )}
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-3xl animate-[fade-in_0.3s_ease-out]">
        {activeTab === "summary" && (
          <SummaryTab
            stats={stats}
            config={config}
            durationDisplay={durationDisplay}
            distanceToOptimum={distanceToOptimum}
            functionMeta={functionMeta}
          />
        )}

        {activeTab === "grid" && (
          <GridTab
            grid={gameState.grid}
            gridSize={config.gridSize}
            showFullGrid={showFullGrid}
            onToggleFullGrid={() => setShowFullGrid(!showFullGrid)}
            stats={stats}
          />
        )}

        {activeTab === "comparison" && (
          <ComparisonTab comparison={comparison} canCompare={canCompare} />
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 animate-[slide-up_0.6s_ease-out]">
        {/* Play the other mode */}
        <button
          onClick={handlePlayOtherMode}
          className="group relative px-7 py-3.5 bg-gradient-to-r from-dxter-600 to-dxter-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-dxter-600/30 hover:shadow-dxter-500/50 hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          <span className="relative z-10 flex items-center gap-2">
            {otherMode === "guided" ? (
              <>
                🤖 Jugar con Dxter
              </>
            ) : (
              <>
                🖐️ Jugar en Manual
              </>
            )}
          </span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-dxter-500 to-dxter-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>

        <button
          onClick={restartGame}
          className="px-6 py-3 border border-slate-300 text-slate-600 font-medium text-sm rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer flex items-center gap-2"
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
          Reiniciar
        </button>

        <button
          onClick={goToSetup}
          className="px-6 py-3 text-slate-500 hover:text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer flex items-center gap-2"
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
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Nueva configuración
        </button>

        <button
          onClick={goToLanding}
          className="px-6 py-3 text-slate-400 hover:text-slate-600 font-medium text-sm rounded-xl transition-colors cursor-pointer"
        >
          Inicio
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-400">
        <p>
          Hecho con 💙 por el equipo de{" "}
          <span className="text-dxter-600 font-medium">Dxter</span>
          {" · "}
          Optimización bayesiana para investigadores
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Ring – SVG animated circular progress
// ---------------------------------------------------------------------------

function ScoreRing({
  score,
  animate,
}: {
  score: number;
  animate: boolean;
}) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = animate ? score / 100 : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const color =
    score >= 90
      ? "var(--color-success)"
      : score >= 70
        ? "var(--color-dxter-400)"
        : score >= 50
          ? "var(--color-warning)"
          : "var(--color-error)";

  return (
    <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
      {/* Background ring */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="8"
      />
      {/* Progress ring */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{
          transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: `drop-shadow(0 0 6px ${color})`,
        }}
      />
      {/* Glow effect */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        opacity="0.3"
        style={{
          transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: `blur(4px)`,
        }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TabButton
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer
        ${
          active
            ? "bg-slate-100 text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }
      `}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Summary Tab
// ---------------------------------------------------------------------------

function SummaryTab({
  stats,
  config,
  durationDisplay,
  distanceToOptimum,
  functionMeta,
}: {
  stats: typeof import("@/types/game").createEmptyStats extends () => infer R
    ? R
    : never;
  config: typeof import("@/types/game").DEFAULT_CONFIG;
  durationDisplay: string;
  distanceToOptimum: number | null;
  functionMeta: ReturnType<typeof getAllFunctionMetas>[number] | undefined;
}) {
  return (
    <div className="space-y-6">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultStatCard
          label="Mejor valor"
          value={
            isFinite(stats.bestValueFound)
              ? stats.bestValueFound.toFixed(4)
              : "—"
          }
          icon="🏆"
        />
        <ResultStatCard
          label="Óptimo real"
          value={stats.optimumValue.toFixed(4)}
          icon="💎"
        />
        <ResultStatCard
          label="Experimentos"
          value={`${stats.attemptsUsed} / ${config.maxAttempts}`}
          icon="🔬"
        />
        <ResultStatCard label="Duración" value={durationDisplay} icon="⏱️" />
      </div>

      {/* Detailed results */}
      <div className="glass p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
          Detalles de la partida
        </h3>
        <div className="space-y-3">
          <DetailRow
            label="Función"
            value={functionMeta?.name ?? config.benchmarkFunction}
          />
          <DetailRow
            label="Objetivo"
            value={
              config.objective === "maximize" ? "📈 Maximizar" : "📉 Minimizar"
            }
          />
          <DetailRow
            label="Modo"
            value={
              config.mode === "manual"
                ? "🖐️ Manual"
                : "🤖 Guiado por Dxter"
            }
          />
          <DetailRow
            label="Tamaño del mapa"
            value={`${config.gridSize}×${config.gridSize} (${config.gridSize * config.gridSize} celdas)`}
          />
          <DetailRow
            label="Posición mejor valor"
            value={
              stats.bestPosition
                ? `(${stats.bestPosition.row}, ${stats.bestPosition.col})`
                : "—"
            }
          />
          <DetailRow
            label="Posición óptimo real"
            value={`(${stats.optimumPosition.row}, ${stats.optimumPosition.col})`}
          />
          {distanceToOptimum !== null && (
            <DetailRow
              label="Distancia al óptimo"
              value={`${distanceToOptimum.toFixed(1)} celdas`}
            />
          )}
          <DetailRow
            label="Eficiencia"
            value={`${((stats.score / Math.max(1, stats.attemptsUsed)) * stats.attemptsUsed / config.maxAttempts * 100).toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Progress history chart */}
      {stats.revealHistory.length > 1 && (
        <div className="glass p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
            Evolución del mejor valor
          </h3>
          <ResultProgressChart history={stats.revealHistory} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid Tab – Full revealed grid
// ---------------------------------------------------------------------------

function GridTab({
  grid,
  gridSize,
  showFullGrid,
  onToggleFullGrid,
  stats,
}: {
  grid: Cell[][];
  gridSize: number;
  showFullGrid: boolean;
  onToggleFullGrid: () => void;
  stats: ReturnType<typeof import("@/types/game").createEmptyStats>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const maxSize = 600;
    const cellSize = Math.max(2, Math.floor(maxSize / gridSize));
    const size = cellSize * gridSize;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw all cells
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = grid[row]?.[col];
        if (!cell) continue;

        ctx.fillStyle = valueToColor(cell.normalizedValue);
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

        // Grid lines for larger cells
        if (cellSize > 6) {
          ctx.strokeStyle = "rgba(255,255,255,0.05)";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(
            col * cellSize,
            row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    // Draw revealed cells markers
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = grid[row]?.[col];
        if (!cell || cell.revealOrder === null) continue;

        // Small white dot for revealed cells
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath();
        ctx.arc(
          col * cellSize + cellSize / 2,
          row * cellSize + cellSize / 2,
          Math.max(1.5, cellSize / 6),
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }

    // Draw best found marker
    if (stats.bestPosition) {
      const { row, col } = stats.bestPosition;
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        col * cellSize - 2,
        row * cellSize - 2,
        cellSize + 4,
        cellSize + 4
      );

      // Star icon
      ctx.fillStyle = "#fbbf24";
      ctx.font = `${Math.max(10, cellSize)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "⭐",
        col * cellSize + cellSize / 2,
        row * cellSize + cellSize / 2
      );
    }

    // Draw optimum marker
    if (stats.optimumPosition) {
      const { row, col } = stats.optimumPosition;
      ctx.strokeStyle = "#ff1493";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        col * cellSize - 2,
        row * cellSize - 2,
        cellSize + 4,
        cellSize + 4
      );

      ctx.fillStyle = "#ff1493";
      ctx.font = `${Math.max(10, cellSize)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "💎",
        col * cellSize + cellSize / 2,
        row * cellSize + cellSize / 2
      );
    }
  }, [grid, gridSize, stats]);

  return (
    <div className="space-y-4">
      <div className="glass p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Mapa completo revelado
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              Mejor encontrado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-pink-500 inline-block" />
              Óptimo real
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
              Explorados
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-lg max-w-full"
            style={{
              imageRendering: "pixelated",
              maxHeight: "70vh",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Color scale legend */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-slate-400">Bajo</span>
          <div
            className="flex-1 h-3 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgb(30,58,95), rgb(37,99,235), rgb(34,197,94), rgb(234,179,8), rgb(239,68,68), rgb(255,20,147))",
            }}
          />
          <span className="text-xs text-slate-400">Alto</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison Tab
// ---------------------------------------------------------------------------

function ComparisonTab({
  comparison,
  canCompare,
}: {
  comparison: ModeComparison;
  canCompare: boolean;
}) {
  if (!comparison.manual && !comparison.guided) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-slate-500 text-sm">
          Juega en ambos modos (Manual y Guiado) con la misma configuración
          para ver la comparativa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canCompare ? (
        <>
          {/* Side by side comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ComparisonCard
              result={comparison.manual!}
              label="🖐️ Manual"
              color="amber"
            />
            <ComparisonCard
              result={comparison.guided!}
              label="🤖 Dxter"
              color="accent"
            />
          </div>

          {/* Winner banner */}
          <WinnerBanner
            manual={comparison.manual!}
            guided={comparison.guided!}
          />

          {/* Comparison chart */}
          <div className="glass p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
              Evolución comparada
            </h3>
            <ComparisonChart
              manual={comparison.manual!}
              guided={comparison.guided!}
            />
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {comparison.manual && (
            <ComparisonCard
              result={comparison.manual}
              label="🖐️ Manual"
              color="amber"
            />
          )}
          {comparison.guided && (
            <ComparisonCard
              result={comparison.guided}
              label="🤖 Dxter"
              color="accent"
            />
          )}
          <div className="glass p-6 text-center">
            <p className="text-slate-500 text-sm mb-2">
              {comparison.manual
                ? "¡Ahora prueba el modo Guiado por Dxter para comparar!"
                : "¡Ahora prueba el modo Manual para comparar!"}
            </p>
            <p className="text-xs text-slate-400">
              Juega la misma función en el otro modo para ver quién gana.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComparisonCard
// ---------------------------------------------------------------------------

function ComparisonCard({
  result,
  label,
  color,
}: {
  result: GameResult;
  label: string;
  color: "amber" | "accent";
}) {
  const borderClass =
    color === "amber" ? "border-amber-500/40" : "border-accent/40";
  const textClass =
    color === "amber" ? "text-amber-400" : "text-dxter-600";

  return (
    <div className={`glass p-5 ${borderClass}`}>
      <h4 className={`text-base font-display font-semibold mb-3 ${textClass}`}>
        {label}
      </h4>
      <div className="space-y-2">
        <ComparisonRow
          label="Puntuación"
          value={`${result.score.toFixed(1)}%`}
        />
        <ComparisonRow
          label="Mejor valor"
          value={
            isFinite(result.stats.bestValueFound)
              ? result.stats.bestValueFound.toFixed(4)
              : "—"
          }
        />
        <ComparisonRow
          label="Experimentos"
          value={`${result.stats.attemptsUsed}`}
        />
        <ComparisonRow
          label="Duración"
          value={`${Math.round(result.durationMs / 1000)}s`}
        />
      </div>
    </div>
  );
}

function ComparisonRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700 font-mono tabular-nums">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WinnerBanner
// ---------------------------------------------------------------------------

function WinnerBanner({
  manual,
  guided,
}: {
  manual: GameResult;
  guided: GameResult;
}) {
  const manualWins = manual.score > guided.score;
  const tie = Math.abs(manual.score - guided.score) < 0.1;
  const difference = Math.abs(manual.score - guided.score);

  if (tie) {
    return (
      <div className="glass p-5 text-center border-dxter-500/30">
        <p className="text-lg font-display font-semibold text-slate-700 mb-1">
          🤝 ¡Empate!
        </p>
        <p className="text-sm text-slate-500">
          Ambos modos obtuvieron resultados prácticamente iguales.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`glass p-5 text-center ${
        manualWins
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-accent/40 bg-accent/5"
      }`}
    >
      <p className="text-lg font-display font-semibold text-slate-700 mb-1">
        {manualWins ? "🖐️ ¡Ganó el modo Manual!" : "🤖 ¡Ganó Dxter!"}
      </p>
      <p className="text-sm text-slate-500">
        {manualWins
          ? `Tu intuición superó a Dxter por ${difference.toFixed(1)} puntos. ¡Impresionante!`
          : `Dxter encontró un resultado ${difference.toFixed(1)} puntos mejor. ¡La optimización bayesiana funciona!`}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComparisonChart – Overlapping progress lines
// ---------------------------------------------------------------------------

function ComparisonChart({
  manual,
  guided,
}: {
  manual: GameResult;
  guided: GameResult;
}) {
  const width = 500;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 24, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allValues = [
    ...manual.stats.revealHistory.map((h) => h.bestSoFar),
    ...guided.stats.revealHistory.map((h) => h.bestSoFar),
  ];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const maxSteps = Math.max(
    manual.stats.revealHistory.length,
    guided.stats.revealHistory.length
  );

  function makePolyline(
    history: Array<{ step: number; bestSoFar: number }>
  ): string {
    if (history.length === 0) return "";
    return history
      .map((h) => {
        const x =
          padding.left +
          ((h.step - 1) / Math.max(1, maxSteps - 1)) * chartWidth;
        const y =
          padding.top +
          chartHeight -
          ((h.bestSoFar - min) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");
  }

  const manualLine = makePolyline(manual.stats.revealHistory);
  const guidedLine = makePolyline(guided.stats.revealHistory);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
        <line
          key={frac}
          x1={padding.left}
          y1={padding.top + chartHeight * (1 - frac)}
          x2={width - padding.right}
          y2={padding.top + chartHeight * (1 - frac)}
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />
      ))}

      {/* Manual line */}
      {manualLine && (
        <polyline
          points={manualLine}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      )}

      {/* Guided line */}
      {guidedLine && (
        <polyline
          points={guidedLine}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      )}

      {/* Legend */}
      <circle cx={width - 120} cy={height - 8} r="4" fill="#fbbf24" />
      <text
        x={width - 112}
        y={height - 4}
        fill="var(--color-surface-400)"
        fontSize="10"
      >
        Manual
      </text>
      <circle cx={width - 55} cy={height - 8} r="4" fill="var(--color-accent)" />
      <text
        x={width - 47}
        y={height - 4}
        fill="var(--color-surface-400)"
        fontSize="10"
      >
        Dxter
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ResultProgressChart – Larger chart for the results screen
// ---------------------------------------------------------------------------

function ResultProgressChart({
  history,
}: {
  history: Array<{ step: number; bestSoFar: number; value: number }>;
}) {
  if (history.length === 0) return null;

  const width = 500;
  const height = 140;
  const padding = { top: 10, right: 10, bottom: 24, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const bestValues = history.map((h) => h.bestSoFar);
  const min = Math.min(...bestValues);
  const max = Math.max(...bestValues);
  const range = max - min || 1;

  const polylinePoints = history
    .map((h) => {
      const x =
        padding.left +
        ((h.step - 1) / Math.max(1, history.length - 1)) * chartWidth;
      const y =
        padding.top + chartHeight - ((h.bestSoFar - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  // Area fill
  const firstX = padding.left;
  const lastX =
    padding.left +
    ((history.length - 1) / Math.max(1, history.length - 1)) * chartWidth;
  const bottomY = padding.top + chartHeight;
  const areaPoints = `${firstX},${bottomY} ${polylinePoints} ${lastX},${bottomY}`;

  // Individual point values (each click)
  const pointDots = history.map((h) => {
    const x =
      padding.left +
      ((h.step - 1) / Math.max(1, history.length - 1)) * chartWidth;
    const y =
      padding.top + chartHeight - ((h.value - min) / range) * chartHeight;
    return { x, y, value: h.value, step: h.step };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="resultChartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--color-dxter-400)"
            stopOpacity="0.25"
          />
          <stop
            offset="100%"
            stopColor="var(--color-dxter-400)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
        <line
          key={frac}
          x1={padding.left}
          y1={padding.top + chartHeight * (1 - frac)}
          x2={width - padding.right}
          y2={padding.top + chartHeight * (1 - frac)}
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />
      ))}

      {/* Area fill */}
      <polygon points={areaPoints} fill="url(#resultChartGradient)" />

      {/* Best-so-far line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="var(--color-dxter-400)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Individual value dots */}
      {pointDots.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2.5"
          fill="var(--color-surface-400)"
          opacity="0.5"
        />
      ))}

      {/* Last point highlight */}
      {pointDots.length > 0 && (
        <circle
          cx={pointDots[pointDots.length - 1]!.x}
          cy={
            padding.top +
            chartHeight -
            ((bestValues[bestValues.length - 1]! - min) / range) * chartHeight
          }
          r="4"
          fill="var(--color-dxter-300)"
          stroke="var(--color-surface-900)"
          strokeWidth="2"
        />
      )}

      {/* Axis labels */}
      <text
        x={padding.left}
        y={height - 4}
        fill="var(--color-surface-400)"
        fontSize="10"
      >
        Paso 1
      </text>
      <text
        x={width - padding.right}
        y={height - 4}
        fill="var(--color-surface-400)"
        fontSize="10"
        textAnchor="end"
      >
        Paso {history.length}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function ResultStatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="glass p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-base sm:text-lg font-mono font-bold tabular-nums text-slate-800 truncate">
        {value}
      </span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Tier Helper
// ---------------------------------------------------------------------------

interface ScoreTierInfo {
  emoji: string;
  title: string;
  message: string;
}

function getScoreTier(score: number): ScoreTierInfo {
  if (score >= 99) {
    return {
      emoji: "🏆",
      title: "¡Perfecto!",
      message:
        "Has encontrado el óptimo global exacto. ¡Eres un maestro de la optimización!",
    };
  }
  if (score >= 90) {
    return {
      emoji: "🥇",
      title: "¡Excelente!",
      message:
        "Estuviste muy cerca del óptimo. Un resultado digno de un investigador experto.",
    };
  }
  if (score >= 75) {
    return {
      emoji: "🥈",
      title: "¡Muy bien!",
      message:
        "Buen resultado. Encontraste una zona prometedora del espacio de búsqueda.",
    };
  }
  if (score >= 50) {
    return {
      emoji: "🥉",
      title: "Buen intento",
      message:
        "No está mal, pero hay margen de mejora. ¿Probaste el modo guiado por Dxter?",
    };
  }
  if (score >= 25) {
    return {
      emoji: "🤔",
      title: "Puede mejorar",
      message:
        "El óptimo estaba lejos de donde buscaste. La optimización bayesiana podría haberte guiado mejor.",
    };
  }
  return {
    emoji: "😅",
    title: "¡A seguir intentando!",
    message:
      "El paisaje era complicado. Prueba con Dxter para ver cómo la optimización bayesiana marca la diferencia.",
  };
}
