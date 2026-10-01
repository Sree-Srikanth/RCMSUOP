import { randomToken, sha256 } from './security.js';
import { getSetting } from '../db.js';
import { notify } from './mail.js';
import { now } from './util.js';

/**
 * Creates a referee-report request with a single-use secure token and emails
 * the referee an individual link. Returns the request id. Any older open
 * request for the same referee is revoked.
 */
export function createRefereeRequest(ctx, { app, referee, createdBy }) {
  const { db, config } = ctx;
  const token = randomToken(32);
  const days = Number(getSetting(db, 'referee_token_days', '21'));
  const t = now();
  const expires = new Date(Date.now() + days * 86400_000).toISOString();
  db.prepare("UPDATE referee_requests SET status = 'REVOKED' WHERE referee_id = ? AND status = 'SENT'").run(referee.id);
  const info = db
    .prepare(
      `INSERT INTO referee_requests (referee_id, application_id, token_hash, status, sent_at, expires_at, created_by)
       VALUES (?, ?, ?, 'SENT', ?, ?, ?)`,
    )
    .run(referee.id, app.id, sha256(token), t, expires, createdBy ?? null);
  const link = `${config.publicUrl}/referee#${token}`;
  notify(ctx, {
    email: referee.email,
    type: 'REFEREE_REQUEST',
    applicationId: app.id,
    subject: `Confidential referee report request – ${app.name_with_initials || app.name_in_full} – ${app.position_title}`,
    body:
      `Dear ${referee.name},\n\n` +
      `${app.title ? app.title + '. ' : ''}${app.name_in_full || app.name_with_initials} has applied for the post of ${app.position_title} ` +
      `in the ${app.department_name}, ${app.faculty_name}, University of Peradeniya (Application Ref: ${app.reference_no}), ` +
      `and has named you as a non-related referee.\n\n` +
      `We would be grateful if you could submit a confidential referee report using the secure link below. ` +
      `The link is personal to you, can be used once and expires on ${expires.slice(0, 10)}.\n\n${link}\n\n` +
      `Alternatively, a report may be sent directly to the Vice-Chancellor, University of Peradeniya, marked with the name of the applicant, ` +
      `the post applied for and the Department at the top left-hand corner of the envelope.\n\n` +
      `Thank you.\n\nDeputy Registrar / Academic Establishments\nUniversity of Peradeniya`,
  });
  return Number(info.lastInsertRowid);
}

/** Resolves a raw token to an open request (or a reason it is not usable). */
export function resolveRefereeToken(db, token) {
  if (!token || typeof token !== 'string' || token.length < 20) return { error: 'invalid' };
  const rq = db.prepare('SELECT * FROM referee_requests WHERE token_hash = ?').get(sha256(token));
  if (!rq) return { error: 'invalid' };
  if (rq.status === 'SUBMITTED') return { error: 'submitted', request: rq };
  if (rq.status === 'REVOKED') return { error: 'revoked', request: rq };
  if (rq.status === 'EXPIRED' || rq.expires_at < now()) return { error: 'expired', request: rq };
  return { request: rq };
}
