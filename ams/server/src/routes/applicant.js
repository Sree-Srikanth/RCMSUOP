import { Router } from 'express';
import { h, badRequest, now, str, date, toInt } from '../lib/util.js';
import { requireAuth, requireRole } from '../lib/auth.js';
import { audit, diff } from '../lib/audit.js';
import { documentRequirements, getFullApplication, validateForSubmission } from '../lib/applications.js';
import { dateSL } from './vacancies.js';

const r = Router();

const PROFILE_FIELDS = [
  'title', 'surname', 'name_in_full', 'name_with_initials', 'nic', 'passport_no', 'date_of_birth', 'mobile',
  'phone_residence', 'phone_office', 'address_line1', 'address_line2', 'city', 'province_id', 'district_id', 'postal_code',
];

r.get(
  '/profile',
  requireRole('APPLICANT'),
  h((req, res) => {
    const { db } = req.ctx;
    const p = db.prepare('SELECT * FROM applicant_profiles WHERE user_id = ?').get(req.user.id) || { user_id: req.user.id };
    res.json({ profile: { ...p, email: req.user.email } });
  }),
);

r.put(
  '/profile',
  requireRole('APPLICANT'),
  h((req, res) => {
    const { db } = req.ctx;
    const b = req.body;
    const p = {
      title: str(b.title, 10),
      surname: str(b.surname, 120),
      name_in_full: str(b.name_in_full, 300),
      name_with_initials: str(b.name_with_initials, 200),
      nic: str(b.nic, 12)?.toUpperCase() || null,
      passport_no: str(b.passport_no, 20),
      date_of_birth: date(b.date_of_birth),
      mobile: str(b.mobile, 20),
      phone_residence: str(b.phone_residence, 20),
      phone_office: str(b.phone_office, 20),
      address_line1: str(b.address_line1, 300),
      address_line2: str(b.address_line2, 300),
      city: str(b.city, 100),
      province_id: toInt(b.province_id),
      district_id: toInt(b.district_id),
      postal_code: str(b.postal_code, 10),
    };
    if (!p.surname || !p.name_with_initials) throw badRequest('Surname and name with initials are required.');
    if (p.nic && !/^(\d{9}[VX]|\d{12})$/.test(p.nic)) throw badRequest('NIC must be 9 digits followed by V/X, or 12 digits.');
    if (p.district_id && !db.prepare('SELECT 1 FROM districts WHERE id = ? AND province_id = ?').get(p.district_id, p.province_id)) {
      throw badRequest('The selected district does not belong to the selected province.');
    }
    const before = db.prepare('SELECT * FROM applicant_profiles WHERE user_id = ?').get(req.user.id);
    db.prepare(
      `INSERT INTO applicant_profiles (user_id, ${PROFILE_FIELDS.join(', ')}, updated_at) VALUES (?, ${PROFILE_FIELDS.map(() => '?').join(', ')}, ?)
       ON CONFLICT(user_id) DO UPDATE SET ${PROFILE_FIELDS.map((f) => `${f} = excluded.${f}`).join(', ')}, updated_at = excluded.updated_at`,
    ).run(req.user.id, ...PROFILE_FIELDS.map((f) => p[f]), now());
    db.prepare('UPDATE users SET full_name = ?, updated_at = ? WHERE id = ?').run(`${p.title ? p.title + '. ' : ''}${p.name_with_initials}`, now(), req.user.id);
    const d = diff(before, p, PROFILE_FIELDS);
    if (d) audit(req, 'PROFILE_UPDATED', 'user', req.user.id, d[0], d[1]);
    res.json({ profile: { ...db.prepare('SELECT * FROM applicant_profiles WHERE user_id = ?').get(req.user.id), email: req.user.email } });
  }),
);

r.get(
  '/applications',
  requireRole('APPLICANT'),
  h((req, res) => {
    const { db } = req.ctx;
    const ids = db.prepare('SELECT id FROM applications WHERE applicant_id = ? ORDER BY id DESC').all(req.user.id);
    const applications = ids.map(({ id }) => {
      const full = getFullApplication(db, id);
      const docs = documentRequirements(full);
      const issues = full.status === 'DRAFT' ? validateForSubmission(full) : [];
      return {
        id: full.id,
        reference_no: full.reference_no,
        status: full.status,
        submitted_at: full.submitted_at,
        updated_at: full.updated_at,
        vacancy_id: full.vacancy_id,
        position_title: full.position_title,
        department_name: full.department_name,
        faculty_name: full.faculty_name,
        discipline: full.discipline,
        closing_date: full.closing_date,
        closing_date_local: dateSL(full.closing_date),
        hard_copy_instructions: full.hard_copy_instructions,
        referee_status: full.referee_status,
        outstanding: issues.length,
        outstanding_items: issues.slice(0, 50),
        missing_documents: docs.filter((d) => d.mandatory && !d.uploaded).map((d) => d.label),
      };
    });
    res.json({ applications });
  }),
);

r.get(
  '/notifications',
  requireAuth,
  h((req, res) => {
    const { db } = req.ctx;
    const rows = db
      .prepare(
        `SELECT n.id, n.type, n.subject, n.body, n.status, n.is_read, n.created_at, n.application_id, a.reference_no
         FROM notifications n LEFT JOIN applications a ON a.id = n.application_id
         WHERE n.user_id = ? ORDER BY n.id DESC LIMIT 200`,
      )
      .all(req.user.id);
    res.json({ notifications: rows, unread: rows.filter((n) => !n.is_read).length });
  }),
);

r.post(
  '/notifications/read',
  requireAuth,
  h((req, res) => {
    req.ctx.db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ ok: true });
  }),
);

export default r;
