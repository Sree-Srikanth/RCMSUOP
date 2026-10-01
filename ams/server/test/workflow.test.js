import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer, Client, createUser, dept, positionId, futureDate, kandy, completeApplication, REQUIRED_UPLOADS, PDF, PASSWORD,
} from './helpers.js';

/**
 * End-to-end workflow covering the acceptance criteria of Requirements §34:
 * vacancy → application → documents → submission/reference → review →
 * shortlist rules → sharing → HOD/Dean visibility → interviews → reports →
 * referees → audit.
 */
describe('Recruitment & selection workflow', () => {
  let srv;
  let admin;
  let registrar;
  let hod;
  let otherHod;
  let dean;
  let applicant;
  let applicant2;
  const ids = {};

  before(async () => {
    srv = await startServer();
    createUser(srv.ctx, { email: 'sar@pdn.ac.lk', role: 'REGISTRAR', full_name: 'SAR Academic' });
    createUser(srv.ctx, { email: 'hod.civil@pdn.ac.lk', role: 'HOD', faculty_code: 'ENG', department_code: 'CIV' });
    createUser(srv.ctx, { email: 'hod.mech@pdn.ac.lk', role: 'HOD', faculty_code: 'ENG', department_code: 'MEC' });
    createUser(srv.ctx, { email: 'dean.eng@pdn.ac.lk', role: 'DEAN', faculty_code: 'ENG' });
    registrar = new Client(srv.base);
    hod = new Client(srv.base);
    otherHod = new Client(srv.base);
    dean = new Client(srv.base);
    await registrar.login('sar@pdn.ac.lk');
    await hod.login('hod.civil@pdn.ac.lk');
    await otherHod.login('hod.mech@pdn.ac.lk');
    await dean.login('dean.eng@pdn.ac.lk');
  });

  after(async () => {
    await srv.close();
  });

  it('forces the seeded administrator to change the temporary password on first login', async () => {
    admin = new Client(srv.base);
    const user = await admin.login('admin@pdn.ac.lk', 'ChangeMe@2026');
    assert.equal(user.must_change_password, true);
    const blocked = await admin.get('/api/admin/users');
    assert.equal(blocked.status, 403);
    assert.equal(blocked.data.details.code, 'PASSWORD_CHANGE_REQUIRED');
    const weak = await admin.post('/api/auth/change-password', { current_password: 'ChangeMe@2026', new_password: 'short' });
    assert.equal(weak.status, 400);
    const ok = await admin.post('/api/auth/change-password', { current_password: 'ChangeMe@2026', new_password: PASSWORD });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.user.must_change_password, false);
    assert.equal((await admin.get('/api/admin/users')).status, 200);
  });

  it('stores passwords hashed, never in plaintext', () => {
    const rows = srv.ctx.db.prepare('SELECT password_hash FROM users').all();
    for (const r of rows) {
      assert.match(r.password_hash, /^scrypt\$/);
      assert.ok(!r.password_hash.includes(PASSWORD));
    }
  });

  it('rejects state-changing requests without the CSRF token', async () => {
    const r = await registrar.request('POST', '/api/vacancies', { json: {}, csrf: false });
    assert.equal(r.status, 403);
  });

  it('administrator creates a staff user with a temporary password', async () => {
    const civ = dept(srv.ctx, 'ENG', 'CIV');
    const r = await admin.post('/api/admin/users', { email: 'hod2@pdn.ac.lk', role: 'HOD', full_name: 'Prof. Test', department_id: civ.id });
    assert.equal(r.status, 201);
    assert.ok(r.data.temporary_password.length >= 10);
    const c = new Client(srv.base);
    const u = await c.login('hod2@pdn.ac.lk', r.data.temporary_password);
    assert.equal(u.must_change_password, true);
    assert.equal(u.faculty_id, civ.faculty_id);
  });

  it('registrar creates and publishes vacancies', async () => {
    const civ = dept(srv.ctx, 'ENG', 'CIV');
    const lp = await registrar.post('/api/vacancies', {
      position_id: positionId(srv.ctx, 'LP'), department_id: civ.id, discipline: 'Geotechnical Engineering',
      advertised_on: futureDate(-10), closing_date: futureDate(20), requirements: 'BSc with First/Second Upper',
    });
    assert.equal(lp.status, 201, JSON.stringify(lp.data));
    ids.lpVacancy = lp.data.vacancy.id;
    const sl1 = await registrar.post('/api/vacancies', {
      position_id: positionId(srv.ctx, 'SL1'), department_id: civ.id, advertised_on: futureDate(-10), closing_date: futureDate(20),
    });
    ids.sl1Vacancy = sl1.data.vacancy.id;
    const closed = await registrar.post('/api/vacancies', {
      position_id: positionId(srv.ctx, 'LU'), department_id: civ.id, advertised_on: futureDate(-30), closing_date: futureDate(-1),
    });
    ids.closedVacancy = closed.data.vacancy.id;
    for (const id of [ids.lpVacancy, ids.sl1Vacancy, ids.closedVacancy]) {
      assert.equal((await registrar.post(`/api/vacancies/${id}/status`, { status: 'PUBLISHED' })).status, 200);
    }
    const pub = await new Client(srv.base).get('/api/vacancies');
    const visible = pub.data.vacancies.map((v) => v.id);
    assert.ok(visible.includes(ids.lpVacancy));
    assert.ok(!visible.includes(ids.closedVacancy), 'vacancy past closing date is not listed publicly');
  });

  it('applicant registers and cannot apply after the closing date', async () => {
    applicant = new Client(srv.base);
    const reg = await applicant.post('/api/auth/register', {
      email: 'amal@example.com', title: 'Dr', surname: 'Perera', name_with_initials: 'A.K. Perera', nic: '199013501234', mobile: '0771234567', password: PASSWORD,
    });
    assert.equal(reg.status, 201, JSON.stringify(reg.data));
    const late = await applicant.post('/api/applications', { vacancy_id: ids.closedVacancy });
    assert.equal(late.status, 403);
  });

  it('creates a draft prefilled from the profile and persists the surname', async () => {
    const r = await applicant.post('/api/applications', { vacancy_id: ids.lpVacancy });
    assert.equal(r.status, 201);
    ids.app1 = r.data.id;
    const got = await applicant.get(`/api/applications/${ids.app1}`);
    assert.equal(got.data.application.surname, 'Perera');
    assert.equal(got.data.application.email, 'amal@example.com', 'registered email is the default applied email');
    const upd = await applicant.put(`/api/applications/${ids.app1}`, { fields: { surname: 'Perera-Silva', name_in_full: 'Amal Kumara Perera-Silva' } });
    assert.equal(upd.status, 200);
    assert.equal(upd.data.application.surname, 'Perera-Silva');
  });

  it('rejects a district that does not belong to the selected province', async () => {
    const loc = kandy(srv.ctx);
    const r = await applicant.put(`/api/applications/${ids.app1}`, { fields: { cur_province_id: loc.province_id, cur_district_id: loc.colombo_id } });
    assert.equal(r.status, 400);
    assert.match(r.data.error, /district/i);
  });

  it('blocks submission while mandatory documents are missing', async () => {
    const payload = completeApplication(srv.ctx, { email: 'amal@example.com' });
    const saved = await applicant.put(`/api/applications/${ids.app1}`, payload);
    assert.equal(saved.status, 200, JSON.stringify(saved.data));
    const r = await applicant.post(`/api/applications/${ids.app1}/submit`, {});
    assert.equal(r.status, 409);
    const codes = r.data.details.issues.map((i) => i.field);
    for (const c of ['BIRTH_CERT', 'NIC_PASSPORT', 'DEGREE', 'PHOTO', 'IMAGE', 'POSTGRAD', 'PUBLICATIONS']) assert.ok(codes.includes(c), `missing ${c}`);
  });

  it('validates uploads by content, not by name', async () => {
    const exe = await applicant.upload(`/api/applications/${ids.app1}/documents`, { category: 'BIRTH_CERT' }, PDF, 'virus.exe');
    assert.equal(exe.status, 400);
    const fake = await applicant.upload(`/api/applications/${ids.app1}/documents`, { category: 'BIRTH_CERT' }, Buffer.from('MZ not a pdf'), 'birth.pdf');
    assert.equal(fake.status, 400);
    const active = await applicant.upload(`/api/applications/${ids.app1}/documents`, { category: 'BIRTH_CERT' }, Buffer.from('%PDF-1.4 /JavaScript (app.alert(1))'), 'b.pdf');
    assert.equal(active.status, 400);
    const photoAsPdf = await applicant.upload(`/api/applications/${ids.app1}/documents`, { category: 'PHOTO' }, PDF, 'photo.pdf');
    assert.equal(photoAsPdf.status, 400, 'photograph must be an image');
  });

  it('submits a complete application and generates a unique reference number', async () => {
    for (const [category, buf, name] of REQUIRED_UPLOADS) {
      const r = await applicant.upload(`/api/applications/${ids.app1}/documents`, { category }, buf, name);
      assert.equal(r.status, 201, `${category}: ${JSON.stringify(r.data)}`);
    }
    const r = await applicant.post(`/api/applications/${ids.app1}/submit`, {});
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.match(r.data.reference_no, /^ENG-CIV-LP-\d{6}$/);
    ids.ref1 = r.data.reference_no;
    const app = srv.ctx.db.prepare('SELECT * FROM applications WHERE id = ?').get(ids.app1);
    assert.equal(app.status, 'SUBMITTED');
    assert.equal(app.declaration_date, app.submitted_at.slice(0, 10), 'submitted date used as declaration date');
  });

  it('makes the submitted application read-only and its reference immutable', async () => {
    const r = await applicant.put(`/api/applications/${ids.app1}`, { fields: { surname: 'Changed' } });
    assert.equal(r.status, 403);
    const up = await applicant.upload(`/api/applications/${ids.app1}/documents`, { category: 'BIRTH_CERT' }, PDF, 'b.pdf');
    assert.equal(up.status, 403);
    assert.throws(() => srv.ctx.db.prepare("UPDATE applications SET reference_no = 'X' WHERE id = ?").run(ids.app1), /REFERENCE_NUMBER_IMMUTABLE/);
    assert.throws(() => srv.ctx.db.prepare('UPDATE applications SET vacancy_id = ? WHERE id = ?').run(ids.sl1Vacancy, ids.app1), /VACANCY_LOCKED/);
    assert.throws(() => srv.ctx.db.prepare('DELETE FROM applications WHERE id = ?').run(ids.app1), /UNDELETABLE/);
  });

  it('generates two referee requests and the confirmation notification after submission', async () => {
    await srv.flush();
    const reqs = srv.ctx.db.prepare('SELECT * FROM referee_requests WHERE application_id = ?').all(ids.app1);
    assert.equal(reqs.length, 2);
    const mails = srv.ctx.db.prepare("SELECT * FROM notifications WHERE application_id = ? AND type = 'REFEREE_REQUEST'").all(ids.app1);
    assert.equal(mails.length, 2);
    assert.ok(mails.every((m) => m.status === 'SENT'));
    const confirm = srv.ctx.db.prepare("SELECT * FROM notifications WHERE application_id = ? AND type = 'APPLICATION_SUBMITTED'").get(ids.app1);
    assert.ok(confirm.body.includes(ids.ref1));
    const mine = await applicant.get('/api/me/applications');
    assert.equal(mine.data.applications[0].reference_no, ids.ref1);
    assert.equal(mine.data.applications[0].referee_status.length, 2);
  });

  it('produces the application PDF', async () => {
    const r = await applicant.get(`/api/applications/${ids.app1}/pdf`, { raw: true });
    assert.equal(r.status, 200);
    assert.equal(r.buffer.subarray(0, 5).toString(), '%PDF-');
  });

  it('second applicant gets a different reference; applicants cannot see each other', async () => {
    applicant2 = new Client(srv.base);
    await applicant2.post('/api/auth/register', {
      email: 'nimal@example.com', surname: 'Silva', name_with_initials: 'N. Silva', nic: '921234567V', mobile: '0712345678', password: PASSWORD,
    });
    for (const [vacancy, key] of [[ids.lpVacancy, 'app2'], [ids.sl1Vacancy, 'app3']]) {
      const c = await applicant2.post('/api/applications', { vacancy_id: vacancy });
      ids[key] = c.data.id;
      const payload = completeApplication(srv.ctx, { surname: 'Silva', email: 'nimal@example.com' });
      payload.fields.nic = '921234567V';
      assert.equal((await applicant2.put(`/api/applications/${ids[key]}`, payload)).status, 200);
      for (const [category, buf, name] of REQUIRED_UPLOADS) await applicant2.upload(`/api/applications/${ids[key]}/documents`, { category }, buf, name);
      const s = await applicant2.post(`/api/applications/${ids[key]}/submit`, {});
      assert.equal(s.status, 200, JSON.stringify(s.data));
      ids[`ref_${key}`] = s.data.reference_no;
    }
    assert.notEqual(ids.ref_app2, ids.ref1);
    assert.match(ids.ref_app3, /^ENG-CIV-SL1-/);
    assert.equal((await applicant2.get(`/api/applications/${ids.app1}`)).status, 404);
    const doc = srv.ctx.db.prepare('SELECT id FROM application_documents WHERE application_id = ? LIMIT 1').get(ids.app1);
    assert.equal((await applicant2.get(`/api/applications/${ids.app1}/documents/${doc.id}`)).status, 404);
  });

  it('registrar lists, filters and opens the complete application with Previous/Next navigation', async () => {
    const list = await registrar.get(`/api/review/applications?vacancy_id=${ids.lpVacancy}&sort=reference_no`);
    assert.equal(list.data.total, 2);
    const detail = await registrar.get(`/api/review/applications/${ids.app1}?vacancy_id=${ids.lpVacancy}&sort=reference_no`);
    assert.equal(detail.status, 200);
    assert.equal(detail.data.application.sections.journals.length, 2, 'complete application, not a summary');
    assert.equal(detail.data.nav.next_id, ids.app2);
    assert.equal(detail.data.nav.prev_id, null);
    const back = await registrar.get(`/api/review/applications/${ids.app2}?vacancy_id=${ids.lpVacancy}&sort=reference_no`);
    assert.equal(back.data.nav.prev_id, ids.app1);
    const lpOpts = detail.data.options;
    assert.deepEqual(lpOpts.find((o) => o.decision === 'SELECTED').categories, ['CATEGORY_I', 'CATEGORY_II', 'CATEGORY_III']);
  });

  it('enforces the Lecturer (Probationary) shortlist rules at the API', async () => {
    const url = `/api/review/applications/${ids.app1}/decision`;
    const cases = [
      [{ decision: 'SELECTED' }, 'no category'],
      [{ decision: 'SELECTED', category: ['CATEGORY_I', 'CATEGORY_II'] }, 'multiple categories'],
      [{ decision: 'REJECTED', category: 'CATEGORY_I' }, 'rejected + category'],
      [{ decision: 'PENDING', category: 'CATEGORY_II' }, 'pending + category'],
      [{ decision: 'RELEVANT' }, 'generic decision'],
      [{ decision: 'SELECTED', category: 'CATEGORY_IV' }, 'unknown category'],
    ];
    for (const [body, why] of cases) {
      const r = await registrar.post(url, body);
      assert.equal(r.status, 400, `expected rejection: ${why}`);
    }
    const ok = await registrar.post(url, { decision: 'SELECTED', category: 'CATEGORY_II', remarks: 'Strong research record' });
    assert.equal(ok.status, 200, JSON.stringify(ok.data));
    assert.equal(ok.data.decision.category_code, 'CATEGORY_II');
    assert.equal(srv.ctx.db.prepare('SELECT status FROM applications WHERE id = ?').get(ids.app1).status, 'UNDER_REVIEW');
  });

  it('enforces the other-position rules (no categories at all)', async () => {
    const url = `/api/review/applications/${ids.app3}/decision`;
    assert.equal((await registrar.post(url, { decision: 'SELECTED', category: 'CATEGORY_I' })).status, 400);
    assert.equal((await registrar.post(url, { decision: 'REJECTED', category: 'CATEGORY_III' })).status, 400);
    assert.equal((await registrar.post(url, { decision: 'PENDING' })).status, 200);
    assert.equal((await registrar.post(url, { decision: 'SELECTED' })).status, 200);
  });

  it('rejects invalid combinations at the database layer too', () => {
    const regId = srv.ctx.db.prepare("SELECT id FROM users WHERE email = 'sar@pdn.ac.lk'").get().id;
    const ins = (app, d, c) =>
      srv.ctx.db.prepare('INSERT INTO shortlist_decisions (application_id, decision_code, category_code, decided_by, decided_at) VALUES (?, ?, ?, ?, ?)').run(app, d, c, regId, new Date().toISOString());
    assert.throws(() => ins(ids.app1, 'SELECTED', null), /SHORTLIST_RULE_VIOLATION/);
    assert.throws(() => ins(ids.app1, 'REJECTED', 'CATEGORY_I'), /CHECK constraint|SHORTLIST_RULE_VIOLATION/);
    assert.throws(() => ins(ids.app3, 'SELECTED', 'CATEGORY_I'), /SHORTLIST_RULE_VIOLATION/);
    assert.throws(() => srv.ctx.db.prepare("UPDATE shortlist_decisions SET decision_code = 'REJECTED'").run(), /IMMUTABLE/);
  });

  it('records decision history with old and new values', async () => {
    await registrar.post(`/api/review/applications/${ids.app2}/decision`, { decision: 'PENDING' });
    await registrar.post(`/api/review/applications/${ids.app2}/decision`, { decision: 'REJECTED', remarks: 'Does not meet minimum' });
    const h = await registrar.get(`/api/review/applications/${ids.app2}/decisions`);
    assert.equal(h.data.history.length, 2);
    assert.equal(h.data.history[0].decision_code, 'REJECTED');
    assert.equal(h.data.history[0].previous_decision_code, 'PENDING');
    assert.equal(h.data.history[0].decided_by_name, 'SAR Academic');
    const audit = srv.ctx.db.prepare("SELECT * FROM audit_logs WHERE action = 'SHORTLIST_DECISION_MODIFIED' AND entity_id = ?").get(String(ids.app2));
    assert.equal(JSON.parse(audit.old_values).decision, 'PENDING');
    assert.equal(JSON.parse(audit.new_values).decision, 'REJECTED');
  });

  it('HOD/Dean see nothing before sharing', async () => {
    assert.equal((await hod.get('/api/shared/applications')).data.applications.length, 0);
    assert.equal((await dean.get('/api/shared/applications')).data.applications.length, 0);
    assert.equal((await hod.get(`/api/applications/${ids.app1}`)).status, 404);
  });

  it('shortlist shows selected candidates and only they can be shared', async () => {
    const sl = await registrar.get('/api/shortlist');
    const listed = sl.data.applications.map((a) => a.id).sort();
    assert.deepEqual(listed, [ids.app1, ids.app3].sort());
    const bad = await registrar.post('/api/shortlist/share', { application_ids: [ids.app1, ids.app2] });
    assert.equal(bad.status, 400, 'rejected candidate cannot be shared');
    const ok = await registrar.post('/api/shortlist/share', { application_ids: [ids.app1], note: 'For your review' });
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.data.shares.map((s) => s.recipient_role).sort(), ['DEAN', 'HOD']);
    const hist = await registrar.get('/api/shortlist/shares');
    assert.equal(hist.data.shares.length, 2);
    assert.equal(hist.data.shares[0].candidates[0].reference_no, ids.ref1);
  });

  it('HOD/Dean see only shared, selected applications of their own unit', async () => {
    const h = await hod.get('/api/shared/applications');
    assert.deepEqual(h.data.applications.map((a) => a.id), [ids.app1]);
    const d = await dean.get('/api/shared/applications');
    assert.deepEqual(d.data.applications.map((a) => a.id), [ids.app1]);
    assert.equal((await otherHod.get('/api/shared/applications')).data.applications.length, 0, 'other department HOD sees nothing');
    assert.equal((await otherHod.get(`/api/applications/${ids.app1}`)).status, 404);
    assert.equal((await hod.get(`/api/applications/${ids.app3}`)).status, 404, 'selected but unshared stays hidden');
    assert.equal((await hod.get(`/api/applications/${ids.app1}`)).status, 200);
    const pdf = await hod.get(`/api/applications/${ids.app1}/pdf`, { raw: true });
    assert.equal(pdf.status, 200);
    const doc = srv.ctx.db.prepare('SELECT id FROM application_documents WHERE application_id = ? AND deleted_at IS NULL LIMIT 1').get(ids.app1);
    assert.equal((await hod.get(`/api/applications/${ids.app1}/documents/${doc.id}`, { raw: true })).status, 200);
    const csv = await hod.get('/api/shared/export.csv');
    assert.ok(csv.data.includes(ids.ref1));
    assert.ok(srv.ctx.db.prepare("SELECT COUNT(*) n FROM audit_logs WHERE action = 'DOCUMENT_DOWNLOADED'").get().n >= 1, 'downloads are audited');
    assert.equal((await hod.get('/api/review/applications')).status, 403, 'HOD cannot use the registrar menu');
  });

  it('sharing never changes the decision; a later rejection hides it from HOD/Dean', async () => {
    const before = srv.ctx.db.prepare('SELECT decision_code FROM current_shortlist WHERE application_id = ?').get(ids.app1);
    assert.equal(before.decision_code, 'SELECTED');
    await registrar.post(`/api/review/applications/${ids.app1}/decision`, { decision: 'PENDING' });
    assert.equal((await hod.get('/api/shared/applications')).data.applications.length, 0);
    await registrar.post(`/api/review/applications/${ids.app1}/decision`, { decision: 'SELECTED', category: 'CATEGORY_I' });
    assert.equal((await hod.get('/api/shared/applications')).data.applications.length, 1);
  });

  it('interviews accept only selected candidates of the vacancy and notify them', async () => {
    const c = await registrar.post('/api/interviews', {
      vacancy_id: ids.lpVacancy, interview_date: futureDate(30), interview_time: '09:30', mode: 'IN_PERSON', venue: 'Senate Room',
      panel_details: 'Vice-Chancellor (Chair), Dean/Engineering, HOD/Civil, two Senate nominees', candidate_instructions: 'Bring originals.',
    });
    assert.equal(c.status, 201, JSON.stringify(c.data));
    ids.interview = c.data.id;
    const det = await registrar.get(`/api/interviews/${ids.interview}`);
    assert.deepEqual(det.data.eligible.map((e) => e.id), [ids.app1]);
    assert.equal((await registrar.post(`/api/interviews/${ids.interview}/candidates`, { application_ids: [ids.app2] })).status, 400);
    assert.equal((await registrar.post(`/api/interviews/${ids.interview}/candidates`, { application_ids: [ids.app3] })).status, 400, 'other vacancy');
    assert.equal((await registrar.post(`/api/interviews/${ids.interview}/candidates`, { application_ids: [ids.app1] })).status, 200);
    const n = await registrar.post(`/api/interviews/${ids.interview}/notify`, {});
    assert.equal(n.data.notified, 1);
    await srv.flush();
    const mail = srv.ctx.db.prepare("SELECT * FROM notifications WHERE type = 'INTERVIEW_NOTIFICATION'").get();
    assert.match(mail.body, /Senate Room/);
    const cand = n.data.candidates[0];
    const upd = await registrar.put(`/api/interviews/${ids.interview}/candidates/${cand.id}`, { attendance: 'PRESENT', result: 'Recommended', remarks: 'Good' });
    assert.equal(upd.data.candidates[0].attendance, 'PRESENT');
  });

  it('referee completes the report through the secure link (once)', async () => {
    const mail = srv.ctx.db.prepare("SELECT body FROM notifications WHERE type = 'REFEREE_REQUEST' AND application_id = ? ORDER BY id LIMIT 1").get(ids.app1);
    const token = mail.body.match(/#([A-Za-z0-9_-]{30,})/)[1];
    const anon = new Client(srv.base);
    assert.equal((await anon.post('/api/referee/lookup', { token: 'x'.repeat(43) })).status, 404);
    const look = await anon.post('/api/referee/lookup', { token });
    assert.equal(look.status, 200);
    assert.equal(look.data.context.reference_no, ids.ref1);
    assert.equal(look.data.context.applicant_email, undefined, 'no applicant contact details exposed');
    const body = { token, referee_name: 'Prof. S. Fernando', relationship: 'PhD co-supervisor', recommendation: 'HIGHLY_RECOMMENDED', non_related_confirmed: true, ratings: { integrity: 'EXCELLENT' } };
    assert.equal((await anon.post('/api/referee/submit', body)).status, 200);
    assert.equal((await anon.post('/api/referee/submit', body)).status, 409);
    const st = await registrar.get(`/api/review/applications/${ids.app1}`);
    assert.equal(st.data.application.rr_received, 1);
    const reports = await registrar.get(`/api/review/applications/${ids.app1}/referee-reports`);
    assert.equal(reports.data.reports[0].ratings.integrity, 'EXCELLENT');
    assert.equal((await applicant.get(`/api/review/applications/${ids.app1}/referee-reports`)).status, 403);
  });

  it('generates CSV and landscape PDF reports with the required fields', async () => {
    const csv = await registrar.get(`/api/reports/candidates?vacancy_id=${ids.lpVacancy}&scope=selected&format=csv`);
    assert.equal(csv.status, 200);
    assert.ok(csv.data.startsWith('Reference,Applicant Name,Mobile,Email,Address,University Education,Postgraduate Qualifications,Previous Employments,Books,Abstracts,Journals,Referees'));
    const raw = await registrar.get(`/api/reports/candidates?vacancy_id=${ids.lpVacancy}&format=csv`, { raw: true });
    assert.deepEqual([...raw.buffer.subarray(0, 3)], [0xef, 0xbb, 0xbf], 'UTF-8 with BOM');
    assert.ok(csv.data.includes(ids.ref1));
    assert.ok(!csv.data.includes(ids.ref_app2), 'rejected candidate excluded from selected report');
    const pdf = await registrar.get(`/api/reports/candidates?department_id=${dept(srv.ctx, 'ENG', 'CIV').id}&scope=all&format=pdf`, { raw: true });
    assert.equal(pdf.buffer.subarray(0, 5).toString(), '%PDF-');
    assert.match(pdf.buffer.toString('latin1'), /\/MediaBox \[0 0 841\.89 595\.28\]/, 'A4 landscape');
  });

  it('reproduces the official schedule (PDF and CSV) with PC/RR/TR', async () => {
    const put = await registrar.put(`/api/review/applications/${ids.app1}/schedule`, { sched_pc: 'TICK', sched_tr: 'PENDING', sched_remarks: 'Transcript awaited' });
    assert.equal(put.status, 200);
    assert.equal((await registrar.put(`/api/review/applications/${ids.app1}/schedule`, { sched_pc: 'MAYBE' })).status, 400);
    await registrar.put(`/api/review/applications/${ids.app1}/schedule`, { sched_pc: 'TICK', sched_tr: 'PENDING', sched_remarks: 'Transcript awaited' });
    const civ = dept(srv.ctx, 'ENG', 'CIV').id;
    const pdf = await registrar.get(`/api/reports/schedule?department_id=${civ}&scope=selected&format=pdf`, { raw: true });
    assert.equal(pdf.status, 200);
    assert.equal(pdf.buffer.subarray(0, 5).toString(), '%PDF-');
    const csv = await registrar.get(`/api/reports/schedule?department_id=${civ}&scope=selected&format=csv`);
    const header = csv.data.split('\r\n')[0];
    for (const col of ['No', 'Name', 'Address', 'Date of Birth', 'Age', 'Telephone', 'Post Applied', 'First Degree', 'Postgraduate Qualifications', 'Other Qualifications', 'Books', 'Journals', 'Abstracts', 'Medals/Prizes', 'Scholarships', 'Extra-curricular Activities', 'Current Position', 'Previous Experience', 'PC', 'RR', 'TR', 'Remarks']) {
      assert.ok(header.split(',').includes(col), `schedule column ${col}`);
    }
    assert.ok(csv.data.includes('Transcript awaited'));
    assert.ok(csv.data.includes('1/2'), 'RR derived from received referee reports');
  });

  it('exports the complete applications list as CSV', async () => {
    const csv = await registrar.get('/api/review/applications.csv');
    assert.equal(csv.headers.get('content-type'), 'text/csv; charset=utf-8');
    const lines = csv.data.trim().split('\r\n');
    assert.equal(lines.length, 4);
  });

  it('keeps appointment records separate from shortlist records', async () => {
    const before = srv.ctx.db.prepare('SELECT COUNT(*) n FROM shortlist_decisions').get().n;
    const r = await registrar.post('/api/appointments', { application_id: ids.app1, status: 'RECOMMENDED', remarks: 'Recommended by panel' });
    assert.equal(r.status, 201);
    assert.equal((await registrar.post('/api/appointments', { application_id: ids.app2, status: 'RECOMMENDED' })).status, 400);
    assert.equal(srv.ctx.db.prepare('SELECT COUNT(*) n FROM shortlist_decisions').get().n, before);
  });

  it('audit log records critical actions and is immutable', async () => {
    const actions = new Set(srv.ctx.db.prepare('SELECT action FROM audit_logs').all().map((x) => x.action));
    for (const a of ['APPLICATION_SUBMITTED', 'SHORTLIST_DECISION', 'SHORTLIST_DECISION_MODIFIED', 'SHORTLIST_SHARED', 'INTERVIEW_CREATED', 'REPORT_GENERATED', 'SCHEDULE_GENERATED', 'VACANCY_CREATED', 'USER_CREATED']) {
      assert.ok(actions.has(a), `audit ${a}`);
    }
    assert.throws(() => srv.ctx.db.prepare('UPDATE audit_logs SET action = 1').run(), /AUDIT_LOG_IMMUTABLE/);
    assert.throws(() => srv.ctx.db.prepare('DELETE FROM audit_logs').run(), /AUDIT_LOG_IMMUTABLE/);
    const r = await admin.get('/api/admin/audit?action=SHORTLIST_SHARED');
    assert.equal(r.data.logs.length, 2);
    assert.equal((await registrar.get('/api/admin/audit')).status, 403);
  });

  it('logs out and invalidates the session', async () => {
    const c = new Client(srv.base);
    await c.login('sar@pdn.ac.lk');
    const saved = { ...c.cookies };
    await c.post('/api/auth/logout', {});
    c.cookies = saved; // replay the old cookie
    assert.equal((await c.get('/api/review/applications')).status, 401);
  });
});
