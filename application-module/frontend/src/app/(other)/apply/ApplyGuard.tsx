// src/app/(other)/apply/ApplyGuard.tsx
// Entry rules for /apply?vacancyId=N
//  1. No/invalid vacancyId → back to the vacancy list.
//  2. Vacancy must exist and be open (published, closing date not passed).
//  3. Not logged in → remember /apply?vacancyId=N and redirect to login.
//  4. Direct URL access is refused: the user must have pressed "Apply Online"
//     on the vacancy (session intent) OR already have an application for it
//     (resume a draft / view a submitted one).
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Loader2, Lock, CalendarX } from "lucide-react";
import {
  ROUTES,
  getMyApplication,
  getVacancyStatus,
  hasApplyIntent,
  isLoggedIn,
  rememberRedirectAfterLogin,
} from "../../../services/applicationApi";
import type { VacancyInfo } from "./types";

type State =
  | { kind: "checking" }
  | { kind: "ok"; vacancy: VacancyInfo; existing: any | null }
  | { kind: "blocked"; title: string; message: string; icon: "closed" | "lock" };

interface Props {
  children: (vacancy: VacancyInfo, existing: any | null) => React.ReactNode;
}

const ApplyGuard: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<State>({ kind: "checking" });
  const vacancyId = Number(new URLSearchParams(location.search).get("vacancyId"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!Number.isInteger(vacancyId) || vacancyId <= 0) {
        navigate(ROUTES.vacancies, { replace: true });
        return;
      }

      const v = await getVacancyStatus(vacancyId);
      if (cancelled) return;
      if (!v.success || !v.data) {
        setState({
          kind: "blocked",
          icon: "lock",
          title: "Vacancy not available",
          message: v.error || "This vacancy could not be found or is no longer published.",
        });
        return;
      }
      const vacancy = v.data;

      if (!isLoggedIn()) {
        if (!vacancy.is_open) {
          setState({
            kind: "blocked",
            icon: "closed",
            title: "Applications closed",
            message: `Applications for “${vacancy.title}” closed on ${vacancy.closing_date ?? "—"}.`,
          });
          return;
        }
        rememberRedirectAfterLogin(`${ROUTES.apply}?vacancyId=${vacancyId}`);
        navigate(ROUTES.login, {
          replace: true,
          state: { from: `${ROUTES.apply}?vacancyId=${vacancyId}`, message: "Please log in to apply for this vacancy." },
        });
        return;
      }

      const mine = await getMyApplication(vacancyId);
      if (cancelled) return;
      const existing = mine.success && mine.data ? mine.data : null;

      if (!existing && !hasApplyIntent(vacancyId)) {
        // Typed / bookmarked URL without going through "Apply Online".
        navigate(`${ROUTES.vacancies}?highlight=${vacancyId}`, {
          replace: true,
          state: { message: "Please choose “Apply Online” on the vacancy to start an application." },
        });
        return;
      }

      if (!existing && !vacancy.is_open) {
        setState({
          kind: "blocked",
          icon: "closed",
          title: "Applications closed",
          message: `Applications for “${vacancy.title}” closed on ${vacancy.closing_date ?? "—"}.`,
        });
        return;
      }

      setState({ kind: "ok", vacancy, existing });
    })();
    return () => {
      cancelled = true;
    };
  }, [vacancyId, navigate]);

  if (state.kind === "checking") {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-600">
        <Loader2 className="animate-spin" size={20} /> Checking vacancy…
      </div>
    );
  }
  if (state.kind === "blocked") {
    return (
      <div className="max-w-md px-4 py-16 mx-auto text-center">
        {state.icon === "closed" ? (
          <CalendarX size={48} className="mx-auto mb-4 text-[#800000]" />
        ) : (
          <Lock size={48} className="mx-auto mb-4 text-[#800000]" />
        )}
        <h2 className="mb-2 text-xl font-bold text-gray-900">{state.title}</h2>
        <p className="mb-6 text-gray-600">{state.message}</p>
        <Link
          to={ROUTES.vacancies}
          className="inline-flex items-center justify-center px-5 py-2.5 font-medium text-white rounded-lg bg-[#800000] hover:bg-[#a01010]"
        >
          View open vacancies
        </Link>
      </div>
    );
  }
  return <>{children(state.vacancy, state.existing)}</>;
};

export default ApplyGuard;
