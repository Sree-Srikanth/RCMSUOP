import { Router } from 'express';
import { h, badRequest, notFound, now, toInt, str, date, oneOf } from '../lib/util.js';
import { requireRole } from '../lib/auth.js';
import { audit, diff } from '../lib/audit.js';
import { notify } from '../lib/mail.js';
import { appSelect } from '../lib/applications.js';
import { tx } from '../db.js';

const r = Router();
const STAFF = ['REGISTRAR', 'ADMIN'];

const INTERVIEW_SELECT = `
  SELECT i.*, p.title AS position_title, d.name AS department_name, f.name AS faculty_name, v.faculty_id, v.department_id,
         (SELECT COUNT(*) FROM interview_candidates ic WHERE ic.interview_id = i.id) AS candidate_count
  FROM interviews i JOIN vacancies v ON v.id = i.vacancy_id
  JOIN positions p ON p.id = v.position_id JOIN departments d ON d.id = v.department_id JOIN faculties f ON f.id = v.faculty_id`;

function scopeSql(user) {
  return user.role === 'REGISTRAR' && user.faculty_id ? { sql: ' AND v.faculty_id = ?', params: [user.faculty_id] } : { sql: '', params: [] };
}

function loadInterview(req) {
  const s = scopeSql(req.user);
  const i = req.ctx.db.prepare(`${INTERVIEW_SELECT} WHERE i.id = ?${s.sql}`).get(toInt(req.params.id), ...s.params);
  if (!i) throw notFound('Interview not found.');
  return i;
}

function candidates(db, interviewId) {
  return db
    .prepare(
      `SELECT ic.*, a.reference_no, a.name_in_full, a.name_with_initials, a.email, a.mobile, cs.decision_code, cs.category_code
       FROM interview_candidates ic JOIN applications a ON a.id = ic.application_id
       LEFT JOIN current_shortlist cs ON cs.application_id = a.id
       WHERE ic.interview_id = ? ORDER BY ic.slot_time, a.reference_no`,
    )
    .all(interviewId);
}

/** Only currently SELECTED applications of the interview's vacancy are eligible. */
function eligible(db, vacancyId) {
  return db.prepare(`${appSelect} WHERE a.vacancy_id = ? AND a.status <> 'DRAFT' AND cs.decision_code = 'SELECTED' ORDER BY cs.category_code, a.reference_no`).all(vacancyId);
}

function parse(body) {
  const v = {
    interview_date: date(body.interview_date),
    interview_time: str(body.interview_time, 5),
    mode: oneOf(body.mode || 'IN_PERSON', ['IN_PERSON', 'ONLINE', 'HYBRID']),
    venue: str(body.venue, 500),
    online_details: str(body.online_details, 1000),
    candidate_instructions: str(body.candidate_instructions, 5000),
    panel_details: str(body.panel_details, 5000),
  };
  if (!v.interview_date || !v.interview_time || !/^\d{2}:\d{2}$/.test(v.interview_time)) throw badRequest('Interview date and time are required.');
  if (v.mode !== 'ONLINE' && !v.venue) throw badRequest('A venue is required for in-person interviews.');
  if (v.mode !== 'IN_PERSON' && !v.online_details) throw badRequest('Online meeting details are required for online interviews.');
  return v;
}
const FIELDS = ['interview_date', 'interview_time', 'mode', 'venue', 'online_details', 'candidate_instructions', 'panel_details'];

r.get(
  '/',
  requireRole(...STAFF),
  h((req, res) => {
    const s = scopeSql(req.user);
    const extra = toInt(req.query.vacancy_id) ? ' AND i.vacancy_id = ' + toInt(req.query.vacancy_id) : '';
    res.json({ interviews: req.ctx.db.prepare(`${INTERVIEW_SELECT} WHERE 1=1${s.sql}${extra} ORDER BY i.interview_date DESC, i.interview_time`).all(...s.params) });
  }),
);

r.get(
  '/:id',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const i = loadInterview(req);
    const assigned = new Set(candidates(db, i.id).map((c) => c.application_id));
    res.json({
      interview: i,
      candidates: candidates(db, i.id),
      eligible: eligible(db, i.vacancy_id)
        .filter((a) => !assigned.has(a.id))
        .map((a) => ({ id: a.id, reference_no: a.reference_no, name_with_initials: a.name_with_initials, category_code: a.category_code })),
    });
  }),
);

r.post(
  '/',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const vacancyId = toInt(req.body.vacancy_id);
    const v = db.prepare('SELECT * FROM vacancies WHERE id = ?').get(vacancyId);
    if (!v || (req.user.faculty_id && v.faculty_id !== req.user.faculty_id)) throw notFound('Vacancy not found.');
    const data = parse(req.body);
    const t = now();
    const id = tx(db, () => {
      const info = db
        .prepare(`INSERT INTO interviews (vacancy_id, ${FIELDS.join(', ')}, status, created_by, created_at, updated_at) VALUES (?, ${FIELDS.map(() => '?').join(', ')}, 'SCHEDULED', ?, ?, ?)`)
        .run(vacancyId, ...FIELDS.map((f) => data[f]), req.user.id, t, t);
      audit(req, 'INTERVIEW_CREATED', 'interview', info.lastInsertRowid, null, { vacancy_id: vacancyId, ...data });
      return Number(info.lastInsertRowid);
    });
    res.status(201).json({ id });
  }),
);

r.put(
  '/:id',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const before = loadInterview(req);
    const data = parse(req.body);
    const status = oneOf(req.body.status || before.status, ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED']);
    tx(db, () => {
      db.prepare(`UPDATE interviews SET ${FIELDS.map((f) => `${f} = ?`).join(', ')}, status = ?, updated_at = ? WHERE id = ?`).run(...FIELDS.map((f) => data[f]), status, now(), before.id);
      const d = diff(before, { ...data, status }, [...FIELDS, 'status']);
      if (d) audit(req, 'INTERVIEW_UPDATED', 'interview', before.id, d[0], d[1]);
    });
    res.json({ ok: true });
  }),
);

r.post(
  '/:id/candidates',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const i = loadInterview(req);
    const ids = [...new Set((req.body.application_ids || []).map(toInt).filter(Boolean))];
    if (!ids.length) throw badRequest('Select at least one candidate.');
    const allowed = new Map(eligible(db, i.vacancy_id).map((a) => [a.id, a]));
    const bad = ids.filter((id) => !allowed.has(id));
    if (bad.length) throw badRequest('Only selected candidates of this vacancy can be added to the interview.', { application_ids: bad });
    tx(db, () => {
      const ins = db.prepare('INSERT OR IGNORE INTO interview_candidates (interview_id, application_id, slot_time) VALUES (?, ?, ?)');
      for (const id of ids) ins.run(i.id, id, str(req.body.slot_times?.[id], 5) || null);
      audit(req, 'INTERVIEW_CANDIDATES_ADDED', 'interview', i.id, null, { candidates: ids.map((id) => allowed.get(id).reference_no) });
    });
    res.json({ candidates: candidates(db, i.id) });
  }),
);

r.put(
  '/:id/candidates/:cid',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const i = loadInterview(req);
    const c = db.prepare('SELECT * FROM interview_candidates WHERE id = ? AND interview_id = ?').get(toInt(req.params.cid), i.id);
    if (!c) throw notFound('Candidate not found.');
    const v = {
      slot_time: str(req.body.slot_time, 5),
      attendance: req.body.attendance ? oneOf(req.body.attendance, ['PRESENT', 'ABSENT']) : null,
      result: str(req.body.result, 200),
      remarks: str(req.body.remarks, 2000),
    };
    tx(db, () => {
      db.prepare('UPDATE interview_candidates SET slot_time = ?, attendance = ?, result = ?, remarks = ? WHERE id = ?').run(v.slot_time, v.attendance, v.result, v.remarks, c.id);
      const d = diff(c, v, Object.keys(v));
      if (d) audit(req, 'INTERVIEW_CANDIDATE_UPDATED', 'interview', i.id, { application_id: c.application_id, ...d[0] }, { application_id: c.application_id, ...d[1] });
    });
    res.json({ candidates: candidates(db, i.id) });
  }),
);

r.delete(
  '/:id/candidates/:cid',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const i = loadInterview(req);
    const c = db.prepare('SELECT * FROM interview_candidates WHERE id = ? AND interview_id = ?').get(toInt(req.params.cid), i.id);
    if (!c) throw notFound('Candidate not found.');
    tx(db, () => {
      db.prepare('DELETE FROM interview_candidates WHERE id = ?').run(c.id);
      audit(req, 'INTERVIEW_CANDIDATE_REMOVED', 'interview', i.id, { application_id: c.application_id }, null);
    });
    res.json({ candidates: candidates(db, i.id) });
  }),
);

r.post(
  '/:id/notify',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const i = loadInterview(req);
    if (i.status === 'CANCELLED') throw badRequest('This interview has been cancelled.');
    const only = (req.body.candidate_ids || []).map(toInt).filter(Boolean);
    const list = candidates(db, i.id).filter((c) => c.decision_code === 'SELECTED' && (!only.length || only.includes(c.id)));
    if (!list.length) throw badRequest('There are no eligible candidates to notify.');
    const t = now();
    tx(db, () => {
      for (const c of list) {
        const app = db.prepare('SELECT applicant_id FROM applications WHERE id = ?').get(c.application_id);
        notify(req.ctx, {
          userId: app.applicant_id,
          email: c.email,
          type: 'INTERVIEW_NOTIFICATION',
          applicationId: c.application_id,
          subject: `Interview – ${i.position_title}, ${i.department_name} (Ref ${c.reference_no})`,
          body:
            `Dear ${c.name_with_initials},\n\nWith reference to your application (Ref ${c.reference_no}) for the post of ${i.position_title} ` +
            `in the ${i.department_name}, ${i.faculty_name}, you are invited to attend an interview as follows.\n\n` +
            `Date: ${i.interview_date}\nTime: ${c.slot_time || i.interview_time}\n` +
            (i.mode !== 'ONLINE' ? `Venue: ${i.venue}\n` : '') +
            (i.mode !== 'IN_PERSON' ? `Online details: ${i.online_details}\n` : '') +
            (i.candidate_instructions ? `\nInstructions:\n${i.candidate_instructions}\n` : '') +
            `\nPlease bring the originals of all certificates and your National Identity Card / Passport.\n\n` +
            `Deputy Registrar / Academic Establishments\nUniversity of Peradeniya`,
        });
        db.prepare('UPDATE interview_candidates SET notified_at = ? WHERE id = ?').run(t, c.id);
      }
      audit(req, 'INTERVIEW_NOTIFICATIONS_SENT', 'interview', i.id, null, { candidates: list.map((c) => c.reference_no) });
    });
    res.json({ notified: list.length, candidates: candidates(db, i.id) });
  }),
);

export default r;
