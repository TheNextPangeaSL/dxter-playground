import { useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 6;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function HowItWorksModal({
  open,
  onClose,
}: HowItWorksModalProps) {
  const [step, setStep] = useState(1);

  const handleClose = useCallback(() => {
    setStep(1);
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS) as 1 | 2 | 3 | 4 | 5 | 6);
  }, []);

  const handlePrev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3 | 4 | 5 | 6);
  }, []);

  const goToStep = useCallback((n: number) => {
    setStep(n as 1 | 2 | 3 | 4 | 5 | 6);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "hiw-overlay-in 0.3s ease-out both" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
        style={{
          animation: "hiw-modal-in 0.4s ease-out both",
          maxHeight: "90vh",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 shrink-0">
          <div
            className="h-full bg-[#177B7D] transition-all duration-500 ease-out rounded-r-full"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-7 sm:p-9 flex-1 overflow-y-auto min-h-[440px] flex flex-col">
          <div
            key={step}
            style={{ animation: "hiw-step-enter 0.4s ease-out both" }}
            className="flex-1 flex flex-col"
          >
            {step === 1 && <StepOverview />}
            {step === 2 && <StepGrid />}
            {step === 3 && <StepBudget />}
            {step === 4 && <StepGP />}
            {step === 5 && <StepAcquisition />}
            {step === 6 && <StepAnalogy />}
          </div>
        </div>

        {/* Footer: dots + nav buttons */}
        <div className="border-t border-slate-200 px-7 sm:px-9 py-4 flex items-center justify-between shrink-0">
          {/* Prev */}
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer"
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
            Back
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToStep(i + 1)}
                className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i + 1 === step
                    ? "bg-[#177B7D] w-5"
                    : i + 1 < step
                      ? "bg-[#177B7D]/40"
                      : "bg-slate-300"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Next / Close */}
          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#177B7D] hover:bg-[#155e5f] px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Next
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
              onClick={handleClose}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#177B7D] hover:bg-[#155e5f] px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Got it!
            </button>
          )}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes hiw-overlay-in {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes hiw-modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(16px) }
          to { opacity: 1; transform: scale(1) translateY(0) }
        }
        @keyframes hiw-step-enter {
          from { opacity: 0; transform: translateY(12px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes hiw-float {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-6px) }
        }
        @keyframes hiw-pulse-ring {
          0% { transform: scale(1); opacity: 0.5 }
          100% { transform: scale(1.8); opacity: 0 }
        }
        @keyframes hiw-reveal-cell {
          0% { transform: scale(0.8) rotateY(90deg); opacity: 0 }
          60% { transform: scale(1.05) rotateY(0deg); opacity: 1 }
          100% { transform: scale(1) rotateY(0deg); opacity: 1 }
        }
        @keyframes hiw-draw-line {
          from { stroke-dashoffset: 800 }
          to { stroke-dashoffset: 0 }
        }
        @keyframes hiw-band-reveal {
          from { opacity: 0; transform: scaleY(0) }
          to { opacity: 0.3; transform: scaleY(1) }
        }
        @keyframes hiw-dot-pop {
          0% { opacity: 0; transform: scale(0) }
          70% { opacity: 1; transform: scale(1.2) }
          100% { opacity: 1; transform: scale(1) }
        }
        @keyframes hiw-peak-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8 }
          50% { transform: scale(1.2); opacity: 1 }
        }
        @keyframes hiw-bar-grow {
          from { width: 0 }
          to { width: var(--target-w) }
        }
        @keyframes hiw-coin-drop {
          0% { transform: translateY(-8px) scale(0.8); opacity: 0 }
          50% { transform: translateY(2px) scale(1.05); opacity: 1 }
          100% { transform: translateY(0) scale(1); opacity: 1 }
        }
        @keyframes hiw-slide-right {
          from { opacity: 0; transform: translateX(-16px) }
          to { opacity: 1; transform: translateX(0) }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Overview – What is DxTER?
// ---------------------------------------------------------------------------
function StepOverview() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div
          className="w-20 h-20 rounded-full bg-[#177B7D] flex items-center justify-center shadow-lg shadow-[#177B7D]/20"
          style={{ animation: "hiw-float 3s ease-in-out infinite" }}
        >
          <svg
            className="w-10 h-10 text-white"
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
        </div>
        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-[#177B7D]"
          style={{ animation: "hiw-pulse-ring 2s ease-out infinite" }}
        />
      </div>

      <h3 className="text-2xl font-bold text-slate-800 mb-3">
        How DxTER works
      </h3>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-6">
        DxTER is a{" "}
        <span className="font-semibold text-slate-700">
          Bayesian Optimization
        </span>{" "}
        assistant. It helps you find the best value on a hidden grid by
        intelligently suggesting which tiles to flip next — using math, not
        luck.
      </p>

      <div className="flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
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
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5"
            />
          </svg>
          Data-driven
        </div>
        <div className="flex items-center gap-1.5">
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
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3"
            />
          </svg>
          Statistical model
        </div>
        <div className="flex items-center gap-1.5">
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
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          Efficient
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: The Grid – A hidden landscape
// ---------------------------------------------------------------------------
function StepGrid() {
  // Mini grid: 5x5 with some cells "revealed"
  const cells: {
    revealed?: boolean;
    value?: number;
    color?: string;
    best?: boolean;
  }[] = [
    {},
    {},
    { revealed: true, value: 72, color: "#D1D5DB" },
    {},
    {},
    {},
    { revealed: true, value: 45, color: "#D1D5DB" },
    {},
    {},
    {},
    {},
    {},
    {},
    { revealed: true, value: 23, color: "#7FC7C3" },
    {},
    { revealed: true, value: 61, color: "#D1D5DB" },
    {},
    {},
    {},
    {},
    {},
    {},
    { revealed: true, value: 8, color: "#177B7D", best: true },
    {},
    {},
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-[#177B7D]/10 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-[#177B7D]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-2">
        The hidden landscape
      </h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        Under every grid hides a mathematical function. Each tile has a value —
        but you can't see them until you flip.{" "}
        <span className="font-semibold text-slate-700">
          Your goal: find the lowest value.
        </span>
      </p>

      {/* Mini grid illustration */}
      <div className="inline-grid grid-cols-5 gap-1.5 mb-5">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`w-11 h-11 rounded-md flex items-center justify-center text-[10px] font-bold ${
              cell.revealed
                ? cell.best
                  ? "text-white border-2 border-[#177B7D] shadow-sm"
                  : "text-slate-700 border border-slate-200"
                : "bg-white border border-slate-200"
            }`}
            style={{
              backgroundColor: cell.revealed ? cell.color : undefined,
              animation: cell.revealed
                ? `hiw-reveal-cell 0.5s ease-out both`
                : undefined,
              animationDelay: cell.revealed ? `${0.3 + i * 0.08}s` : undefined,
            }}
          >
            {cell.revealed ? (
              cell.value
            ) : (
              <svg
                className="w-4 h-4 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-white border border-slate-200 inline-block" />
          Hidden
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#D1D5DB] inline-block" />
          Far
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#7FC7C3] inline-block" />
          Close
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#177B7D] inline-block" />
          Best
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Budget – Every experiment costs
// ---------------------------------------------------------------------------
function StepBudget() {
  const costs = [
    {
      label: "Flip a tile",
      cost: 2,
      icon: (
        <svg
          className="w-5 h-5"
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
      ),
    },
    {
      label: "Ask DxTER",
      cost: 5,
      icon: (
        <svg
          className="w-5 h-5"
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
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-[#177B7D]/10 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-[#177B7D]"
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
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-2">Limited budget</h3>
      <p className="text-sm text-slate-500 max-w-md mb-7">
        You start with a fixed budget. Every action costs money — so you need to
        be
        <span className="font-semibold text-slate-700"> strategic</span> about
        where you look. Random guessing will burn through your budget fast!
      </p>

      {/* Cost cards */}
      <div className="flex items-stretch gap-4 mb-7 w-full max-w-sm">
        {costs.map((item, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2"
            style={{
              animation: `hiw-coin-drop 0.5s ease-out both`,
              animationDelay: `${0.2 + i * 0.2}s`,
            }}
          >
            <div className="text-[#177B7D]">{item.icon}</div>
            <span className="text-xs font-medium text-slate-600">
              {item.label}
            </span>
            <span className="text-lg font-bold text-slate-800">
              ${item.cost}
            </span>
          </div>
        ))}
      </div>

      {/* Animated budget bar */}
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>Budget</span>
          <span className="font-semibold text-slate-700">$100</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#177B7D] rounded-full"
            style={
              {
                "--target-w": "72%",
                animation: "hiw-bar-grow 1.2s ease-out both 0.5s",
                width: 0,
              } as React.CSSProperties
            }
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          Spend wisely — once it's gone, the game ends
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Gaussian Process – DxTER's brain
// ---------------------------------------------------------------------------
function StepGP() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-full bg-[#177B7D]/10 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-[#177B7D]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Gaussian Process model
        </h3>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          DxTER builds a{" "}
          <span className="font-semibold text-slate-700">surrogate model</span>{" "}
          from the tiles you've flipped. It predicts what every hidden tile
          might hold — and how uncertain it is about each prediction.
        </p>
      </div>

      {/* GP Chart */}
      <div className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-5 flex-1">
        <svg
          width="100%"
          height="200"
          viewBox="0 0 500 200"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="hiw-ug" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#177B7D" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#177B7D" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <g stroke="#E5E7EB" strokeWidth={0.5} opacity={0.7}>
            <line x1="30" y1="40" x2="470" y2="40" />
            <line x1="30" y1="80" x2="470" y2="80" />
            <line x1="30" y1="120" x2="470" y2="120" />
            <line x1="30" y1="160" x2="470" y2="160" />
          </g>

          {/* Uncertainty band */}
          <path
            d="M 30 140 C 80 130, 110 100, 160 90 C 210 78, 260 60, 310 70 C 360 80, 400 90, 470 95
               L 470 145 C 400 140, 360 130, 310 125 C 260 118, 210 125, 160 135 C 110 145, 80 155, 30 165 Z"
            fill="url(#hiw-ug)"
            style={{
              animation: "hiw-band-reveal 1.2s ease-out forwards 0.3s",
              opacity: 0,
              transformOrigin: "center 130px",
            }}
          />

          {/* Predicted mean */}
          <path
            d="M 30 152 C 80 142, 110 118, 160 110 C 210 98, 260 85, 310 92 C 360 100, 400 110, 470 115"
            fill="none"
            stroke="#177B7D"
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{
              strokeDasharray: 800,
              strokeDashoffset: 800,
              animation: "hiw-draw-line 1.5s ease-out forwards 0.2s",
            }}
          />

          {/* Observed points */}
          {[
            [80, 138],
            [160, 110],
            [250, 82],
            [360, 98],
            [430, 112],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={5}
              fill="#177B7D"
              stroke="#FFFFFF"
              strokeWidth={2.5}
              style={{
                animation: "hiw-dot-pop 0.4s ease-out both",
                animationDelay: `${0.6 + i * 0.15}s`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />
          ))}

          {/* Labels */}
          <g fontFamily="Rubik, sans-serif" fontSize="10" fill="#9CA3AF">
            <text x="30" y="188" fontWeight={500}>
              Shaded = uncertainty
            </text>
            <text x="200" y="188" fontWeight={500}>
              Line = predicted value
            </text>
            <text x="370" y="188" fontWeight={500}>
              Dots = your data
            </text>
          </g>
        </svg>
      </div>

      <p className="text-xs text-slate-500 text-center mt-3">
        More data → less uncertainty → better predictions
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Acquisition function – Explore vs Exploit
// ---------------------------------------------------------------------------
function StepAcquisition() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-full bg-[#177B7D]/10 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-[#177B7D]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Exploration vs Exploitation
        </h3>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          DxTER's{" "}
          <span className="font-semibold text-slate-700">
            acquisition function
          </span>{" "}
          decides where to look next by balancing two strategies. Peaks mark the
          tiles DxTER recommends.
        </p>
      </div>

      {/* Two columns: Explore + Exploit */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div
          className="bg-slate-50 border border-slate-200 rounded-xl p-4"
          style={{ animation: "hiw-slide-right 0.5s ease-out both 0.2s" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
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
                  d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-700">
              Exploration
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Visit{" "}
            <span className="font-semibold text-slate-600">
              unexplored areas
            </span>{" "}
            where uncertainty is high. There might be a hidden gem!
          </p>
        </div>

        <div
          className="bg-slate-50 border border-slate-200 rounded-xl p-4"
          style={{ animation: "hiw-slide-right 0.5s ease-out both 0.4s" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
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
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-700">
              Exploitation
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Look{" "}
            <span className="font-semibold text-slate-600">
              near the best values
            </span>{" "}
            found so far. Dig deeper where things look promising.
          </p>
        </div>
      </div>

      {/* Acquisition function chart */}
      <div className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-4 flex-1">
        <div className="text-[11px] font-semibold text-slate-500 mb-2 text-center">
          Acquisition function
        </div>
        <svg width="100%" height="120" viewBox="0 0 420 120">
          {/* Baseline */}
          <line
            x1="20"
            y1="100"
            x2="400"
            y2="100"
            stroke="#E5E7EB"
            strokeWidth={1}
          />

          {/* Curve */}
          <path
            d="M 20 95
               C 60 90, 80 82, 100 65
               C 115 52, 130 30, 150 55
               C 165 75, 185 85, 210 60
               C 230 38, 255 20, 280 42
               C 300 60, 320 80, 340 72
               C 355 65, 375 78, 400 88"
            fill="none"
            stroke="#4DA9AB"
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{
              strokeDasharray: 700,
              strokeDashoffset: 700,
              animation: "hiw-draw-line 1.3s ease-out forwards 0.3s",
            }}
          />

          {/* Peaks with labels */}
          {[
            { cx: 128, cy: 34, label: "Explore", color: "#D97706" },
            { cx: 258, cy: 22, label: "Exploit", color: "#059669" },
            { cx: 345, cy: 65, label: "Explore", color: "#D97706" },
          ].map(({ cx, cy, label, color }, i) => (
            <g
              key={i}
              style={{
                animation: `hiw-dot-pop 0.4s ease-out both`,
                animationDelay: `${1 + i * 0.25}s`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={7}
                fill="#177B7D"
                style={{
                  animation: `hiw-peak-pulse 1.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  transformOrigin: `${cx}px ${cy}px`,
                }}
              />
              <text
                x={cx}
                y={cy - 14}
                textAnchor="middle"
                fontSize="9"
                fontFamily="Rubik, sans-serif"
                fontWeight={600}
                fill={color}
              >
                {label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 6: Real-world analogy
// ---------------------------------------------------------------------------
function StepAnalogy() {
  const rows = [
    {
      game: "Grid tiles",
      research: "Experiment parameters",
      icon: (
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
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z"
          />
        </svg>
      ),
    },
    {
      game: "Flip a tile",
      research: "Run an experiment",
      icon: (
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
            d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672z"
          />
        </svg>
      ),
    },
    {
      game: "Tile value",
      research: "Experiment result (KPI)",
      icon: (
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
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z"
          />
        </svg>
      ),
    },
    {
      game: "Limited budget",
      research: "Lab time & resources",
      icon: (
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
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      game: "DxTER suggestions",
      research: "Bayesian Optimization",
      icon: (
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
      ),
    },
    {
      game: "Find the minimum",
      research: "Optimize your process",
      icon: (
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
            d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-[#177B7D]/10 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-[#177B7D]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-2">
        Same as real research
      </h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        This game mirrors how scientists use{" "}
        <span className="font-semibold text-slate-700">DxTER</span> in real labs
        to optimize processes with minimal experiments.
      </p>

      {/* Analogy table */}
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 mb-2 px-3">
          <span className="text-[11px] font-bold text-[#177B7D] uppercase tracking-wider text-left">
            In the game
          </span>
          <span />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-left">
            In research
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
              style={{
                animation: "hiw-slide-right 0.4s ease-out both",
                animationDelay: `${0.15 + i * 0.1}s`,
              }}
            >
              <span className="text-xs font-medium text-slate-700 text-left flex items-center gap-2">
                <span className="text-[#177B7D] shrink-0">{row.icon}</span>
                {row.game}
              </span>
              <svg
                className="w-3.5 h-3.5 text-slate-300 shrink-0"
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
              <span className="text-xs text-slate-500 text-left">
                {row.research}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
