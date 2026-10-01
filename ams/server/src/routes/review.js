import { Router } from 'express';
import { h, badRequest, notFound, now, toInt, str, sendCsv } from '../lib/util.js';
import { requireRole } from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import { appSelect, getFullApplication, assertCanView, documentRequirements, label } from '../lib/applications.js';
import { allowedOptions, recordDecision, decisionHistory } from '../lib/shortlist.js';
import { createRefereeRequest } from '../lib/referees.js';
import * as S from '../lib/summaries.js';
import { tx } from '../db.js';

const r = Router();
const STAFF = ['REGISTRAR', 'ADMIN'];

const SORTS = {
  reference_no: 'a.reference_no',
  name: 'a.name_in_full COLLATE NOCASE',
  position: 'p.title',
  department: 'd.name',
  faculty: 'f.name',
  submitted_at: 'a.submitted_at',
  decision: 'cs.decision_code',
  status: 'a.status',
};

/** Builds the filtered/sorted list query shared by the list, CSV and prev/next navigation. */
export function buildListQuery(q, user) {
  const where = ["a.status <> 'DRAFT'"];
  const params = [];
  if (user.role === 'REGISTRAR' && user.faculty_id) {
    where.push('v.faculty_id = ?');
    params.push(user.faculty_id);
  }
  for (const [k, col] of [['vacancy_id', 'a.vacancy_id'], ['department_id', 'v.department_id'], ['faculty_id', 'v.faculty_id'], ['position_id', 'v.position_id']]) {
    if (toInt(q[k])) {
      where.push(`${col} = ?`);
      params.push(toInt(q[k]));
    }
  }
  if (q.status && ['SUBMITTED', 'UNDER_REVIEW', 'CLOSED'].includes(q.status)) {
    where.push('a.status = ?');
    params.push(q.status);
  }
  if (q.decision === 'NONE') where.push('cs.decision_code IS NULL');
  else if (['SELECTED', 'REJECTED', 'PENDING'].includes(q.decision)) {
    where.push('cs.decision_code = ?');
    params.push(q.decision);
  }
  if (['CATEGORY_I', 'CATEGORY_II', 'CATEGORY_III'].includes(q.category)) {
    where.push('cs.category_code = ?');
    params.push(q.category);
  }
  const search = str(q.q, 100);
  if (search) {
    const cols = ['a.reference_no', 'a.name_in_full', 'a.name_with_initials', 'a.nic', 'a.email'];
    where.push(`(${cols.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(' OR ')})`);
    const like = `%${search.replace(/[%_]/g, (m) => '\\' + m)}%`;
    params.push(like, like, like, like, like);
  }
  const sortCol = SORTS[q.sort] || 'a.submitted_at';
  const dir = q.dir === 'desc' ? 'DESC' : 'ASC';
  return { where: `WHERE ${where.join(' AND ')}`, params, order: `ORDER BY ${sortCol} ${dir}, a.id ${dir}` };
}

function listRows(db, q, user, { limit, offset } = {}) {
  const { where, params, order } = buildListQuery(q, user);
  const sql = `${appSelect} ${where} ${order}${limit ? ' LIMIT ? OFFSET ?' : ''}`;
  return db.prepare(sql).all(...params, ...(limit ? [limit, offset] : []));
}

r.get(
  '/applications',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const pageSize = Math.min(Math.max(toInt(req.query.page_size) || 25, 5), 200);
    const page = Math.max(toInt(req.query.page) || 1, 1);
    const { where, params } = buildListQuery(req.query, req.user);
    const total = db
      .prepare(
        `SELECT COUNT(*) n FROM applications a JOIN vacancies v ON v.id = a.vacancy_id LEFT JOIN current_shortlist cs ON cs.application_id = a.id ${where}`,
      )
      .get(...params).n;
    const rows = listRows(db, req.query, req.user, { limit: pageSize, offset: (page - 1) * pageSize }).map((a) => ({
      id: a.id,
      reference_no: a.reference_no,
      applicant_name: a.name_in_full,
      name_with_initials: a.name_with_initials,
      position_title: a.position_title,
      position_code: a.position_code,
      department_name: a.department_name,
      faculty_name: a.faculty_name,
      status: a.status,
      decision_code: a.decision_code,
      category_code: a.category_code,
      submitted_at: a.submitted_at,
    }));
    res.json({ applications: rows, total, page, page_size: pageSize });
  }),
);

r.get(
  '/applications.csv',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const rows = listRows(db, req.query, req.user).map((row) => {
      const a = getFullApplication(db, row.id);
      const s = a.sections;
      return [
        a.reference_no, a.title, a.name_in_full, a.surname, a.name_with_initials, a.nic, a.passport_no, a.date_of_birth, a.age, a.civil_status,
        label(a.citizenship_type), a.email, a.mobile, a.phone_residence, a.phone_office, S.addressText(a, 'cur'),
        a.perm_same_as_current ? 'Same as current' : S.addressText(a, 'perm'),
        a.position_title, a.department_name, a.faculty_name, a.discipline, a.status, a.submitted_at,
        label(a.decision_code), label(a.category_code), a.decision_remarks,
        S.educationSummary(s), S.postgraduateSummary(s), S.distinctionsOfType(s, ['SCHOLARSHIP', 'MEDAL', 'PRIZE', 'DISTINCTION', 'OTHER']),
        a.counts.books, a.counts.abstracts, a.counts.journals, S.currentEmploymentSummary(s), S.previousEmploymentSummary(s),
        a.extra_curricular, S.refereesSummary(s), `${a.rr_received}/2`, S.schedText(a.sched_pc), S.schedText(S.rrStatus(a)), S.schedText(a.sched_tr), a.sched_remarks,
      ];
    });
    audit(req, 'APPLICATIONS_EXPORTED', 'report', 'applications.csv', null, { filters: req.query, count: rows.length });
    sendCsv(
      res,
      `applications-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Reference', 'Title', 'Name in Full', 'Surname', 'Name with Initials', 'NIC', 'Passport', 'Date of Birth', 'Age', 'Civil Status',
        'Citizenship', 'Email', 'Mobile', 'Phone (Residence)', 'Phone (Office)', 'Current Address', 'Permanent Address',
        'Position', 'Department', 'Faculty', 'Discipline', 'Application Status', 'Submitted At',
        'Shortlist Decision', 'Category', 'Decision Remarks',
        'University Education', 'Postgraduate Qualifications', 'Academic Distinctions',
        'Books', 'Abstracts', 'Journals', 'Current Employment', 'Previous Employment',
        'Extra-Curricular', 'Referees', 'Referee Reports Received', 'PC', 'RR', 'TR', 'Schedule Remarks',
      ],
      rows,
    );
  }),
);

r.get(
  '/applications/:id',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const id = toInt(req.params.id);
    const full = getFullApplication(db, id);
    assertCanView(db, req.user, full);

    // Previous / Next within the same filtered & sorted list (review context).
    const ids = listRows(db, req.query, req.user).map((x) => x.id);
    const idx = ids.indexOf(id);
    const nav = { index: idx, total: ids.length, prev_id: idx > 0 ? ids[idx - 1] : null, next_id: idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null };

    res.json({
      application: full,
      documents_required: documentRequirements(full),
      options: allowedOptions(db, full.position_id),
      history: decisionHistory(db, id),
      nav,
      can_decide: req.user.role === 'REGISTRAR' && full.status !== 'CLOSED',
    });
  }),
);

r.get(
  '/applications/:id/options',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const full = getFullApplication(db, toInt(req.params.id));
    assertCanView(db, req.user, full);
    res.json({ position: full.position_title, options: allowedOptions(db, full.position_id) });
  }),
);

r.post(
  '/applications/:id/decision',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const full = getFullApplication(db, toInt(req.params.id));
    assertCanView(db, req.user, full);
    if (full.status === 'CLOSED') throw badRequest('Processing for this application is closed.');
    const result = recordDecision(req, full, req.body.decision, req.body.category ?? req.body.categories ?? null, str(req.body.remarks, 2000));
    res.json({ ...result, history: decisionHistory(db, full.id) });
  }),
);

r.get(
  '/applications/:id/decisions',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const full = getFullApplication(db, toInt(req.params.id));
    assertCanView(db, req.user, full);
    res.json({ history: decisionHistory(db, full.id) });
  }),
);

const SCHED_VALUES = ['TICK', 'NO', 'PENDING'];
r.put(
  '/applications/:id/schedule',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const full = getFullApplication(db, toInt(req.params.id));
    assertCanView(db, req.user, full);
    const vals = {};
    for (const k of ['sched_pc', 'sched_rr', 'sched_tr']) {
      const v = req.body[k] || null;
      if (v !== null && !SCHED_VALUES.includes(v)) throw badRequest(`Invalid value for ${k.slice(6).toUpperCase()}.`);
      vals[k] = v;
    }
    vals.sched_remarks = str(req.body.sched_remarks, 2000);
    tx(db, () => {
      db.prepare('UPDATE applications SET sched_pc = ?, sched_rr = ?, sched_tr = ?, sched_remarks = ?, updated_at = ? WHERE id = ?').run(vals.sched_pc, vals.sched_rr, vals.sched_tr, vals.sched_remarks, now(), full.id);
      audit(req, 'SCHEDULE_FIELDS_UPDATED', 'application', full.id,
        { sched_pc: full.sched_pc, sched_rr: full.sched_rr, sched_tr: full.sched_tr, sched_remarks: full.sched_remarks }, vals);
    });
    res.json({ ok: true, ...vals });
  }),
);

r.post(
  '/applications/:id/referees/:refereeId/resend',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const full = getFullApplication(db, toInt(req.params.id));
    assertCanView(db, req.user, full);
    const referee = db.prepare('SELECT * FROM referees WHERE id = ? AND application_id = ?').get(toInt(req.params.refereeId), full.id);
    if (!referee) throw notFound('Referee not found.');
    const status = full.referee_status.find((x) => x.referee_id === referee.id);
    if (status?.status === 'SUBMITTED') throw badRequest('This referee has already submitted a report.');
    tx(db, () => {
      createRefereeRequest(req.ctx, { app: full, referee, createdBy: req.user.id });
      audit(req, 'REFEREE_REQUEST_RESENT', 'application', full.id, null, { referee_id: referee.id, email: referee.email });
    });
    res.json({ referee_status: getFullApplication(db, full.id).referee_status });
  }),
);

r.get(
  '/applications/:id/referee-reports',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const full = getFullApplication(db, toInt(req.params.id));
    assertCanView(db, req.user, full);
    const reports = db.prepare('SELECT * FROM referee_reports WHERE application_id = ? ORDER BY id').all(full.id).map((x) => ({ ...x, ratings: JSON.parse(x.ratings || '{}') }));
    audit(req, 'REFEREE_REPORTS_VIEWED', 'application', full.id);
    res.json({ reports });
  }),
);

r.get(
  '/stats',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const scope = req.user.role === 'REGISTRAR' && req.user.faculty_id ? ' AND v.faculty_id = ' + Number(req.user.faculty_id) : '';
    const one = (sql) => db.prepare(sql).get().n;
    res.json({
      open_vacancies: one(`SELECT COUNT(*) n FROM vacancies v WHERE v.status = 'PUBLISHED'${scope}`),
      submitted: one(`SELECT COUNT(*) n FROM applications a JOIN vacancies v ON v.id = a.vacancy_id WHERE a.status <> 'DRAFT'${scope}`),
      undecided: one(`SELECT COUNT(*) n FROM applications a JOIN vacancies v ON v.id = a.vacancy_id LEFT JOIN current_shortlist cs ON cs.application_id = a.id WHERE a.status <> 'DRAFT' AND cs.id IS NULL${scope}`),
      selected: one(`SELECT COUNT(*) n FROM applications a JOIN vacancies v ON v.id = a.vacancy_id JOIN current_shortlist cs ON cs.application_id = a.id WHERE cs.decision_code = 'SELECTED'${scope}`),
      rejected: one(`SELECT COUNT(*) n FROM applications a JOIN vacancies v ON v.id = a.vacancy_id JOIN current_shortlist cs ON cs.application_id = a.id WHERE cs.decision_code = 'REJECTED'${scope}`),
      pending: one(`SELECT COUNT(*) n FROM applications a JOIN vacancies v ON v.id = a.vacancy_id JOIN current_shortlist cs ON cs.application_id = a.id WHERE cs.decision_code = 'PENDING'${scope}`),
      upcoming_interviews: one(`SELECT COUNT(*) n FROM interviews i JOIN vacancies v ON v.id = i.vacancy_id WHERE i.status = 'SCHEDULED' AND i.interview_date >= date('now')${scope}`),
      referee_reports_outstanding: one(`SELECT COUNT(*) n FROM referee_requests rq JOIN applications a ON a.id = rq.application_id JOIN vacancies v ON v.id = a.vacancy_id WHERE rq.status = 'SENT'${scope}`),
    });
  }),
);

export default r;
