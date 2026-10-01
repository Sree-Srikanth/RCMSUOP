import { Router } from 'express';
import multer from 'multer';
import { h, badRequest, notFound, forbidden, now, str, date, toInt } from '../lib/util.js';
import { requireRole } from '../lib/auth.js';
import { audit, diff } from '../lib/audit.js';
import { validateUpload, storeFile, sendStoredFile } from '../lib/files.js';
import { vacancyOpen } from '../lib/applications.js';
import { getSetting, tx } from '../db.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024, files: 1 } });
const STAFF = ['ADMIN', 'REGISTRAR'];

/** Closing dates are entered as dates and close at 23:59:59 Sri Lanka time. */
export const endOfDaySL = (d) => (d ? new Date(`${d}T23:59:59.999+05:30`).toISOString() : null);
export const dateSL = (iso) => (iso ? new Date(new Date(iso).getTime() + 5.5 * 3600_000).toISOString().slice(0, 10) : null);

const VACANCY_SELECT = `
  SELECT v.*, p.code AS position_code, p.title AS position_title,
         f.code AS faculty_code, f.name AS faculty_name, d.code AS department_code, d.name AS department_name
  FROM vacancies v
  JOIN positions p ON p.id = v.position_id
  JOIN faculties f ON f.id = v.faculty_id
  JOIN departments d ON d.id = v.department_id`;

const isStaff = (user) => user && STAFF.includes(user.role) && !user.must_change_password;

function decorate(v) {
  return { ...v, closing_date_local: dateSL(v.closing_date), late_exception_until_local: dateSL(v.late_exception_until), is_open: vacancyOpen(v) };
}

function scopeCheck(user, v) {
  if (user.role === 'REGISTRAR' && user.faculty_id && user.faculty_id !== v.faculty_id) throw notFound('Vacancy not found.');
}

r.get(
  '/',
  h((req, res) => {
    const { db } = req.ctx;
    const where = [];
    const params = [];
    if (isStaff(req.user)) {
      if (req.query.status) {
        where.push('v.status = ?');
        params.push(String(req.query.status));
      }
      if (req.user.role === 'REGISTRAR' && req.user.faculty_id) {
        where.push('v.faculty_id = ?');
        params.push(req.user.faculty_id);
      }
    } else {
      where.push("v.status = 'PUBLISHED'");
    }
    for (const k of ['faculty_id', 'department_id', 'position_id']) {
      if (toInt(req.query[k])) {
        where.push(`v.${k} = ?`);
        params.push(toInt(req.query[k]));
      }
    }
    const sql = `${VACANCY_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY v.closing_date DESC, v.id DESC`;
    let rows = db.prepare(sql).all(...params).map(decorate);
    if (isStaff(req.user)) {
      const counts = db
        .prepare(
          `SELECT vacancy_id, COUNT(*) AS total, SUM(status <> 'DRAFT') AS submitted FROM applications GROUP BY vacancy_id`,
        )
        .all();
      const map = new Map(counts.map((c) => [c.vacancy_id, c]));
      rows = rows.map((v) => ({ ...v, application_count: map.get(v.id)?.submitted || 0, draft_count: (map.get(v.id)?.total || 0) - (map.get(v.id)?.submitted || 0) }));
    } else {
      rows = rows.filter((v) => v.is_open);
    }
    res.json({ vacancies: rows });
  }),
);

function loadVacancy(db, id) {
  return db.prepare(`${VACANCY_SELECT} WHERE v.id = ?`).get(id);
}

r.get(
  '/:id',
  h((req, res) => {
    const { db } = req.ctx;
    const v = loadVacancy(db, toInt(req.params.id));
    if (!v) throw notFound('Vacancy not found.');
    if (!isStaff(req.user) && v.status !== 'PUBLISHED') throw notFound('Vacancy not found.');
    if (isStaff(req.user)) scopeCheck(req.user, v);
    const documents = db.prepare('SELECT id, original_name, mime_type, size_bytes, uploaded_at FROM vacancy_documents WHERE vacancy_id = ?').all(v.id);
    res.json({ vacancy: { ...decorate(v), documents } });
  }),
);

function parseVacancy(db, body, user) {
  const position_id = toInt(body.position_id);
  const department_id = toInt(body.department_id);
  if (!db.prepare('SELECT 1 FROM positions WHERE id = ?').get(position_id)) throw badRequest('Select a valid position.');
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(department_id);
  if (!dept) throw badRequest('Select a valid department.');
  if (user.role === 'REGISTRAR' && user.faculty_id && dept.faculty_id !== user.faculty_id) throw forbidden('You can only manage vacancies for your faculty.');
  const advertised_on = date(body.advertised_on);
  const closingLocal = date(body.closing_date);
  if (!advertised_on || !closingLocal) throw badRequest('Advertisement date and closing date are required.');
  if (closingLocal < advertised_on) throw badRequest('The closing date must be on or after the advertisement date.');
  return {
    position_id,
    faculty_id: dept.faculty_id,
    department_id,
    discipline: str(body.discipline, 300),
    advert_reference: str(body.advert_reference, 100),
    advertised_on,
    closing_date: endOfDaySL(closingLocal),
    requirements: str(body.requirements, 10000),
    hard_copy_instructions: str(body.hard_copy_instructions, 3000),
  };
}

const FIELDS = ['position_id', 'faculty_id', 'department_id', 'discipline', 'advert_reference', 'advertised_on', 'closing_date', 'requirements', 'hard_copy_instructions'];

r.post(
  '/',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const v = parseVacancy(db, req.body, req.user);
    const t = now();
    const id = tx(db, () => {
      const info = db
        .prepare(`INSERT INTO vacancies (${FIELDS.join(', ')}, status, created_by, created_at, updated_at) VALUES (${FIELDS.map(() => '?').join(', ')}, 'DRAFT', ?, ?, ?)`)
        .run(...FIELDS.map((f) => v[f]), req.user.id, t, t);
      audit(req, 'VACANCY_CREATED', 'vacancy', info.lastInsertRowid, null, v);
      return Number(info.lastInsertRowid);
    });
    res.status(201).json({ vacancy: decorate(loadVacancy(db, id)) });
  }),
);

r.put(
  '/:id',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const before = loadVacancy(db, toInt(req.params.id));
    if (!before) throw notFound('Vacancy not found.');
    scopeCheck(req.user, before);
    if (before.status === 'ARCHIVED') throw forbidden('Archived vacancies cannot be edited.');
    const v = parseVacancy(db, req.body, req.user);
    const hasSubmitted = db.prepare("SELECT 1 FROM applications WHERE vacancy_id = ? AND status <> 'DRAFT' LIMIT 1").get(before.id);
    if (hasSubmitted && (v.position_id !== before.position_id || v.department_id !== before.department_id)) {
      throw forbidden('Position and department cannot be changed after applications have been submitted.');
    }
    tx(db, () => {
      db.prepare(`UPDATE vacancies SET ${FIELDS.map((f) => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`).run(...FIELDS.map((f) => v[f]), now(), before.id);
      const d = diff(before, v, FIELDS);
      if (d) audit(req, 'VACANCY_UPDATED', 'vacancy', before.id, d[0], d[1]);
    });
    res.json({ vacancy: decorate(loadVacancy(db, before.id)) });
  }),
);

const TRANSITIONS = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['CLOSED', 'DRAFT'],
  CLOSED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: [],
};

r.post(
  '/:id/status',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const v = loadVacancy(db, toInt(req.params.id));
    if (!v) throw notFound('Vacancy not found.');
    scopeCheck(req.user, v);
    const status = String(req.body.status || '');
    if (!TRANSITIONS[v.status].includes(status)) throw badRequest(`A ${v.status.toLowerCase()} vacancy cannot be changed to ${status.toLowerCase()}.`);
    if (status === 'DRAFT' && db.prepare('SELECT 1 FROM applications WHERE vacancy_id = ? LIMIT 1').get(v.id)) {
      throw badRequest('A vacancy with applications cannot be returned to draft. Close it instead.');
    }
    tx(db, () => {
      db.prepare('UPDATE vacancies SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), v.id);
      if (status === 'ARCHIVED') {
        db.prepare("UPDATE applications SET status = 'CLOSED', updated_at = ? WHERE vacancy_id = ? AND status IN ('SUBMITTED','UNDER_REVIEW')").run(now(), v.id);
      }
      audit(req, 'VACANCY_STATUS_CHANGED', 'vacancy', v.id, { status: v.status }, { status });
    });
    res.json({ vacancy: decorate(loadVacancy(db, v.id)) });
  }),
);

r.post(
  '/:id/late-exception',
  requireRole('ADMIN'),
  h((req, res) => {
    const { db } = req.ctx;
    const v = loadVacancy(db, toInt(req.params.id));
    if (!v) throw notFound('Vacancy not found.');
    const untilLocal = date(req.body.until);
    const reason = str(req.body.reason, 1000);
    if (untilLocal && !reason) throw badRequest('A reason is required for a late-application exception.');
    const until = untilLocal ? endOfDaySL(untilLocal) : null;
    if (until && until <= v.closing_date) throw badRequest('The exception date must be after the closing date.');
    tx(db, () => {
      db.prepare('UPDATE vacancies SET late_exception_until = ?, late_exception_reason = ?, updated_at = ? WHERE id = ?').run(until, until ? reason : null, now(), v.id);
      audit(req, until ? 'VACANCY_LATE_EXCEPTION_ENABLED' : 'VACANCY_LATE_EXCEPTION_REMOVED', 'vacancy', v.id,
        { late_exception_until: v.late_exception_until, reason: v.late_exception_reason }, { late_exception_until: until, reason });
    });
    res.json({ vacancy: decorate(loadVacancy(db, v.id)) });
  }),
);

r.post(
  '/:id/documents',
  requireRole(...STAFF),
  upload.single('file'),
  h(async (req, res) => {
    const { db, config } = req.ctx;
    const v = loadVacancy(db, toInt(req.params.id));
    if (!v) throw notFound('Vacancy not found.');
    scopeCheck(req.user, v);
    const maxBytes = Number(getSetting(db, 'max_upload_mb', '5')) * 1024 * 1024 * 2;
    const meta = await validateUpload(req.file, { allowed: ['pdf', 'jpg', 'png'], maxBytes, scanFile: config.scanFile });
    const stored = storeFile(config.vacancyDocsDir, req.file.buffer, meta.kind);
    const info = db
      .prepare('INSERT INTO vacancy_documents (vacancy_id, original_name, stored_name, mime_type, size_bytes, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(v.id, meta.originalName, stored, meta.mime, req.file.buffer.length, req.user.id, now());
    audit(req, 'VACANCY_DOCUMENT_UPLOADED', 'vacancy', v.id, null, { document_id: Number(info.lastInsertRowid), name: meta.originalName });
    res.status(201).json({ id: Number(info.lastInsertRowid) });
  }),
);

r.get(
  '/:id/documents/:docId',
  h((req, res) => {
    const { db, config } = req.ctx;
    const v = loadVacancy(db, toInt(req.params.id));
    if (!v || (!isStaff(req.user) && v.status !== 'PUBLISHED')) throw notFound('Document not found.');
    const doc = db.prepare('SELECT * FROM vacancy_documents WHERE id = ? AND vacancy_id = ?').get(toInt(req.params.docId), v.id);
    if (!doc) throw notFound('Document not found.');
    sendStoredFile(res, config.vacancyDocsDir, doc.stored_name, { mime: doc.mime_type, downloadName: doc.original_name });
  }),
);

r.delete(
  '/:id/documents/:docId',
  requireRole(...STAFF),
  h((req, res) => {
    const { db } = req.ctx;
    const v = loadVacancy(db, toInt(req.params.id));
    if (!v) throw notFound('Vacancy not found.');
    scopeCheck(req.user, v);
    const doc = db.prepare('SELECT * FROM vacancy_documents WHERE id = ? AND vacancy_id = ?').get(toInt(req.params.docId), v.id);
    if (!doc) throw notFound('Document not found.');
    db.prepare('DELETE FROM vacancy_documents WHERE id = ?').run(doc.id);
    audit(req, 'VACANCY_DOCUMENT_DELETED', 'vacancy', v.id, { document_id: doc.id, name: doc.original_name }, null);
    res.json({ ok: true });
  }),
);

export default r;
