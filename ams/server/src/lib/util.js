export const now = () => new Date().toISOString();

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const forbidden = (msg = 'You are not authorised to perform this action.') => new HttpError(403, msg);
export const notFound = (msg = 'Not found.') => new HttpError(404, msg);
export const conflict = (msg, details) => new HttpError(409, msg, details);

/** Wrap an async/sync handler so thrown errors reach the error middleware. */
export const h = (fn) => (req, res, next) => {
  try {
    const r = fn(req, res, next);
    if (r && typeof r.catch === 'function') r.catch(next);
  } catch (e) {
    next(e);
  }
};

export const toInt = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

export const str = (v, max = 2000) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
};

export const bool01 = (v) => {
  if (v === undefined || v === null || v === '') return null;
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'YES' ? 1 : 0;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const date = (v) => {
  const s = str(v, 10);
  if (!s) return null;
  if (!ISO_DATE.test(s) || Number.isNaN(Date.parse(s))) throw badRequest(`Invalid date: ${s}`);
  return s;
};

export const oneOf = (v, allowed) => {
  const s = str(v, 64);
  if (s === null) return null;
  if (!allowed.includes(s)) throw badRequest(`Invalid value "${s}". Allowed: ${allowed.join(', ')}`);
  return s;
};

export const isEmail = (s) => typeof s === 'string' && /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/.test(s);

/** Age in completed years on a given date (both YYYY-MM-DD). */
export function ageOn(dob, onDate) {
  if (!dob) return null;
  const d = new Date(dob);
  const o = onDate ? new Date(onDate) : new Date();
  let age = o.getUTCFullYear() - d.getUTCFullYear();
  const m = o.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && o.getUTCDate() < d.getUTCDate())) age -= 1;
  return age;
}

export function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  // Neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) lines.push(r.map(csvEscape).join(','));
  // UTF-8 BOM so Excel opens Sinhala/Tamil text correctly.
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

export function sendCsv(res, filename, headers, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(toCsv(headers, rows));
}

export const fmtDate = (s) => (s ? String(s).slice(0, 10) : '');
