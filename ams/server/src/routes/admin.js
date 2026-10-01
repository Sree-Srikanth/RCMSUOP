import { Router } from 'express';
import { h, badRequest, notFound, conflict, now, toInt, str, isEmail } from '../lib/util.js';
import { requireRole } from '../lib/auth.js';
import { audit, diff } from '../lib/audit.js';
import { notify } from '../lib/mail.js';
import { hashPassword, temporaryPassword } from '../lib/security.js';
import { tx } from '../db.js';

const r = Router();
r.use(requireRole('ADMIN'));

const ROLES = ['APPLICANT', 'REGISTRAR', 'HOD', 'DEAN', 'ADMIN'];

const USER_SELECT = `
  SELECT u.id, u.email, u.role, u.full_name, u.faculty_id, u.department_id, u.is_active, u.must_change_password,
         u.last_login_at, u.created_at, u.locked_until, f.name AS faculty_name, d.name AS department_name
  FROM users u LEFT JOIN faculties f ON f.id = u.faculty_id LEFT JOIN departments d ON d.id = u.department_id`;

function parseUser(db, b) {
  const role = String(b.role || '');
  if (!ROLES.includes(role)) throw badRequest('Select a valid role.');
  const full_name = str(b.full_name, 200);
  if (!full_name) throw badRequest('Full name is required.');
  let faculty_id = toInt(b.faculty_id);
  let department_id = toInt(b.department_id);
  if (role === 'HOD') {
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(department_id);
    if (!dept) throw badRequest('A Head of Department must be assigned to a department.');
    faculty_id = dept.faculty_id;
  } else if (role === 'DEAN') {
    if (!db.prepare('SELECT 1 FROM faculties WHERE id = ?').get(faculty_id)) throw badRequest('A Dean must be assigned to a faculty.');
    department_id = null;
  } else if (role === 'REGISTRAR') {
    department_id = null; // optional faculty scope (SAR of a faculty); empty = all faculties
    if (faculty_id && !db.prepare('SELECT 1 FROM faculties WHERE id = ?').get(faculty_id)) throw badRequest('Invalid faculty.');
  } else {
    faculty_id = null;
    department_id = null;
  }
  return { role, full_name, faculty_id: faculty_id || null, department_id: department_id || null };
}

r.get(
  '/users',
  h((req, res) => {
    const { db } = req.ctx;
    const where = [];
    const params = [];
    if (ROLES.includes(req.query.role)) {
      where.push('u.role = ?');
      params.push(req.query.role);
    }
    const q = str(req.query.q, 100);
    if (q) {
      where.push('(u.email LIKE ? OR u.full_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    const rows = db.prepare(`${USER_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY u.role, u.full_name LIMIT 500`).all(...params);
    res.json({ users: rows });
  }),
);

r.post(
  '/users',
  h((req, res) => {
    const { db, config } = req.ctx;
    const email = str(req.body.email, 200)?.toLowerCase();
    if (!email || !isEmail(email)) throw badRequest('A valid email is required.');
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw conflict('A user with this email already exists.');
    const u = parseUser(db, req.body);
    const temp = temporaryPassword();
    const t = now();
    const id = tx(db, () => {
      const info = db
        .prepare(
          `INSERT INTO users (email, password_hash, role, full_name, faculty_id, department_id, must_change_password, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .run(email, hashPassword(temp), u.role, u.full_name, u.faculty_id, u.department_id, t, t);
      const newId = Number(info.lastInsertRowid);
      if (u.role === 'APPLICANT') db.prepare('INSERT INTO applicant_profiles (user_id, updated_at) VALUES (?, ?)').run(newId, t);
      audit(req, 'USER_CREATED', 'user', newId, null, { email, ...u });
      return newId;
    });
    notify(req.ctx, {
      userId: id,
      email,
      type: 'ACCOUNT_CREATED',
      subject: 'University of Peradeniya AMS – your account',
      body: `Dear ${u.full_name},\n\nAn account has been created for you on the University of Peradeniya Application Management System.\n\nLogin: ${config.publicUrl}/login\nEmail: ${email}\nTemporary password: ${temp}\n\nYou will be asked to change this password when you first log in.`,
    });
    res.status(201).json({ user: db.prepare(`${USER_SELECT} WHERE u.id = ?`).get(id), temporary_password: temp });
  }),
);

r.put(
  '/users/:id',
  h((req, res) => {
    const { db } = req.ctx;
    const before = db.prepare(`${USER_SELECT} WHERE u.id = ?`).get(toInt(req.params.id));
    if (!before) throw notFound('User not found.');
    const u = parseUser(db, { ...before, ...req.body });
    const is_active = req.body.is_active === undefined ? before.is_active : req.body.is_active ? 1 : 0;
    if (before.id === req.user.id && (!is_active || u.role !== 'ADMIN')) throw badRequest('You cannot deactivate or demote your own account.');
    tx(db, () => {
      db.prepare('UPDATE users SET role = ?, full_name = ?, faculty_id = ?, department_id = ?, is_active = ?, updated_at = ? WHERE id = ?').run(u.role, u.full_name, u.faculty_id, u.department_id, is_active, now(), before.id);
      if (!is_active) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(before.id);
      const d = diff(before, { ...u, is_active }, ['role', 'full_name', 'faculty_id', 'department_id', 'is_active']);
      if (d) audit(req, 'USER_UPDATED', 'user', before.id, d[0], d[1]);
    });
    res.json({ user: db.prepare(`${USER_SELECT} WHERE u.id = ?`).get(before.id) });
  }),
);

r.post(
  '/users/:id/reset-password',
  h((req, res) => {
    const { db } = req.ctx;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(toInt(req.params.id));
    if (!user) throw notFound('User not found.');
    const temp = temporaryPassword();
    tx(db, () => {
      db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1, failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?').run(hashPassword(temp), now(), user.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      audit(req, 'USER_PASSWORD_RESET_BY_ADMIN', 'user', user.id);
    });
    notify(req.ctx, {
      userId: user.id,
      email: user.email,
      type: 'PASSWORD_RESET',
      subject: 'University of Peradeniya AMS – temporary password',
      body: `Dear ${user.full_name},\n\nYour password has been reset by an administrator.\nTemporary password: ${temp}\n\nYou must change it when you next log in.`,
    });
    res.json({ temporary_password: temp });
  }),
);

// ----------------------------------------------------------- master data
r.post(
  '/faculties',
  h((req, res) => {
    const { db } = req.ctx;
    const code = str(req.body.code, 10)?.toUpperCase();
    const name = str(req.body.name, 200);
    if (!code || !/^[A-Z0-9]{2,10}$/.test(code) || !name) throw badRequest('A code (2-10 letters/digits) and name are required.');
    const info = db.prepare('INSERT INTO faculties (code, name) VALUES (?, ?)').run(code, name);
    audit(req, 'FACULTY_CREATED', 'faculty', info.lastInsertRowid, null, { code, name });
    res.status(201).json({ id: Number(info.lastInsertRowid) });
  }),
);

r.put(
  '/faculties/:id',
  h((req, res) => {
    const { db } = req.ctx;
    const before = db.prepare('SELECT * FROM faculties WHERE id = ?').get(toInt(req.params.id));
    if (!before) throw notFound();
    const v = { name: str(req.body.name, 200) || before.name, is_active: req.body.is_active === undefined ? before.is_active : req.body.is_active ? 1 : 0 };
    db.prepare('UPDATE faculties SET name = ?, is_active = ? WHERE id = ?').run(v.name, v.is_active, before.id);
    const d = diff(before, v, ['name', 'is_active']);
    if (d) audit(req, 'FACULTY_UPDATED', 'faculty', before.id, d[0], d[1]);
    res.json({ ok: true });
  }),
);

r.get(
  '/departments',
  h((req, res) => {
    res.json({
      departments: req.ctx.db
        .prepare('SELECT d.*, f.name AS faculty_name, f.code AS faculty_code FROM departments d JOIN faculties f ON f.id = d.faculty_id ORDER BY f.name, d.name')
        .all(),
      faculties: req.ctx.db.prepare('SELECT * FROM faculties ORDER BY name').all(),
    });
  }),
);

r.post(
  '/departments',
  h((req, res) => {
    const { db } = req.ctx;
    const faculty_id = toInt(req.body.faculty_id);
    const code = str(req.body.code, 10)?.toUpperCase();
    const name = str(req.body.name, 200);
    if (!db.prepare('SELECT 1 FROM faculties WHERE id = ?').get(faculty_id)) throw badRequest('Select a faculty.');
    if (!code || !/^[A-Z0-9]{2,10}$/.test(code) || !name) throw badRequest('A code (2-10 letters/digits) and name are required.');
    const info = db.prepare('INSERT INTO departments (faculty_id, code, name) VALUES (?, ?, ?)').run(faculty_id, code, name);
    audit(req, 'DEPARTMENT_CREATED', 'department', info.lastInsertRowid, null, { faculty_id, code, name });
    res.status(201).json({ id: Number(info.lastInsertRowid) });
  }),
);

r.put(
  '/departments/:id',
  h((req, res) => {
    const { db } = req.ctx;
    const before = db.prepare('SELECT * FROM departments WHERE id = ?').get(toInt(req.params.id));
    if (!before) throw notFound();
    const v = { name: str(req.body.name, 200) || before.name, is_active: req.body.is_active === undefined ? before.is_active : req.body.is_active ? 1 : 0 };
    db.prepare('UPDATE departments SET name = ?, is_active = ? WHERE id = ?').run(v.name, v.is_active, before.id);
    const d = diff(before, v, ['name', 'is_active']);
    if (d) audit(req, 'DEPARTMENT_UPDATED', 'department', before.id, d[0], d[1]);
    res.json({ ok: true });
  }),
);

// -------------------------------------------------------------- settings
const SETTING_KEYS = {
  referee_token_days: (v) => /^\d{1,3}$/.test(v) && +v >= 1,
  max_upload_mb: (v) => /^\d{1,2}$/.test(v) && +v >= 1 && +v <= 20,
  session_hours: (v) => /^\d{1,2}$/.test(v) && +v >= 1 && +v <= 24,
  institution_email: (v) => isEmail(v),
  institution_phone: (v) => v.length <= 100,
  form_reference: (v) => v.length <= 100,
};

r.get(
  '/settings',
  h((req, res) => {
    const rows = req.ctx.db.prepare('SELECT key, value FROM settings').all();
    res.json({ settings: Object.fromEntries(rows.filter((x) => SETTING_KEYS[x.key]).map((x) => [x.key, x.value])) });
  }),
);

r.put(
  '/settings',
  h((req, res) => {
    const { db } = req.ctx;
    const changes = {};
    for (const [k, valid] of Object.entries(SETTING_KEYS)) {
      if (req.body[k] === undefined) continue;
      const v = String(req.body[k]).trim();
      if (!valid(v)) throw badRequest(`Invalid value for ${k}.`);
      changes[k] = v;
    }
    tx(db, () => {
      const before = Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((x) => [x.key, x.value]));
      for (const [k, v] of Object.entries(changes)) db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, v);
      const d = diff(before, { ...before, ...changes }, Object.keys(changes));
      if (d) audit(req, 'SETTINGS_UPDATED', 'settings', 'system', d[0], d[1]);
    });
    res.json({ ok: true });
  }),
);

// ----------------------------------------------------------------- audit
r.get(
  '/audit',
  h((req, res) => {
    const { db } = req.ctx;
    const where = [];
    const params = [];
    for (const k of ['action', 'entity_type', 'entity_id']) {
      const v = str(req.query[k], 100);
      if (v) {
        where.push(`l.${k} = ?`);
        params.push(v);
      }
    }
    if (toInt(req.query.user_id)) {
      where.push('l.user_id = ?');
      params.push(toInt(req.query.user_id));
    }
    if (req.query.from) {
      where.push('l.created_at >= ?');
      params.push(String(req.query.from));
    }
    if (req.query.to) {
      where.push('l.created_at <= ?');
      params.push(`${req.query.to}T23:59:59.999Z`);
    }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const pageSize = Math.min(toInt(req.query.page_size) || 50, 200);
    const page = Math.max(toInt(req.query.page) || 1, 1);
    const total = db.prepare(`SELECT COUNT(*) n FROM audit_logs l ${w}`).get(...params).n;
    const rows = db
      .prepare(`SELECT l.*, u.full_name AS user_name, u.email AS user_email FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id ${w} ORDER BY l.id DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, (page - 1) * pageSize);
    const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all().map((x) => x.action);
    res.json({ logs: rows, total, page, page_size: pageSize, actions });
  }),
);

// ------------------------------------------------------------ email outbox
r.get(
  '/notifications',
  h((req, res) => {
    const { db } = req.ctx;
    const where = ['n.recipient_email IS NOT NULL'];
    const params = [];
    if (req.query.type) {
      where.push('n.type = ?');
      params.push(String(req.query.type));
    }
    const rows = db
      .prepare(`SELECT n.*, a.reference_no FROM notifications n LEFT JOIN applications a ON a.id = n.application_id WHERE ${where.join(' AND ')} ORDER BY n.id DESC LIMIT 300`)
      .all(...params);
    res.json({ notifications: rows, smtp_configured: !!req.ctx.config.smtp.host });
  }),
);

export default r;
