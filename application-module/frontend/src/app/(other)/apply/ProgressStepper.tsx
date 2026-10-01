// src/app/(other)/apply/ProgressStepper.tsx
import React, { useEffect, useRef } from "react";
import { Check, AlertCircle } from "lucide-react";
import { STEPS } from "./steps";

interface Props {
  current: number;
  visited: Set<number>;
  errors: Record<number, string[]>;
  onSelect: (step: number) => void;
}

const ProgressStepper: React.FC<Props> = ({ current, visited, errors, onSelect }) => {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the active chip visible on narrow screens.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [current]);

  const pct = Math.round(((current - 1) / (STEPS.length - 1)) * 100);

  return (
    <nav aria-label="Application steps" className="p-3 bg-white border border-gray-200 shadow-sm sm:p-4 rounded-xl">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-semibold text-[#800000]">
          Step {current} of {STEPS.length}
          <span className="font-normal text-gray-600"> · {STEPS[current - 1].title}</span>
        </p>
        <span className="hidden text-xs text-gray-500 sm:inline">{pct}%</span>
      </div>
      <div className="w-full h-1.5 mb-3 bg-gray-200 rounded-full">
        <div className="h-1.5 rounded-full bg-[#800000] transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      <ol className="flex gap-2 -mx-3 px-3 pb-1 overflow-x-auto snap-x [scrollbar-width:none]">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const isActive = n === current;
          const hasErr = visited.has(n) && !isActive && (errors[n]?.length ?? 0) > 0;
          const done = visited.has(n) && !isActive && !hasErr;
          return (
            <li key={s.id} className="snap-start shrink-0">
              <button
                ref={isActive ? activeRef : undefined}
                type="button"
                onClick={() => onSelect(n)}
                aria-current={isActive ? "step" : undefined}
                className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-xs font-medium border transition whitespace-nowrap ${
                  isActive
                    ? "bg-[#800000] border-[#800000] text-white"
                    : hasErr
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : done
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                    isActive ? "bg-white text-[#800000]" : hasErr ? "bg-amber-500 text-white" : done ? "bg-green-600 text-white" : "bg-gray-100"
                  }`}
                >
                  {done ? <Check size={13} /> : hasErr ? <AlertCircle size={13} /> : n}
                </span>
                {s.short}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ProgressStepper;
