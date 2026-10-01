import crypto from 'node:crypto';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [algo, N, r, p, saltB64, hashB64] = stored.split('$');
    if (algo !== 'scrypt') return false;
    const expected = Buffer.from(hashB64, 'base64');
    const actual = crypto.scryptSync(String(password), Buffer.from(saltB64, 'base64'), expected.length, { N: +N, r: +r, p: +p });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

/** Temporary password satisfying the password policy. */
export function temporaryPassword() {
  const pick = (set) => set[crypto.randomInt(set.length)];
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$%&*!';
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const all = upper + lower + digits;
  while (chars.length < 12) chars.push(pick(all));
  return chars.sort(() => crypto.randomInt(3) - 1).join('');
}

export function passwordPolicyErrors(pw) {
  const errors = [];
  if (typeof pw !== 'string' || pw.length < 10) errors.push('at least 10 characters');
  if (!/[A-Z]/.test(pw || '')) errors.push('an upper-case letter');
  if (!/[a-z]/.test(pw || '')) errors.push('a lower-case letter');
  if (!/[0-9]/.test(pw || '')) errors.push('a digit');
  if (!/[^A-Za-z0-9]/.test(pw || '')) errors.push('a symbol');
  return errors;
}

/** Simple fixed-window in-memory rate limiter keyed by IP (+ optional key). */
export function rateLimit({ windowMs, max, keyFn = (req) => req.ip, message = 'Too many requests. Please try again later.' }) {
  const hits = new Map();
  setInterval(() => {
    const t = Date.now();
    for (const [k, v] of hits) if (v.reset < t) hits.delete(k);
  }, windowMs).unref();
  return (req, res, next) => {
    if (process.env.AMS_DISABLE_RATE_LIMIT === '1') return next();
    const key = keyFn(req);
    const t = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.reset < t) {
      entry = { count: 0, reset: t + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - t) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
