/**
 * Consistent online backup of the database plus the uploaded documents.
 *
 *   npm run backup                 -> storage/backups/<timestamp>/
 *   AMS_BACKUP_DIR=/mnt/backup npm run backup
 *
 * Restore: stop the server, copy ams.sqlite back to AMS_DB_FILE and the
 * uploads / vacancy-docs folders back into the storage directory.
 */
import fs from 'node:fs';
import path from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';
import { loadConfig } from '../src/config.js';

const config = loadConfig();
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(process.env.AMS_BACKUP_DIR || path.join(config.storageDir, 'backups'), stamp);
fs.mkdirSync(target, { recursive: true });

const db = new DatabaseSync(config.dbFile, { readOnly: true });
await backup(db, path.join(target, 'ams.sqlite'));
db.close();

for (const dir of ['uploads', 'vacancy-docs']) {
  const src = path.join(config.storageDir, dir);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(target, dir), { recursive: true });
}
console.log(`Backup written to ${target}`);
