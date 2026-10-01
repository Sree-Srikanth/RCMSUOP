import { Router } from 'express';
import { h, badRequest, notFound, now, toInt, str, date, oneOf } from '../lib/util.js';
import { requireRole } from '../lib/auth.js';
import { audit, diff } from '../lib/audit.js';
import { getApplicationRow, assertCanView } from '../lib/applications.js';
import { tx } from '../db.js';

/**
 * Appointment processing is kept separate from shortlist records
 * (Requirements §6, §35): nothing here writes to shortlist_decisions.
 */
const r = Router();
const STATUSES = ['RECOMMENDED', 'APPROVED', 'OFFERED', 'ACCEPTED', 'DECLINED', 'APPOINTED', 'WITHDRAWN'];
const FIELDS = ['status', 'council_approval_date', 'letter_reference', 'effective_date', 'remarks'];

function parse(body) {
  return {
    status: oneOf(body.status, STATUSES),
    council_approval_date: date(body.council_approval_date),
    letter_reference: str(body.letter_reference, 100),
    effective_date: date(body.effective_date),
    remarks: str(body.remarks, 3000),
  };
}

r.get(
  '/',
  requireRole('REGISTRAR', 'ADMIN'),
  h((req, res) => {
    const { db } = req.ctx;
    const scope = req.user.role === 'REGISTRAR' && req.user.faculty_id ? ' WHERE v.faculty_id = ?' : '';
    const rows = db
      .prepare(
        `SELECT ar.*, a.reference_no, a.name_with_initials, p.title AS position_title, d.name AS department_name, cs.decision_code, cs.category_code
         FROM appointment_records ar JOIN applications a ON a.id = ar.application_id JOIN vacancies v ON v.id = a.vacancy_id
         JOIN positions p ON p.id = v.position_id JOIN departments d ON d.id = v.department_id
         LEFT JOIN current_shortlist cs ON cs.application_id = a.id${scope}
         ORDER BY ar.updated_at DESC`,
      )
      .all(...(scope ? [req.user.faculty_id] : []));
    res.json({ appointments: rows });
  }),
);

r.post(
  '/',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const app = getApplicationRow(db, toInt(req.body.application_id));
    assertCanView(db, req.user, app);
    if (app.decision_code !== 'SELECTED') throw badRequest('Appointment records can only be created for selected candidates.');
    const v = parse(req.body);
    if (!v.status) throw badRequest('Status is required.');
    const t = now();
    const id = tx(db, () => {
      const info = db
        .prepare(`INSERT INTO appointment_records (application_id, ${FIELDS.join(', ')}, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(app.id, ...FIELDS.map((f) => v[f]), req.user.id, t, t);
      audit(req, 'APPOINTMENT_CREATED', 'appointment', info.lastInsertRowid, null, { application_id: app.id, reference_no: app.reference_no, ...v });
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
    const before = db.prepare('SELECT * FROM appointment_records WHERE id = ?').get(toInt(req.params.id));
    if (!before) throw notFound('Appointment record not found.');
    assertCanView(db, req.user, getApplicationRow(db, before.application_id));
    const v = parse(req.body);
    if (!v.status) throw badRequest('Status is required.');
    tx(db, () => {
      db.prepare(`UPDATE appointment_records SET ${FIELDS.map((f) => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`).run(...FIELDS.map((f) => v[f]), now(), before.id);
      const d = diff(before, v, FIELDS);
      if (d) audit(req, 'APPOINTMENT_UPDATED', 'appointment', before.id, d[0], d[1]);
    });
    res.json({ ok: true });
  }),
);

export default r;
