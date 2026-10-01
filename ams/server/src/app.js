import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { openDatabase } from './db.js';
import { loadConfig } from './config.js';
import { createMailer } from './lib/mail.js';
import { authenticate } from './lib/auth.js';
import { HttpError } from './lib/util.js';

import authRoutes from './routes/auth.js';
import masterRoutes from './routes/master.js';
import vacancyRoutes from './routes/vacancies.js';
import applicantRoutes from './routes/applicant.js';
import applicationRoutes from './routes/applications.js';
import reviewRoutes from './routes/review.js';
import shortlistRoutes from './routes/shortlist.js';
import sharedRoutes from './routes/shared.js';
import interviewRoutes from './routes/interviews.js';
import appointmentRoutes from './routes/appointments.js';
import reportRoutes from './routes/reports.js';
import refereeRoutes from './routes/referee.js';
import adminRoutes from './routes/admin.js';

const DB_ERRORS = {
  SHORTLIST_RULE_VIOLATION: [400, 'The decision/category combination is not permitted for this position.'],
  SHORTLIST_DECISIONS_IMMUTABLE: [409, 'Shortlist decision history cannot be modified.'],
  AUDIT_LOG_IMMUTABLE: [409, 'Audit logs cannot be modified.'],
  SUBMITTED_APPLICATION_VACANCY_LOCKED: [409, 'A submitted application cannot change its vacancy.'],
  REFERENCE_NUMBER_IMMUTABLE: [409, 'The application reference number cannot be changed.'],
  SUBMITTED_APPLICATION_UNDELETABLE: [409, 'Submitted applications cannot be deleted.'],
};

export function createApp(overrides = {}) {
  const config = loadConfig(overrides);
  fs.mkdirSync(config.uploadsDir, { recursive: true });
  fs.mkdirSync(config.vacancyDocsDir, { recursive: true });
  const db = overrides.db || openDatabase(config.dbFile);
  const ctx = { db, config, mailer: createMailer(config) };

  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    if (config.secureCookies) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    req.ctx = ctx;
    next();
  });

  app.use('/api', express.json({ limit: '2mb' }));
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', authenticate);

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/master', masterRoutes);
  app.use('/api/vacancies', vacancyRoutes);
  app.use('/api/me', applicantRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/review', reviewRoutes);
  app.use('/api/shortlist', shortlistRoutes);
  app.use('/api/shared', sharedRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/referee', refereeRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  // Serve the built React client (production) with SPA fallback.
  if (fs.existsSync(path.join(config.clientDist, 'index.html'))) {
    app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, details: err.details });
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'The file is larger than the permitted upload size.' : err.message;
      return res.status(400).json({ error: msg });
    }
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON request.' });
    const dbKey = Object.keys(DB_ERRORS).find((k) => String(err?.message).includes(k));
    if (dbKey) return res.status(DB_ERRORS[dbKey][0]).json({ error: DB_ERRORS[dbKey][1] });
    if (/UNIQUE constraint failed/.test(String(err?.message))) return res.status(409).json({ error: 'A record with these details already exists.' });
    console.error(err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  });

  return { app, ctx };
}
