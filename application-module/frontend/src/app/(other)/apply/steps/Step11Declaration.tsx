// src/app/(other)/apply/steps/Step11Declaration.tsx
import React, { useEffect } from "react";
import { Shield, Scale, Gavel, AlertTriangle, PenTool, CheckCircle2, XCircle } from "lucide-react";
import { todayISO } from "../normalize";
import type { Declaration, EmploymentDeclarations } from "../types";
import { Checkbox, Field, Grid, StepHeader, TextArea, TextInput, YesNo } from "../ui";
import type { StepProps } from "./stepProps";

const Block: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="p-4 border border-gray-200 sm:p-5 rounded-xl bg-gray-50/60">
    <h4 className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-800">
      {icon}
      {title}
    </h4>
    <div className="space-y-3">{children}</div>
  </div>
);

const Step11Declaration: React.FC<StepProps> = ({ data, update, readOnly }) => {
  const d = data.declaration;
  const ed = d.employmentDeclarations;
  const hasCurrentJob = data.professionalExperience.some((x) => x.currentPosition);

  const set = <K extends keyof Declaration>(k: K, v: Declaration[K]) => update("declaration", { ...d, [k]: v });
  const setEd = <K extends keyof EmploymentDeclarations>(k: K, v: EmploymentDeclarations[K]) =>
    update("declaration", { ...d, employmentDeclarations: { ...ed, [k]: v } });
  const setBond = (k: keyof EmploymentDeclarations["bondViolationDetails"], v: string) =>
    setEd("bondViolationDetails", { ...ed.bondViolationDetails, [k]: v });

  // Pre-fill today's date the first time the applicant reaches this step.
  useEffect(() => {
    if (!readOnly && !d.date) set("date", todayISO());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <StepHeader step="declaration" icon={<Shield size={22} />} subtitle="Answer each question and confirm the declaration." />

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-800">Part A — Employment History</h3>

        <Block icon={<Scale size={18} className="text-[#800000]" />} title="1. Commendations / punishments during your career">
          <p className="text-sm text-gray-700">Have you received any commendations or awards from an employer?</p>
          <YesNo name="commend" value={ed.hasCommendations} onChange={(v) => setEd("hasCommendations", v)} />
          {ed.hasCommendations && (
            <TextArea rows={2} value={ed.commendationsDetails} onValue={(v) => setEd("commendationsDetails", v)} placeholder="Details of commendations / awards" />
          )}
          <p className="pt-2 text-sm text-gray-700">Have you received any punishment or disciplinary action?</p>
          <YesNo name="punish" value={ed.hasPunishments} onChange={(v) => setEd("hasPunishments", v)} />
          {ed.hasPunishments && (
            <TextArea rows={2} value={ed.punishmentsDetails} onValue={(v) => setEd("punishmentsDetails", v)} placeholder="Details of punishments / disciplinary actions *" />
          )}
        </Block>

        <Block icon={<Gavel size={18} className="text-[#800000]" />} title="2. Vacation of post">
          <p className="text-sm text-gray-700">
            Have you ever been served a vacation-of-post notice by any University / Government institution?
          </p>
          <YesNo name="vop" value={ed.hasVacationNotice} onChange={(v) => setEd("hasVacationNotice", v)} />
          {ed.hasVacationNotice && (
            <Grid>
              <Field label="Institution" required>
                <TextInput value={ed.vacationNoticeInstitution} onValue={(v) => setEd("vacationNoticeInstitution", v)} />
              </Field>
              <Field label="Date of notice">
                <TextInput type="date" value={ed.vacationNoticeDate} onValue={(v) => setEd("vacationNoticeDate", v)} />
              </Field>
              <Field label="Details" full>
                <TextArea rows={2} value={ed.vacationNoticeDetails} onValue={(v) => setEd("vacationNoticeDetails", v)} />
              </Field>
            </Grid>
          )}
        </Block>

        <Block icon={<AlertTriangle size={18} className="text-[#800000]" />} title="3. Bond violation">
          <p className="text-sm text-gray-700">Have you ever been treated as a bond violator?</p>
          <YesNo name="bond" value={ed.isBondViolator} onChange={(v) => setEd("isBondViolator", v)} />
          {ed.isBondViolator && (
            <Grid>
              <Field label="Bond value (LKR)">
                <TextInput inputMode="numeric" value={ed.bondViolationDetails.bondValue} onValue={(v) => setBond("bondValue", v)} />
              </Field>
              <Field label="University / Institute" required>
                <TextInput value={ed.bondViolationDetails.institution} onValue={(v) => setBond("institution", v)} />
              </Field>
              <Field label="Date">
                <TextInput type="date" value={ed.bondViolationDetails.violationDate || ""} onValue={(v) => setBond("violationDate", v)} />
              </Field>
              <Field label="Remarks" full>
                <TextArea rows={2} value={ed.bondViolationDetails.remarks || ""} onValue={(v) => setBond("remarks", v)} />
              </Field>
            </Grid>
          )}
        </Block>
      </section>

      {hasCurrentJob && (
        <section className="p-4 border border-gray-200 sm:p-5 rounded-xl">
          <h3 className="mb-2 text-base font-semibold text-gray-800">Part B — Release from present post</h3>
          <Checkbox
            id="resign"
            checked={d.willingnessToResign}
            onChange={(v) => set("willingnessToResign", v)}
            label="I am willing to resign from my present post if I am not officially released to accept this appointment. *"
          />
        </section>
      )}

      <section className={`p-4 sm:p-5 border-2 rounded-xl ${d.agreed ? "border-green-300 bg-green-50/40" : "border-[#800000]/30"}`}>
        <h3 className="mb-2 text-base font-semibold text-gray-800">{hasCurrentJob ? "Part C" : "Part B"} — Declaration</h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-700">
          I hereby certify that all particulars submitted by me in this application are true and
          accurate. I am aware that if any of the information is found to be false or inaccurate, I am
          liable to be disqualified before selection, or dismissed without compensation if the
          inaccuracy is discovered after appointment.
        </p>
        <Checkbox
          id="agree"
          checked={d.agreed}
          onChange={(v) => set("agreed", v)}
          label={<strong>I agree to the above declaration *</strong>}
        />
        <p className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${d.agreed ? "text-green-700" : "text-gray-500"}`}>
          {d.agreed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          Declaration agreed: {d.agreed ? "Yes" : "No"}
        </p>

        <div className="mt-4">
          <Grid>
            <Field label="Signature (type your full name)" required>
              <div className="relative">
                <PenTool size={16} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <TextInput className="pl-9" value={d.signature} onValue={(v) => set("signature", v)} placeholder={data.personalInfo.fullName || "Full name"} />
              </div>
              {!d.signature && data.personalInfo.fullName && !readOnly && (
                <button type="button" onClick={() => set("signature", data.personalInfo.fullName)} className="mt-1 text-xs font-medium text-[#800000] underline">
                  Use “{data.personalInfo.fullName}”
                </button>
              )}
            </Field>
            <Field label="Date" required>
              <TextInput type="date" value={d.date} onValue={(v) => set("date", v)} />
            </Field>
          </Grid>
        </div>
      </section>
    </div>
  );
};

export default Step11Declaration;
