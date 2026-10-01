// src/app/(other)/apply/steps.ts
// Single source of truth for step ORDER and NUMBERING. Step headings, the
// progress bar, the preview and the PDF all read from here, so the numbers
// can no longer drift apart (the old form showed "7. Professional Experience"
// as step 4, "4. Professional Qualifications" as step 5, and so on).

import { buildDocumentChecklist } from "./documents";
import { pruneBlankEntries } from "./normalize";
import type { ApplicationData } from "./types";

export type StepId =
  | "personal"
  | "contact"
  | "education"
  | "professional"
  | "research"
  | "languages"
  | "experience"
  | "activities"
  | "referees"
  | "documents"
  | "declaration"
  | "preview";

export interface StepDef {
  id: StepId;
  /** Full title shown as the step heading. */
  title: string;
  /** Short label for the progress bar. */
  short: string;
  optional?: boolean;
}

export const STEPS: StepDef[] = [
  { id: "personal", title: "Personal Information", short: "Personal" },
  { id: "contact", title: "Contact Information", short: "Contact" },
  { id: "education", title: "Educational Qualifications", short: "Education" },
  { id: "professional", title: "Professional Qualifications & Memberships", short: "Prof. Quals", optional: true },
  { id: "research", title: "Research & Publications", short: "Research", optional: true },
  { id: "languages", title: "Language Proficiency", short: "Languages", optional: true },
  { id: "experience", title: "Professional Experience", short: "Experience", optional: true },
  { id: "activities", title: "Extra-Curricular Activities & Other Particulars", short: "Activities", optional: true },
  { id: "referees", title: "Referees", short: "Referees" },
  { id: "documents", title: "Supporting Documents", short: "Documents" },
  { id: "declaration", title: "Declaration & Undertaking", short: "Declaration" },
  { id: "preview", title: "Review & Submit", short: "Submit" },
];

export const TOTAL_STEPS = STEPS.length;
export const stepNumber = (id: StepId) => STEPS.findIndex((s) => s.id === id) + 1;
export const stepTitle = (id: StepId) => `${stepNumber(id)}. ${STEPS[stepNumber(id) - 1].title}`;

// ─── validation ──────────────────────────────────────────────────────────────

const NIC_RE = /^(\d{9}[VvXx]|\d{12})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{9,16}$/;
const YEAR_RE = /^(19|20)\d{2}$/;

const blank = (v: unknown) => v === null || v === undefined || String(v).trim() === "";

export type StepErrors = string[];

export const validateStep = (id: StepId, raw: ApplicationData): StepErrors => {
  const data = pruneBlankEntries(raw);
  const e: string[] = [];

  switch (id) {
    case "personal": {
      const p = data.personalInfo;
      if (blank(p.title)) e.push("Select your title.");
      if (blank(p.fullName)) e.push("Enter your full name.");
      if (blank(p.nameWithInitials)) e.push("Enter your name with initials.");
      if (blank(p.surname)) e.push("Enter your surname.");
      if (blank(p.dateOfBirth)) e.push("Enter your date of birth.");
      else if (p.age < 18) e.push("Date of birth looks incorrect (age under 18).");
      if (blank(p.gender)) e.push("Select your gender.");
      if (blank(p.civilStatus)) e.push("Select your civil status.");
      if (blank(p.nationality)) e.push("Select your nationality.");
      if (p.nationality === "Other" && blank(p.nationalityOther)) e.push("Specify your nationality.");
      if (blank(p.citizenshipType)) e.push("Select your citizenship type.");
      if (blank(p.nic)) e.push("Enter your NIC number.");
      else if (!NIC_RE.test(p.nic.trim())) e.push("NIC must be 9 digits + V/X, or 12 digits.");
      break;
    }
    case "contact": {
      const c = data.contactInfo;
      if (blank(c.permanentAddress)) e.push("Enter your permanent address.");
      if (blank(c.permanentCity)) e.push("Enter the city of your permanent address.");
      if (blank(c.permanentDistrict)) e.push("Select the district of your permanent address.");
      if (!c.sameAsPermanent) {
        if (blank(c.address)) e.push("Enter your postal address.");
        if (blank(c.city)) e.push("Enter the city of your postal address.");
        if (blank(c.district)) e.push("Select the district of your postal address.");
      }
      if (blank(c.phoneMobile)) e.push("Enter your mobile number.");
      else if (!PHONE_RE.test(c.phoneMobile.trim())) e.push("Mobile number looks invalid.");
      if (blank(c.email)) e.push("Enter your email address.");
      else if (!EMAIL_RE.test(c.email.trim())) e.push("Email address looks invalid.");
      break;
    }
    case "education": {
      if (data.universityEducation.length === 0)
        e.push("Add at least one degree / diploma under University Education.");
      data.universityEducation.forEach((u, i) => {
        if (blank(u.degreeName)) e.push(`University #${i + 1}: enter the degree / diploma name.`);
        if (blank(u.university)) e.push(`University #${i + 1}: enter the university.`);
        if (!blank(u.fromYear) && !YEAR_RE.test(u.fromYear)) e.push(`University #${i + 1}: "From" year must be YYYY.`);
        if (!blank(u.toYear) && !YEAR_RE.test(u.toYear)) e.push(`University #${i + 1}: "To" year must be YYYY.`);
      });
      // Postgraduate qualifications are OPTIONAL. Untouched cards are pruned
      // above; only a partly-filled card needs its name + university.
      data.postgraduateQualifications.forEach((pg, i) => {
        if (blank(pg.qualificationName)) e.push(`Postgraduate #${i + 1}: enter the qualification name (or remove the card).`);
        if (blank(pg.university)) e.push(`Postgraduate #${i + 1}: enter the university (or remove the card).`);
      });
      data.academicDistinctions.forEach((d, i) => {
        if (blank(d.awardName)) e.push(`Distinction #${i + 1}: enter the award name (or remove the card).`);
      });
      break;
    }
    case "professional":
      data.professionalQualifications.forEach((q, i) => {
        if (blank(q.qualificationFullName) && blank(q.qualificationName))
          e.push(`Qualification #${i + 1}: enter the qualification name (or remove the card).`);
        if (blank(q.institution)) e.push(`Qualification #${i + 1}: enter the awarding body.`);
      });
      data.professionalMemberships.forEach((m, i) => {
        if (blank(m.organization)) e.push(`Membership #${i + 1}: enter the organisation (or remove the card).`);
      });
      break;
    case "research":
      data.researchPublications.books.forEach((b, i) => {
        if (blank(b.bookName)) e.push(`Book #${i + 1}: enter the title (or remove the card).`);
      });
      data.researchPublications.journals.forEach((j, i) => {
        if (blank(j.articleTitle)) e.push(`Journal article #${i + 1}: enter the title (or remove the card).`);
      });
      data.researchPublications.conferences.forEach((c, i) => {
        if (blank(c.abstractTitle)) e.push(`Conference abstract #${i + 1}: enter the title (or remove the card).`);
      });
      break;
    case "languages":
      data.languageProficiency.forEach((l, i) => {
        if (blank(l.language)) e.push(`Language #${i + 1}: select the language (or remove the card).`);
      });
      break;
    case "experience":
      data.professionalExperience.forEach((x, i) => {
        const label = x.currentPosition ? "Present occupation" : `Employment #${i + 1}`;
        if (blank(x.designation)) e.push(`${label}: enter the designation.`);
        if (blank(x.institution)) e.push(`${label}: enter the institution.`);
        if (blank(x.fromDate)) e.push(`${label}: enter the start date.`);
        if (!x.currentPosition && blank(x.toDate)) e.push(`${label}: enter the end date.`);
        if (!blank(x.toDate) && !blank(x.fromDate) && x.toDate < x.fromDate)
          e.push(`${label}: end date is before start date.`);
      });
      break;
    case "activities":
      data.extraCurricular.forEach((a, i) => {
        if (blank(a.activityName)) e.push(`Activity #${i + 1}: enter the activity name (or remove the card).`);
      });
      break;
    case "referees": {
      if (data.referees.length < 2) e.push("Provide at least two non-related referees.");
      const emails = new Set<string>();
      data.referees.forEach((r, i) => {
        const n = `Referee ${i + 1}`;
        if (blank(r.name)) e.push(`${n}: enter the full name.`);
        if (blank(r.designation)) e.push(`${n}: enter the designation.`);
        if (blank(r.institution)) e.push(`${n}: enter the institution.`);
        if (blank(r.phone)) e.push(`${n}: enter the telephone number.`);
        if (blank(r.email)) e.push(`${n}: enter the email address.`);
        else if (!EMAIL_RE.test(r.email.trim())) e.push(`${n}: email address looks invalid.`);
        else {
          const key = r.email.trim().toLowerCase();
          if (emails.has(key)) e.push(`${n}: each referee must have a different email.`);
          if (key === data.contactInfo.email.trim().toLowerCase())
            e.push(`${n}: a referee cannot use your own email address.`);
          emails.add(key);
        }
      });
      break;
    }
    case "documents":
      buildDocumentChecklist(data)
        .filter((d) => d.required && !data.documents[d.key])
        .forEach((d) => e.push(`Upload: ${d.label}.`));
      break;
    case "declaration": {
      const d = data.declaration;
      if (!d.agreed) e.push("Tick the box to agree to the declaration.");
      if (blank(d.signature)) e.push("Type your full name as your signature.");
      if (blank(d.date)) e.push("Enter the declaration date.");
      const hasCurrentJob = data.professionalExperience.some((x) => x.currentPosition);
      if (hasCurrentJob && !d.willingnessToResign)
        e.push("Confirm your willingness to resign from your present post if not released.");
      const ed = d.employmentDeclarations;
      if (ed.hasPunishments && blank(ed.punishmentsDetails)) e.push("Give details of the punishments / disciplinary actions.");
      if (ed.hasVacationNotice && blank(ed.vacationNoticeInstitution)) e.push("Give the institution that served the vacation-of-post notice.");
      if (ed.isBondViolator && blank(ed.bondViolationDetails.institution)) e.push("Give the institution for the bond violation.");
      break;
    }
    case "preview":
      break;
  }
  return e;
};

/** Errors for every step, keyed by 1-based step number (only steps with errors). */
export const validateAll = (data: ApplicationData): Record<number, StepErrors> => {
  const out: Record<number, StepErrors> = {};
  STEPS.forEach((s, i) => {
    const errs = validateStep(s.id, data);
    if (errs.length) out[i + 1] = errs;
  });
  return out;
};
