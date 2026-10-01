import { Router } from 'express';
import { h, badRequest, HttpError, now, isEmail, str, date } from '../lib/util.js';
import { hashPassword, verifyPassword, passwordPolicyErrors, rateLimit, randomToken, sha256 } from '../lib/security.js';
import { createSession, destroySession } from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/mail.js';
import { tx } from '../db.js';

const r = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, message: 'Too many attempts. Please wait 15 minutes and try again.' });
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

function publicUser(db, id) {
  const u = db
    .prepare(
      `SELECT u.id, u.email, u.role, u.full_name, u.faculty_id, u.department_id, u.must_change_password,
              f.name AS faculty_name, d.name AS department_name
       FROM users u LEFT JOIN faculties f ON f.id = u.faculty_id LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = ?`,
    )
    .get(id);
  return u ? { ...u, must_change_password: !!u.must_change_password } : null;
}

r.post(
  '/register',
  authLimiter,
  h((req, res) => {
    const { db } = req.ctx;
    const email = str(req.body.email, 200)?.toLowerCase();
    const title = str(req.body.title, 10);
    const surname = str(req.body.surname, 120);
    const nameWithInitials = str(req.body.name_with_initials, 200);
    const nic = str(req.body.nic, 12)?.toUpperCase() || null;
    const passport = str(req.body.passport_no, 20);
    const mobile = str(req.body.mobile, 20);
    const dob = date(req.body.date_of_birth);
    const password = req.body.password;

    if (!email || !isEmail(email)) throw badRequest('A valid email address is required.');
    if (!surname || !nameWithInitials) throw badRequest('Surname and name with initials are required.');
    if (!nic && !passport) throw badRequest('NIC number is required (or a passport number if you do not have an NIC).');
    if (nic && !/^(\d{9}[VX]|\d{12})$/.test(nic)) throw badRequest('NIC must be 9 digits followed by V/X, or 12 digits.');
    if (!mobile) throw badRequest('Mobile number is required.');
    const pwErrors = passwordPolicyErrors(password);
    if (pwErrors.length) throw badRequest(`Password must contain ${pwErrors.join(', ')}.`);
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new HttpError(409, 'An account with this email already exists. Please log in or reset your password.');

    const t = now();
    const userId = tx(db, () => {
      const info = db
        .prepare(
          `INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at) VALUES (?, ?, 'APPLICANT', ?, ?, ?)`,
        )
        .run(email, hashPassword(password), `${title ? title + '. ' : ''}${nameWithInitials}`, t, t);
      const id = Number(info.lastInsertRowid);
      db.prepare(
        `INSERT INTO applicant_profiles (user_id, title, surname, name_with_initials, nic, passport_no, mobile, date_of_birth, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, title, surname, nameWithInitials, nic, passport, mobile, dob, t);
      req.user = { id, role: 'APPLICANT' };
      audit(req, 'APPLICANT_REGISTERED', 'user', id, null, { email });
      return id;
    });
    notify(req.ctx, {
      userId,
      email,
      type: 'ACCOUNT_CREATED',
      subject: 'University of Peradeniya – Recruitment account created',
      body: `Dear ${nameWithInitials},\n\nYour applicant account for the University of Peradeniya Application Management System has been created.\n\nYou can log in at ${req.ctx.config.publicUrl}/login using ${email}.\n\nDeputy Registrar / Academic Establishments`,
    });
    const csrf = createSession(req, res, { id: userId });
    res.status(201).json({ user: publicUser(db, userId), csrfToken: csrf });
  }),
);

r.post(
  '/login',
  authLimiter,
  h((req, res) => {
    const { db } = req.ctx;
    const email = str(req.body.email, 200)?.toLowerCase();
    const password = String(req.body.password || '');
    const user = email ? db.prepare('SELECT * FROM users WHERE email = ?').get(email) : null;
    const t = now();
    if (user?.locked_until && user.locked_until > t) {
      throw new HttpError(423, 'This account is temporarily locked after repeated failed attempts. Please try again later or reset your password.');
    }
    if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
      if (user) {
        const failed = user.failed_logins + 1;
        const lock = failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
        db.prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?').run(lock ? 0 : failed, lock, user.id);
        req.user = { id: user.id, role: user.role };
        audit(req, 'LOGIN_FAILED', 'user', user.id, null, { locked: !!lock });
        req.user = null;
      }
      throw new HttpError(401, 'Invalid email or password.');
    }
    db.prepare('UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = ? WHERE id = ?').run(t, user.id);
    // Session fixation defence: always issue a fresh session.
    destroySession(req, res);
    const csrf = createSession(req, res, user);
    req.user = { id: user.id, role: user.role };
    audit(req, 'LOGIN', 'user', user.id);
    res.json({ user: publicUser(db, user.id), csrfToken: csrf });
  }),
);

r.post(
  '/logout',
  h((req, res) => {
    if (req.user) audit(req, 'LOGOUT', 'user', req.user.id);
    destroySession(req, res);
    res.json({ ok: true });
  }),
);

r.get(
  '/me',
  h((req, res) => {
    if (!req.user) return res.json({ user: null });
    res.json({ user: publicUser(req.ctx.db, req.user.id), csrfToken: req.session.csrf });
  }),
);

r.post(
  '/change-password',
  authLimiter,
  h((req, res) => {
    const { db } = req.ctx;
    if (!req.user) throw new HttpError(401, 'Please log in to continue.');
    const { current_password: current, new_password: next } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!verifyPassword(String(current || ''), user.password_hash)) throw badRequest('Your current password is incorrect.');
    const errors = passwordPolicyErrors(next);
    if (errors.length) throw badRequest(`Password must contain ${errors.join(', ')}.`);
    if (verifyPassword(next, user.password_hash)) throw badRequest('The new password must be different from the current password.');
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?').run(hashPassword(next), now(), user.id);
    // Invalidate all other sessions for this user.
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?').run(user.id, req.session.id);
    audit(req, 'PASSWORD_CHANGED', 'user', user.id);
    res.json({ user: publicUser(db, user.id) });
  }),
);

r.post(
  '/forgot-password',
  authLimiter,
  h((req, res) => {
    const { db, config } = req.ctx;
    const email = str(req.body.email, 200)?.toLowerCase();
    const user = email ? db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email) : null;
    if (user) {
      const token = randomToken();
      db.prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(
        user.id,
        sha256(token),
        new Date(Date.now() + 60 * 60_000).toISOString(),
      );
      notify(req.ctx, {
        userId: user.id,
        email: user.email,
        type: 'PASSWORD_RESET',
        subject: 'University of Peradeniya AMS – password reset',
        body: `A password reset was requested for your account.\n\nUse this link within 60 minutes:\n${config.publicUrl}/reset-password#${token}\n\nIf you did not request this, you can ignore this email.`,
      });
      req.user = { id: user.id, role: user.role };
      audit(req, 'PASSWORD_RESET_REQUESTED', 'user', user.id);
    }
    // Same response either way to avoid account enumeration.
    res.json({ ok: true, message: 'If an account exists for that email, a reset link has been sent.' });
  }),
);

r.post(
  '/reset-password',
  authLimiter,
  h((req, res) => {
    const { db } = req.ctx;
    const token = String(req.body.token || '');
    const row = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(sha256(token));
    if (!row || row.used_at || row.expires_at < now()) throw badRequest('This reset link is invalid or has expired.');
    const errors = passwordPolicyErrors(req.body.new_password);
    if (errors.length) throw badRequest(`Password must contain ${errors.join(', ')}.`);
    tx(db, () => {
      db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?').run(
        hashPassword(req.body.new_password),
        now(),
        row.user_id,
      );
      db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(now(), row.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.user_id);
      const u = db.prepare('SELECT id, role FROM users WHERE id = ?').get(row.user_id);
      req.user = { id: u.id, role: u.role };
      audit(req, 'PASSWORD_RESET', 'user', u.id);
    });
    res.json({ ok: true });
  }),
);

export default r;
