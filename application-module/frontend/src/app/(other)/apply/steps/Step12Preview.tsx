// src/app/(other)/apply/steps/Step12Preview.tsx
// Mobile-friendly review of the whole application. Each section shows its
// own validation issues and an "Edit" shortcut back to that step.
import React from "react";
import { Eye, Pencil, AlertCircle, CheckCircle2, Download, Printer, Loader2 } from "lucide-react";
import { buildDocumentChecklist } from "../documents";
import { pruneBlankEntries } from "../normalize";
import { STEPS, stepNumber, type StepId } from "../steps";
import type { ApplicationData } from "../types";
import { Notice, StepHeader } from "../ui";

interface Props {
  data: ApplicationData;
  errors: Record<number, string[]>;
  goTo: (step: number) => void;
  onDownload: () => void;
  onPrint: () => void;
  downloading: boolean;
  readOnly?: boolean;
}

type Pair = [string, React.ReactNode];

const KV: React.FC<{ rows: Pair[] }> = ({ rows }) => (
  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
    {rows.map(([k, v]) => (
      <div key={k} className="min-w-0">
        <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">{k}</dt>
        <dd className="text-sm text-gray-900 break-words">{v === "" || v === undefined || v === null ? "—" : v}</dd>
      </div>
    ))}
  </dl>
);

const Items: React.FC<{ items: Array<{ title: React.ReactNode; rows: Pair[] }>; empty?: string }> = ({
  items,
  empty = "None provided.",
}) =>
  items.length ? (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg">
          <p className="mb-2 text-sm font-semibold text-gray-900">{it.title}</p>
          <KV rows={it.rows} />
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm italic text-gray-400">{empty}</p>
  );

const Section: React.FC<{
  id: StepId;
  errors: Record<number, string[]>;
  goTo: (s: number) => void;
  readOnly?: boolean;
  children: React.ReactNode;
}> = ({ id, errors, goTo, readOnly, children }) => {
  const num = stepNumber(id);
  const errs = errors[num] || [];
  return (
    <section className={`border rounded-xl overflow-hidden ${errs.length ? "border-red-300" : "border-gray-200"}`}>
      <header className="flex items-center justify-between gap-2 px-4 py-3 text-white bg-[#7a0000]">
        <h3 className="flex items-center gap-2 text-sm font-semibold sm:text-base">
          {errs.length ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {num}. {STEPS[num - 1].title}
        </h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => goTo(num)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#7a0000] bg-white rounded-md hover:bg-gray-100"
          >
            <Pencil size={14} /> Edit
          </button>
        )}
      </header>
      <div className="p-4 space-y-3 bg-gray-50/50">
        {errs.length > 0 && (
          <ul className="p-3 space-y-1 text-sm text-red-700 list-disc list-inside rounded-lg bg-red-50">
            {errs.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </section>
  );
};

const Step12Preview: React.FC<Props> = ({ data: raw, errors, goTo, onDownload, onPrint, downloading, readOnly }) => {
  const data = pruneBlankEntries(raw);
  const p = data.personalInfo;
  const c = data.contactInfo;
  const d = data.declaration;
  const ed = d.employmentDeclarations;
  const errorCount = Object.values(errors).reduce((a, e) => a + e.length, 0);
  const docs = buildDocumentChecklist(data);
  const sp = { errors, goTo, readOnly };

  return (
    <div className="space-y-5">
      <StepHeader
        step="preview"
        icon={<Eye size={22} />}
        subtitle="Check every section carefully. After submission the application cannot be changed."
        action={
          <div className="flex gap-2">
            <button type="button" onClick={onPrint} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px]">
              <Printer size={16} /> Print
            </button>
            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex items-center justify-center w-full gap-2 px-3 py-2 text-sm text-white rounded-lg sm:w-auto bg-gray-700 hover:bg-gray-800 min-h-[44px] disabled:opacity-60"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {raw.is_final_submitted ? "Download PDF" : "Download draft PDF"}
            </button>
          </div>
        }
      />

      {!readOnly &&
        (errorCount ? (
          <Notice tone="warn">
            <strong>{errorCount} item(s) need attention</strong> before you can submit. Use <em>Edit</em> on the
            highlighted sections.
          </Notice>
        ) : (
          <Notice>Everything looks complete. Review the details below, then press <strong>Submit Application</strong>.</Notice>
        ))}

      <Section id="personal" {...sp}>
        <KV
          rows={[
            ["Name", `${p.title} ${p.fullName}`.trim()],
            ["Name with initials", p.nameWithInitials],
            ["Surname", p.surname],
            ["Previous name", p.previousName],
            ["Date of birth", p.dateOfBirth ? `${p.dateOfBirth} (age ${p.age})` : ""],
            ["Gender", p.gender],
            ["Civil status", p.civilStatus],
            ["Nationality", p.nationality === "Other" ? p.nationalityOther : p.nationality],
            ["Citizenship", p.citizenshipType],
            ["NIC", p.nic],
            ["Passport", p.passportNo],
          ]}
        />
      </Section>

      <Section id="contact" {...sp}>
        <KV
          rows={[
            ["Permanent address", [c.permanentAddress, c.permanentCity, c.permanentDistrict, c.permanentPostalCode].filter(Boolean).join(", ")],
            ["Postal address", [c.address, c.city, c.district, c.postalCode].filter(Boolean).join(", ")],
            ["Mobile", c.phoneMobile],
            ["Email", c.email],
            ["Home / Office", [c.phoneHome, c.phoneOffice].filter(Boolean).join(" / ")],
            ["Emergency contact", [c.emergencyName, c.emergencyRelation, c.emergencyPhone].filter(Boolean).join(" · ")],
          ]}
        />
      </Section>

      <Section id="education" {...sp}>
        <h4 className="text-xs font-bold text-gray-600 uppercase">University</h4>
        <Items
          items={data.universityEducation.map((e) => ({
            title: e.degreeName,
            rows: [
              ["University", e.university],
              ["Period", e.fromYear || e.toYear ? `${e.fromYear || "—"} – ${e.toYear || "—"}` : ""],
              ["Class / Results", e.classGrade || e.results],
              ["GPA", e.gpa],
            ],
          }))}
        />
        <h4 className="pt-2 text-xs font-bold text-gray-600 uppercase">Postgraduate (optional)</h4>
        <Items
          empty="None — optional."
          items={data.postgraduateQualifications.map((e) => ({
            title: e.qualificationName,
            rows: [
              ["University", e.university],
              ["Type", e.type.replace("_", " & ")],
              ["Duration", e.duration],
              ["SLQF", e.slqfLevel],
            ],
          }))}
        />
        {data.boardCertifications.length > 0 && (
          <>
            <h4 className="pt-2 text-xs font-bold text-gray-600 uppercase">Board certification</h4>
            <Items items={data.boardCertifications.map((e) => ({ title: e.boardName || "Board", rows: [["Certified", e.isCertified ? "Yes" : "No"], ["Date", e.certificationDate]] }))} />
          </>
        )}
        {data.academicDistinctions.length > 0 && (
          <>
            <h4 className="pt-2 text-xs font-bold text-gray-600 uppercase">Distinctions</h4>
            <Items items={data.academicDistinctions.map((e) => ({ title: e.awardName, rows: [["Institution", e.institution], ["Year", e.yearReceived]] }))} />
          </>
        )}
      </Section>

      <Section id="professional" {...sp}>
        <Items
          items={data.professionalQualifications.map((q) => ({
            title: q.qualificationFullName || q.qualificationName,
            rows: [["Awarding body", q.institution], ["Year", q.year], ["Licence no.", q.licenseNumber]],
          }))}
        />
        {data.professionalMemberships.length > 0 && (
          <Items items={data.professionalMemberships.map((m) => ({ title: m.organization, rows: [["Level", m.membershipLevel], ["No.", m.membershipNumber], ["Since", m.yearJoined]] }))} />
        )}
      </Section>

      <Section id="research" {...sp}>
        <Items
          items={[
            ...data.researchPublications.journals.map((j) => ({ title: j.articleTitle, rows: [["Journal", j.journalName], ["Year", j.year], ["Authors", j.authors]] as Pair[] })),
            ...data.researchPublications.conferences.map((x) => ({ title: x.abstractTitle, rows: [["Conference", x.conferenceName], ["Date", x.conferenceDate]] as Pair[] })),
            ...data.researchPublications.books.map((b) => ({ title: b.bookName, rows: [["Authors", b.authors], ["ISBN", b.isbn]] as Pair[] })),
          ]}
        />
      </Section>

      <Section id="languages" {...sp}>
        <Items
          items={data.languageProficiency.map((l) => ({
            title: l.language,
            rows: [["Read / Write / Speak", [l.readingLevel, l.writingLevel, l.speakingLevel].map((x) => x || "—").join(" / ")], ["Highest exam", l.examPassed]],
          }))}
        />
      </Section>

      <Section id="experience" {...sp}>
        <Items
          items={data.professionalExperience.map((x) => ({
            title: (
              <>
                {x.designation} {x.currentPosition && <span className="ml-1 text-xs font-medium text-[#7a0000]">(Present)</span>}
              </>
            ),
            rows: [["Institution", x.institution], ["Period", `${x.fromDate || "—"} – ${x.currentPosition ? "to date" : x.toDate || "—"}`]],
          }))}
        />
      </Section>

      <Section id="activities" {...sp}>
        <Items items={data.extraCurricular.map((a) => ({ title: a.activityName, rows: [["Level", a.level], ["Year", a.year]] }))} />
        {data.additionalInfo && <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.additionalInfo}</p>}
      </Section>

      <Section id="referees" {...sp}>
        <Items
          items={data.referees.map((r) => ({
            title: r.name,
            rows: [["Designation", r.designation], ["Institution", r.institution], ["Phone", r.phone], ["Email", r.email]],
          }))}
        />
      </Section>

      <Section id="documents" {...sp}>
        <ul className="space-y-1">
          {docs.map((r) => (
            <li key={r.key} className="flex items-start gap-2 text-sm">
              {data.documents[r.key] ? (
                <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className={`shrink-0 mt-0.5 ${r.required ? "text-red-500" : "text-gray-300"}`} />
              )}
              <span className={data.documents[r.key] ? "text-gray-800" : "text-gray-500"}>
                {r.label}
                {r.required && !data.documents[r.key] && " (required)"}
              </span>
            </li>
          ))}
          {data.otherDocuments.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" /> Other: {o.name}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="declaration" {...sp}>
        <KV
          rows={[
            ["Commendations", ed.hasCommendations ? `Yes — ${ed.commendationsDetails || "—"}` : "No"],
            ["Punishments", ed.hasPunishments ? `Yes — ${ed.punishmentsDetails || "—"}` : "No"],
            ["Vacation of post notice", ed.hasVacationNotice ? `Yes — ${ed.vacationNoticeInstitution || "—"}` : "No"],
            ["Bond violator", ed.isBondViolator ? `Yes — ${ed.bondViolationDetails.institution || "—"}` : "No"],
            ["Willing to resign if not released", d.willingnessToResign ? "Yes" : "No"],
            [
              "Declaration agreed",
              <span className={`font-semibold ${d.agreed ? "text-green-700" : "text-red-600"}`}>{d.agreed ? "Yes" : "No"}</span>,
            ],
            ["Signature", d.signature],
            ["Date", d.date],
          ]}
        />
      </Section>
    </div>
  );
};

export default Step12Preview;
