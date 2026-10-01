import { Router } from 'express';
import { h, badRequest, HttpError, now, str, oneOf } from '../lib/util.js';
import { rateLimit } from '../lib/security.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/mail.js';
import { resolveRefereeToken } from '../lib/referees.js';
import { tx } from '../db.js';

/**
 * Public referee-report endpoints. The token travels in the request body
 * (the emailed link carries it in the URL fragment, which is never sent to
 * the server or logged). A token grants access to one report form only and
 * reveals nothing beyond the applicant's name and post.
 */
const r = Router();
const limiter = rateLimit({ windowMs: 15 * 60_000, max: 60 });

export const RATING_ITEMS = [
  ['subject_knowledge', 'Knowledge of the subject'],
  ['teaching_ability', 'Teaching / communication ability'],
  ['research_ability', 'Research ability and output'],
  ['integrity', 'Integrity and character'],
  ['teamwork', 'Ability to work with others'],
  ['leadership', 'Leadership and initiative'],
];
const RATING_VALUES = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'AVERAGE', 'POOR', 'NOT_KNOWN'];

const ERRORS = {
  invalid: [404, 'This referee link is not valid.'],
  submitted: [409, 'A report has already been submitted using this link. Thank you.'],
  revoked: [410, 'This link has been replaced by a newer request. Please use the most recent email you received.'],
  expired: [410, 'This referee link has expired. Please contact the Academic Establishments Division for a new link.'],
};

function context(db, request) {
  const row = db
    .prepare(
      `SELECT a.title, a.name_in_full, a.name_with_initials, a.reference_no, p.title AS position_title, d.name AS department_name,
              f.name AS faculty_name, rf.name AS referee_name, rf.designation AS referee_designation, rf.seq
       FROM applications a JOIN vacancies v ON v.id = a.vacancy_id JOIN positions p ON p.id = v.position_id
       JOIN departments d ON d.id = v.department_id JOIN faculties f ON f.id = v.faculty_id
       JOIN referees rf ON rf.id = ? WHERE a.id = ?`,
    )
    .get(request.referee_id, request.application_id);
  return {
    applicant_name: `${row.title ? row.title + '. ' : ''}${row.name_in_full}`,
    reference_no: row.reference_no,
    position_title: row.position_title,
    department_name: row.department_name,
    faculty_name: row.faculty_name,
    referee_name: row.referee_name,
    referee_designation: row.referee_designation,
    expires_at: request.expires_at,
  };
}

r.post(
  '/lookup',
  limiter,
  h((req, res) => {
    const { db } = req.ctx;
    const result = resolveRefereeToken(db, req.body.token);
    if (result.error) throw new HttpError(...ERRORS[result.error]);
    if (!result.request.opened_at) db.prepare('UPDATE referee_requests SET opened_at = ? WHERE id = ?').run(now(), result.request.id);
    res.json({ context: context(db, result.request), rating_items: RATING_ITEMS, rating_values: RATING_VALUES });
  }),
);

r.post(
  '/submit',
  limiter,
  h((req, res) => {
    const { db } = req.ctx;
    const result = resolveRefereeToken(db, req.body.token);
    if (result.error) throw new HttpError(...ERRORS[result.error]);
    const rq = result.request;
    const b = req.body;
    const ratings = {};
    for (const [key] of RATING_ITEMS) ratings[key] = oneOf(b.ratings?.[key] || 'NOT_KNOWN', RATING_VALUES);
    const report = {
      referee_name: str(b.referee_name, 200),
      referee_designation: str(b.referee_designation, 200),
      relationship: str(b.relationship, 500),
      known_since: str(b.known_since, 50),
      strengths: str(b.strengths, 5000),
      weaknesses: str(b.weaknesses, 5000),
      comments: str(b.comments, 10000),
      recommendation: oneOf(b.recommendation, ['HIGHLY_RECOMMENDED', 'RECOMMENDED', 'RECOMMENDED_WITH_RESERVATIONS', 'NOT_RECOMMENDED']),
    };
    if (!report.referee_name || !report.relationship || !report.recommendation) throw badRequest('Your name, how you know the applicant and your recommendation are required.');
    if (b.non_related_confirmed !== true) throw badRequest('Please confirm that you are not related to the applicant.');
    const t = now();
    const app = tx(db, () => {
      const fresh = db.prepare('SELECT status FROM referee_requests WHERE id = ?').get(rq.id);
      if (fresh.status !== 'SENT') throw new HttpError(...ERRORS.submitted);
      db.prepare(
        `INSERT INTO referee_reports (referee_request_id, application_id, referee_name, referee_designation, relationship, known_since, ratings,
           strengths, weaknesses, comments, recommendation, is_related_declared, submitted_at, submitted_ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      ).run(rq.id, rq.application_id, report.referee_name, report.referee_designation, report.relationship, report.known_since, JSON.stringify(ratings),
        report.strengths, report.weaknesses, report.comments, report.recommendation, t, req.ip);
      db.prepare("UPDATE referee_requests SET status = 'SUBMITTED', submitted_at = ? WHERE id = ?").run(t, rq.id);
      audit(req, 'REFEREE_REPORT_SUBMITTED', 'application', rq.application_id, null, { referee_id: rq.referee_id, request_id: rq.id });
      return db.prepare('SELECT applicant_id, reference_no FROM applications WHERE id = ?').get(rq.application_id);
    });
    notify(req.ctx, {
      userId: app.applicant_id,
      type: 'REFEREE_REPORT_RECEIVED',
      applicationId: rq.application_id,
      subject: `A referee report has been received for application ${app.reference_no}`,
      body: 'One of your referees has submitted their confidential report. The contents of referee reports are not disclosed to applicants.',
    });
    res.json({ ok: true });
  }),
);

export default r;
