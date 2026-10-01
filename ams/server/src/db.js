import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { seedMasterData } from './seed.js';

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sequences (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------- master data
CREATE TABLE IF NOT EXISTS faculties (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY,
  faculty_id INTEGER NOT NULL REFERENCES faculties(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (faculty_id, code)
);

CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shortlist_decision_types (
  code TEXT PRIMARY KEY CHECK (code IN ('SELECTED','REJECTED','PENDING')),
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shortlist_categories (
  code TEXT PRIMARY KEY CHECK (code IN ('CATEGORY_I','CATEGORY_II','CATEGORY_III')),
  label TEXT NOT NULL
);

-- Authoritative position-specific shortlist matrix (Requirements §15).
CREATE TABLE IF NOT EXISTS position_shortlist_decisions (
  id INTEGER PRIMARY KEY,
  position_id INTEGER NOT NULL REFERENCES positions(id),
  decision_code TEXT NOT NULL REFERENCES shortlist_decision_types(code),
  category_code TEXT REFERENCES shortlist_categories(code),
  UNIQUE (position_id, decision_code, category_code)
);

CREATE TABLE IF NOT EXISTS provinces (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS districts (
  id INTEGER PRIMARY KEY,
  province_id INTEGER NOT NULL REFERENCES provinces(id),
  name TEXT NOT NULL UNIQUE
);

-- ------------------------------------------------------------ users and auth
CREATE TABLE IF NOT EXISTS roles (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL REFERENCES roles(code),
  full_name TEXT NOT NULL,
  faculty_id INTEGER REFERENCES faculties(id),
  department_id INTEGER REFERENCES departments(id),
  must_change_password INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS applicant_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  surname TEXT,
  name_in_full TEXT,
  name_with_initials TEXT,
  nic TEXT,
  passport_no TEXT,
  date_of_birth TEXT,
  mobile TEXT,
  phone_residence TEXT,
  phone_office TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province_id INTEGER REFERENCES provinces(id),
  district_id INTEGER REFERENCES districts(id),
  postal_code TEXT,
  updated_at TEXT
);

-- -------------------------------------------------------------- vacancies
CREATE TABLE IF NOT EXISTS vacancies (
  id INTEGER PRIMARY KEY,
  position_id INTEGER NOT NULL REFERENCES positions(id),
  faculty_id INTEGER NOT NULL REFERENCES faculties(id),
  department_id INTEGER NOT NULL REFERENCES departments(id),
  discipline TEXT,
  advert_reference TEXT,
  advertised_on TEXT NOT NULL,
  closing_date TEXT NOT NULL,
  requirements TEXT,
  hard_copy_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','CLOSED','ARCHIVED')),
  late_exception_until TEXT,
  late_exception_reason TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vacancy_documents (
  id INTEGER PRIMARY KEY,
  vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TEXT NOT NULL
);

-- ------------------------------------------------------------ applications
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY,
  applicant_id INTEGER NOT NULL REFERENCES users(id),
  vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','CLOSED')),
  reference_no TEXT UNIQUE,
  submitted_at TEXT,
  submitted_ip TEXT,
  -- personal
  title TEXT,
  surname TEXT,
  name_in_full TEXT,
  former_name TEXT,
  name_with_initials TEXT,
  date_of_birth TEXT,
  civil_status TEXT,
  citizenship_type TEXT CHECK (citizenship_type IS NULL OR citizenship_type IN ('DESCENT','REGISTRATION')),
  citizenship_cert_no TEXT,
  citizenship_cert_date TEXT,
  nic TEXT,
  passport_no TEXT,
  email TEXT,
  mobile TEXT,
  phone_residence TEXT,
  phone_office TEXT,
  -- address
  cur_address_line1 TEXT,
  cur_address_line2 TEXT,
  cur_city TEXT,
  cur_province_id INTEGER REFERENCES provinces(id),
  cur_district_id INTEGER REFERENCES districts(id),
  cur_postal_code TEXT,
  perm_same_as_current INTEGER NOT NULL DEFAULT 1,
  perm_address_line1 TEXT,
  perm_address_line2 TEXT,
  perm_city TEXT,
  perm_province_id INTEGER REFERENCES provinces(id),
  perm_district_id INTEGER REFERENCES districts(id),
  perm_postal_code TEXT,
  -- postgraduate board certification (MBBS/BDS only)
  board_certified INTEGER,
  board_certification_date TEXT,
  -- other institutional information
  lang_sinhala TEXT,
  lang_tamil TEXT,
  lang_english TEXT,
  commendations_punishments TEXT,
  vacation_of_post INTEGER,
  vacation_of_post_details TEXT,
  bond_violator INTEGER,
  bond_value TEXT,
  bond_institution TEXT,
  bond_details TEXT,
  extra_curricular TEXT,
  other_particulars TEXT,
  -- declaration
  declaration_accepted INTEGER NOT NULL DEFAULT 0,
  declaration_name TEXT,
  willing_to_resign INTEGER,
  declaration_date TEXT,
  -- official schedule fields maintained by the processing officer
  sched_pc TEXT,
  sched_rr TEXT,
  sched_tr TEXT,
  sched_remarks TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (applicant_id, vacancy_id)
);

CREATE TABLE IF NOT EXISTS application_education (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  qualification TEXT,
  university TEXT,
  period_from TEXT,
  period_to TEXT,
  course_followed TEXT,
  final_exam_date TEXT,
  result_class TEXT CHECK (result_class IS NULL OR result_class IN ('FIRST_CLASS','SECOND_UPPER','SECOND_LOWER','PASS')),
  gpa TEXT
);

CREATE TABLE IF NOT EXISTS postgraduate_qualifications (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  qualification TEXT,
  institution TEXT,
  pg_type TEXT CHECK (pg_type IS NULL OR pg_type IN ('COURSEWORK','RESEARCH','READING_OTHER')),
  slqf_level TEXT CHECK (slqf_level IS NULL OR slqf_level IN ('LEVEL_9','LEVEL_10','OTHER')),
  duration TEXT,
  effective_date TEXT
);

CREATE TABLE IF NOT EXISTS academic_distinctions (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  award_type TEXT CHECK (award_type IS NULL OR award_type IN ('SCHOLARSHIP','MEDAL','PRIZE','DISTINCTION','OTHER')),
  award TEXT,
  institution TEXT,
  year TEXT
);

CREATE TABLE IF NOT EXISTS publications_books (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  publication_date TEXT,
  authors TEXT,
  isbn TEXT
);

CREATE TABLE IF NOT EXISTS publications_abstracts (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  authors TEXT,
  source TEXT,
  publication_date TEXT
);

CREATE TABLE IF NOT EXISTS publications_journals (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  authors TEXT,
  source_doi TEXT,
  year TEXT
);

CREATE TABLE IF NOT EXISTS current_employment (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  designation TEXT,
  institution TEXT,
  date_from TEXT,
  salary TEXT
);

CREATE TABLE IF NOT EXISTS previous_employment (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  designation TEXT,
  institution TEXT,
  date_from TEXT,
  date_to TEXT,
  reason_for_leaving TEXT
);

CREATE TABLE IF NOT EXISTS referees (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL CHECK (seq IN (1,2)),
  name TEXT,
  designation TEXT,
  address TEXT,
  telephone TEXT,
  email TEXT,
  UNIQUE (application_id, seq)
);

CREATE TABLE IF NOT EXISTS referee_requests (
  id INTEGER PRIMARY KEY,
  referee_id INTEGER NOT NULL REFERENCES referees(id),
  application_id INTEGER NOT NULL REFERENCES applications(id),
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT','SUBMITTED','EXPIRED','REVOKED')),
  sent_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  opened_at TEXT,
  submitted_at TEXT,
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS referee_reports (
  id INTEGER PRIMARY KEY,
  referee_request_id INTEGER NOT NULL UNIQUE REFERENCES referee_requests(id),
  application_id INTEGER NOT NULL REFERENCES applications(id),
  referee_name TEXT NOT NULL,
  referee_designation TEXT,
  relationship TEXT NOT NULL,
  known_since TEXT,
  ratings TEXT NOT NULL DEFAULT '{}',
  strengths TEXT,
  weaknesses TEXT,
  comments TEXT,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('HIGHLY_RECOMMENDED','RECOMMENDED','RECOMMENDED_WITH_RESERVATIONS','NOT_RECOMMENDED')),
  is_related_declared INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT NOT NULL,
  submitted_ip TEXT
);

CREATE TABLE IF NOT EXISTS application_documents (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  category TEXT NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TEXT NOT NULL,
  deleted_at TEXT,
  deleted_by INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_docs_app ON application_documents(application_id, category);

-- -------------------------------------------------------------- shortlisting
-- Append-only: each row is one decision event; the latest row per application
-- is the current decision. Previous values are kept on every row.
CREATE TABLE IF NOT EXISTS shortlist_decisions (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  decision_code TEXT NOT NULL REFERENCES shortlist_decision_types(code),
  category_code TEXT REFERENCES shortlist_categories(code),
  previous_decision_code TEXT,
  previous_category_code TEXT,
  remarks TEXT,
  decided_by INTEGER NOT NULL REFERENCES users(id),
  decided_at TEXT NOT NULL,
  CHECK (category_code IS NULL OR decision_code = 'SELECTED')
);
CREATE INDEX IF NOT EXISTS idx_sd_app ON shortlist_decisions(application_id, id);

CREATE TRIGGER IF NOT EXISTS trg_shortlist_matrix
BEFORE INSERT ON shortlist_decisions
BEGIN
  SELECT RAISE(ABORT, 'SHORTLIST_RULE_VIOLATION')
  WHERE NOT EXISTS (
    SELECT 1 FROM position_shortlist_decisions psd
    JOIN vacancies v ON v.position_id = psd.position_id
    JOIN applications a ON a.vacancy_id = v.id
    WHERE a.id = NEW.application_id
      AND psd.decision_code = NEW.decision_code
      AND ((psd.category_code IS NULL AND NEW.category_code IS NULL) OR psd.category_code = NEW.category_code)
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_shortlist_no_update
BEFORE UPDATE ON shortlist_decisions
BEGIN
  SELECT RAISE(ABORT, 'SHORTLIST_DECISIONS_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_shortlist_no_delete
BEFORE DELETE ON shortlist_decisions
BEGIN
  SELECT RAISE(ABORT, 'SHORTLIST_DECISIONS_IMMUTABLE');
END;

CREATE VIEW IF NOT EXISTS current_shortlist AS
SELECT sd.* FROM shortlist_decisions sd
WHERE sd.id = (SELECT MAX(id) FROM shortlist_decisions x WHERE x.application_id = sd.application_id);

CREATE TABLE IF NOT EXISTS shortlist_shares (
  id INTEGER PRIMARY KEY,
  vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('HOD','DEAN')),
  department_id INTEGER REFERENCES departments(id),
  faculty_id INTEGER REFERENCES faculties(id),
  note TEXT,
  shared_by INTEGER NOT NULL REFERENCES users(id),
  shared_at TEXT NOT NULL,
  CHECK ((recipient_role = 'HOD' AND department_id IS NOT NULL) OR (recipient_role = 'DEAN' AND faculty_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS shortlist_share_items (
  share_id INTEGER NOT NULL REFERENCES shortlist_shares(id),
  application_id INTEGER NOT NULL REFERENCES applications(id),
  PRIMARY KEY (share_id, application_id)
);

-- --------------------------------------------------------------- interviews
CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY,
  vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
  interview_date TEXT NOT NULL,
  interview_time TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'IN_PERSON' CHECK (mode IN ('IN_PERSON','ONLINE','HYBRID')),
  venue TEXT,
  online_details TEXT,
  candidate_instructions TEXT,
  panel_details TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED','POSTPONED')),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interview_candidates (
  id INTEGER PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  slot_time TEXT,
  notified_at TEXT,
  attendance TEXT CHECK (attendance IS NULL OR attendance IN ('PRESENT','ABSENT')),
  result TEXT,
  remarks TEXT,
  UNIQUE (interview_id, application_id)
);

-- ------------------------------------------------------------- appointments
CREATE TABLE IF NOT EXISTS appointment_records (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  status TEXT NOT NULL CHECK (status IN ('RECOMMENDED','APPROVED','OFFERED','ACCEPTED','DECLINED','APPOINTED','WITHDRAWN')),
  council_approval_date TEXT,
  letter_reference TEXT,
  effective_date TEXT,
  remarks TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ----------------------------------------------------- notifications & audit
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  recipient_email TEXT,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  application_id INTEGER REFERENCES applications(id),
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','SENT','FAILED','IN_APP')),
  error TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  sent_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values TEXT,
  new_values TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

CREATE TRIGGER IF NOT EXISTS trg_audit_no_update
BEFORE UPDATE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'AUDIT_LOG_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_audit_no_delete
BEFORE DELETE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'AUDIT_LOG_IMMUTABLE');
END;

-- A submitted application can never silently change its vacancy.
CREATE TRIGGER IF NOT EXISTS trg_app_vacancy_locked
BEFORE UPDATE OF vacancy_id ON applications
WHEN OLD.status <> 'DRAFT' AND NEW.vacancy_id <> OLD.vacancy_id
BEGIN
  SELECT RAISE(ABORT, 'SUBMITTED_APPLICATION_VACANCY_LOCKED');
END;

CREATE TRIGGER IF NOT EXISTS trg_app_reference_immutable
BEFORE UPDATE OF reference_no ON applications
WHEN OLD.reference_no IS NOT NULL AND NEW.reference_no IS NOT OLD.reference_no
BEGIN
  SELECT RAISE(ABORT, 'REFERENCE_NUMBER_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_app_no_delete_submitted
BEFORE DELETE ON applications
WHEN OLD.status <> 'DRAFT'
BEGIN
  SELECT RAISE(ABORT, 'SUBMITTED_APPLICATION_UNDELETABLE');
END;
`;

export function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  seedMasterData(db);
  return db;
}

/** Run fn inside a transaction; nested calls join the outer transaction. */
export function tx(db, fn) {
  if (db.isTransaction) return fn();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function nextSequence(db, name) {
  db.prepare('INSERT INTO sequences (name, value) VALUES (?, 0) ON CONFLICT(name) DO NOTHING').run(name);
  db.prepare('UPDATE sequences SET value = value + 1 WHERE name = ?').run(name);
  return db.prepare('SELECT value FROM sequences WHERE name = ?').get(name).value;
}

export function getSetting(db, key, fallback) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}
