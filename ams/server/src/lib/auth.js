import { randomToken, sha256 } from './security.js';
import { getSetting } from '../db.js';
import { now, HttpError, forbidden } from './util.js';

export const SESSION_COOKIE = 'ams_sid';
export const CSRF_COOKIE = 'ams_csrf';

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    try {
      out[k] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      /* ignore malformed cookie */
    }
  }
  return out;
}

function cookieOptions(config, httpOnly, maxAgeSec) {
  const parts = ['Path=/', 'SameSite=Strict', `Max-Age=${maxAgeSec}`];
  if (httpOnly) parts.push('HttpOnly');
  if (config.secureCookies) parts.push('Secure');
  return parts.join('; ');
}

export function createSession(req, res, user) {
  const { db, config } = req.ctx;
  const token = randomToken();
  const csrf = randomToken(24);
  const hours = Number(getSetting(db, 'session_hours', '8'));
  const t = new Date();
  const expires = new Date(t.getTime() + hours * 3600_000);
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, csrf_token, ip, user_agent, created_at, last_seen_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(sha256(token), user.id, csrf, req.ip, String(req.headers['user-agent'] || '').slice(0, 300), t.toISOString(), t.toISOString(), expires.toISOString());
  res.append('Set-Cookie', `${SESSION_COOKIE}=${token}; ${cookieOptions(config, true, hours * 3600)}`);
  res.append('Set-Cookie', `${CSRF_COOKIE}=${csrf}; ${cookieOptions(config, false, hours * 3600)}`);
  return csrf;
}

export function destroySession(req, res) {
  const { db, config } = req.ctx;
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  res.append('Set-Cookie', `${SESSION_COOKIE}=; ${cookieOptions(config, true, 0)}`);
  res.append('Set-Cookie', `${CSRF_COOKIE}=; ${cookieOptions(config, false, 0)}`);
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Resolves req.user from the session cookie and enforces CSRF on state-changing requests. */
export function authenticate(req, res, next) {
  const { db } = req.ctx;
  req.user = null;
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token) {
    const row = db
      .prepare(
        `SELECT s.id sid, s.csrf_token, s.expires_at, u.id, u.email, u.role, u.full_name, u.faculty_id, u.department_id,
                u.must_change_password, u.is_active
         FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
      )
      .get(sha256(token));
    if (row && row.expires_at > now() && row.is_active) {
      req.user = {
        id: row.id,
        email: row.email,
        role: row.role,
        full_name: row.full_name,
        faculty_id: row.faculty_id,
        department_id: row.department_id,
        must_change_password: !!row.must_change_password,
      };
      req.session = { id: row.sid, csrf: row.csrf_token };
      db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(now(), row.sid);
    } else if (row) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(row.sid);
    }
  }
  if (req.user && !SAFE_METHODS.has(req.method)) {
    const header = req.headers['x-csrf-token'];
    if (!header || header !== req.session.csrf) {
      return next(new HttpError(403, 'Invalid or missing CSRF token. Please reload the page.'));
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'Please log in to continue.'));
  if (req.user.must_change_password) {
    return next(new HttpError(403, 'You must change your temporary password before continuing.', { code: 'PASSWORD_CHANGE_REQUIRED' }));
  }
  next();
}

export const requireRole = (...roles) => (req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  });
};
