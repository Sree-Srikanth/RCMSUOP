import { hashPassword } from './lib/security.js';
import { now } from './lib/util.js';

export const POSITIONS = [
  { code: 'LP', title: 'Lecturer (Probationary)' },
  { code: 'LU', title: 'Lecturer (Unconfirmed)' },
  { code: 'SL2', title: 'Senior Lecturer Grade II' },
  { code: 'SL1', title: 'Senior Lecturer Grade I' },
  { code: 'AL', title: 'Assistant Librarian' },
  { code: 'SAL2', title: 'Senior Assistant Librarian Grade II' },
  { code: 'SAL1', title: 'Senior Assistant Librarian Grade I' },
];

/** Requirements §15 – the authoritative shortlist matrix. */
export const SHORTLIST_MATRIX = {
  LP: [['SELECTED', 'CATEGORY_I'], ['SELECTED', 'CATEGORY_II'], ['SELECTED', 'CATEGORY_III'], ['REJECTED', null], ['PENDING', null]],
  LU: [['SELECTED', null], ['REJECTED', null], ['PENDING', null]],
  SL2: [['SELECTED', null], ['REJECTED', null], ['PENDING', null]],
  SL1: [['SELECTED', null], ['REJECTED', null], ['PENDING', null]],
  AL: [['SELECTED', null], ['REJECTED', null], ['PENDING', null]],
  SAL2: [['SELECTED', null], ['REJECTED', null], ['PENDING', null]],
  SAL1: [['SELECTED', null], ['REJECTED', null], ['PENDING', null]],
};

const FACULTIES = [
  ['AGR', 'Faculty of Agriculture', [['AGB', 'Agricultural Biology'], ['AGE', 'Agricultural Engineering'], ['AEB', 'Agricultural Economics and Business Management'], ['ANS', 'Animal Science'], ['CRS', 'Crop Science'], ['FST', 'Food Science and Technology'], ['SOS', 'Soil Science']]],
  ['AHS', 'Faculty of Allied Health Sciences', [['MLS', 'Medical Laboratory Science'], ['NUR', 'Nursing'], ['PHA', 'Pharmacy'], ['PHY', 'Physiotherapy'], ['RAD', 'Radiography/Radiotherapy']]],
  ['ART', 'Faculty of Arts', [['ARC', 'Archaeology'], ['ECO', 'Economics and Statistics'], ['ENG', 'English'], ['GEO', 'Geography'], ['HIS', 'History'], ['PHL', 'Philosophy and Psychology'], ['POL', 'Political Science'], ['SIN', 'Sinhala'], ['TAM', 'Tamil'], ['SOC', 'Sociology']]],
  ['DEN', 'Faculty of Dental Sciences', [['BDS', 'Basic Sciences'], ['COM', 'Community Dental Health'], ['ORS', 'Oral Medicine and Periodontology'], ['PRO', 'Prosthetic Dentistry'], ['RES', 'Restorative Dentistry']]],
  ['ENG', 'Faculty of Engineering', [['CHE', 'Chemical and Process Engineering'], ['CIV', 'Civil Engineering'], ['CSE', 'Computer Engineering'], ['EEE', 'Electrical and Electronic Engineering'], ['EMT', 'Engineering Mathematics'], ['MAN', 'Manufacturing and Industrial Engineering'], ['MEC', 'Mechanical Engineering']]],
  ['MGT', 'Faculty of Management', [['BFN', 'Business Finance'], ['MKT', 'Marketing Management'], ['OPM', 'Operations Management'], ['HRM', 'Human Resource Management']]],
  ['MED', 'Faculty of Medicine', [['ANA', 'Anatomy'], ['BCH', 'Biochemistry'], ['CMD', 'Community Medicine'], ['MCB', 'Microbiology'], ['MDC', 'Medicine'], ['OBG', 'Obstetrics and Gynaecology'], ['PAE', 'Paediatrics'], ['PAT', 'Pathology'], ['PHM', 'Pharmacology'], ['PHS', 'Physiology'], ['SUR', 'Surgery']]],
  ['SCI', 'Faculty of Science', [['BOT', 'Botany'], ['CHM', 'Chemistry'], ['CSC', 'Statistics and Computer Science'], ['GLG', 'Geology'], ['MTH', 'Mathematics'], ['MBI', 'Molecular Biology and Biotechnology'], ['PHY', 'Physics'], ['ZOO', 'Zoology']]],
  ['VET', 'Faculty of Veterinary Medicine and Animal Science', [['VBS', 'Basic Veterinary Sciences'], ['VCS', 'Veterinary Clinical Sciences'], ['VPA', 'Veterinary Pathobiology'], ['VPH', 'Veterinary Public Health and Pharmacology']]],
  ['LIB', 'University Library', [['LIB', 'Main Library']]],
];

const PROVINCES = {
  Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
  Eastern: ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'North Western': ['Kurunegala', 'Puttalam'],
  Sabaragamuwa: ['Kegalle', 'Ratnapura'],
  Southern: ['Galle', 'Hambantota', 'Matara'],
  Uva: ['Badulla', 'Monaragala'],
  Western: ['Colombo', 'Gampaha', 'Kalutara'],
};

export const ROLES = [
  ['APPLICANT', 'Applicant'],
  ['REGISTRAR', 'Registrar / SAR'],
  ['HOD', 'Head of Department'],
  ['DEAN', 'Dean'],
  ['ADMIN', 'Administrator'],
];

const DEFAULT_SETTINGS = {
  referee_token_days: '21',
  max_upload_mb: '5',
  session_hours: '8',
  institution_email: 'acestpera@gs.pdn.ac.lk',
  institution_phone: '081-2392341, 2342',
  form_reference: 'UoP/AE/00020/2023',
};

export function seedMasterData(db) {
  const ins = (sql, ...a) => db.prepare(sql).run(...a);
  for (const [code, label] of ROLES) ins('INSERT OR IGNORE INTO roles (code, label) VALUES (?, ?)', code, label);
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) ins('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', k, v);

  ins("INSERT OR IGNORE INTO shortlist_decision_types (code, label) VALUES ('SELECTED','Selected'),('REJECTED','Rejected'),('PENDING','Pending')");
  ins("INSERT OR IGNORE INTO shortlist_categories (code, label) VALUES ('CATEGORY_I','Category I'),('CATEGORY_II','Category II'),('CATEGORY_III','Category III')");

  POSITIONS.forEach((p, i) => ins('INSERT OR IGNORE INTO positions (code, title, sort_order) VALUES (?, ?, ?)', p.code, p.title, i));
  const hasMatrix = db.prepare('SELECT COUNT(*) n FROM position_shortlist_decisions').get().n > 0;
  if (!hasMatrix) {
    for (const [code, rows] of Object.entries(SHORTLIST_MATRIX)) {
      const pos = db.prepare('SELECT id FROM positions WHERE code = ?').get(code);
      for (const [decision, category] of rows) {
        ins('INSERT INTO position_shortlist_decisions (position_id, decision_code, category_code) VALUES (?, ?, ?)', pos.id, decision, category);
      }
    }
  }

  if (db.prepare('SELECT COUNT(*) n FROM faculties').get().n === 0) {
    for (const [code, name, depts] of FACULTIES) {
      const f = db.prepare('INSERT INTO faculties (code, name) VALUES (?, ?)').run(code, name);
      for (const [dcode, dname] of depts) {
        ins('INSERT INTO departments (faculty_id, code, name) VALUES (?, ?, ?)', f.lastInsertRowid, dcode, `Department of ${dname}`.replace('Department of Main Library', 'Main Library'));
      }
    }
  }

  if (db.prepare('SELECT COUNT(*) n FROM provinces').get().n === 0) {
    for (const [prov, districts] of Object.entries(PROVINCES)) {
      const p = db.prepare('INSERT INTO provinces (name) VALUES (?)').run(prov);
      for (const d of districts) ins('INSERT INTO districts (province_id, name) VALUES (?, ?)', p.lastInsertRowid, d);
    }
  }

  if (db.prepare("SELECT COUNT(*) n FROM users WHERE role = 'ADMIN'").get().n === 0) {
    const email = process.env.AMS_ADMIN_EMAIL || 'admin@pdn.ac.lk';
    const password = process.env.AMS_ADMIN_PASSWORD || 'ChangeMe@2026';
    const t = now();
    ins(
      `INSERT INTO users (email, password_hash, role, full_name, must_change_password, created_at, updated_at)
       VALUES (?, ?, 'ADMIN', 'System Administrator', 1, ?, ?)`,
      email, hashPassword(password), t, t,
    );
  }
}
