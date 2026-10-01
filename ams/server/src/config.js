import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(here, '..');

export function loadConfig(overrides = {}) {
  const env = process.env;
  const storageDir = path.resolve(overrides.storageDir || env.AMS_STORAGE_DIR || path.join(SERVER_ROOT, 'storage'));
  return {
    port: Number(env.PORT || 4000),
    dbFile: env.AMS_DB_FILE || path.join(storageDir, 'ams.sqlite'),
    storageDir,
    uploadsDir: path.join(storageDir, 'uploads'),
    vacancyDocsDir: path.join(storageDir, 'vacancy-docs'),
    publicUrl: (env.AMS_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, ''),
    secureCookies: env.NODE_ENV === 'production' || env.AMS_SECURE_COOKIES === '1',
    trustProxy: env.AMS_TRUST_PROXY || false,
    clientDist: env.AMS_CLIENT_DIST || path.resolve(SERVER_ROOT, '../client/dist'),
    mailFrom: env.AMS_MAIL_FROM || 'UoP Recruitment <no-reply@pdn.ac.lk>',
    smtp: {
      host: env.SMTP_HOST || null,
      port: Number(env.SMTP_PORT || 587),
      secure: env.SMTP_SECURE === '1',
      user: env.SMTP_USER || null,
      pass: env.SMTP_PASS || null,
    },
    scanFile: null,
    ...overrides,
  };
}
