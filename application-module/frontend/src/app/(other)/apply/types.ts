// src/app/(other)/apply/types.ts

export interface PersonalInfo {
  title: string;
  fullName: string;
  nameWithInitials: string;
  surname: string;
  previousName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  civilStatus: string;
  nationality: string;
  nationalityOther?: string;
  citizenshipType: string;
  citizenshipRegNo: string;
  citizenshipRegDate: string;
  nic: string;
  passportNo: string;
}

export interface ContactInfo {
  permanentAddress: string;
  permanentCity: string;
  permanentDistrict: string;
  permanentProvince: string;
  permanentPostalCode: string;

  sameAsPermanent: boolean;

  address: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;

  phoneMobile: string;
  phoneHome: string;
  phoneOffice: string;
  email: string;

  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
}

export interface EmploymentDeclarations {
  hasCommendations: boolean;
  commendationsDetails: string;
  hasPunishments: boolean;
  punishmentsDetails: string;
  hasVacationNotice: boolean;
  vacationNoticeDetails: string;
  vacationNoticeInstitution: string;
  vacationNoticeDate: string;
  isBondViolator: boolean;
  bondViolationDetails: {
    bondValue: string;
    institution: string;
    violationDate?: string;
    remarks?: string;
  };
}

export interface Declaration {
  agreed: boolean;
  willingnessToResign: boolean;
  date: string;
  signature: string;
  employmentDeclarations: EmploymentDeclarations;
}

export interface UniversityEducation {
  id: string;
  degreeName: string;
  university: string;
  fromYear: string;
  toYear: string;
  courseFollowed: string;
  finalExamDate: string;
  results: string;
  classGrade: string;
  gpa: string;
}

export type PostgraduateType = "coursework" | "research" | "coursework_research";

export interface PostgraduateQualification {
  id: string;
  qualificationName: string;
  university: string;
  type: PostgraduateType;
  duration: string;
  effectiveDate: string;
  slqfLevel: string;
}

export interface AcademicDistinction {
  id: string;
  awardName: string;
  institution: string;
  yearReceived: string;
}

export interface BoardCertification {
  id: string;
  isCertified: boolean;
  boardName: string;
  certificationDate: string;
}

export interface Experience {
  id: string;
  designation: string;
  institution: string;
  fromDate: string;
  toDate: string;
  currentPosition: boolean;
  responsibilities: string;
  salary: string;
  reasonForLeaving: string;
}

export interface ProfessionalQual {
  id: string;
  qualificationName: string;
  qualificationFullName: string;
  institution: string;
  year: string;
  licenseNumber: string;
  expiryDate: string;
  additionalNotes: string;
}

export interface ProfessionalMembership {
  id: string;
  organization: string;
  membershipLevel: string;
  membershipNumber: string;
  yearJoined: string;
  expiryDate: string;
}

export interface ResearchBook {
  id: string;
  bookName: string;
  publicationDate: string;
  authors: string;
  isbn: string;
}

export interface ResearchJournal {
  id: string;
  articleTitle: string;
  authors: string;
  journalName: string;
  year: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
}

export interface ResearchConference {
  id: string;
  abstractTitle: string;
  authors: string;
  conferenceName: string;
  conferenceDate: string;
  location: string;
}

export interface ResearchPublications {
  books: ResearchBook[];
  journals: ResearchJournal[];
  conferences: ResearchConference[];
}

export interface LanguageProficiency {
  id: string;
  language: string;
  readingLevel: string;
  writingLevel: string;
  speakingLevel: string;
  examPassed: string;
}

export interface Referee {
  id: string;
  name: string;
  designation: string;
  institution: string;
  address: string;
  phone: string;
  email: string;
}

export interface ExtraCurricular {
  id: string;
  activityName: string;
  level: string;
  year: string;
  description: string;
}

/** One uploaded file. All uploads live in ApplicationData.documents (Documents step). */
export interface UploadedDocument {
  path: string;
  name: string;
  uploadedAt: string;
}

export interface ApplicationData {
  application_id: number | null;
  /** Auto-generated application reference number, e.g. APP/2026/000123 */
  reference_no: string;
  vacancy_id: number;
  vacancy_reference_no?: string;
  vacancy_title?: string;
  faculty?: string;
  department?: string;
  discipline?: string;
  closing_date?: string;
  selectedJob: string;
  status: "draft" | "submitted";
  is_final_submitted: boolean;
  submitted_at?: string;
  updated_at?: string;
  /** Last step the applicant was on, so a draft resumes where they left off. */
  current_step: number;

  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  universityEducation: UniversityEducation[];
  postgraduateQualifications: PostgraduateQualification[];
  boardCertifications: BoardCertification[];
  academicDistinctions: AcademicDistinction[];
  professionalQualifications: ProfessionalQual[];
  professionalMemberships: ProfessionalMembership[];
  researchPublications: ResearchPublications;
  languageProficiency: LanguageProficiency[];
  professionalExperience: Experience[];
  extraCurricular: ExtraCurricular[];
  additionalInfo: string;
  referees: Referee[];
  /** key -> file. Keys come from documents.ts (e.g. "nic_copy", "university:<id>"). */
  documents: Record<string, UploadedDocument>;
  /** Free-form "other supporting documents". */
  otherDocuments: UploadedDocument[];
  declaration: Declaration;
}

/** Sections of ApplicationData that a step edits. */
export type SectionKey = Exclude<
  keyof ApplicationData,
  | "application_id"
  | "reference_no"
  | "vacancy_id"
  | "vacancy_reference_no"
  | "vacancy_title"
  | "faculty"
  | "department"
  | "discipline"
  | "closing_date"
  | "status"
  | "is_final_submitted"
  | "submitted_at"
  | "updated_at"
  | "current_step"
>;

export interface VacancyInfo {
  vacancy_id: number;
  reference_no: string;
  title: string;
  positions: string;
  faculty?: string;
  department?: string;
  discipline?: string;
  closing_date: string | null;
  is_open: boolean;
}
