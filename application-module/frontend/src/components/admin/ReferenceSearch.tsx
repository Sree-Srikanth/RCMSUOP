// src/components/admin/ReferenceSearch.tsx
// Admin search box: find an advertisement or an application by its
// reference number (full or partial, e.g. "2026/0007" or "APP/2026/000123").
import React, { useState } from "react";
import { Search, Loader2, Megaphone, FileText } from "lucide-react";
import { searchByReference } from "../../services/applicationApi";

interface Props {
  onOpenVacancy?: (vacancyId: number) => void;
  onOpenApplication?: (applicationId: number) => void;
}

type Result = NonNullable<Awaited<ReturnType<typeof searchByReference>>["data"]>;

const ReferenceSearch: React.FC<Props> = ({ onOpenVacancy, onOpenApplication }) => {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 3) {
      setError("Enter at least 3 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await searchByReference(q.trim());
    setLoading(false);
    if (res.success && res.data) setResult(res.data);
    else setError(res.error || "Search failed.");
  };

  return (
    <div className="space-y-3">
      <form onSubmit={run} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by Reference No."
          className="flex-1 min-h-[44px] px-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000]"
        />
        <button type="submit" className="inline-flex items-center gap-2 px-4 text-white rounded-lg bg-[#800000] min-h-[44px]">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="space-y-2">
          {result.vacancies.length + result.applications.length === 0 && (
            <p className="text-sm text-gray-500">No matches.</p>
          )}
          {result.vacancies.map((v) => (
            <button
              key={`v${v.vacancy_id}`}
              type="button"
              onClick={() => onOpenVacancy?.(v.vacancy_id)}
              className="flex items-start w-full gap-3 p-3 text-left bg-white border rounded-lg hover:border-[#800000]"
            >
              <Megaphone size={18} className="text-[#800000] shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block font-mono text-sm font-semibold">{v.reference_no}</span>
                <span className="block text-sm text-gray-700 truncate">{v.title}</span>
                <span className="block text-xs text-gray-500">Closes {v.closing_date ?? "—"}</span>
              </span>
            </button>
          ))}
          {result.applications.map((a) => (
            <button
              key={`a${a.application_id}`}
              type="button"
              onClick={() => onOpenApplication?.(a.application_id)}
              className="flex items-start w-full gap-3 p-3 text-left bg-white border rounded-lg hover:border-[#800000]"
            >
              <FileText size={18} className="text-gray-600 shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block font-mono text-sm font-semibold">{a.reference_no}</span>
                <span className="block text-sm text-gray-700 truncate">
                  {a.applicant_name || "—"} · {a.vacancy_title}
                </span>
                <span className="block text-xs text-gray-500">
                  {a.status === "submitted" ? `Submitted ${a.submitted_at ?? ""}` : "Draft"}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferenceSearch;
