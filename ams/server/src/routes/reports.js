import { Router } from 'express';
import { h, badRequest, notFound, toInt, sendCsv, fmtDate } from '../lib/util.js';
import { requireRole } from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import { getFullApplication, label } from '../lib/applications.js';
import * as S from '../lib/summaries.js';
import { generateCandidateReportPdf, generateSchedulePdf } from '../pdf/reportPdf.js';
import { dateSL } from './vacancies.js';

const r = Router();
const STAFF = ['REGISTRAR', 'ADMIN'];

/**
 * Resolves the vacancies a report covers (by vacancy or department) and
 * enforces the officer's faculty scope.
 */
function resolveScope(req) {
  const { db } = req.ctx;
  const vacancyId = toInt(req.query.vacancy_id);
  const departmentId = toInt(req.query.department_id);
  if (!vacancyId && !departmentId) throw badRequest('Select a vacancy or a department.');
  const vacancies = db
    .prepare(
      `SELECT v.*, p.code AS position_code, p.title AS position_title, p.sort_order, d.name AS department_name, f.name AS faculty_name
       FROM vacancies v JOIN positions p ON p.id = v.position_id JOIN departments d ON d.id = v.department_id JOIN faculties f ON f.id = v.faculty_id
       WHERE ${vacancyId ? 'v.id = ?' : 'v.department_id = ?'} ORDER BY p.sort_order, v.advertised_on`,
    )
    .all(vacancyId || departmentId)
    .filter((v) => !(req.user.role === 'REGISTRAR' && req.user.faculty_id && v.faculty_id !== req.user.faculty_id))
    .map((v) => ({ ...v, closing_date_local: dateSL(v.closing_date) }));
  if (!vacancies.length) throw notFound('No vacancies found for the selected scope.');
  const scope = ['all', 'selected', 'shortlisted'].includes(req.query.scope) ? req.query.scope : 'selected';
  const groups = vacancies.map((v) => {
    const ids = db
      .prepare(
        `SELECT a.id FROM applications a LEFT JOIN current_shortlist cs ON cs.application_id = a.id
         WHERE a.vacancy_id = ? AND a.status <> 'DRAFT' ${scope === 'all' ? '' : "AND cs.decision_code = 'SELECTED'"}
         ORDER BY ${scope === 'all' ? '' : 'cs.category_code, '}a.reference_no`,
      )
      .all(v.id);
    return { vacancy: v, apps: ids.map(({ id }) => getFullApplication(db, id)) };
  });
  const unitName = vacancyId ? `${vacancies[0].position_title} - ${vacancies[0].department_name}` : vacancies[0].department_name;
  return { groups, scope, unitName, departmentName: vacancies[0].department_name, filters: { vacancy_id: vacancyId, department_id: departmentId, scope } };
}

r.get(
  '/candidates',
  requireRole(...STAFF),
  h(async (req, res) => {
    const { groups, scope, unitName, filters } = resolveScope(req);
    const apps = groups.flatMap((g) => g.apps);
    const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
    audit(req, 'REPORT_GENERATED', 'report', 'candidates', null, { ...filters, format, count: apps.length });
    const base = `candidate-report-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'pdf') {
      const buf = await generateCandidateReportPdf(apps, req.ctx, {
        title: scope === 'all' ? 'Candidate Report - All Applicants' : 'Candidate Report - Shortlisted / Selected Candidates',
        subtitle: unitName,
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${base}.pdf"`);
      return res.send(buf);
    }
    sendCsv(
      res,
      `${base}.csv`,
      ['Reference', 'Applicant Name', 'Mobile', 'Email', 'Address', 'University Education', 'Postgraduate Qualifications', 'Previous Employments', 'Books', 'Abstracts', 'Journals', 'Referees', 'Position', 'Department', 'Decision', 'Category'],
      apps.map((a) => [
        a.reference_no, a.name_in_full, a.mobile, a.email, S.addressText(a), S.educationSummary(a.sections), S.postgraduateSummary(a.sections),
        S.previousEmploymentSummary(a.sections), a.counts.books, a.counts.abstracts, a.counts.journals, S.refereesSummary(a.sections),
        a.position_title, a.department_name, label(a.decision_code), label(a.category_code),
      ]),
    );
  }),
);

r.get(
  '/schedule',
  requireRole(...STAFF),
  h(async (req, res) => {
    const { groups, departmentName, filters } = resolveScope(req);
    const format = req.query.format === 'csv' ? 'csv' : 'pdf';
    const count = groups.reduce((n, g) => n + g.apps.length, 0);
    audit(req, 'SCHEDULE_GENERATED', 'report', 'schedule', null, { ...filters, format, count });
    const base = `schedule-${departmentName.replace(/[^A-Za-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'pdf') {
      const buf = await generateSchedulePdf(groups, req.ctx, { departmentName });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${base}.pdf"`);
      return res.send(buf);
    }
    let serial = 0;
    const rows = groups.flatMap((g) =>
      g.apps.map((a) => {
        const s = a.sections;
        serial += 1;
        return [
          serial, a.name_in_full, S.addressText(a), fmtDate(a.date_of_birth), a.age, [a.mobile, a.phone_residence].filter(Boolean).join(' / '),
          a.position_title + (a.category_code ? ` (${label(a.category_code)})` : ''), S.educationSummary(s), S.postgraduateSummary(s), S.otherQualifications(a),
          a.counts.books, a.counts.journals, a.counts.abstracts, S.distinctionsOfType(s, ['MEDAL', 'PRIZE', 'DISTINCTION', 'OTHER']),
          S.distinctionsOfType(s, ['SCHOLARSHIP']), a.extra_curricular, S.currentEmploymentSummary(s), S.previousEmploymentSummary(s),
          S.schedText(a.sched_pc), S.schedText(S.rrStatus(a)), S.schedText(a.sched_tr), a.sched_remarks, a.reference_no,
          fmtDate(g.vacancy.advertised_on), g.vacancy.closing_date_local,
        ];
      }),
    );
    sendCsv(
      res,
      `${base}.csv`,
      ['No', 'Name', 'Address', 'Date of Birth', 'Age', 'Telephone', 'Post Applied', 'First Degree', 'Postgraduate Qualifications', 'Other Qualifications',
        'Books', 'Journals', 'Abstracts', 'Medals/Prizes', 'Scholarships', 'Extra-curricular Activities', 'Current Position', 'Previous Experience',
        'PC', 'RR', 'TR', 'Remarks', 'Reference', 'Advertised On', 'Application Closed On'],
      rows,
    );
  }),
);

export default r;
