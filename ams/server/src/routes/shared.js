import { Router } from 'express';
import { h, sendCsv, toInt } from '../lib/util.js';
import { requireRole } from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import { appSelect, label, getFullApplication } from '../lib/applications.js';
import { generateCandidateReportPdf } from '../pdf/reportPdf.js';

const r = Router();

/**
 * Applications shared with the current HOD (department) or Dean (faculty)
 * that are still SELECTED. Unshared, rejected and pending applications are
 * never returned.
 */
export function sharedApplications(db, user, q = {}) {
  const unitCol = user.role === 'HOD' ? 'department_id' : 'faculty_id';
  const unit = user.role === 'HOD' ? user.department_id : user.faculty_id;
  if (!unit) return [];
  const params = [user.role, unit];
  let extra = '';
  if (toInt(q.vacancy_id)) {
    extra = ' AND a.vacancy_id = ?';
    params.push(toInt(q.vacancy_id));
  }
  return db
    .prepare(
      `${appSelect}
       JOIN (SELECT si.application_id, MAX(s.shared_at) AS shared_at
             FROM shortlist_share_items si JOIN shortlist_shares s ON s.id = si.share_id
             WHERE s.recipient_role = ? AND s.${unitCol} = ? GROUP BY si.application_id) sh ON sh.application_id = a.id
       WHERE cs.decision_code = 'SELECTED' AND a.status <> 'DRAFT'${extra}
       ORDER BY p.sort_order, cs.category_code, a.reference_no`,
    )
    .all(...params);
}

r.get(
  '/applications',
  requireRole('HOD', 'DEAN'),
  h((req, res) => {
    const { db } = req.ctx;
    const rows = sharedApplications(db, req.user, req.query);
    res.json({
      applications: rows.map((a) => ({
        id: a.id,
        reference_no: a.reference_no,
        applicant_name: a.name_in_full,
        name_with_initials: a.name_with_initials,
        position_title: a.position_title,
        department_name: a.department_name,
        faculty_name: a.faculty_name,
        vacancy_id: a.vacancy_id,
        category_code: a.category_code,
        decision_code: a.decision_code,
        submitted_at: a.submitted_at,
        shared_at: a.shared_at,
      })),
    });
  }),
);

r.get(
  '/export.csv',
  requireRole('HOD', 'DEAN'),
  h((req, res) => {
    const { db } = req.ctx;
    const rows = sharedApplications(db, req.user, req.query);
    audit(req, 'SHARED_SHORTLIST_DOWNLOADED', 'report', 'shared.csv', null, { count: rows.length, format: 'csv' });
    sendCsv(
      res,
      `shared-shortlist-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Reference', 'Applicant Name', 'Name with Initials', 'Email', 'Mobile', 'Position', 'Department', 'Faculty', 'Decision', 'Category', 'Submitted At'],
      rows.map((a) => [a.reference_no, a.name_in_full, a.name_with_initials, a.email, a.mobile, a.position_title, a.department_name, a.faculty_name, label(a.decision_code), label(a.category_code), a.submitted_at]),
    );
  }),
);

r.get(
  '/export.pdf',
  requireRole('HOD', 'DEAN'),
  h(async (req, res) => {
    const { db } = req.ctx;
    const rows = sharedApplications(db, req.user, req.query).map((a) => getFullApplication(db, a.id));
    const unitName = req.user.role === 'HOD'
      ? db.prepare('SELECT name FROM departments WHERE id = ?').get(req.user.department_id)?.name
      : db.prepare('SELECT name FROM faculties WHERE id = ?').get(req.user.faculty_id)?.name;
    const buf = await generateCandidateReportPdf(rows, req.ctx, { title: 'Shared Shortlist of Selected Candidates', subtitle: unitName || '' });
    audit(req, 'SHARED_SHORTLIST_DOWNLOADED', 'report', 'shared.pdf', null, { count: rows.length, format: 'pdf' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="shared-shortlist-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.send(buf);
  }),
);

export default r;
