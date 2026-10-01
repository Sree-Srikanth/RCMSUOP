import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import { now } from './util.js';

/**
 * Builds the mail transport. With SMTP_HOST configured, real SMTP is used;
 * otherwise messages are written as .eml files to storage/outbox so they can
 * be inspected (and the Administrator's Email Outbox page lists them).
 */
export function createMailer(config) {
  if (config.smtp?.host) {
    const transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
    return { transport, outboxDir: null };
  }
  const outboxDir = path.join(config.storageDir, 'outbox');
  fs.mkdirSync(outboxDir, { recursive: true });
  return { transport: nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' }), outboxDir };
}

/**
 * Records a notification and delivers it by email (when an address is given).
 * Delivery happens after the current request's DB work so a mail failure can
 * never roll back an application/decision write.
 */
export function notify(ctx, { userId = null, email = null, type, subject, body, applicationId = null, attachments = [] }) {
  const { db, mailer, config } = ctx;
  const info = db
    .prepare(
      `INSERT INTO notifications (user_id, recipient_email, type, subject, body, application_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(userId, email, type, subject, body, applicationId, email ? 'QUEUED' : 'IN_APP', now());
  const id = Number(info.lastInsertRowid);
  if (!email) return id;

  const deliver = async () => {
    // The surrounding transaction may have rolled back: never send for a vanished record.
    if (!db.prepare("SELECT 1 FROM notifications WHERE id = ? AND status = 'QUEUED'").get(id)) return;
    try {
      const atts = typeof attachments === 'function' ? await attachments() : attachments;
      const result = await mailer.transport.sendMail({
        from: config.mailFrom,
        to: email,
        subject,
        text: body,
        attachments: atts,
      });
      if (mailer.outboxDir && result.message) {
        fs.writeFileSync(path.join(mailer.outboxDir, `${String(id).padStart(6, '0')}.eml`), result.message);
      }
      db.prepare("UPDATE notifications SET status = 'SENT', sent_at = ? WHERE id = ?").run(now(), id);
    } catch (err) {
      db.prepare("UPDATE notifications SET status = 'FAILED', error = ? WHERE id = ?").run(String(err.message).slice(0, 500), id);
    }
  };
  ctx.pendingMail ??= new Set();
  const p = new Promise((resolve) => setImmediate(() => deliver().finally(resolve)));
  ctx.pendingMail.add(p);
  p.finally(() => ctx.pendingMail.delete(p));
  return id;
}

/** Test helper: wait for queued mail deliveries. */
export async function flushMail(ctx) {
  while (ctx.pendingMail?.size) await Promise.all([...ctx.pendingMail]);
}
