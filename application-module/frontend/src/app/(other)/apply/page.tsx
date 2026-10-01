// src/app/(other)/apply/page.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  Send,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudOff,
  Cloud,
  Briefcase,
  CalendarClock,
  Download,
  Mail,
  Lock,
  X,
} from "lucide-react";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import { DropdownProvider } from "../../../context/DropdownContext";
import { ROUTES, getStoredUser, submitApplication } from "../../../services/applicationApi";

import ApplyGuard from "./ApplyGuard";
import ApplicationPrintForm from "./ApplicationPrintForm";
import PositionSelection, { parsePositions } from "./PositionSelection";
import ProgressStepper from "./ProgressStepper";
import { pruneOrphanDocuments } from "./documents";
import { emptyApplication, normalizeApplication, pruneBlankEntries } from "./normalize";
import { downloadPdf, pdfFileName, renderPdfBlob } from "./pdf";
import { STEPS, TOTAL_STEPS, validateAll, validateStep } from "./steps";
import type { ApplicationData, SectionKey, VacancyInfo } from "./types";
import { useDraftSaver, type SaveStatus } from "./useDraftSaver";
import type { SectionUpdater } from "./steps/stepProps";

import Step1PersonalInfo from "./steps/Step1PersonalInfo";
import Step2ContactInfo from "./steps/Step2ContactInfo";
import Step3Education from "./steps/Step3Education";
import Step4ProfessionalQuals from "./steps/Step4ProfessionalQuals";
import Step5Research from "./steps/Step5Research";
import Step6Languages from "./steps/Step6Languages";
import Step7Experience from "./steps/Step7Experience";
import Step8ExtraCurricular from "./steps/Step8ExtraCurricular";
import Step9Referees from "./steps/Step9Referees";
import Step10Documents from "./steps/Step10Documents";
import Step11Declaration from "./steps/Step11Declaration";
import Step12Preview from "./steps/Step12Preview";

const FORM_KEYS: SectionKey[] = [
  "selectedJob",
  "personalInfo",
  "contactInfo",
  "universityEducation",
  "postgraduateQualifications",
  "boardCertifications",
  "academicDistinctions",
  "professionalQualifications",
  "professionalMemberships",
  "researchPublications",
  "languageProficiency",
  "professionalExperience",
  "extraCurricular",
  "additionalInfo",
  "referees",
  "documents",
  "otherDocuments",
  "declaration",
];

/** Only the applicant-editable sections are stored in form_data. */
const toFormData = (d: ApplicationData) => Object.fromEntries(FORM_KEYS.map((k) => [k, d[k]]));

const daysLeft = (closing?: string | null) => {
  if (!closing) return null;
  const end = new Date(`${closing.slice(0, 10)}T23:59:59`);
  return Math.ceil((end.getTime() - Date.now()) / 86_400_000);
};

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

// ─── Save indicator ──────────────────────────────────────────────────────────

const SaveIndicator: React.FC<{ status: SaveStatus; lastSavedAt: Date | null }> = ({ status, lastSavedAt }) => {
  const time = lastSavedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const map: Record<SaveStatus, { icon: React.ReactNode; text: string; cls: string }> = {
    idle: { icon: <Cloud size={14} />, text: time ? `Draft saved ${time}` : "Draft", cls: "text-gray-500" },
    saved: { icon: <CheckCircle2 size={14} />, text: `Draft saved ${time ?? ""}`, cls: "text-green-700" },
    unsaved: { icon: <Cloud size={14} />, text: "Unsaved changes…", cls: "text-gray-500" },
    saving: { icon: <Loader2 size={14} className="animate-spin" />, text: "Saving…", cls: "text-gray-600" },
    error: { icon: <AlertCircle size={14} />, text: "Save failed — retrying", cls: "text-red-600" },
    offline: { icon: <CloudOff size={14} />, text: "Offline — will save when back online", cls: "text-amber-700" },
    locked: { icon: <Lock size={14} />, text: "Read-only", cls: "text-gray-600" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.cls}`} aria-live="polite">
      {s.icon}
      {s.text}
    </span>
  );
};

// ─── Main form ───────────────────────────────────────────────────────────────

const ApplicationForm: React.FC<{ vacancy: VacancyInfo; existing: any | null }> = ({ vacancy, existing }) => {
  const navigate = useNavigate();
  const positions = parsePositions(vacancy.positions);

  const initial = useMemo<ApplicationData>(() => {
    const base = existing ? normalizeApplication(existing, vacancy.vacancy_id) : emptyApplication(vacancy.vacancy_id);
    const user = getStoredUser();
    return {
      ...base,
      vacancy_title: vacancy.title,
      vacancy_reference_no: vacancy.reference_no,
      faculty: vacancy.faculty,
      department: vacancy.department,
      discipline: vacancy.discipline,
      closing_date: vacancy.closing_date ?? undefined,
      selectedJob: base.selectedJob || (positions.length === 1 ? positions[0] : ""),
      contactInfo: { ...base.contactInfo, email: base.contactInfo.email || user?.email || "" },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [data, setData] = useState<ApplicationData>(initial);
  const dataRef = useRef(data);
  dataRef.current = data;
  const appIdRef = useRef<number | null>(initial.application_id);

  const startStep = Math.min(Math.max(initial.current_step, 1), TOTAL_STEPS);
  const [step, setStep] = useState(startStep);
  const stepRef = useRef(step);
  const [visited, setVisited] = useState<Set<number>>(() => new Set(Array.from({ length: startStep }, (_, i) => i + 1)));
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [lockedReason, setLockedReason] = useState("");
  const [toast, setToast] = useState("");
  const [choosingPosition, setChoosingPosition] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState<null | { emails?: { applicant: boolean; referees_sent: number; referees_total: number } }>(null);
  const [downloading, setDownloading] = useState(false);
  const [printExtra, setPrintExtra] = useState<Partial<ApplicationData>>({});
  const printRef = useRef<HTMLDivElement>(null);

  const submitted = data.is_final_submitted;
  const closed = !vacancy.is_open;
  const readOnly = submitted || closed || !!lockedReason;
  const left = daysLeft(vacancy.closing_date);

  const saver = useDraftSaver({
    enabled: !readOnly,
    getPayload: () => ({
      application_id: appIdRef.current,
      vacancy_id: vacancy.vacancy_id,
      selected_job: dataRef.current.selectedJob,
      current_step: stepRef.current,
      form_data: toFormData(pruneOrphanDocuments(dataRef.current)),
    }),
    onSaved: (res) => {
      const d = res.data ?? res;
      if (d.application_id) appIdRef.current = Number(d.application_id);
      setData((prev) => ({
        ...prev,
        application_id: appIdRef.current,
        reference_no: d.reference_no || prev.reference_no,
        updated_at: d.updated_at || prev.updated_at,
      }));
    },
    onLocked: (res) => setLockedReason(res.error || "This application can no longer be edited."),
  });
  const { markDirty, flush } = saver;

  const update: SectionUpdater = useCallback(
    (key, value) => {
      setData((prev) => ({
        ...prev,
        [key]: typeof value === "function" ? (value as (p: any) => any)(prev[key]) : value,
      }));
      markDirty();
    },
    [markDirty],
  );

  const errors = useMemo(() => validateAll(data), [data]);

  const flashToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 4000);
  };

  const goTo = (n: number) => {
    if (n < 1 || n > TOTAL_STEPS || n === step) return;
    setVisited((v) => new Set(v).add(step).add(n));
    setStep(n);
    stepRef.current = n;
    setStepErrors([]);
    if (!readOnly) {
      markDirty(); // persists current_step so the draft resumes here
      void flush();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    const errs = validateStep(STEPS[step - 1].id, data);
    if (errs.length) {
      setStepErrors(errs);
      setVisited((v) => new Set(v).add(step));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    goTo(step + 1);
  };

  const saveNow = async () => {
    markDirty();
    const ok = await flush();
    if (ok) {
      flashToast(
        `Draft saved${data.reference_no ? ` (Ref. ${data.reference_no})` : ""}. You can return and edit until ${
          vacancy.closing_date ?? "the closing date"
        }.`,
      );
    }
  };

  const startSubmit = () => {
    const all = validateAll(data);
    if (Object.keys(all).length) {
      setVisited(new Set(STEPS.map((_, i) => i + 1)));
      setSubmitError("Some sections are incomplete. Fix the highlighted items below, then submit.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitError("");
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      markDirty();
      const saved = await flush();
      if (!saved || !appIdRef.current) {
        setSubmitError(saver.error || "Could not save your application. Check your connection and try again.");
        return;
      }
      const now = new Date();
      setPrintExtra({ submitted_at: now.toLocaleString() });
      await nextFrame();
      if (!printRef.current) throw new Error("Print form not ready");
      const filename = pdfFileName(dataRef.current.reference_no, dataRef.current.personalInfo.nameWithInitials);
      const blob = await renderPdfBlob(printRef.current, filename);

      const res = await submitApplication(appIdRef.current, blob);
      if (!res.success) {
        if (res.code === "closed" || res.code === "submitted") setLockedReason(res.error || "");
        setSubmitError(res.error || "Submission failed. Please try again.");
        return;
      }
      const d = res.data ?? (res as any);
      setData((prev) => ({
        ...prev,
        status: "submitted",
        is_final_submitted: true,
        submitted_at: d.submitted_at || now.toISOString(),
        reference_no: d.reference_no || prev.reference_no,
      }));
      setPrintExtra({});
      setSubmitResult({ emails: d.emails });
      setConfirmOpen(false);
      try {
        sessionStorage.removeItem("applyIntent");
      } catch {
        /* ignore */
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      setSubmitError("Could not generate the application PDF. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      await downloadPdf(printRef.current, pdfFileName(data.reference_no, data.personalInfo.nameWithInitials));
    } finally {
      setDownloading(false);
    }
  };

  const printData = useMemo(() => ({ ...pruneBlankEntries(data), ...printExtra }), [data, printExtra]);
  const showPositionPicker = !readOnly && positions.length > 1 && (!data.selectedJob || choosingPosition);
  const stepProps = { data, update, readOnly };

  const renderStep = () => {
    switch (STEPS[step - 1].id) {
      case "personal": return <Step1PersonalInfo {...stepProps} />;
      case "contact": return <Step2ContactInfo {...stepProps} />;
      case "education": return <Step3Education {...stepProps} />;
      case "professional": return <Step4ProfessionalQuals {...stepProps} />;
      case "research": return <Step5Research {...stepProps} />;
      case "languages": return <Step6Languages {...stepProps} />;
      case "experience": return <Step7Experience {...stepProps} />;
      case "activities": return <Step8ExtraCurricular {...stepProps} />;
      case "referees": return <Step9Referees {...stepProps} />;
      case "documents": return <Step10Documents {...stepProps} />;
      case "declaration": return <Step11Declaration {...stepProps} />;
      case "preview":
        return (
          <Step12Preview
            data={data}
            errors={errors}
            goTo={goTo}
            onDownload={handleDownload}
            onPrint={() => window.print()}
            downloading={downloading}
            readOnly={readOnly}
          />
        );
    }
  };

  return (
    <>
      <main className="flex-grow w-full max-w-5xl px-3 py-4 mx-auto sm:px-4 sm:py-8 print:hidden">
        {/* ── Vacancy / draft summary ── */}
        <div className="p-4 mb-4 bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {vacancy.reference_no ? `Advertisement ${vacancy.reference_no}` : "Advertisement"}
              </p>
              <h1 className="text-lg font-bold leading-tight text-gray-900 sm:text-xl">{vacancy.title}</h1>
              {data.selectedJob && (
                <p className="flex flex-wrap items-center gap-2 mt-1 text-sm text-[#800000]">
                  <Briefcase size={14} /> {data.selectedJob}
                  {positions.length > 1 && !readOnly && (
                    <button type="button" onClick={() => setChoosingPosition(true)} className="text-xs text-gray-600 underline">
                      change
                    </button>
                  )}
                </p>
              )}
            </div>
            <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 sm:flex-col sm:items-end">
              <span className="text-sm">
                <span className="text-gray-500">Application Ref: </span>
                <strong className="text-gray-900">{data.reference_no || "assigned on first save"}</strong>
              </span>
              {vacancy.closing_date && (
                <span className={`inline-flex items-center gap-1 text-xs ${left !== null && left <= 3 ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                  <CalendarClock size={14} /> Closes {vacancy.closing_date}
                  {left !== null && left >= 0 && !submitted && ` · ${left} day${left === 1 ? "" : "s"} left`}
                </span>
              )}
              {!readOnly && <SaveIndicator status={saver.status} lastSavedAt={saver.lastSavedAt} />}
            </div>
          </div>
        </div>

        {/* ── Status banners ── */}
        {submitted && (
          <div className="p-5 mb-4 border border-green-200 rounded-xl bg-green-50">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={28} className="text-green-600 shrink-0" />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-green-900">Application submitted</h2>
                <p className="text-sm text-green-900">
                  Reference No. <strong>{data.reference_no}</strong>
                  {data.submitted_at && <> · submitted {data.submitted_at}</>}. Quote this number in all correspondence.
                </p>
                {submitResult?.emails && (
                  <ul className="mt-2 space-y-1 text-sm text-green-900">
                    <li className="flex items-center gap-1">
                      <Mail size={14} />
                      {submitResult.emails.applicant
                        ? `A PDF copy was emailed to ${data.contactInfo.email}.`
                        : "We could not email your PDF copy — please download it below."}
                    </li>
                    <li className="flex items-center gap-1">
                      <Mail size={14} /> {submitResult.emails.referees_sent} of {submitResult.emails.referees_total} referees notified.
                    </li>
                  </ul>
                )}
                <div className="flex flex-col gap-2 mt-3 sm:flex-row">
                  <button type="button" onClick={handleDownload} disabled={downloading} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 min-h-[44px]">
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
                  </button>
                  <button type="button" onClick={() => navigate(ROUTES.home)} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-green-800 border border-green-300 rounded-lg min-h-[44px]">
                    Back to home
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {!submitted && (closed || lockedReason) && (
          <div className="flex items-start gap-3 p-4 mb-4 border rounded-xl bg-amber-50 border-amber-200 text-amber-900">
            <Lock size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">
              {lockedReason || `The closing date (${vacancy.closing_date}) has passed. This draft was not submitted and can no longer be edited.`}
            </p>
          </div>
        )}
        {saver.status === "error" && !readOnly && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
            <AlertCircle size={16} /> {saver.error}
          </div>
        )}
        {submitError && (
          <div className="flex items-start gap-2 p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {submitError}
          </div>
        )}

        {!readOnly && !showPositionPicker && (
          <div className="mb-4">
            <ProgressStepper current={step} visited={visited} errors={errors} onSelect={goTo} />
          </div>
        )}

        {/* ── Form card ── */}
        <div className="p-4 bg-white border border-gray-200 shadow-sm sm:p-6 rounded-xl">
          {stepErrors.length > 0 && (
            <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50" role="alert">
              <p className="flex items-center gap-2 mb-1 text-sm font-semibold text-red-800">
                <AlertCircle size={16} /> Please complete the following before continuing:
              </p>
              <ul className="ml-6 space-y-0.5 text-sm text-red-700 list-disc">
                {stepErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {showPositionPicker ? (
            <PositionSelection
              positions={positions}
              selected={data.selectedJob}
              onSelect={(pos) => {
                update("selectedJob", pos);
                setChoosingPosition(false);
              }}
              onCancel={data.selectedJob ? () => setChoosingPosition(false) : undefined}
            />
          ) : readOnly ? (
            <Step12Preview
              data={data}
              errors={submitted ? {} : errors}
              goTo={goTo}
              onDownload={handleDownload}
              onPrint={() => window.print()}
              downloading={downloading}
              readOnly
            />
          ) : (
            <fieldset disabled={submitting} className="min-w-0">
              {renderStep()}
            </fieldset>
          )}
        </div>

        {/* ── Navigation (sticky on phones) ── */}
        {!readOnly && !showPositionPicker && (
          <div className="sticky bottom-0 z-20 -mx-3 sm:mx-0 mt-4 px-3 py-3 sm:px-0 bg-gray-50/95 backdrop-blur border-t border-gray-200 sm:border-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                disabled={step === 1}
                className="inline-flex items-center justify-center gap-1 px-3 sm:px-5 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg min-h-[44px] disabled:opacity-40"
              >
                <ChevronLeft size={18} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <button
                type="button"
                onClick={saveNow}
                disabled={saver.status === "saving"}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg min-h-[44px]"
              >
                {saver.status === "saving" ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span className="hidden sm:inline">Save Draft</span>
                <span className="sm:hidden">Save</span>
              </button>

              <div className="flex-1" />

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center justify-center gap-1 px-5 sm:px-6 py-2 font-semibold text-white rounded-lg bg-[#800000] hover:bg-[#a01010] min-h-[44px]"
                >
                  {step === TOTAL_STEPS - 1 ? "Review" : "Next"}
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startSubmit}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 min-h-[44px] disabled:opacity-60"
                >
                  <Send size={18} /> Submit<span className="hidden sm:inline"> Application</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Confirm submission dialog ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center print:hidden" role="dialog" aria-modal="true">
          <div className="w-full max-w-md p-5 bg-white shadow-xl rounded-t-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Submit application?</h3>
              {!submitting && (
                <button type="button" onClick={() => setConfirmOpen(false)} className="p-1 text-gray-500" aria-label="Close">
                  <X size={20} />
                </button>
              )}
            </div>
            <ul className="mb-4 space-y-2 text-sm text-gray-700">
              <li>• You will <strong>not</strong> be able to edit the application after submitting.</li>
              <li>• A PDF copy will be emailed to <strong>{data.contactInfo.email}</strong>.</li>
              <li>
                • Your {pruneBlankEntries(data).referees.length} referees will receive a notification email with your
                details and a copy of the application.
              </li>
            </ul>
            {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmOpen(false)} disabled={submitting} className="px-4 py-2 font-medium text-gray-700 border border-gray-300 rounded-lg min-h-[44px]">
                Cancel
              </button>
              <button type="button" onClick={confirmSubmit} disabled={submitting} className="inline-flex items-center justify-center gap-2 px-5 py-2 font-semibold text-white bg-green-700 rounded-lg min-h-[44px] disabled:opacity-70">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? "Submitting…" : "Yes, submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed z-50 max-w-md px-4 py-3 mx-auto text-sm text-white bg-gray-900 shadow-lg left-3 right-3 bottom-24 sm:bottom-6 rounded-xl print:hidden" role="status">
          {toast}
        </div>
      )}

      {/* ── Off-screen official form (PDF / print) ── */}
      <div id="application-print-root" aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: 0, width: "210mm" }}>
        <ApplicationPrintForm ref={printRef} data={printData} />
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #application-print-root, #application-print-root * { visibility: visible !important; }
          #application-print-root { position: absolute !important; left: 0 !important; top: 0 !important; }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>
    </>
  );
};

const ApplyPage: React.FC = () => (
  <DropdownProvider>
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <ApplyGuard>{(vacancy, existing) => <ApplicationForm vacancy={vacancy} existing={existing} />}</ApplyGuard>
      <Footer />
    </div>
  </DropdownProvider>
);

export default ApplyPage;
