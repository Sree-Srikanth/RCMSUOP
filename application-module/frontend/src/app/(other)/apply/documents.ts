// src/app/(other)/apply/documents.ts
// Every upload happens in the single "Documents" step. The checklist is built
// from what the applicant entered in earlier steps, so each degree/job/etc.
// gets its own slot. Academic transcripts are intentionally NOT requested.

import type { ApplicationData } from "./types";

export type DocGroup =
  | "Personal"
  | "Education"
  | "Professional"
  | "Experience"
  | "Research"
  | "Other";

export interface DocRequirement {
  key: string;
  group: DocGroup;
  label: string;
  hint?: string;
  required: boolean;
  /** Accept attribute for the file input. */
  accept: string;
  maxMB: number;
}

const CERT = ".pdf,.jpg,.jpeg,.png";
const PDF = ".pdf";
const PHOTO = ".jpg,.jpeg,.png";

const orUntitled = (v: string, fallback: string) => (v && v.trim() ? v.trim() : fallback);

export const buildDocumentChecklist = (data: ApplicationData): DocRequirement[] => {
  const list: DocRequirement[] = [
    {
      key: "profile_photo",
      group: "Personal",
      label: "Passport-size photograph",
      hint: "Recent, front-facing, plain light background",
      required: true,
      accept: PHOTO,
      maxMB: 2,
    },
    {
      key: "nic_copy",
      group: "Personal",
      label: "National Identity Card (both sides)",
      required: true,
      accept: CERT,
      maxMB: 5,
    },
    {
      key: "birth_certificate",
      group: "Personal",
      label: "Birth certificate",
      required: true,
      accept: CERT,
      maxMB: 5,
    },
  ];

  if (data.personalInfo.passportNo.trim()) {
    list.push({
      key: "passport_copy",
      group: "Personal",
      label: "Passport (bio-data page)",
      required: false,
      accept: CERT,
      maxMB: 5,
    });
  }
  if (data.personalInfo.citizenshipType === "By Registration") {
    list.push({
      key: "citizenship_certificate",
      group: "Personal",
      label: "Citizenship registration certificate",
      required: true,
      accept: CERT,
      maxMB: 5,
    });
  }

  data.universityEducation.forEach((e, i) =>
    list.push({
      key: `university:${e.id}`,
      group: "Education",
      label: `Degree / diploma certificate — ${orUntitled(e.degreeName, `Degree ${i + 1}`)}`,
      hint: e.university || undefined,
      required: true,
      accept: CERT,
      maxMB: 5,
    }),
  );
  data.postgraduateQualifications.forEach((e, i) =>
    list.push({
      key: `postgraduate:${e.id}`,
      group: "Education",
      label: `Postgraduate certificate — ${orUntitled(e.qualificationName, `Qualification ${i + 1}`)}`,
      hint: e.university || undefined,
      required: true,
      accept: CERT,
      maxMB: 5,
    }),
  );
  data.boardCertifications
    .filter((b) => b.isCertified)
    .forEach((e, i) =>
      list.push({
        key: `board:${e.id}`,
        group: "Education",
        label: `Board certification — ${orUntitled(e.boardName, `Board ${i + 1}`)}`,
        required: true,
        accept: CERT,
        maxMB: 5,
      }),
    );
  data.academicDistinctions.forEach((e, i) =>
    list.push({
      key: `distinction:${e.id}`,
      group: "Education",
      label: `Award / distinction — ${orUntitled(e.awardName, `Award ${i + 1}`)}`,
      required: false,
      accept: CERT,
      maxMB: 5,
    }),
  );

  data.professionalQualifications.forEach((e, i) =>
    list.push({
      key: `professional:${e.id}`,
      group: "Professional",
      label: `Professional qualification — ${orUntitled(
        e.qualificationFullName || e.qualificationName,
        `Qualification ${i + 1}`,
      )}`,
      hint: e.institution || undefined,
      required: true,
      accept: CERT,
      maxMB: 5,
    }),
  );
  data.languageProficiency.forEach((e, i) =>
    list.push({
      key: `language:${e.id}`,
      group: "Professional",
      label: `Language certificate — ${orUntitled(e.language, `Language ${i + 1}`)}`,
      required: false,
      accept: CERT,
      maxMB: 5,
    }),
  );

  data.professionalExperience.forEach((e, i) =>
    list.push({
      key: `experience:${e.id}`,
      group: "Experience",
      label: e.currentPosition
        ? `Appointment letter (present post) — ${orUntitled(e.designation, "Present occupation")}`
        : `Service / experience certificate — ${orUntitled(e.designation, `Employment ${i + 1}`)}`,
      hint: e.institution || undefined,
      required: e.currentPosition,
      accept: CERT,
      maxMB: 5,
    }),
  );
  data.extraCurricular.forEach((e, i) =>
    list.push({
      key: `activity:${e.id}`,
      group: "Experience",
      label: `Extra-curricular certificate — ${orUntitled(e.activityName, `Activity ${i + 1}`)}`,
      required: false,
      accept: CERT,
      maxMB: 5,
    }),
  );

  data.researchPublications.books.forEach((e, i) =>
    list.push({
      key: `book:${e.id}`,
      group: "Research",
      label: `Book — ${orUntitled(e.bookName, `Book ${i + 1}`)}`,
      required: false,
      accept: PDF,
      maxMB: 10,
    }),
  );
  data.researchPublications.journals.forEach((e, i) =>
    list.push({
      key: `journal:${e.id}`,
      group: "Research",
      label: `Journal article — ${orUntitled(e.articleTitle, `Article ${i + 1}`)}`,
      required: false,
      accept: PDF,
      maxMB: 10,
    }),
  );
  data.researchPublications.conferences.forEach((e, i) =>
    list.push({
      key: `conference:${e.id}`,
      group: "Research",
      label: `Conference abstract — ${orUntitled(e.abstractTitle, `Abstract ${i + 1}`)}`,
      required: false,
      accept: PDF,
      maxMB: 10,
    }),
  );

  return list;
};

/** Drop uploads whose owning entry was deleted (e.g. a removed degree). */
export const pruneOrphanDocuments = (data: ApplicationData): ApplicationData => {
  const valid = new Set(buildDocumentChecklist(data).map((d) => d.key));
  const documents = Object.fromEntries(
    Object.entries(data.documents).filter(([k]) => valid.has(k)),
  );
  return { ...data, documents };
};
