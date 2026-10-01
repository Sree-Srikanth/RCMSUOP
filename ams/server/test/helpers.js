import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { flushMail } from '../src/lib/mail.js';
import { hashPassword } from '../src/lib/security.js';

process.env.AMS_DISABLE_RATE_LIMIT = '1';

export const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
export const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
export const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
export const PASSWORD = 'Str0ng!Passw0rd';

export async function startServer() {
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-test-'));
  const { app, ctx } = createApp({ dbFile: ':memory:', storageDir, publicUrl: 'http://ams.test' });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    ctx,
    base,
    flush: () => flushMail(ctx),
    async close() {
      await flushMail(ctx);
      await new Promise((resolve) => server.close(resolve));
      ctx.db.close();
      fs.rmSync(storageDir, { recursive: true, force: true });
    },
  };
}

/** Minimal cookie-aware API client that sends the CSRF header like the SPA does. */
export class Client {
  constructor(base) {
    this.base = base;
    this.cookies = {};
  }

  get csrf() {
    return this.cookies.ams_csrf;
  }

  storeCookies(res) {
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      const k = pair.slice(0, i);
      const v = pair.slice(i + 1);
      if (v) this.cookies[k] = v;
      else delete this.cookies[k];
    }
  }

  async request(method, url, { json, form, csrf = true, raw = false } = {}) {
    const headers = {};
    const cookie = Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookie) headers.cookie = cookie;
    if (csrf && this.csrf) headers['x-csrf-token'] = this.csrf;
    let body;
    if (json !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(json);
    } else if (form) body = form;
    const res = await fetch(this.base + url, { method, headers, body });
    this.storeCookies(res);
    if (raw) return { status: res.status, headers: res.headers, buffer: Buffer.from(await res.arrayBuffer()) };
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data, headers: res.headers };
  }

  get(url, opts) {
    return this.request('GET', url, opts);
  }
  post(url, json, opts = {}) {
    return this.request('POST', url, { ...opts, json });
  }
  put(url, json, opts = {}) {
    return this.request('PUT', url, { ...opts, json });
  }
  del(url, opts) {
    return this.request('DELETE', url, opts);
  }

  async upload(url, fields, buffer, filename, type = 'application/octet-stream') {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    form.append('file', new Blob([buffer], { type }), filename);
    return this.request('POST', url, { form });
  }

  async login(email, password = PASSWORD) {
    const r = await this.post('/api/auth/login', { email, password });
    if (r.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(r.data)}`);
    return r.data.user;
  }
}

/** Create a staff user directly (bypassing first-login password change). */
export function createUser(ctx, { email, role, full_name = role, faculty_code, department_code }) {
  const { db } = ctx;
  let faculty_id = null;
  let department_id = null;
  if (department_code) {
    const d = db.prepare('SELECT d.* FROM departments d JOIN faculties f ON f.id = d.faculty_id WHERE f.code = ? AND d.code = ?').get(faculty_code, department_code);
    department_id = d.id;
    faculty_id = d.faculty_id;
  } else if (faculty_code) {
    faculty_id = db.prepare('SELECT id FROM faculties WHERE code = ?').get(faculty_code).id;
  }
  const t = new Date().toISOString();
  db.prepare(
    'INSERT INTO users (email, password_hash, role, full_name, faculty_id, department_id, must_change_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
  ).run(email, hashPassword(PASSWORD), role, full_name, faculty_id, department_id, t, t);
}

export function dept(ctx, facultyCode, deptCode) {
  return ctx.db.prepare('SELECT d.* FROM departments d JOIN faculties f ON f.id = d.faculty_id WHERE f.code = ? AND d.code = ?').get(facultyCode, deptCode);
}

export function positionId(ctx, code) {
  return ctx.db.prepare('SELECT id FROM positions WHERE code = ?').get(code).id;
}

export function futureDate(days) {
  return new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
}

export function kandy(ctx) {
  const p = ctx.db.prepare("SELECT id FROM provinces WHERE name = 'Central'").get();
  const d = ctx.db.prepare("SELECT id FROM districts WHERE name = 'Kandy'").get();
  const colombo = ctx.db.prepare("SELECT id FROM districts WHERE name = 'Colombo'").get();
  return { province_id: p.id, district_id: d.id, colombo_id: colombo.id };
}

/** A complete, valid application payload. */
export function completeApplication(ctx, { surname = 'Perera', email, refEmails = ['ref1@example.org', 'ref2@example.org'] } = {}) {
  const loc = kandy(ctx);
  return {
    fields: {
      title: 'Dr',
      surname,
      name_in_full: `Amal Kumara ${surname}`,
      name_with_initials: `A.K. ${surname}`,
      date_of_birth: '1990-05-14',
      civil_status: 'MARRIED',
      citizenship_type: 'DESCENT',
      nic: '199013501234',
      email,
      mobile: '0771234567',
      cur_address_line1: '12 Temple Road',
      cur_city: 'Peradeniya',
      cur_province_id: loc.province_id,
      cur_district_id: loc.district_id,
      perm_same_as_current: true,
      vacation_of_post: false,
      bond_violator: false,
      extra_curricular: 'University chess team captain',
      declaration_accepted: true,
      declaration_name: `A.K. ${surname}`,
    },
    sections: {
      education: [
        {
          qualification: 'BSc Eng (Hons)',
          university: 'University of Peradeniya',
          period_from: '2010-01-10',
          period_to: '2014-03-10',
          course_followed: 'Civil Engineering',
          final_exam_date: '2014-02-20',
          result_class: 'FIRST_CLASS',
          gpa: '3.85',
        },
      ],
      postgraduate: [
        { qualification: 'PhD', institution: 'University of Cambridge', pg_type: 'RESEARCH', slqf_level: 'LEVEL_10', duration: '4 years', effective_date: '2020-07-01' },
      ],
      distinctions: [{ award_type: 'MEDAL', award: 'Gold Medal for best performance', institution: 'University of Peradeniya', year: '2014' }],
      books: [],
      abstracts: [{ title: 'Soil behaviour', authors: 'Perera A.K.', source: 'Proc. PURSE', publication_date: '2019-11-01' }],
      journals: [
        { title: 'Slope stability', authors: 'Perera A.K., Silva B.', source_doi: '10.1000/xyz123', year: '2021' },
        { title: 'Ground improvement', authors: 'Perera A.K.', source_doi: '10.1000/abc', year: '2022' },
      ],
      current_employment: [{ designation: 'Lecturer', institution: 'SLIIT', date_from: '2021-01-01', salary: 'Rs. 150,000' }],
      previous_employment: [],
      referees: [
        { name: 'Prof. S. Fernando', address: 'Dept of Civil Eng, University of Moratuwa', telephone: '0112650301', email: refEmails[0] },
        { name: 'Dr. R. Jayasinghe', address: 'Dept of Civil Eng, University of Ruhuna', telephone: '0912245765', email: refEmails[1] },
      ],
    },
  };
}

export const REQUIRED_UPLOADS = [
  ['BIRTH_CERT', PDF, 'birth.pdf'],
  ['NIC_PASSPORT', PDF, 'nic.pdf'],
  ['DEGREE', PDF, 'degree.pdf'],
  ['POSTGRAD', PDF, 'phd.pdf'],
  ['DISTINCTIONS', PDF, 'medal.pdf'],
  ['PUBLICATIONS', PDF, 'pubs.pdf'],
  ['EMPLOYMENT', PDF, 'employment.pdf'],
  ['EXTRA_CURRICULAR', PDF, 'extra.pdf'],
  ['PHOTO', JPG, 'photo.jpg'],
  ['IMAGE', PNG, 'signature.png'],
];
