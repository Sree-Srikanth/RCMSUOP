import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { badRequest } from './util.js';

const SIGNATURES = {
  pdf: { mime: 'application/pdf', test: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  png: { mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  jpg: { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
};

const EXECUTABLE_EXT = /\.(exe|bat|cmd|com|msi|sh|ps1|js|mjs|vbs|jar|php|py|pl|rb|scr|dll|html?|svg)$/i;

/** Strip path components and unsafe characters; keep a readable original name. */
export function sanitizeFilename(name) {
  const base = path.basename(String(name || 'file')).normalize('NFKC');
  const cleaned = base.replace(/[^\p{L}\p{N}._ ()-]/gu, '_').replace(/\.{2,}/g, '.').slice(-120);
  return cleaned || 'file';
}

/**
 * Validates an uploaded buffer: size, allowed type by magic bytes (not by the
 * client-supplied MIME type or extension), no executable extension, and a
 * basic active-content scan for PDFs. An external virus scanner can be plugged
 * in through config.scanFile(buffer) which should throw on infection.
 */
export async function validateUpload(file, { allowed, maxBytes, scanFile }) {
  if (!file || !file.buffer?.length) throw badRequest('No file was uploaded.');
  if (file.buffer.length > maxBytes) throw badRequest(`File exceeds the maximum size of ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  const original = sanitizeFilename(file.originalname);
  if (EXECUTABLE_EXT.test(original)) throw badRequest('Executable or script files are not permitted.');
  const kind = allowed.find((k) => SIGNATURES[k].test(file.buffer));
  if (!kind) throw badRequest(`Unsupported file type. Allowed: ${allowed.map((a) => a.toUpperCase()).join(', ')}.`);
  if (kind === 'pdf') {
    const text = file.buffer.toString('latin1');
    if (/\/(JavaScript|JS|Launch|EmbeddedFile|OpenAction\s*<<[^>]*\/JS)\b/.test(text)) {
      throw badRequest('The PDF contains active content (scripts or embedded files) and was rejected for security reasons.');
    }
  }
  if (scanFile) await scanFile(file.buffer);
  const ext = kind === 'jpg' ? 'jpg' : kind;
  const finalName = /\.[a-z0-9]{2,4}$/i.test(original) ? original.replace(/\.[a-z0-9]{2,4}$/i, `.${ext}`) : `${original}.${ext}`;
  return { kind, mime: SIGNATURES[kind].mime, originalName: finalName, sha256: crypto.createHash('sha256').update(file.buffer).digest('hex') };
}

/** Stores the buffer under a random name outside any web-served directory. */
export function storeFile(dir, buffer, ext) {
  fs.mkdirSync(dir, { recursive: true });
  const stored = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(dir, stored), buffer, { mode: 0o600 });
  return stored;
}

export function sendStoredFile(res, dir, stored, { mime, downloadName, inline = false }) {
  const full = path.join(dir, path.basename(stored));
  if (!fs.existsSync(full)) {
    res.status(404).json({ error: 'File not found in storage.' });
    return;
  }
  res.setHeader('Content-Type', mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
  fs.createReadStream(full).pipe(res);
}
