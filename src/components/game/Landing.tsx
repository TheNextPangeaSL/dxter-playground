import { useStore } from "@nanostores/react";
import { useState, useRef, useEffect } from "react";
import {
  $config,
  setDifficulty,
  setPlayerName,
  startGame,
} from "@/stores/gameStore";
import { DIFFICULTY_PRESETS, type Difficulty } from "@/types/game";
import { loadHighScores, formatDate } from "@/lib/highScores";

// ---------------------------------------------------------------------------
// DxTER: The Optimization Game – Landing / Difficulty Selection
// Matches the SeleccionDificultad.png mock exactly
// ---------------------------------------------------------------------------

const DIFFICULTIES: Array<{
  id: Difficulty;
  recommended?: boolean;
}> = [{ id: "easy" }, { id: "medium", recommended: true }, { id: "hard" }];

export default function Landing() {
  const config = useStore($config);
  const [selected, setSelected] = useState<Difficulty>(config.difficulty);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showHighScores, setShowHighScores] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (d: Difficulty) => {
    setSelected(d);
    setDifficulty(d);
  };

  const handleStartClick = () => {
    setDifficulty(selected);
    setShowNameModal(true);
  };

  const handleConfirmStart = () => {
    const name = nameValue.trim() || "Anonymous";
    setPlayerName(name);
    setShowNameModal(false);
    startGame();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirmStart();
    } else if (e.key === "Escape") {
      setShowNameModal(false);
    }
  };

  useEffect(() => {
    if (showNameModal && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showNameModal]);

  const preset = DIFFICULTY_PRESETS[selected];

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Nav Bar ── */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-[#e5e7eb] bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#177B7D] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
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
          </div>
          <span className="text-base font-bold text-slate-800 font-display tracking-tight">
            DxTER
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
          <button
            onClick={() => setShowInstructions(true)}
            className="hover:text-slate-700 transition-colors cursor-pointer"
          >
            Instructions
          </button>
          <a
            href="https://dxter.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-700 transition-colors cursor-pointer"
          >
            About DxTER
          </a>
          <button
            onClick={() => setShowHighScores(true)}
            className="hover:text-slate-700 transition-colors cursor-pointer"
          >
            High Scores
          </button>
          <a
            href="mailto:dxter@thenextpangea.com"
            className="hover:text-slate-700 transition-colors cursor-pointer"
          >
            Feedback
          </a>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 text-center mb-3 tracking-tight">
          DxTER: The Optimization Game
        </h1>

        {/* Subtitles */}
        <p className="text-base sm:text-lg text-slate-500 text-center max-w-xl mb-1">
          Can you find the global minimum with limited resources?
        </p>
        <p className="text-sm sm:text-base text-slate-400 text-center max-w-xl mb-8">
          Learn how smarter experimentation outperforms brute force.
        </p>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e5e7eb] bg-white text-sm text-slate-600 mb-10">
          <svg
            className="w-4 h-4 text-[#177B7D]"
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
          Optimize under constraints.
        </div>

        {/* Select Difficulty */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 text-center mb-6">
          Select Difficulty
        </h2>

        {/* Difficulty Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-10">
          {DIFFICULTIES.map(({ id, recommended }) => {
            const p = DIFFICULTY_PRESETS[id];
            const isSelected = selected === id;

            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={`
                  difficulty-card relative text-left
                  ${isSelected ? "difficulty-card--selected" : ""}
                `}
              >
                {/* Header row: label + radio */}
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <span className="text-lg font-bold text-slate-800 font-display">
                      {p.label}
                    </span>
                    {recommended && (
                      <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-[#177B7D] text-white align-middle">
                        Recommended
                      </span>
                    )}
                  </div>
                  {/* Radio circle */}
                  <div
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                      ${isSelected ? "border-[#177B7D] bg-[#177B7D]" : "border-slate-300 bg-white"}
                    `}
                  >
                    {isSelected && (
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                  {p.description}
                </p>

                {/* Stats */}
                <div className="space-y-2">
                  <StatRow
                    icon={
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    }
                    label={`${p.gridSize} × ${p.gridSize} grid`}
                  />
                  <StatRow
                    icon={
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
                          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                        />
                      </svg>
                    }
                    label={`$${p.budget} budget`}
                  />
                  <StatRow
                    icon={
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
                          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
                        />
                      </svg>
                    }
                    label={p.complexity}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartClick}
          className="group flex items-center gap-2 px-10 py-4 bg-[#177B7D] hover:bg-[#155e5f] text-white font-semibold text-base rounded-xl shadow-lg shadow-[#177B7D]/20 hover:shadow-[#177B7D]/40 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          Start {preset.label}
          <svg
            className="w-5 h-5 group-hover:translate-x-0.5 transition-transform"
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
        </button>
      </main>

      {/* ── Player Name Modal ── */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-[#177B7D]/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#177B7D]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-slate-800">
                    Ready to play?
                  </h3>
                  <p className="text-sm text-slate-500">
                    Enter your name for the leaderboard
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="px-6 pb-4">
              <label
                htmlFor="player-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Player Name
              </label>
              <input
                ref={inputRef}
                id="player-name"
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your name..."
                maxLength={30}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#177B7D]/30 focus:border-[#177B7D] transition-colors"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Leave blank to play as "Anonymous"
              </p>
            </div>

            {/* Difficulty reminder */}
            <div className="mx-6 mb-4 px-4 py-3 bg-slate-50 rounded-xl flex items-center gap-3 text-sm text-slate-600">
              <svg
                className="w-4 h-4 text-[#177B7D] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                />
              </svg>
              <span>
                <strong>{preset.label}</strong> — {preset.gridSize}×
                {preset.gridSize} grid, ${preset.budget} budget
              </span>
            </div>

            {/* Buttons */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStart}
                className="flex-1 px-4 py-3 bg-[#177B7D] hover:bg-[#155e5f] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#177B7D]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Let's Go!
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
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Instructions Modal ── */}
      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}

      {/* ── High Scores Modal ── */}
      {showHighScores && (
        <HighScoresModal onClose={() => setShowHighScores(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      {icon}
      <span>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Instructions Modal
// ---------------------------------------------------------------------------

function InstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#177B7D]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#177B7D]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <h3 className="text-lg font-display font-bold text-slate-800">
              How to Play
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm text-slate-600 leading-relaxed">
          {/* Goal */}
          <section>
            <h4 className="text-base font-display font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-lg">🎯</span> Goal
            </h4>
            <p>
              You're exploring a hidden landscape of values. Your mission is to{" "}
              <strong className="text-slate-800">
                find the global minimum
              </strong>{" "}
              — the lowest value on the entire grid — before you run out of
              budget.
            </p>
          </section>

          {/* How it works */}
          <section>
            <h4 className="text-base font-display font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-lg">⚙️</span> How It Works
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  1
                </span>
                <span>
                  <strong className="text-slate-800">Click any tile</strong> to
                  flip it and reveal its hidden value. Each flip costs{" "}
                  <strong className="text-[#177B7D]">$2</strong> from your
                  budget. Lower values are better!
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  2
                </span>
                <span>
                  Use the revealed values to guide your search — nearby tiles
                  often have similar values.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  3
                </span>
                <span>
                  The game ends when you find the minimum (value{" "}
                  <strong className="text-slate-800">0</strong>) or you run out
                  of budget.
                </span>
              </li>
            </ul>
          </section>

          {/* DxTER */}
          <section>
            <h4 className="text-base font-display font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-lg">🤖</span> Ask DxTER
            </h4>
            <p className="mb-2">
              <strong className="text-slate-800">DxTER</strong> is your AI
              assistant. For <strong className="text-[#177B7D]">$5</strong>,
              DxTER will analyze the data you've collected so far and suggest{" "}
              <strong className="text-slate-800">3 tiles</strong> most likely to
              contain low values. Suggested tiles appear with a{" "}
              <span className="text-[#177B7D] font-semibold">
                dashed teal border
              </span>
              .
            </p>
            <p>
              DxTER uses a Bayesian optimization model internally — the more
              data you give it, the better its recommendations become.
            </p>
          </section>

          {/* Tile colors */}
          <section>
            <h4 className="text-base font-display font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-lg">🎨</span> Tile Colors
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-md shrink-0"
                  style={{ backgroundColor: "#D1D5DB" }}
                />
                <span>
                  <strong className="text-slate-700">Gray</strong> — Far from
                  the best (lowest) value found so far.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-md shrink-0"
                  style={{ backgroundColor: "#7FC7C3" }}
                />
                <span>
                  <strong className="text-slate-700">Light teal</strong> — Close
                  to the best (lowest) value found (within 15 points).
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-md shrink-0"
                  style={{ backgroundColor: "#177B7D" }}
                />
                <span>
                  <strong className="text-white bg-[#177B7D] px-1.5 py-0.5 rounded">
                    Dark teal
                  </strong>{" "}
                  — The lowest value you've found so far.
                </span>
              </div>
            </div>
          </section>

          {/* Budget & Scoring */}
          <section>
            <h4 className="text-base font-display font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-lg">💰</span> Budget & Scoring
            </h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Easy</span>
                <span className="font-semibold text-slate-700">
                  12×12 grid · $100 budget · up to 50 flips
                </span>
              </div>
              <div className="flex justify-between">
                <span>Medium</span>
                <span className="font-semibold text-slate-700">
                  16×16 grid · $200 budget · up to 100 flips
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hard</span>
                <span className="font-semibold text-slate-700">
                  20×20 grid · $320 budget · up to 160 flips
                </span>
              </div>
            </div>
            <p className="mt-2.5">
              Your <strong className="text-slate-800">efficiency score</strong>{" "}
              rewards finding the minimum while spending as little budget as
              possible. The best scores come from smart, strategic exploration —
              not brute force.
            </p>
          </section>

          {/* Tips */}
          <section>
            <h4 className="text-base font-display font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-lg">💡</span> Pro Tips
            </h4>
            <ul className="space-y-1.5 list-disc list-inside marker:text-[#177B7D]">
              <li>
                Start by spreading your clicks across different areas to survey
                the landscape.
              </li>
              <li>
                When you find a promising region (low values), explore its
                neighbors to zero in on the valley floor.
              </li>
              <li>
                Use DxTER after 3-5 manual flips — it needs some data to give
                good recommendations.
              </li>
              <li>
                Don't flip every tile — real optimization is about finding the
                best answer with the fewest experiments.
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#177B7D] hover:bg-[#155e5f] text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// High Scores Modal (accessible from the nav bar)
// ---------------------------------------------------------------------------

const DIFFICULTY_TABS: Difficulty[] = ["easy", "medium", "hard"];

function HighScoresModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Difficulty | "all">("all");
  const allScores = loadHighScores();

  const filtered =
    tab === "all" ? allScores : allScores.filter((s) => s.difficulty === tab);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-xl">
              🏆
            </div>
            <h3 className="text-lg font-display font-bold text-slate-800">
              High Scores
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2">
          {(["all", ...DIFFICULTY_TABS] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                tab === t
                  ? "bg-[#177B7D] text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {t === "all" ? "All" : DIFFICULTY_PRESETS[t].label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <p className="text-3xl mb-3">🎮</p>
              <p>No scores yet. Play a game to get started!</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2 pr-2">Player</th>
                  <th className="pb-2 pr-2">Difficulty</th>
                  <th className="pb-2 pr-2 text-right">Best</th>
                  <th className="pb-2 pr-2 text-right">Efficiency</th>
                  <th className="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="border-t border-slate-50 hover:bg-slate-50/50"
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
                    <td className="py-2.5 text-right text-slate-400 text-xs">
                      {formatDate(entry.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
