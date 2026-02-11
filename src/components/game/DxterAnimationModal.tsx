import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AnimationStep = 1 | 2 | 3 | 4;

interface DxterAnimationModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** If true, no cost is deducted and the "Apply" button just closes */
  previewOnly?: boolean;
  /** Number of revealed tiles shown in step 1 */
  revealedCount: number;
  /** Number of recommendations DxTER will give */
  recommendationCount?: number;
  /** Called when the user clicks "Apply recommendations" (non-preview) */
  onApply: () => void;
  /** Called when the modal is closed (X button, or Apply in preview mode) */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Timing constants (ms)
// ---------------------------------------------------------------------------
const STEP_2_DELAY = 2800;
const STEP_3_DELAY = 6200;
const STEP_4_DELAY = 10500;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DxterAnimationModal({
  open,
  previewOnly = false,
  revealedCount,
  recommendationCount = 3,
  onApply,
  onClose,
}: DxterAnimationModalProps) {
  const [step, setStep] = useState<AnimationStep>(1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Reset & start animation when modal opens
  useEffect(() => {
    if (!open) return;

    setStep(1);

    // Clear any leftover timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const t1 = setTimeout(() => setStep(2), STEP_2_DELAY);
    const t2 = setTimeout(() => setStep(3), STEP_3_DELAY);
    const t3 = setTimeout(() => setStep(4), STEP_4_DELAY);

    timersRef.current = [t1, t2, t3];

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [open]);

  const handleApply = useCallback(() => {
    if (previewOnly) {
      onClose();
    } else {
      onApply();
    }
  }, [previewOnly, onApply, onClose]);

  const handleClose = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "dxter-overlay-fade-in 0.35s ease-out both" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-3xl mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ animation: "dxter-modal-scale-in 0.4s ease-out both" }}
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
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-[#177B7D] transition-all duration-700 ease-out rounded-r-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Content area */}
        <div className="p-8 sm:p-10 min-h-[420px] flex flex-col">
          {step === 1 && <Step1 revealedCount={revealedCount} />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && (
            <Step4
              recommendationCount={recommendationCount}
              previewOnly={previewOnly}
              onApply={handleApply}
            />
          )}
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes dxter-overlay-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dxter-modal-scale-in {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes dxter-step-enter {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dxter-draw-line {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes dxter-band-reveal {
          from { opacity: 0; transform: scaleY(0); }
          to { opacity: 0.35; transform: scaleY(1); }
        }
        @keyframes dxter-peak-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.18); opacity: 1; }
        }
        @keyframes dxter-dot-pop {
          0% { r: 0; opacity: 0; }
          60% { r: 7; opacity: 1; }
          100% { r: 6; opacity: 1; }
        }
        @keyframes dxter-icon-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes dxter-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dxter-scanning-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Analyzing observed experiments
// ---------------------------------------------------------------------------
function Step1({ revealedCount }: { revealedCount: number }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center text-center"
      style={{ animation: "dxter-step-enter 0.5s ease-out both" }}
    >
      {/* Animated icon */}
      <div className="relative mb-6">
        <div
          className="w-20 h-20 rounded-full bg-[#177B7D]/10 flex items-center justify-center"
          style={{ animation: "dxter-icon-pulse 2s ease-in-out infinite" }}
        >
          <svg
            className="w-9 h-9 text-[#177B7D]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75"
            />
          </svg>
        </div>
        {/* Scanning bar */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-transparent via-[#177B7D]/20 to-transparent"
            style={{ animation: "dxter-scanning-bar 1.8s ease-in-out infinite" }}
          />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-2">
        Analyzing observed experiments
      </h3>
      <p className="text-sm text-slate-500 mb-8 max-w-md">
        Using {revealedCount} flipped tile{revealedCount !== 1 ? "s" : ""} as
        training data for the surrogate model
      </p>

      {/* Mini data dots animation */}
      <div className="flex items-center gap-3">
        {Array.from({ length: Math.min(revealedCount, 7) }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-[#177B7D]"
            style={{
              animation: `dxter-icon-pulse 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
              opacity: 0.5 + (i / 7) * 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Fitting GP surrogate model
// ---------------------------------------------------------------------------
function Step2() {
  return (
    <div
      className="flex-1 flex flex-col"
      style={{ animation: "dxter-step-enter 0.5s ease-out both" }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div
          className="w-16 h-16 rounded-full bg-[#177B7D]/10 flex items-center justify-center mx-auto mb-4"
          style={{ animation: "dxter-icon-pulse 2s ease-in-out infinite" }}
        >
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
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">
          Fitting Gaussian Process surrogate model
        </h3>
        <p className="text-sm text-slate-500">
          Estimating the objective function and its uncertainty
        </p>
      </div>

      {/* GP Chart */}
      <div className="bg-[#FAFAFA] border border-slate-200 rounded-lg p-5 flex-1">
        <svg
          width="100%"
          height="240"
          viewBox="0 0 600 240"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient
              id="dxter-ug"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#177B7D" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#177B7D" stopOpacity={0.22} />
            </linearGradient>
            <clipPath id="dxter-plot-clip">
              <rect x="50" y="20" width="520" height="180" rx="8" />
            </clipPath>
          </defs>

          {/* Grid lines */}
          <g stroke="#E5E7EB" strokeWidth={1}>
            <line x1="50" y1="50" x2="570" y2="50" />
            <line x1="50" y1="90" x2="570" y2="90" />
            <line x1="50" y1="130" x2="570" y2="130" />
            <line x1="50" y1="170" x2="570" y2="170" />
            <line x1="120" y1="20" x2="120" y2="200" />
            <line x1="220" y1="20" x2="220" y2="200" />
            <line x1="320" y1="20" x2="320" y2="200" />
            <line x1="420" y1="20" x2="420" y2="200" />
            <line x1="520" y1="20" x2="520" y2="200" />
          </g>

          <g clipPath="url(#dxter-plot-clip)">
            {/* Uncertainty band */}
            <path
              d="M 50 175
                 C 120 155, 160 135, 220 120
                 C 300 100, 360 88, 420 95
                 C 485 102, 525 115, 570 120
                 L 570 165
                 C 525 160, 485 150, 420 145
                 C 360 140, 300 145, 220 155
                 C 160 165, 120 178, 50 190 Z"
              fill="url(#dxter-ug)"
              style={{
                animation: "dxter-band-reveal 1.4s ease-out forwards 0.3s",
                opacity: 0,
                transformOrigin: "center bottom",
              }}
            />

            {/* Predicted mean line */}
            <path
              d="M 50 182
                 C 120 165, 160 150, 220 140
                 C 300 122, 360 110, 420 115
                 C 485 120, 525 132, 570 138"
              fill="none"
              stroke="#177B7D"
              strokeWidth={3}
              strokeLinecap="round"
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: 1000,
                animation: "dxter-draw-line 1.5s ease-out forwards",
              }}
            />

            {/* Observation dots */}
            {[
              [95, 150],
              [160, 175],
              [230, 135],
              [290, 75],
              [410, 95],
              [455, 118],
              [500, 108],
              [545, 102],
            ].map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={6}
                fill="#177B7D"
                stroke="#FFFFFF"
                strokeWidth={3}
                style={{
                  animation: `dxter-dot-pop 0.4s ease-out forwards`,
                  animationDelay: `${0.6 + i * 0.12}s`,
                  opacity: 0,
                }}
              />
            ))}
          </g>

          {/* Legend */}
          <g fontFamily="Rubik, sans-serif">
            <text x="50" y="225" fontSize="11" fill="#6B7280" fontWeight={500}>
              Uncertainty (±2σ)
            </text>
            <rect
              x="165"
              y="214"
              width="30"
              height="12"
              fill="url(#dxter-ug)"
              rx="2"
            />
            <text x="210" y="225" fontSize="11" fill="#6B7280" fontWeight={500}>
              Predicted mean
            </text>
            <line
              x1="315"
              y1="220"
              x2="355"
              y2="220"
              stroke="#177B7D"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <text x="370" y="225" fontSize="11" fill="#6B7280" fontWeight={500}>
              Observations
            </text>
            <circle
              cx="465"
              cy="220"
              r="5"
              fill="#177B7D"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Optimizing acquisition function
// ---------------------------------------------------------------------------
function Step3() {
  return (
    <div
      className="flex-1 flex flex-col"
      style={{ animation: "dxter-step-enter 0.5s ease-out both" }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div
          className="w-16 h-16 rounded-full bg-[#177B7D]/10 flex items-center justify-center mx-auto mb-4"
          style={{ animation: "dxter-icon-pulse 2s ease-in-out infinite" }}
        >
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
              d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">
          Optimizing acquisition function
        </h3>
        <p className="text-sm text-slate-500">
          Balancing exploration (uncertainty) and exploitation (predicted value)
        </p>
      </div>

      {/* Two charts side by side */}
      <div className="grid grid-cols-2 gap-5 flex-1">
        {/* GP mini chart */}
        <div className="bg-[#FAFAFA] border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-slate-600 mb-3 text-center">
            Gaussian Process
          </div>
          <svg width="100%" height="140" viewBox="0 0 280 140">
            <defs>
              <linearGradient
                id="dxter-ug-mini"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#177B7D" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#177B7D" stopOpacity={0.18} />
              </linearGradient>
            </defs>
            {/* Band */}
            <path
              d="M 20 95 Q 80 70, 140 55 T 260 75 L 260 110 Q 200 105, 140 105 Q 80 110, 20 120 Z"
              fill="url(#dxter-ug-mini)"
              style={{
                animation: "dxter-band-reveal 1s ease-out forwards 0.2s",
                opacity: 0,
                transformOrigin: "center bottom",
              }}
            />
            {/* Mean */}
            <path
              d="M 20 108 Q 80 88, 140 75 T 260 92"
              fill="none"
              stroke="#177B7D"
              strokeWidth={2}
              strokeLinecap="round"
              style={{
                strokeDasharray: 500,
                strokeDashoffset: 500,
                animation: "dxter-draw-line 1.2s ease-out forwards 0.1s",
              }}
            />
            {/* Points */}
            {[
              [60, 92],
              [120, 78],
              [200, 88],
            ].map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={4}
                fill="#177B7D"
                stroke="#FFFFFF"
                strokeWidth={2}
                style={{
                  animation: `dxter-dot-pop 0.35s ease-out forwards`,
                  animationDelay: `${0.4 + i * 0.15}s`,
                  opacity: 0,
                }}
              />
            ))}
          </svg>
        </div>

        {/* Acquisition function chart */}
        <div className="bg-[#FAFAFA] border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-slate-600 mb-3 text-center">
            Acquisition Function
          </div>
          <svg width="100%" height="140" viewBox="0 0 280 140">
            {/* Acquisition curve */}
            <path
              d="M 20 115
                 C 55 112, 70 105, 90 90
                 C 105 78, 115 50, 130 72
                 C 145 92, 160 100, 175 70
                 C 188 45, 205 35, 220 55
                 C 235 72, 248 92, 260 104"
              fill="none"
              stroke="#4DA9AB"
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{
                strokeDasharray: 600,
                strokeDashoffset: 600,
                animation: "dxter-draw-line 1.3s ease-out forwards 0.2s",
              }}
            />
            <line
              x1="20"
              y1="118"
              x2="260"
              y2="118"
              stroke="#E5E7EB"
              strokeWidth={1}
            />
            {/* Peaks */}
            {[
              { cx: 112, cy: 54, delay: 0 },
              { cx: 200, cy: 38, delay: 0.25 },
              { cx: 232, cy: 68, delay: 0.5 },
            ].map(({ cx, cy, delay }, i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={7}
                fill="#177B7D"
                style={{
                  animation: `dxter-peak-pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                  transformOrigin: `${cx}px ${cy}px`,
                }}
              />
            ))}
          </svg>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center mt-4">
        Peaks represent the most promising regions to explore next
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Recommendations ready
// ---------------------------------------------------------------------------
function Step4({
  recommendationCount,
  previewOnly,
  onApply,
}: {
  recommendationCount: number;
  previewOnly: boolean;
  onApply: () => void;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center text-center"
      style={{ animation: "dxter-step-enter 0.5s ease-out both" }}
    >
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-[#177B7D] flex items-center justify-center mb-5 shadow-lg shadow-[#177B7D]/20">
        <svg
          className="w-10 h-10 text-white"
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
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {recommendationCount} promising regions identified
      </h3>
      <p className="text-sm text-slate-500 mb-8 max-w-lg">
        Based on the Gaussian Process model and acquisition optimization, DxTER
        recommends exploring these areas.
      </p>

      {/* Preview of recommendation tiles */}
      <div className="bg-[#177B7D]/5 border border-[#177B7D]/20 rounded-xl p-5 mb-8 w-full max-w-sm">
        <div className="flex items-center justify-center gap-4">
          {Array.from({ length: recommendationCount }).map((_, i) => (
            <div
              key={i}
              className="w-14 h-14 border-2 border-dashed border-[#177B7D] rounded-lg bg-white flex items-center justify-center shadow-sm"
              style={{
                animation: "dxter-step-enter 0.4s ease-out both",
                animationDelay: `${i * 0.12}s`,
              }}
            >
              <svg
                className="w-5 h-5 text-[#177B7D]"
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
          ))}
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={onApply}
        className="w-full max-w-sm bg-[#177B7D] text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-[#155e5f] transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.98]"
      >
        {previewOnly ? "Close preview" : "Apply recommendations"}
      </button>

      {previewOnly && (
        <p className="text-xs text-slate-400 mt-3">
          This is a preview — no budget was spent
        </p>
      )}
    </div>
  );
}
