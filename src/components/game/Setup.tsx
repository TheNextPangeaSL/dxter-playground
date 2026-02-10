import { useStore } from "@nanostores/react";
import { useState } from "react";
import {
  $config,
  setDifficulty,
  setBenchmarkFunction,
  setGameMode,
  setObjective,
  startGame,
  goToLanding,
} from "@/stores/gameStore";
import {
  DIFFICULTY_PRESETS,
  type Difficulty,
  type BenchmarkFunction,
  type GameMode,
  type ObjectiveDirection,
} from "@/types/game";
import { getAllFunctionMetas } from "@/lib/functions";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const DIFFICULTY_OPTIONS: Array<{
  id: Difficulty;
  label: string;
  emoji: string;
  description: string;
}> = [
  {
    id: "easy",
    label: "Fácil",
    emoji: "🟢",
    description: `Cuadrícula ${DIFFICULTY_PRESETS.easy.gridSize}×${DIFFICULTY_PRESETS.easy.gridSize} · ${DIFFICULTY_PRESETS.easy.maxAttempts} intentos`,
  },
  {
    id: "medium",
    label: "Medio",
    emoji: "🟡",
    description: `Cuadrícula ${DIFFICULTY_PRESETS.medium.gridSize}×${DIFFICULTY_PRESETS.medium.gridSize} · ${DIFFICULTY_PRESETS.medium.maxAttempts} intentos`,
  },
  {
    id: "hard",
    label: "Difícil",
    emoji: "🔴",
    description: `Cuadrícula ${DIFFICULTY_PRESETS.hard.gridSize}×${DIFFICULTY_PRESETS.hard.gridSize} · ${DIFFICULTY_PRESETS.hard.maxAttempts} intentos`,
  },
];

const MODE_OPTIONS: Array<{
  id: GameMode;
  label: string;
  emoji: string;
  description: string;
  color: string;
}> = [
  {
    id: "manual",
    label: "Manual",
    emoji: "🖐️",
    description: "Explora el mapa libremente usando tu intuición y estrategia.",
    color: "amber",
  },
  {
    id: "guided",
    label: "Guiado por Dxter",
    emoji: "🤖",
    description:
      "Dxter te sugiere los mejores puntos a explorar con optimización bayesiana.",
    color: "accent",
  },
];

const OBJECTIVE_OPTIONS: Array<{
  id: ObjectiveDirection;
  label: string;
  emoji: string;
}> = [
  { id: "maximize", label: "Maximizar", emoji: "📈" },
  { id: "minimize", label: "Minimizar", emoji: "📉" },
];

const FUNCTION_EMOJI: Record<BenchmarkFunction, string> = {
  rastrigin: "🌊",
  ackley: "🗻",
  rosenbrock: "🍌",
  himmelblau: "💠",
  schwefel: "🌀",
  gaussian_mixture: "🎯",
  sinusoidal: "〰️",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Setup() {
  const config = useStore($config);
  const functionMetas = getAllFunctionMetas();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const totalSteps = 4;

  const handleStart = () => {
    startGame();
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="w-full max-w-2xl mb-10">
        <button
          onClick={goToLanding}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 text-sm cursor-pointer"
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
          Volver al inicio
        </button>

        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
          Configura tu partida
        </h1>
        <p className="text-slate-500">
          Personaliza el juego a tu gusto antes de comenzar.
        </p>

        {/* Progress bar */}
        <div className="mt-6 flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-colors duration-300"
              style={{
                backgroundColor:
                  i + 1 <= step
                    ? "var(--color-dxter-500)"
                    : "var(--color-surface-600)",
              }}
            />
          ))}
          <span className="text-xs text-slate-400 ml-2 tabular-nums">
            {step}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Steps content */}
      <div className="w-full max-w-2xl flex-1">
        {/* Step 1: Game Mode */}
        {step === 1 && (
          <StepContainer
            title="Elige el modo de juego"
            subtitle="¿Quieres explorar por tu cuenta o dejar que Dxter te guíe?"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MODE_OPTIONS.map((mode) => {
                const isSelected = config.mode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setGameMode(mode.id)}
                    className={`
                      glass p-6 text-left transition-all duration-200 cursor-pointer
                      ${
                        isSelected
                          ? mode.id === "manual"
                            ? "border-amber-500 bg-amber-50 shadow-lg shadow-amber-200"
                            : "border-dxter-500 bg-dxter-50 shadow-lg shadow-dxter-200"
                          : "hover:border-slate-300"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{mode.emoji}</span>
                      <span
                        className={`text-lg font-display font-semibold ${
                          isSelected
                            ? mode.id === "manual"
                              ? "text-amber-400"
                              : "text-dxter-600"
                            : "text-slate-700"
                        }`}
                      >
                        {mode.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {mode.description}
                    </p>
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-dxter-700">
                        <svg
                          className="w-4 h-4"
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
                        Seleccionado
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </StepContainer>
        )}

        {/* Step 2: Difficulty */}
        {step === 2 && (
          <StepContainer
            title="Selecciona la dificultad"
            subtitle="Cuanto más difícil, más grande es el mapa y menos intentos tendrás."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DIFFICULTY_OPTIONS.map((diff) => {
                const isSelected = config.difficulty === diff.id;
                const preset = DIFFICULTY_PRESETS[diff.id];
                return (
                  <button
                    key={diff.id}
                    onClick={() => setDifficulty(diff.id)}
                    className={`
                      glass p-5 text-center transition-all duration-200 cursor-pointer
                      ${
                        isSelected
                          ? "border-dxter-500 bg-dxter-50 shadow-lg shadow-dxter-200"
                          : "hover:border-slate-300"
                      }
                    `}
                  >
                    <span className="text-2xl mb-2 block">{diff.emoji}</span>
                    <span
                      className={`text-base font-display font-semibold block mb-1 ${
                        isSelected ? "text-dxter-700" : "text-slate-700"
                      }`}
                    >
                      {diff.label}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      {diff.description}
                    </span>
                    {/* Stats */}
                    <div className="mt-3 flex justify-center gap-4 text-xs text-slate-500">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-semibold text-slate-600">
                          {preset.gridSize}²
                        </span>
                        <span className="text-slate-400">celdas</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-semibold text-slate-600">
                          {preset.maxAttempts}
                        </span>
                        <span className="text-slate-400">intentos</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-dxter-700">
                        <svg
                          className="w-4 h-4"
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
                        Seleccionado
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </StepContainer>
        )}

        {/* Step 3: Benchmark Function */}
        {step === 3 && (
          <StepContainer
            title="Elige la función oculta"
            subtitle="Cada función genera un paisaje diferente con distintos niveles de complejidad."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {functionMetas.map((fn) => {
                const isSelected = config.benchmarkFunction === fn.id;
                return (
                  <button
                    key={fn.id}
                    onClick={() => setBenchmarkFunction(fn.id)}
                    className={`
                      glass p-4 text-left transition-all duration-200 cursor-pointer
                      ${
                        isSelected
                          ? "border-dxter-500 bg-dxter-50 shadow-lg shadow-dxter-200"
                          : "hover:border-slate-300"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">
                        {FUNCTION_EMOJI[fn.id] ?? "📊"}
                      </span>
                      <span
                        className={`text-base font-display font-semibold ${
                          isSelected ? "text-dxter-700" : "text-slate-700"
                        }`}
                      >
                        {fn.name}
                      </span>
                      {isSelected && (
                        <svg
                          className="w-4 h-4 ml-auto text-dxter-600"
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
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {fn.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span>
                        Óptimos locales: ~{fn.localOptimaCount}
                      </span>
                      <span>·</span>
                      <span>
                        Natural:{" "}
                        {fn.naturalOptimum === "minimum"
                          ? "Minimización"
                          : "Maximización"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </StepContainer>
        )}

        {/* Step 4: Objective & Summary */}
        {step === 4 && (
          <StepContainer
            title="Objetivo y resumen"
            subtitle="Revisa la configuración antes de empezar."
          >
            {/* Objective direction */}
            <div className="mb-8">
              <label className="text-sm font-medium text-slate-600 mb-3 block">
                ¿Qué quieres hacer con la función?
              </label>
              <div className="flex gap-3">
                {OBJECTIVE_OPTIONS.map((obj) => {
                  const isSelected = config.objective === obj.id;
                  return (
                    <button
                      key={obj.id}
                      onClick={() => setObjective(obj.id)}
                      className={`
                        flex-1 glass p-4 text-center transition-all duration-200 cursor-pointer
                        ${
                          isSelected
                            ? "border-dxter-500 bg-dxter-50"
                            : "hover:border-slate-300"
                        }
                      `}
                    >
                      <span className="text-2xl block mb-1">{obj.emoji}</span>
                      <span
                        className={`text-sm font-semibold ${
                          isSelected ? "text-dxter-700" : "text-slate-600"
                        }`}
                      >
                        {obj.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                Resumen de la partida
              </h3>
              <div className="space-y-3">
                <SummaryRow
                  label="Modo"
                  value={
                    config.mode === "manual"
                      ? "🖐️ Manual"
                      : "🤖 Guiado por Dxter"
                  }
                />
                <SummaryRow
                  label="Dificultad"
                  value={`${
                    DIFFICULTY_OPTIONS.find((d) => d.id === config.difficulty)
                      ?.emoji ?? ""
                  } ${
                    DIFFICULTY_OPTIONS.find((d) => d.id === config.difficulty)
                      ?.label ?? config.difficulty
                  }`}
                />
                <SummaryRow
                  label="Cuadrícula"
                  value={`${config.gridSize} × ${config.gridSize} (${config.gridSize * config.gridSize} celdas)`}
                />
                <SummaryRow
                  label="Intentos"
                  value={`${config.maxAttempts} experimentos`}
                />
                <SummaryRow
                  label="Función"
                  value={`${FUNCTION_EMOJI[config.benchmarkFunction] ?? "📊"} ${
                    functionMetas.find(
                      (f) => f.id === config.benchmarkFunction
                    )?.name ?? config.benchmarkFunction
                  }`}
                />
                <SummaryRow
                  label="Objetivo"
                  value={
                    config.objective === "maximize"
                      ? "📈 Maximizar"
                      : "📉 Minimizar"
                  }
                />
                {config.mode === "guided" && (
                  <SummaryRow
                    label="Sugerencias"
                    value={`${config.suggestionsPerStep} por paso`}
                  />
                )}
              </div>
            </div>
          </StepContainer>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="w-full max-w-2xl mt-10 flex items-center justify-between">
        <button
          onClick={() => {
            if (step > 1) setStep((step - 1) as 1 | 2 | 3 | 4);
          }}
          disabled={step === 1}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer
            ${
              step === 1
                ? "text-slate-400 cursor-not-allowed"
                : "text-slate-600 hover:text-white hover:bg-slate-50 border border-slate-300 hover:border-slate-300"
            }
          `}
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
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Anterior
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep((step + 1) as 1 | 2 | 3 | 4)}
            className="flex items-center gap-2 px-6 py-2.5 bg-dxter-600 hover:bg-dxter-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-dxter-600/20 hover:shadow-dxter-500/30 transition-all duration-200 cursor-pointer"
          >
            Siguiente
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
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-dxter-600 to-dxter-500 hover:from-dxter-500 hover:to-dxter-400 text-white font-semibold text-base rounded-xl shadow-lg shadow-dxter-600/30 hover:shadow-dxter-500/50 hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            ¡Comenzar!
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepContainer({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <h2 className="text-xl sm:text-2xl font-display font-semibold mb-1 text-slate-800">
        {title}
      </h2>
      <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}
