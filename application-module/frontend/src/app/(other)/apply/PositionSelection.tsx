// src/app/(other)/apply/PositionSelection.tsx
import React from "react";
import { Briefcase, ChevronRight } from "lucide-react";

export const parsePositions = (positions: string | undefined) =>
  (positions || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

interface Props {
  positions: string[];
  selected?: string;
  onSelect: (position: string) => void;
  onCancel?: () => void;
}

const PositionSelection: React.FC<Props> = ({ positions, selected, onSelect, onCancel }) => (
  <div className="max-w-2xl py-4 mx-auto sm:py-8">
    <div className="mb-6 text-center sm:mb-8">
      <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">Select the position you are applying for</h2>
      <p className="text-sm text-gray-600">This advertisement covers more than one post. One application = one position.</p>
    </div>
    <div className="space-y-3">
      {positions.map((pos) => (
        <button
          key={pos}
          type="button"
          onClick={() => onSelect(pos)}
          className={`w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left border-2 rounded-xl transition group ${
            pos === selected ? "border-[#800000] bg-red-50" : "border-gray-100 bg-white hover:border-[#800000] hover:bg-red-50"
          }`}
        >
          <span className="flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-red-100 text-[#800000] group-hover:bg-[#800000] group-hover:text-white transition">
              <Briefcase size={20} />
            </span>
            <span className="text-base font-semibold text-gray-800">{pos}</span>
          </span>
          <ChevronRight className="text-gray-400 group-hover:text-[#800000]" />
        </button>
      ))}
    </div>
    {onCancel && (
      <div className="mt-4 text-center">
        <button type="button" onClick={onCancel} className="text-sm text-gray-600 underline">
          Keep current selection
        </button>
      </div>
    )}
  </div>
);

export default PositionSelection;
