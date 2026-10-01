import { badRequest, forbidden, notFound, ageOn, isEmail, str, date, oneOf, bool01, toInt, now } from './util.js';

// ------------------------------------------------------------------ constants
export const RESULT_CLASSES = ['FIRST_CLASS', 'SECOND_UPPER', 'SECOND_LOWER', 'PASS'];
export const PG_TYPES = ['COURSEWORK', 'RESEARCH', 'READING_OTHER'];
export const SLQF_LEVELS = ['LEVEL_9', 'LEVEL_10', 'OTHER'];
export const AWARD_TYPES = ['SCHOLARSHIP', 'MEDAL', 'PRIZE', 'DISTINCTION', 'OTHER'];
export const CIVIL_STATUSES = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
export const TITLES = ['Rev', 'Dr', 'Prof', 'Mr', 'Mrs', 'Miss', 'Ms'];

export const LABELS = {
  FIRST_CLASS: 'First Class',
  SECOND_UPPER: 'Second Class (Upper Division)',
  SECOND_LOWER: 'Second Class (Lower Division)',
  PASS: 'Pass',
  COURSEWORK: 'Coursework',
  RESEARCH: 'Research',
  READING_OTHER: 'Reading / Other',
  LEVEL_9: 'SLQF Level 9',
  LEVEL_10: 'SLQF Level 10',
  OTHER: 'Other',
  SCHOLARSHIP: 'Scholarship',
  MEDAL: 'Medal',
  PRIZE: 'Prize',
  DISTINCTION: 'Distinction',
  DESCENT: 'By descent',
  REGISTRATION: 'By registration',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  PENDING: 'Pending',
  CATEGORY_I: 'Category I',
  CATEGORY_II: 'Category II',
  CATEGORY_III: 'Category III',
};
export const label = (code) => (code ? LABELS[code] || code : '');

/**
 * Supporting-document categories (Requirements §10). `when` names the form
 * section whose entries make an otherwise optional category mandatory.
 */
export const DOC_CATEGORIES = [
  { code: 'BIRTH_CERT', label: 'Birth Certificate', required: true, types: ['pdf', 'jpg', 'png'] },
  { code: 'NIC_PASSPORT', label: 'NIC / Passport', required: true, types: ['pdf', 'jpg', 'png'] },
  { code: 'DEGREE', label: 'Degree / Diploma Certificates', required: true, types: ['pdf'] },
  { code: 'POSTGRAD', label: 'Postgraduate Qualifications', when: 'postgraduate', types: ['pdf'] },
  { code: 'DISTINCTIONS', label: 'Academic Distinctions / Scholarships / Medals / Prizes', when: 'distinctions', types: ['pdf'] },
  { code: 'PUBLICATIONS', label: 'Research Publications', when: 'publications', types: ['pdf'] },
  { code: 'EMPLOYMENT', label: 'Employment Details', when: 'employment', types: ['pdf'] },
  { code: 'EXTRA_CURRICULAR', label: 'Extra-Curricular Activities', when: 'extra_curricular', types: ['pdf'] },
  { code: 'PHOTO', label: 'Passport-size Photograph', required: true, types: ['jpg', 'png'] },
  {
    code: 'IMAGE',
    label: 'Image (scanned signature)',
    required: true,
    types: ['jpg', 'png'],
    hint: 'Scanned image of your signature, used with the declaration.',
  },
];

// ------------------------------------------------------- repeatable sections
const T = (max = 300) => ({ type: 'text', max });
const D = { type: 'date' };
const Y = { type: 'year' };
const E = (values) => ({ type: 'enum', values });

export const SECTIONS = {
  education: {
    table: 'application_education',
    label: 'University Education',
    cols: {
      qualification: { ...T(), required: true, label: 'Degree / Diploma' },
      university: { ...T(), required: true, label: 'University' },
      period_from: { ...D, required: true, label: 'From' },
      period_to: { ...D, required: true, label: 'To' },
      course_followed: { ...T(), required: true, label: 'Course followed' },
      final_exam_date: { ...D, required: true, label: 'Date of final examination' },
      result_class: { ...E(RESULT_CLASSES), required: true, label: 'Class / Grade' },
      gpa: { ...T(20), label: 'GPA' },
    },
  },
  postgraduate: {
    table: 'postgraduate_qualifications',
    label: 'Postgraduate Qualifications',
    cols: {
      qualification: { ...T(), required: true, label: 'Qualification' },
      institution: { ...T(), required: true, label: 'Institution' },
      pg_type: { ...E(PG_TYPES), required: true, label: 'Type' },
      slqf_level: { ...E(SLQF_LEVELS), required: true, label: 'SLQF level' },
      duration: { ...T(60), required: true, label: 'Duration' },
      effective_date: { ...D, required: true, label: 'Effective / completion date' },
    },
  },
  distinctions: {
    table: 'academic_distinctions',
    label: 'Academic Distinctions',
    cols: {
      award_type: { ...E(AWARD_TYPES), required: true, label: 'Type' },
      award: { ...T(), required: true, label: 'Distinction / award' },
      institution: { ...T(), required: true, label: 'Institution' },
      year: { ...Y, label: 'Year' },
    },
  },
  books: {
    table: 'publications_books',
    label: 'Books',
    cols: {
      title: { ...T(500), required: true, label: 'Name of book' },
      publication_date: { ...D, required: true, label: 'Date of publication' },
      authors: { ...T(500), required: true, label: 'Author(s)' },
      isbn: { ...T(30), required: true, label: 'ISBN No.' },
    },
  },
  abstracts: {
    table: 'publications_abstracts',
    label: 'Abstracts',
    cols: {
      title: { ...T(500), required: true, label: 'Title of article' },
      authors: { ...T(500), required: true, label: 'Author(s)' },
      source: { ...T(500), required: true, label: 'Source' },
      publication_date: { ...D, required: true, label: 'Date of publication' },
    },
  },
  journals: {
    table: 'publications_journals',
    label: 'Journals',
    cols: {
      title: { ...T(500), required: true, label: 'Title of article' },
      authors: { ...T(500), required: true, label: 'Author(s)' },
      source_doi: { ...T(500), required: true, label: 'Source / DOI' },
      year: { ...Y, required: true, label: 'Year of publication' },
    },
  },
  current_employment: {
    table: 'current_employment',
    label: 'Current Employment',
    single: true,
    cols: {
      designation: { ...T(), required: true, label: 'Designation' },
      institution: { ...T(), required: true, label: 'Department / Institution' },
      date_from: { ...D, required: true, label: 'From' },
      salary: { ...T(60), label: 'Salary drawn' },
    },
  },
  previous_employment: {
    table: 'previous_employment',
    label: 'Previous Employment',
    cols: {
      designation: { ...T(), required: true, label: 'Designation' },
      institution: { ...T(), required: true, label: 'Department / Institution' },
      date_from: { ...D, required: true, label: 'From' },
      date_to: { ...D, required: true, label: 'To' },
      reason_for_leaving: { ...T(500), label: 'Reasons for leaving' },
    },
  },
  referees: {
    table: 'referees',
    label: 'Referees',
    fixed: 2,
    cols: {
      name: { ...T(), required: true, label: 'Name' },
      designation: { ...T(), label: 'Designation' },
      address: { ...T(500), required: true, label: 'Address' },
      telephone: { ...T(40), required: true, label: 'Telephone' },
      email: { ...T(200), required: true, label: 'Email', email: true },
    },
  },
};

/** Single-value fields stored on the applications row (draft-editable). */
export const APP_FIELDS = {
  title: E(TITLES),
  surname: T(120),
  name_in_full: T(300),
  former_name: T(300),
  name_with_initials: T(200),
  date_of_birth: D,
  civil_status: E(CIVIL_STATUSES),
  citizenship_type: E(['DESCENT', 'REGISTRATION']),
  citizenship_cert_no: T(60),
  citizenship_cert_date: D,
  nic: T(12),
  passport_no: T(20),
  email: T(200),
  mobile: T(20),
  phone_residence: T(20),
  phone_office: T(20),
  cur_address_line1: T(),
  cur_address_line2: T(),
  cur_city: T(100),
  cur_province_id: { type: 'int' },
  cur_district_id: { type: 'int' },
  cur_postal_code: T(10),
  perm_same_as_current: { type: 'bool' },
  perm_address_line1: T(),
  perm_address_line2: T(),
  perm_city: T(100),
  perm_province_id: { type: 'int' },
  perm_district_id: { type: 'int' },
  perm_postal_code: T(10),
  board_certified: { type: 'bool' },
  board_certification_date: D,
  lang_sinhala: T(200),
  lang_tamil: T(200),
  lang_english: T(200),
  commendations_punishments: T(3000),
  vacation_of_post: { type: 'bool' },
  vacation_of_post_details: T(3000),
  bond_violator: { type: 'bool' },
  bond_value: T(60),
  bond_institution: T(),
  bond_details: T(3000),
  extra_curricular: T(5000),
  other_particulars: T(5000),
  declaration_accepted: { type: 'bool' },
  declaration_name: T(300),
  willing_to_resign: { type: 'bool' },
};

function parseValue(spec, v, where) {
  try {
    switch (spec.type) {
      case 'text':
        return str(v, spec.max);
      case 'date':
        return date(v);
      case 'year': {
        const s = str(v, 4);
        if (s && !/^(19|20)\d{2}$/.test(s)) throw badRequest(`Invalid year: ${s}`);
        return s;
      }
      case 'enum':
        return oneOf(v, spec.values);
      case 'int':
        return toInt(v);
      case 'bool':
        return bool01(v);
      default:
        return str(v);
    }
  } catch (e) {
    throw badRequest(`${where}: ${e.message}`);
  }
}

export function parseFields(input) {
  const out = {};
  for (const [k, spec] of Object.entries(APP_FIELDS)) {
    if (Object.prototype.hasOwnProperty.call(input, k)) out[k] = parseValue(spec, input[k], k);
  }
  if (out.email !== undefined && out.email !== null && !isEmail(out.email)) throw badRequest('Invalid email address.');
  if (out.nic) {
    out.nic = out.nic.toUpperCase();
    if (!/^(\d{9}[VX]|\d{12})$/.test(out.nic)) throw badRequest('NIC must be 9 digits followed by V/X, or 12 digits.');
  }
  return out;
}

export function parseSectionRows(key, rows) {
  const section = SECTIONS[key];
  if (!Array.isArray(rows)) throw badRequest(`${section.label} must be a list.`);
  if (rows.length > 100) throw badRequest(`Too many rows in ${section.label}.`);
  const out = [];
  rows.forEach((row, i) => {
    const clean = {};
    for (const [col, spec] of Object.entries(section.cols)) clean[col] = parseValue(spec, row?.[col], `${section.label} row ${i + 1}, ${spec.label}`);
    if (key === 'referees') clean.seq = toInt(row?.seq) ?? i + 1;
    const hasData = Object.entries(clean).some(([k, v]) => k !== 'seq' && v !== null);
    if (hasData) out.push(clean);
  });
  if (section.single && out.length > 1) throw badRequest(`${section.label} can only have one entry.`);
  if (key === 'referees') {
    if (out.length > 2) throw badRequest('Exactly two referees are required.');
    out.forEach((r, i) => (r.seq = i + 1));
  }
  return out;
}

export function replaceSectionRows(db, applicationId, key, rows) {
  const section = SECTIONS[key];
  db.prepare(`DELETE FROM ${section.table} WHERE application_id = ?`).run(applicationId);
  const cols = Object.keys(section.cols);
  if (key === 'referees') cols.push('seq');
  else if (!section.single) cols.push('sort_order');
  const stmt = db.prepare(`INSERT INTO ${section.table} (application_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`);
  rows.forEach((r, i) => {
    if (!section.single && key !== 'referees') r.sort_order = i;
    stmt.run(applicationId, ...cols.map((c) => r[c] ?? null));
  });
}

// -------------------------------------------------------------- loading data
const APP_SELECT = `
  SELECT a.*, v.position_id, v.faculty_id, v.department_id, v.discipline, v.advertised_on, v.closing_date,
         v.status AS vacancy_status, v.advert_reference, v.late_exception_until, v.hard_copy_instructions,
         p.code AS position_code, p.title AS position_title,
         f.code AS faculty_code, f.name AS faculty_name,
         d.code AS department_code, d.name AS department_name,
         cp.name AS cur_province, cd.name AS cur_district, pp.name AS perm_province, pd.name AS perm_district,
         cs.decision_code, cs.category_code, cs.remarks AS decision_remarks, cs.decided_at, cs.decided_by
  FROM applications a
  JOIN vacancies v ON v.id = a.vacancy_id
  JOIN positions p ON p.id = v.position_id
  JOIN faculties f ON f.id = v.faculty_id
  JOIN departments d ON d.id = v.department_id
  LEFT JOIN provinces cp ON cp.id = a.cur_province_id
  LEFT JOIN districts cd ON cd.id = a.cur_district_id
  LEFT JOIN provinces pp ON pp.id = a.perm_province_id
  LEFT JOIN districts pd ON pd.id = a.perm_district_id
  LEFT JOIN current_shortlist cs ON cs.application_id = a.id`;

export const appSelect = APP_SELECT;

export function getApplicationRow(db, id) {
  return db.prepare(`${APP_SELECT} WHERE a.id = ?`).get(id);
}

export function loadSections(db, id) {
  const out = {};
  for (const [key, s] of Object.entries(SECTIONS)) {
    const order = key === 'referees' ? 'seq' : s.single ? 'id' : 'sort_order, id';
    out[key] = db.prepare(`SELECT * FROM ${s.table} WHERE application_id = ? ORDER BY ${order}`).all(id);
  }
  return out;
}

export function loadDocuments(db, id) {
  return db
    .prepare(
      `SELECT id, category, original_name, mime_type, size_bytes, uploaded_at
       FROM application_documents WHERE application_id = ? AND deleted_at IS NULL ORDER BY category, id`,
    )
    .all(id);
}

export function loadRefereeStatus(db, id) {
  return db
    .prepare(
      `SELECT r.id AS referee_id, r.seq, r.name, r.email,
              rq.id AS request_id, rq.status, rq.sent_at, rq.expires_at, rq.submitted_at
       FROM referees r
       LEFT JOIN referee_requests rq ON rq.id = (SELECT MAX(id) FROM referee_requests x WHERE x.referee_id = r.id)
       WHERE r.application_id = ? ORDER BY r.seq`,
    )
    .all(id)
    .map((r) => ({ ...r, status: r.status === 'SENT' && r.expires_at < now() ? 'EXPIRED' : r.status || 'NOT_SENT' }));
}

/** Full application (all sections) – used by every complete-application view and the PDF. */
export function getFullApplication(db, id) {
  const app = getApplicationRow(db, id);
  if (!app) return null;
  const sections = loadSections(db, id);
  const documents = loadDocuments(db, id);
  const refereeStatus = loadRefereeStatus(db, id);
  const rrReceived = refereeStatus.filter((r) => r.status === 'SUBMITTED').length;
  return {
    ...app,
    age: ageOn(app.date_of_birth, app.closing_date?.slice(0, 10)),
    sections,
    documents,
    referee_status: refereeStatus,
    rr_received: rrReceived,
    counts: {
      books: sections.books.length,
      abstracts: sections.abstracts.length,
      journals: sections.journals.length,
    },
  };
}

// -------------------------------------------------------- access control
export function registrarScopeSql(user, alias = 'v') {
  if (user.role === 'REGISTRAR' && user.faculty_id) return { sql: ` AND ${alias}.faculty_id = ?`, params: [user.faculty_id] };
  return { sql: '', params: [] };
}

function isSharedWith(db, user, appId) {
  const roleCol = user.role === 'HOD' ? 'department_id' : 'faculty_id';
  const unit = user.role === 'HOD' ? user.department_id : user.faculty_id;
  if (!unit) return false;
  const row = db
    .prepare(
      `SELECT 1 FROM shortlist_share_items si
       JOIN shortlist_shares s ON s.id = si.share_id
       JOIN current_shortlist cs ON cs.application_id = si.application_id
       WHERE si.application_id = ? AND s.recipient_role = ? AND s.${roleCol} = ? AND cs.decision_code = 'SELECTED'
       LIMIT 1`,
    )
    .get(appId, user.role, unit);
  return !!row;
}

/**
 * Object-level authorisation for an application (prevents IDOR):
 * applicants see only their own; Registrar/Admin see submitted applications
 * within scope; HOD/Dean see only applications shared with their unit and
 * still SELECTED.
 */
export function assertCanView(db, user, app) {
  if (!app) throw notFound('Application not found.');
  switch (user.role) {
    case 'APPLICANT':
      if (app.applicant_id === user.id) return;
      break;
    case 'ADMIN':
      if (app.status !== 'DRAFT') return;
      break;
    case 'REGISTRAR':
      if (app.status !== 'DRAFT' && (!user.faculty_id || user.faculty_id === app.faculty_id)) return;
      break;
    case 'HOD':
    case 'DEAN':
      if (app.status !== 'DRAFT' && isSharedWith(db, user, app.id)) return;
      break;
    default:
  }
  // Same response as a missing record so existence is not disclosed.
  throw notFound('Application not found.');
}

export function assertOwnDraft(user, app) {
  if (!app || app.applicant_id !== user.id) throw notFound('Application not found.');
  if (app.status !== 'DRAFT') throw forbidden('This application has been submitted and is now read-only.');
}

// ----------------------------------------------------------- validation
const MED_DENTAL = /\b(MBBS|BDS|M\.?B\.?B\.?S|B\.?D\.?S)\b/i;
export const isMedicalDental = (education) => education.some((e) => MED_DENTAL.test(e.qualification || ''));

function sectionHasEntries(full, when) {
  const s = full.sections;
  switch (when) {
    case 'postgraduate':
      return s.postgraduate.length > 0;
    case 'distinctions':
      return s.distinctions.length > 0;
    case 'publications':
      return s.books.length + s.abstracts.length + s.journals.length > 0;
    case 'employment':
      return s.current_employment.length + s.previous_employment.length > 0;
    case 'extra_curricular':
      return !!full.extra_curricular;
    default:
      return false;
  }
}

export function documentRequirements(full) {
  return DOC_CATEGORIES.map((c) => {
    const applicable = !!c.required || sectionHasEntries(full, c.when);
    const uploaded = full.documents.filter((d) => d.category === c.code);
    return { ...c, applicable, mandatory: applicable, uploaded: uploaded.length > 0, files: uploaded };
  });
}

/**
 * Returns a list of outstanding issues. Empty list = ready to submit.
 * Each issue: { step, field, message }.
 */
export function validateForSubmission(full) {
  const issues = [];
  const add = (step, field, message) => issues.push({ step, field, message });
  const need = (step, field, labelText) => {
    if (full[field] === null || full[field] === undefined || full[field] === '') add(step, field, `${labelText} is required.`);
  };

  // Personal
  need('personal', 'title', 'Title');
  need('personal', 'surname', 'Surname');
  need('personal', 'name_in_full', 'Name in full');
  need('personal', 'name_with_initials', 'Name with initials');
  need('personal', 'date_of_birth', 'Date of birth');
  need('personal', 'civil_status', 'Civil status');
  need('personal', 'citizenship_type', 'Citizenship');
  if (full.citizenship_type === 'REGISTRATION') {
    need('personal', 'citizenship_cert_no', 'Citizenship certificate reference number');
    need('personal', 'citizenship_cert_date', 'Citizenship certificate date');
  }
  if (!full.nic && !full.passport_no) add('personal', 'nic', 'NIC number is required (or a passport number if you do not have an NIC).');
  need('personal', 'email', 'Email');
  need('personal', 'mobile', 'Mobile number');
  if (full.surname && full.name_in_full && !full.name_in_full.toLowerCase().includes(full.surname.toLowerCase())) {
    add('personal', 'surname', 'Surname must appear in the name in full.');
  }

  // Address
  need('address', 'cur_address_line1', 'Current address');
  need('address', 'cur_city', 'City / town');
  need('address', 'cur_province_id', 'Province');
  need('address', 'cur_district_id', 'District');
  if (!full.perm_same_as_current) {
    need('address', 'perm_address_line1', 'Permanent address');
    need('address', 'perm_city', 'Permanent city / town');
    need('address', 'perm_province_id', 'Permanent address province');
    need('address', 'perm_district_id', 'Permanent address district');
  }

  // Repeatable sections – required columns of each entered row
  const stepOf = {
    education: 'education',
    postgraduate: 'postgraduate',
    distinctions: 'distinctions',
    books: 'publications',
    abstracts: 'publications',
    journals: 'publications',
    current_employment: 'employment',
    previous_employment: 'employment',
    referees: 'referees',
  };
  for (const [key, section] of Object.entries(SECTIONS)) {
    full.sections[key].forEach((row, i) => {
      for (const [col, spec] of Object.entries(section.cols)) {
        if (spec.required && (row[col] === null || row[col] === '')) add(stepOf[key], `${key}.${i}.${col}`, `${section.label} #${i + 1}: ${spec.label} is required.`);
        if (spec.email && row[col] && !isEmail(row[col])) add(stepOf[key], `${key}.${i}.${col}`, `${section.label} #${i + 1}: ${spec.label} is not a valid email address.`);
      }
    });
  }
  if (full.sections.education.length === 0) add('education', 'education', 'At least one university education entry is required.');

  // Board certification applies to MBBS/BDS graduates only
  if (full.board_certified === 1) {
    if (!isMedicalDental(full.sections.education)) add('postgraduate', 'board_certified', 'Board certification applies to MBBS/BDS graduates only.');
    need('postgraduate', 'board_certification_date', 'Board certification date');
  }

  // Other institutional information
  if (full.vacation_of_post === null || full.vacation_of_post === undefined) add('other', 'vacation_of_post', 'Please state whether you have been served with a vacation of post notice.');
  if (full.vacation_of_post === 1) need('other', 'vacation_of_post_details', 'Vacation of post details');
  if (full.bond_violator === null || full.bond_violator === undefined) add('other', 'bond_violator', 'Please state whether you have been treated as a bond violator.');
  if (full.bond_violator === 1) {
    need('other', 'bond_value', 'Bond value');
    need('other', 'bond_institution', 'Bond university / institute');
  }

  // Referees – two, non-related, distinct
  const refs = full.sections.referees;
  if (refs.length !== 2) add('referees', 'referees', 'Two non-related referees are compulsory.');
  if (refs.length === 2 && refs[0].email && refs[1].email && refs[0].email.toLowerCase() === refs[1].email.toLowerCase()) {
    add('referees', 'referees.1.email', 'The two referees must have different email addresses.');
  }
  if (full.email && refs.some((r) => r.email && r.email.toLowerCase() === full.email.toLowerCase())) {
    add('referees', 'referees', 'You cannot nominate yourself as a referee.');
  }

  // Documents
  for (const req of documentRequirements(full)) {
    if (req.mandatory && !req.uploaded) {
      add('documents', req.code, req.required ? `${req.label} must be uploaded.` : `${req.label} must be uploaded because you entered information in that section.`);
    }
  }

  // Declaration
  if (full.declaration_accepted !== 1) add('declaration', 'declaration_accepted', 'You must accept the declaration.');
  need('declaration', 'declaration_name', 'Declaration name (signature)');

  return issues;
}

/** Whether the vacancy is accepting applications right now. */
export function vacancyOpen(v, at = now()) {
  if (!['PUBLISHED', 'CLOSED'].includes(v.status)) return false;
  if (v.status === 'PUBLISHED' && at <= v.closing_date) return true;
  // Late submissions only through an explicit administrator exception.
  return !!(v.late_exception_until && at <= v.late_exception_until);
}

export function referenceNumber(app, seq) {
  return `${app.faculty_code}-${app.department_code}-${app.position_code}-${String(seq).padStart(6, '0')}`;
}
