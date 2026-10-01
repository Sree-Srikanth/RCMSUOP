// src/app/(other)/apply/normalize.ts
// Defaults + defensive normalisation of whatever the backend returns.
// The "Declaration Agreed: No" bug came from booleans arriving as "1"/"0"/"true"
// strings; every boolean is coerced here so the UI, preview and PDF agree.

import type {
  ApplicationData,
  ContactInfo,
  Declaration,
  EmploymentDeclarations,
  PersonalInfo,
  UploadedDocument,
} from "./types";

export const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true" || v === "yes" || v === "on";

const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

export const todayISO = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(age, 0);
};

const emptyPersonal = (): PersonalInfo => ({
  title: "",
  fullName: "",
  nameWithInitials: "",
  surname: "",
  previousName: "",
  dateOfBirth: "",
  age: 0,
  gender: "",
  civilStatus: "",
  nationality: "",
  nationalityOther: "",
  citizenshipType: "",
  citizenshipRegNo: "",
  citizenshipRegDate: "",
  nic: "",
  passportNo: "",
});

const emptyContact = (): ContactInfo => ({
  permanentAddress: "",
  permanentCity: "",
  permanentDistrict: "",
  permanentProvince: "",
  permanentPostalCode: "",
  sameAsPermanent: false,
  address: "",
  city: "",
  district: "",
  province: "",
  postalCode: "",
  phoneMobile: "",
  phoneHome: "",
  phoneOffice: "",
  email: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
});

const emptyEmploymentDeclarations = (): EmploymentDeclarations => ({
  hasCommendations: false,
  commendationsDetails: "",
  hasPunishments: false,
  punishmentsDetails: "",
  hasVacationNotice: false,
  vacationNoticeDetails: "",
  vacationNoticeInstitution: "",
  vacationNoticeDate: "",
  isBondViolator: false,
  bondViolationDetails: { bondValue: "", institution: "", violationDate: "", remarks: "" },
});

const emptyDeclaration = (): Declaration => ({
  agreed: false,
  willingnessToResign: false,
  date: "",
  signature: "",
  employmentDeclarations: emptyEmploymentDeclarations(),
});

export const emptyApplication = (vacancyId: number): ApplicationData => ({
  application_id: null,
  reference_no: "",
  vacancy_id: vacancyId,
  selectedJob: "",
  status: "draft",
  is_final_submitted: false,
  current_step: 1,
  personalInfo: emptyPersonal(),
  contactInfo: emptyContact(),
  universityEducation: [],
  postgraduateQualifications: [],
  boardCertifications: [],
  academicDistinctions: [],
  professionalQualifications: [],
  professionalMemberships: [],
  researchPublications: { books: [], journals: [], conferences: [] },
  languageProficiency: [],
  professionalExperience: [],
  extraCurricular: [],
  additionalInfo: "",
  referees: [],
  documents: {},
  otherDocuments: [],
  declaration: emptyDeclaration(),
});

type AnyRecord = Record<string, any>;

const arr = <T>(v: unknown, map: (item: AnyRecord) => T): T[] =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x) => map(x)) : [];

const withId = (item: AnyRecord) => ({ ...item, id: str(item.id) || newId() });

/**
 * Turn a server/legacy payload into a fully-populated ApplicationData.
 * Handles: snake_case keys, string booleans, missing sections, and the old
 * per-item `certificatePath`/`pdfPath` fields (migrated into `documents`).
 */
export const normalizeApplication = (raw: AnyRecord, vacancyId: number): ApplicationData => {
  const base = emptyApplication(vacancyId);
  if (!raw || typeof raw !== "object") return base;

  const documents: Record<string, UploadedDocument> = {
    ...(raw.documents && typeof raw.documents === "object" && !Array.isArray(raw.documents)
      ? raw.documents
      : {}),
  };
  const legacyDoc = (key: string, path: unknown) => {
    const p = str(path);
    if (p && !documents[key]) {
      documents[key] = { path: p, name: p.split("/").pop() || key, uploadedAt: "" };
    }
  };

  const pi: AnyRecord = raw.personalInfo || {};
  legacyDoc("profile_photo", pi.profilePicture_path);
  legacyDoc("birth_certificate", pi.birth_certificate_path);
  legacyDoc("nic_copy", pi.nic_copy_path);
  legacyDoc("passport_copy", pi.passport_copy_path);

  const personalInfo: PersonalInfo = {
    ...base.personalInfo,
    ...Object.fromEntries(Object.keys(base.personalInfo).map((k) => [k, str(pi[k])])),
    age: Number(pi.age) || calculateAge(str(pi.dateOfBirth)),
  } as PersonalInfo;

  const ci: AnyRecord = raw.contactInfo || {};
  const contactInfo: ContactInfo = {
    ...(Object.fromEntries(Object.keys(base.contactInfo).map((k) => [k, str(ci[k])])) as any),
    sameAsPermanent: toBool(ci.sameAsPermanent),
  };

  const universityEducation = arr(raw.universityEducation ?? raw.university_education, (e) => {
    const item = withId(e);
    legacyDoc(`university:${item.id}`, e.certificatePath);
    return {
      id: item.id,
      degreeName: str(e.degreeName),
      university: str(e.university),
      fromYear: str(e.fromYear),
      toYear: str(e.toYear),
      courseFollowed: str(e.courseFollowed),
      finalExamDate: str(e.finalExamDate),
      results: str(e.results),
      classGrade: str(e.classGrade),
      gpa: str(e.gpa),
    };
  });

  const postgraduateQualifications = arr(
    raw.postgraduateQualifications ?? raw.postgraduate_qualifications,
    (e) => {
      const item = withId(e);
      legacyDoc(`postgraduate:${item.id}`, e.certificatePath);
      const type = str(e.type);
      return {
        id: item.id,
        qualificationName: str(e.qualificationName),
        university: str(e.university),
        type: (["coursework", "research", "coursework_research"].includes(type)
          ? type
          : "coursework") as any,
        duration: str(e.duration),
        effectiveDate: str(e.effectiveDate),
        slqfLevel: str(e.slqfLevel),
      };
    },
  );

  const boardCertifications = arr(raw.boardCertifications ?? raw.board_certifications, (e) => {
    const item = withId(e);
    legacyDoc(`board:${item.id}`, e.certificatePath);
    return {
      id: item.id,
      isCertified: e.isCertified === undefined ? true : toBool(e.isCertified),
      boardName: str(e.boardName),
      certificationDate: str(e.certificationDate),
    };
  });

  const academicDistinctions = arr(raw.academicDistinctions ?? raw.academic_distinctions, (e) => {
    const item = withId(e);
    legacyDoc(`distinction:${item.id}`, e.certificatePath);
    return {
      id: item.id,
      awardName: str(e.awardName),
      institution: str(e.institution),
      yearReceived: str(e.yearReceived),
    };
  });

  const professionalQualifications = arr(raw.professionalQualifications, (e) => {
    const item = withId(e);
    legacyDoc(`professional:${item.id}`, e.certificatePath);
    return {
      id: item.id,
      qualificationName: str(e.qualificationName),
      qualificationFullName: str(e.qualificationFullName),
      institution: str(e.institution),
      year: str(e.year),
      licenseNumber: str(e.licenseNumber),
      expiryDate: str(e.expiryDate),
      additionalNotes: str(e.additionalNotes),
    };
  });

  const professionalMemberships = arr(raw.professionalMemberships, (e) => ({
    id: withId(e).id,
    organization: str(e.organization),
    membershipLevel: str(e.membershipLevel),
    membershipNumber: str(e.membershipNumber),
    yearJoined: str(e.yearJoined),
    expiryDate: str(e.expiryDate),
  }));

  const rp: AnyRecord = raw.researchPublications || {};
  const researchPublications = {
    books: arr(rp.books, (e) => {
      const item = withId(e);
      legacyDoc(`book:${item.id}`, e.pdfPath);
      return {
        id: item.id,
        bookName: str(e.bookName),
        publicationDate: str(e.publicationDate),
        authors: str(e.authors),
        isbn: str(e.isbn),
      };
    }),
    journals: arr(rp.journals, (e) => {
      const item = withId(e);
      legacyDoc(`journal:${item.id}`, e.pdfPath);
      return {
        id: item.id,
        articleTitle: str(e.articleTitle),
        authors: str(e.authors),
        journalName: str(e.journalName),
        year: str(e.year),
        volume: str(e.volume),
        issue: str(e.issue),
        pages: str(e.pages),
        doi: str(e.doi),
      };
    }),
    conferences: arr(rp.conferences, (e) => {
      const item = withId(e);
      legacyDoc(`conference:${item.id}`, e.pdfPath);
      return {
        id: item.id,
        abstractTitle: str(e.abstractTitle),
        authors: str(e.authors),
        conferenceName: str(e.conferenceName),
        conferenceDate: str(e.conferenceDate),
        location: str(e.location),
      };
    }),
  };

  const languageProficiency = arr(raw.languageProficiency, (e) => {
    const item = withId(e);
    legacyDoc(`language:${item.id}`, e.certificatePath);
    return {
      id: item.id,
      language: str(e.language),
      readingLevel: str(e.readingLevel),
      writingLevel: str(e.writingLevel),
      speakingLevel: str(e.speakingLevel),
      examPassed: str(e.examPassed),
    };
  });

  const professionalExperience = arr(raw.professionalExperience, (e) => {
    const item = withId(e);
    legacyDoc(`experience:${item.id}`, e.experienceLetterPath);
    return {
      id: item.id,
      designation: str(e.designation),
      institution: str(e.institution),
      fromDate: str(e.fromDate),
      toDate: str(e.toDate),
      currentPosition: toBool(e.currentPosition),
      responsibilities: str(e.responsibilities),
      salary: str(e.salary),
      reasonForLeaving: str(e.reasonForLeaving),
    };
  });

  const extraCurricular = arr(raw.extraCurricular, (e) => {
    const item = withId(e);
    legacyDoc(`activity:${item.id}`, e.certificatePath);
    return {
      id: item.id,
      activityName: str(e.activityName),
      level: str(e.level),
      year: str(e.year),
      description: str(e.description),
    };
  });

  const referees = arr(raw.referees, (e) => ({
    id: withId(e).id,
    name: str(e.name),
    designation: str(e.designation),
    institution: str(e.institution),
    address: str(e.address),
    phone: str(e.phone),
    email: str(e.email),
  }));

  const otherDocuments = arr(raw.otherDocuments ?? raw.additionalDocs, (e) => ({
    path: str(e.path),
    name: str(e.name) || str(e.path).split("/").pop() || "Document",
    uploadedAt: str(e.uploadedAt),
  })).filter((d) => d.path);

  const d: AnyRecord = raw.declaration || {};
  const ed: AnyRecord = d.employmentDeclarations || {};
  const bond: AnyRecord = ed.bondViolationDetails || {};
  const declaration: Declaration = {
    agreed: toBool(d.agreed),
    willingnessToResign: toBool(d.willingnessToResign),
    date: str(d.date),
    signature: str(d.signature),
    employmentDeclarations: {
      hasCommendations: toBool(ed.hasCommendations),
      commendationsDetails: str(ed.commendationsDetails),
      hasPunishments: toBool(ed.hasPunishments),
      punishmentsDetails: str(ed.punishmentsDetails),
      hasVacationNotice: toBool(ed.hasVacationNotice),
      vacationNoticeDetails: str(ed.vacationNoticeDetails),
      vacationNoticeInstitution: str(ed.vacationNoticeInstitution),
      vacationNoticeDate: str(ed.vacationNoticeDate),
      isBondViolator: toBool(ed.isBondViolator),
      bondViolationDetails: {
        bondValue: str(bond.bondValue),
        institution: str(bond.institution),
        violationDate: str(bond.violationDate),
        remarks: str(bond.remarks),
      },
    },
  };

  const submitted = toBool(raw.is_final_submitted) || raw.status === "submitted";

  return {
    ...base,
    application_id: Number(raw.application_id) || null,
    reference_no: str(raw.reference_no),
    vacancy_id: Number(raw.vacancy_id) || vacancyId,
    vacancy_reference_no: str(raw.vacancy_reference_no) || undefined,
    vacancy_title: str(raw.vacancy_title) || undefined,
    faculty: str(raw.faculty) || undefined,
    department: str(raw.department) || undefined,
    discipline: str(raw.discipline) || undefined,
    closing_date: str(raw.closing_date) || undefined,
    selectedJob: str(raw.selectedJob ?? raw.selected_job),
    status: submitted ? "submitted" : "draft",
    is_final_submitted: submitted,
    submitted_at: str(raw.submitted_at) || undefined,
    updated_at: str(raw.updated_at) || undefined,
    current_step: Number(raw.current_step) || 1,
    personalInfo,
    contactInfo,
    universityEducation,
    postgraduateQualifications,
    boardCertifications,
    academicDistinctions,
    professionalQualifications,
    professionalMemberships,
    researchPublications,
    languageProficiency,
    professionalExperience,
    extraCurricular,
    additionalInfo: str(raw.additionalInfo),
    referees,
    documents,
    otherDocuments,
    declaration,
  };
};

/** True when every user-editable field of a repeatable entry is still empty. */
export const isBlankEntry = (item: object, ignore: string[] = []): boolean =>
  Object.entries(item).every(
    ([k, v]) =>
      k === "id" ||
      ignore.includes(k) ||
      typeof v === "boolean" ||
      v === null ||
      v === undefined ||
      String(v).trim() === "",
  );

/**
 * Remove entries the applicant added but never filled in (e.g. an empty
 * postgraduate card). Used for validation, preview, PDF and final submit so
 * optional sections never block the applicant.
 */
export const pruneBlankEntries = (data: ApplicationData): ApplicationData => ({
  ...data,
  universityEducation: data.universityEducation.filter((e) => !isBlankEntry(e)),
  postgraduateQualifications: data.postgraduateQualifications.filter(
    (e) => !isBlankEntry(e, ["type"]),
  ),
  boardCertifications: data.boardCertifications.filter((e) => !isBlankEntry(e)),
  academicDistinctions: data.academicDistinctions.filter((e) => !isBlankEntry(e)),
  professionalQualifications: data.professionalQualifications.filter((e) => !isBlankEntry(e)),
  professionalMemberships: data.professionalMemberships.filter((e) => !isBlankEntry(e)),
  researchPublications: {
    books: data.researchPublications.books.filter((e) => !isBlankEntry(e)),
    journals: data.researchPublications.journals.filter((e) => !isBlankEntry(e)),
    conferences: data.researchPublications.conferences.filter((e) => !isBlankEntry(e)),
  },
  languageProficiency: data.languageProficiency.filter((e) => !isBlankEntry(e)),
  professionalExperience: data.professionalExperience.filter((e) => !isBlankEntry(e)),
  extraCurricular: data.extraCurricular.filter((e) => !isBlankEntry(e)),
  referees: data.referees.filter((e) => !isBlankEntry(e)),
});
