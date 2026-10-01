import { Router } from 'express';
import multer from 'multer';
import { h, badRequest, notFound, forbidden, conflict, now, toInt } from '../lib/util.js';
import { requireAuth, requireRole } from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/mail.js';
import { validateUpload, storeFile, sendStoredFile } from '../lib/files.js';
import {
  SECTIONS, DOC_CATEGORIES, getApplicationRow, getFullApplication, assertCanView, assertOwnDraft, parseFields, parseSectionRows,
  replaceSectionRows, documentRequirements, validateForSubmission, vacancyOpen, referenceNumber, isMedicalDental,
} from '../lib/applications.js';
import { createRefereeRequest } from '../lib/referees.js';
import { generateApplicationPdf } from '../pdf/applicationPdf.js';
import { getSetting, nextSequence, tx } from '../db.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 } });

function loadApp(req) {
  const app = getApplicationRow(req.ctx.db, toInt(req.params.id));
  if (!app) throw notFound('Application not found.');
  return app;
}

// ---------------------------------------------------------------- create
r.post(
  '/',
  requireRole('APPLICANT'),
  h((req, res) => {
    const { db } = req.ctx;
    const vacancyId = toInt(req.body.vacancy_id);
    const v = db.prepare('SELECT * FROM vacancies WHERE id = ?').get(vacancyId);
    if (!v) throw notFound('Vacancy not found.');
    const existing = db.prepare('SELECT id FROM applications WHERE applicant_id = ? AND vacancy_id = ?').get(req.user.id, vacancyId);
    if (existing) return res.json({ id: existing.id, existing: true });
    if (!vacancyOpen(v)) throw forbidden('This vacancy is not accepting applications.');

    const p = db.prepare('SELECT * FROM applicant_profiles WHERE user_id = ?').get(req.user.id) || {};
    const t = now();
    const id = tx(db, () => {
      const info = db
        .prepare(
          `INSERT INTO applications (applicant_id, vacancy_id, status, title, surname, name_in_full, name_with_initials, nic, passport_no,
             date_of_birth, email, mobile, phone_residence, phone_office, cur_address_line1, cur_address_line2, cur_city, cur_province_id,
             cur_district_id, cur_postal_code, created_at, updated_at)
           VALUES (?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          req.user.id, vacancyId, p.title ?? null, p.surname ?? null, p.name_in_full ?? null, p.name_with_initials ?? null, p.nic ?? null,
          p.passport_no ?? null, p.date_of_birth ?? null, req.user.email, p.mobile ?? null, p.phone_residence ?? null, p.phone_office ?? null,
          p.address_line1 ?? null, p.address_line2 ?? null, p.city ?? null, p.province_id ?? null, p.district_id ?? null, p.postal_code ?? null, t, t,
        );
      audit(req, 'APPLICATION_DRAFT_CREATED', 'application', info.lastInsertRowid, null, { vacancy_id: vacancyId });
      return Number(info.lastInsertRowid);
    });
    res.status(201).json({ id });
  }),
);

// ------------------------------------------------------------------ read
r.get(
  '/:id',
  requireAuth,
  h((req, res) => {
    const { db } = req.ctx;
    const app = loadApp(req);
    assertCanView(db, req.user, app);
    const full = getFullApplication(db, app.id);
    if (['HOD', 'DEAN'].includes(req.user.role)) audit(req, 'APPLICATION_VIEWED', 'application', app.id, null, { reference_no: app.reference_no });
    const isOwner = req.user.id === app.applicant_id;
    // Applicants do not see the internal shortlist decision or schedule notes.
    if (isOwner) {
      for (const k of ['decision_code', 'category_code', 'decision_remarks', 'decided_at', 'decided_by', 'sched_pc', 'sched_rr', 'sched_tr', 'sched_remarks']) delete full[k];
    }
    res.json({
      application: full,
      documents_required: documentRequirements(full),
      issues: full.status === 'DRAFT' ? validateForSubmission(full) : [],
      is_medical_dental: isMedicalDental(full.sections.education),
      vacancy_open: full.status === 'DRAFT' ? vacancyOpen({ status: full.vacancy_status, closing_date: full.closing_date, late_exception_until: full.late_exception_until }) : null,
    });
  }),
);

// --------------------------------------------------------- draft update
r.put(
  '/:id',
  requireRole('APPLICANT'),
  h((req, res) => {
    const { db } = req.ctx;
    const app = loadApp(req);
    assertOwnDraft(req.user, app);
    const fields = req.body.fields ? parseFields(req.body.fields) : {};
    const sections = {};
    for (const key of Object.keys(req.body.sections || {})) {
      if (!SECTIONS[key]) throw badRequest(`Unknown section: ${key}`);
      sections[key] = parseSectionRows(key, req.body.sections[key]);
    }
    // Province must be chosen first; district must belong to it.
    for (const prefix of ['cur', 'perm']) {
      const prov = fields[`${prefix}_province_id`] !== undefined ? fields[`${prefix}_province_id`] : app[`${prefix}_province_id`];
      const dist = fields[`${prefix}_district_id`] !== undefined ? fields[`${prefix}_district_id`] : app[`${prefix}_district_id`];
      if (dist && !prov) throw badRequest('Select the province before the district.');
      if (dist && !db.prepare('SELECT 1 FROM districts WHERE id = ? AND province_id = ?').get(dist, prov)) {
        throw badRequest('The selected district does not belong to the selected province.');
      }
    }
    if (fields.perm_same_as_current === 1) {
      for (const k of ['perm_address_line1', 'perm_address_line2', 'perm_city', 'perm_province_id', 'perm_district_id', 'perm_postal_code']) fields[k] = null;
    }
    if (fields.citizenship_type === 'DESCENT') {
      fields.citizenship_cert_no = null;
      fields.citizenship_cert_date = null;
    }
    if (fields.board_certified === 0) fields.board_certification_date = null;
    if (fields.bond_violator === 0) Object.assign(fields, { bond_value: null, bond_institution: null, bond_details: null });
    if (fields.vacation_of_post === 0) fields.vacation_of_post_details = null;

    tx(db, () => {
      const keys = Object.keys(fields);
      if (keys.length) {
        db.prepare(`UPDATE applications SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`).run(...keys.map((k) => fields[k]), now(), app.id);
      } else {
        db.prepare('UPDATE applications SET updated_at = ? WHERE id = ?').run(now(), app.id);
      }
      for (const [key, rows] of Object.entries(sections)) replaceSectionRows(db, app.id, key, rows);
    });
    const full = getFullApplication(db, app.id);
    res.json({ application: full, documents_required: documentRequirements(full), issues: validateForSubmission(full), is_medical_dental: isMedicalDental(full.sections.education) });
  }),
);

r.delete(
  '/:id',
  requireRole('APPLICANT'),
  h((req, res) => {
    const { db } = req.ctx;
    const app = loadApp(req);
    assertOwnDraft(req.user, app);
    tx(db, () => {
      db.prepare('DELETE FROM application_documents WHERE application_id = ?').run(app.id);
      db.prepare('DELETE FROM applications WHERE id = ?').run(app.id);
      audit(req, 'APPLICATION_DRAFT_DELETED', 'application', app.id, { vacancy_id: app.vacancy_id }, null);
    });
    res.json({ ok: true });
  }),
);

// ------------------------------------------------------------ documents
r.post(
  '/:id/documents',
  requireRole('APPLICANT'),
  upload.single('file'),
  h(async (req, res) => {
    const { db, config } = req.ctx;
    const app = loadApp(req);
    assertOwnDraft(req.user, app);
    const cat = DOC_CATEGORIES.find((c) => c.code === req.body.category);
    if (!cat) throw badRequest('Select a valid document category.');
    const maxBytes = Number(getSetting(db, 'max_upload_mb', '5')) * 1024 * 1024;
    const meta = await validateUpload(req.file, { allowed: cat.types, maxBytes, scanFile: config.scanFile });
    const stored = storeFile(config.uploadsDir, req.file.buffer, meta.kind);
    const id = tx(db, () => {
      // One file per category: the new file replaces any earlier one.
      const old = db.prepare('SELECT id, original_name FROM application_documents WHERE application_id = ? AND category = ? AND deleted_at IS NULL').all(app.id, cat.code);
      db.prepare('UPDATE application_documents SET deleted_at = ?, deleted_by = ? WHERE application_id = ? AND category = ? AND deleted_at IS NULL').run(now(), req.user.id, app.id, cat.code);
      const info = db
        .prepare(
          `INSERT INTO application_documents (application_id, category, original_name, stored_name, mime_type, size_bytes, sha256, uploaded_by, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(app.id, cat.code, meta.originalName, stored, meta.mime, req.file.buffer.length, meta.sha256, req.user.id, now());
      audit(req, old.length ? 'DOCUMENT_REPLACED' : 'DOCUMENT_UPLOADED', 'application', app.id, old.length ? { documents: old } : null, {
        document_id: Number(info.lastInsertRowid), category: cat.code, name: meta.originalName, sha256: meta.sha256,
      });
      return Number(info.lastInsertRowid);
    });
    const full = getFullApplication(db, app.id);
    res.status(201).json({ id, documents_required: documentRequirements(full) });
  }),
);

r.delete(
  '/:id/documents/:docId',
  requireRole('APPLICANT'),
  h((req, res) => {
    const { db } = req.ctx;
    const app = loadApp(req);
    assertOwnDraft(req.user, app);
    const doc = db.prepare('SELECT * FROM application_documents WHERE id = ? AND application_id = ? AND deleted_at IS NULL').get(toInt(req.params.docId), app.id);
    if (!doc) throw notFound('Document not found.');
    db.prepare('UPDATE application_documents SET deleted_at = ?, deleted_by = ? WHERE id = ?').run(now(), req.user.id, doc.id);
    audit(req, 'DOCUMENT_DELETED', 'application', app.id, { document_id: doc.id, category: doc.category, name: doc.original_name }, null);
    res.json({ documents_required: documentRequirements(getFullApplication(db, app.id)) });
  }),
);

r.get(
  '/:id/documents/:docId',
  requireAuth,
  h((req, res) => {
    const { db, config } = req.ctx;
    const app = loadApp(req);
    assertCanView(db, req.user, app);
    const doc = db.prepare('SELECT * FROM application_documents WHERE id = ? AND application_id = ? AND deleted_at IS NULL').get(toInt(req.params.docId), app.id);
    if (!doc) throw notFound('Document not found.');
    if (req.user.id !== app.applicant_id) {
      audit(req, 'DOCUMENT_DOWNLOADED', 'application', app.id, null, { document_id: doc.id, category: doc.category, reference_no: app.reference_no });
    }
    sendStoredFile(res, config.uploadsDir, doc.stored_name, { mime: doc.mime_type, downloadName: doc.original_name, inline: req.query.inline === '1' });
  }),
);

// --------------------------------------------------------------- submit
r.post(
  '/:id/submit',
  requireRole('APPLICANT'),
  h(async (req, res) => {
    const { db } = req.ctx;
    const app = loadApp(req);
    assertOwnDraft(req.user, app);
    if (!vacancyOpen({ status: app.vacancy_status, closing_date: app.closing_date, late_exception_until: app.late_exception_until })) {
      throw forbidden('The closing date for this vacancy has passed. Applications can no longer be submitted.');
    }
    const full = getFullApplication(db, app.id);
    const issues = validateForSubmission(full);
    if (issues.length) throw conflict('The application is incomplete. Please resolve the outstanding items before submitting.', { issues });

    const t = now();
    const submitted = tx(db, () => {
      // Re-check inside the transaction to avoid double submission.
      const current = db.prepare('SELECT status FROM applications WHERE id = ?').get(app.id);
      if (current.status !== 'DRAFT') throw conflict('This application has already been submitted.');
      const seq = nextSequence(db, 'application_reference');
      const ref = referenceNumber(app, seq);
      db.prepare(
        `UPDATE applications SET status = 'SUBMITTED', reference_no = ?, submitted_at = ?, submitted_ip = ?, declaration_date = ?, updated_at = ? WHERE id = ?`,
      ).run(ref, t, req.ip, t.slice(0, 10), t, app.id);
      const updated = getApplicationRow(db, app.id);
      const refs = db.prepare('SELECT * FROM referees WHERE application_id = ? ORDER BY seq').all(app.id);
      for (const referee of refs) createRefereeRequest(req.ctx, { app: updated, referee, createdBy: req.user.id });
      audit(req, 'APPLICATION_SUBMITTED', 'application', app.id, { status: 'DRAFT' }, {
        status: 'SUBMITTED', reference_no: ref, vacancy_id: app.vacancy_id, session_id: req.session?.id, submitted_at: t,
      });
      return updated;
    });

    const pdf = () => generateApplicationPdf(getFullApplication(db, app.id), req.ctx);
    notify(req.ctx, {
      userId: req.user.id,
      email: submitted.email || req.user.email,
      type: 'APPLICATION_SUBMITTED',
      applicationId: app.id,
      subject: `Application submitted – Ref ${submitted.reference_no}`,
      body:
        `Dear ${submitted.name_with_initials},\n\nYour application for the post of ${submitted.position_title}, ${submitted.department_name}, ` +
        `${submitted.faculty_name} has been received.\n\nApplication reference number: ${submitted.reference_no}\nSubmitted on: ${t.slice(0, 10)}\n\n` +
        `Please quote this reference number in all correspondence. A copy of your application is attached.\n` +
        `Referee report requests have been sent to your two referees.\n` +
        (submitted.hard_copy_instructions ? `\nIMPORTANT – hard copy submission: ${submitted.hard_copy_instructions}\n` : '') +
        `\nDeputy Registrar / Academic Establishments\nUniversity of Peradeniya`,
      attachments: async () => [{ filename: `Application-${submitted.reference_no}.pdf`, content: await pdf() }],
    });
    res.json({ reference_no: submitted.reference_no, submitted_at: t });
  }),
);

// ------------------------------------------------------------------ PDF
r.get(
  '/:id/pdf',
  requireAuth,
  h(async (req, res) => {
    const { db } = req.ctx;
    const app = loadApp(req);
    assertCanView(db, req.user, app);
    const full = getFullApplication(db, app.id);
    const buf = await generateApplicationPdf(full, req.ctx);
    if (req.user.id !== app.applicant_id) audit(req, 'APPLICATION_PDF_DOWNLOADED', 'application', app.id, null, { reference_no: app.reference_no });
    const name = full.reference_no ? `Application-${full.reference_no}.pdf` : `Application-DRAFT-${full.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${req.query.inline === '1' ? 'inline' : 'attachment'}; filename="${name}"`);
    res.send(buf);
  }),
);

r.post(
  '/:id/email',
  requireRole('APPLICANT'),
  h((req, res) => {
    const { db } = req.ctx;
    const app = loadApp(req);
    if (app.applicant_id !== req.user.id) throw notFound('Application not found.');
    if (app.status === 'DRAFT') throw badRequest('Only submitted applications can be emailed.');
    notify(req.ctx, {
      userId: req.user.id,
      email: req.user.email,
      type: 'APPLICATION_COPY',
      applicationId: app.id,
      subject: `Copy of your application – Ref ${app.reference_no}`,
      body: `Dear ${app.name_with_initials},\n\nAs requested, a copy of your application (Ref ${app.reference_no}) for the post of ${app.position_title} is attached.\n\nUniversity of Peradeniya`,
      attachments: async () => [{ filename: `Application-${app.reference_no}.pdf`, content: await generateApplicationPdf(getFullApplication(db, app.id), req.ctx) }],
    });
    audit(req, 'APPLICATION_EMAILED', 'application', app.id, null, { to: req.user.email });
    res.json({ ok: true, email: req.user.email });
  }),
);

export default r;
