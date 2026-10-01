import { Router } from 'express';
import { h, badRequest, now, toInt, str, sendCsv } from '../lib/util.js';
import { requireRole } from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/mail.js';
import { appSelect, label } from '../lib/applications.js';
import { tx } from '../db.js';

const r = Router();
const STAFF = ['REGISTRAR', 'ADMIN'];

function shortlistRows(db, q, user) {
  const where = ["a.status <> 'DRAFT'"];
  const params = [];
  const decision = ['SELECTED', 'REJECTED', 'PENDING'].includes(q.decision) ? q.decision : 'SELECTED';
  where.push('cs.decision_code = ?');
  params.push(decision);
  if (user.role === 'REGISTRAR' && user.faculty_id) {
    where.push('v.faculty_id = ?');
    params.push(user.faculty_id);
  }
  for (const [k, col] of [['vacancy_id', 'a.vacancy_id'], ['department_id', 'v.department_id'], ['faculty_id', 'v.faculty_id']]) {
    if (toInt(q[k])) {
      where.push(`${col} = ?`);
      params.push(toInt(q[k]));
    }
  }
  if (['CATEGORY_I', 'CATEGORY_II', 'CATEGORY_III'].includes(q.category)) {
    where.push('cs.category_code = ?');
    params.push(q.category);
  }
  const rows = db.prepare(`${appSelect} WHERE ${where.join(' AND ')} ORDER BY p.sort_order, d.name, cs.category_code, a.reference_no`).all(...params);
  const shareStmt = db.prepare(
    `SELECT s.recipient_role, MAX(s.shared_at) AS shared_at FROM shortlist_share_items si JOIN shortlist_shares s ON s.id = si.share_id
     WHERE si.application_id = ? GROUP BY s.recipient_role`,
  );
  return rows.map((a) => {
    const shares = shareStmt.all(a.id);
    return {
      id: a.id,
      reference_no: a.reference_no,
      applicant_name: a.name_in_full,
      name_with_initials: a.name_with_initials,
      email: a.email,
      mobile: a.mobile,
      vacancy_id: a.vacancy_id,
      position_title: a.position_title,
      department_id: a.department_id,
      department_name: a.department_name,
      faculty_id: a.faculty_id,
      faculty_name: a.faculty_name,
      decision_code: a.decision_code,
      category_code: a.category_code,
      decision_remarks: a.decision_remarks,
      decided_at: a.decided_at,
      shared_with_hod_at: shares.find((s) => s.recipient_role === 'HOD')?.shared_at || null,
      shared_with_dean_at: shares.find((s) => s.recipient_role === 'DEAN')?.shared_at || null,
    };
  });
}

r.get(
  '/',
  requireRole(...STAFF),
  h((req, res) => {
    let rows = shortlistRows(req.ctx.db, req.query, req.user);
    if (req.query.shared === 'no') rows = rows.filter((x) => !x.shared_with_hod_at || !x.shared_with_dean_at);
    if (req.query.shared === 'yes') rows = rows.filter((x) => x.shared_with_hod_at && x.shared_with_dean_at);
    res.json({ applications: rows });
  }),
);

r.get(
  '/export.csv',
  requireRole(...STAFF),
  h((req, res) => {
    const rows = shortlistRows(req.ctx.db, req.query, req.user);
    audit(req, 'SHORTLIST_EXPORTED', 'report', 'shortlist.csv', null, { filters: req.query, count: rows.length });
    sendCsv(
      res,
      `shortlist-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Reference', 'Applicant Name', 'Name with Initials', 'Email', 'Mobile', 'Position', 'Department', 'Faculty', 'Decision', 'Category', 'Remarks', 'Decided At', 'Shared with HOD', 'Shared with Dean'],
      rows.map((x) => [x.reference_no, x.applicant_name, x.name_with_initials, x.email, x.mobile, x.position_title, x.department_name, x.faculty_name, label(x.decision_code), label(x.category_code), x.decision_remarks, x.decided_at, x.shared_with_hod_at || '', x.shared_with_dean_at || '']),
    );
  }),
);

r.post(
  '/share',
  requireRole('REGISTRAR'),
  h((req, res) => {
    const { db } = req.ctx;
    const ids = [...new Set((Array.isArray(req.body.application_ids) ? req.body.application_ids : []).map(toInt).filter(Boolean))];
    if (!ids.length) throw badRequest('Select at least one candidate to share.');
    const note = str(req.body.note, 1000);

    const rows = ids.map((id) => db.prepare(`${appSelect} WHERE a.id = ?`).get(id));
    const problems = [];
    rows.forEach((a, i) => {
      if (!a || a.status === 'DRAFT' || (req.user.faculty_id && a.faculty_id !== req.user.faculty_id)) problems.push(`Application #${ids[i]} was not found.`);
      else if (a.decision_code !== 'SELECTED') problems.push(`${a.reference_no} (${a.name_with_initials}) is ${a.decision_code ? label(a.decision_code) : 'undecided'} – only Selected candidates can be shared.`);
    });
    if (problems.length) throw badRequest('Only selected candidates can be shared with the HOD and Dean.', { problems });

    // One HOD share and one Dean share per vacancy.
    const byVacancy = new Map();
    for (const a of rows) {
      if (!byVacancy.has(a.vacancy_id)) byVacancy.set(a.vacancy_id, []);
      byVacancy.get(a.vacancy_id).push(a);
    }
    const t = now();
    const created = tx(db, () => {
      const out = [];
      for (const [vacancyId, apps] of byVacancy) {
        const { department_id: deptId, faculty_id: facId } = apps[0];
        for (const [role, unitCol, unit] of [['HOD', 'department_id', deptId], ['DEAN', 'faculty_id', facId]]) {
          const info = db
            .prepare(`INSERT INTO shortlist_shares (vacancy_id, recipient_role, ${unitCol}, note, shared_by, shared_at) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(vacancyId, role, unit, note, req.user.id, t);
          const shareId = Number(info.lastInsertRowid);
          const ins = db.prepare('INSERT INTO shortlist_share_items (share_id, application_id) VALUES (?, ?)');
          apps.forEach((a) => ins.run(shareId, a.id));
          audit(req, 'SHORTLIST_SHARED', 'shortlist_share', shareId, null, {
            recipient_role: role,
            [unitCol]: unit,
            vacancy_id: vacancyId,
            candidates: apps.map((a) => a.reference_no),
          });
          out.push({ shareId, role, unitCol, unit, apps });
        }
      }
      return out;
    });

    for (const s of created) {
      const recipients = db.prepare(`SELECT id, email, full_name FROM users WHERE role = ? AND ${s.unitCol} = ? AND is_active = 1`).all(s.role, s.unit);
      const a0 = s.apps[0];
      for (const u of recipients) {
        notify(req.ctx, {
          userId: u.id,
          email: u.email,
          type: 'SHORTLIST_SHARED',
          subject: `Shortlisted candidates shared – ${a0.position_title}, ${a0.department_name}`,
          body:
            `Dear ${u.full_name},\n\n${s.apps.length} selected candidate(s) for the post of ${a0.position_title} (${a0.department_name}) have been shared with you ` +
            `for review.\n\n${s.apps.map((a) => `- ${a.reference_no}  ${a.name_with_initials}${a.category_code ? ' (' + label(a.category_code) + ')' : ''}`).join('\n')}\n\n` +
            `${note ? `Note from the Registrar: ${note}\n\n` : ''}Please log in to ${req.ctx.config.publicUrl} to view the applications.`,
        });
      }
    }
    res.json({ shares: created.map((s) => ({ id: s.shareId, recipient_role: s.role, count: s.apps.length })) });
  }),
);

r.get(
  '/shares',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const scope = req.user.role === 'REGISTRAR' && req.user.faculty_id ? 'WHERE v.faculty_id = ?' : '';
    const rows = db
      .prepare(
        `SELECT s.id, s.recipient_role, s.note, s.shared_at, u.full_name AS shared_by_name, p.title AS position_title,
                d.name AS department_name, f.name AS faculty_name, rd.name AS recipient_department, rf.name AS recipient_faculty
         FROM shortlist_shares s
         JOIN users u ON u.id = s.shared_by
         JOIN vacancies v ON v.id = s.vacancy_id
         JOIN positions p ON p.id = v.position_id
         JOIN departments d ON d.id = v.department_id
         JOIN faculties f ON f.id = v.faculty_id
         LEFT JOIN departments rd ON rd.id = s.department_id
         LEFT JOIN faculties rf ON rf.id = s.faculty_id
         ${scope} ORDER BY s.id DESC LIMIT 500`,
      )
      .all(...(scope ? [req.user.faculty_id] : []));
    const items = db.prepare(
      `SELECT a.id, a.reference_no, a.name_with_initials FROM shortlist_share_items si JOIN applications a ON a.id = si.application_id WHERE si.share_id = ? ORDER BY a.reference_no`,
    );
    res.json({ shares: rows.map((s) => ({ ...s, recipient_unit: s.recipient_role === 'HOD' ? s.recipient_department : s.recipient_faculty, candidates: items.all(s.id) })) });
  }),
);

export default r;
