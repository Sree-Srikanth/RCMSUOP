/**
 * Loads demonstration data (staff accounts, vacancies, submitted applications,
 * shortlist decisions and a shared shortlist) through the real API so every
 * business rule is exercised. Intended for training / UAT environments only.
 *
 *   npm run seed:demo
 */
import { createApp } from '../src/app.js';
import { flushMail } from '../src/lib/mail.js';
import { hashPassword } from '../src/lib/security.js';
import { Client, completeApplication, REQUIRED_UPLOADS, futureDate } from '../test/helpers.js';

const DEMO_PASSWORD = process.env.AMS_DEMO_PASSWORD || 'Demo@2026pdn';

const { app, ctx } = createApp();
const { db } = ctx;

if (db.prepare('SELECT COUNT(*) n FROM vacancies').get().n > 0) {
  console.log('Vacancies already exist – demo data not loaded.');
  process.exit(0);
}

const server = await new Promise((resolve) => {
  const s = app.listen(0, () => resolve(s));
});
const base = `http://127.0.0.1:${server.address().port}`;

const t = new Date().toISOString();
const unit = (fac, dep) =>
  dep
    ? db.prepare('SELECT d.id, d.faculty_id FROM departments d JOIN faculties f ON f.id = d.faculty_id WHERE f.code = ? AND d.code = ?').get(fac, dep)
    : { id: null, faculty_id: db.prepare('SELECT id FROM faculties WHERE code = ?').get(fac).id };

const staff = [
  ['registrar@pdn.ac.lk', 'REGISTRAR', 'Senior Assistant Registrar (Academic Establishments)', null],
  ['hod.civil@pdn.ac.lk', 'HOD', 'Prof. K. Wijesinghe (HOD Civil Engineering)', unit('ENG', 'CIV')],
  ['hod.computer@pdn.ac.lk', 'HOD', 'Dr. P. Ekanayake (HOD Computer Engineering)', unit('ENG', 'CSE')],
  ['dean.eng@pdn.ac.lk', 'DEAN', 'Prof. N. Ratnayake (Dean, Faculty of Engineering)', unit('ENG')],
];
for (const [email, role, name, u] of staff) {
  db.prepare(
    `INSERT INTO users (email, password_hash, role, full_name, faculty_id, department_id, must_change_password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
  ).run(email, hashPassword(DEMO_PASSWORD), role, name, u?.faculty_id ?? null, role === 'HOD' ? u.id : null, t, t);
}
db.prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE role = 'ADMIN'").run(hashPassword(DEMO_PASSWORD));

const registrar = new Client(base);
await registrar.login('registrar@pdn.ac.lk', DEMO_PASSWORD);

const pos = (code) => db.prepare('SELECT id FROM positions WHERE code = ?').get(code).id;
async function vacancy(position, fac, dep, discipline, closesInDays) {
  const r = await registrar.post('/api/vacancies', {
    position_id: pos(position),
    department_id: unit(fac, dep).id,
    discipline,
    advert_reference: `AE/${position}/${new Date().getFullYear()}/${Math.floor(Math.random() * 90 + 10)}`,
    advertised_on: futureDate(-14),
    closing_date: futureDate(closesInDays),
    requirements:
      'A Bachelor’s degree with First or Second Class (Upper Division) Honours in the relevant field.\n' +
      'Applicants should submit transcripts directly from the awarding university.',
    hard_copy_instructions: 'Send one printed copy of the submitted application, through proper channel where applicable, to the Deputy Registrar / Academic Establishments.',
  });
  if (r.status !== 201) throw new Error(JSON.stringify(r.data));
  await registrar.post(`/api/vacancies/${r.data.vacancy.id}/status`, { status: 'PUBLISHED' });
  return r.data.vacancy.id;
}

const lpCivil = await vacancy('LP', 'ENG', 'CIV', 'Geotechnical / Structural Engineering', 30);
const sl1Civil = await vacancy('SL1', 'ENG', 'CIV', 'Transportation Engineering', 30);
await vacancy('LU', 'ENG', 'CSE', 'Computer Systems / Data Science', 45);
await vacancy('AL', 'LIB', 'LIB', 'Library and Information Science', 21);

const applicants = [
  ['nimali.perera@example.com', 'Perera', 'Nimali Sandamali', '199258701234'],
  ['kasun.fernando@example.com', 'Fernando', 'Kasun Tharaka', '199112304567'],
  ['tharindu.silva@example.com', 'Silva', 'Tharindu Madushan', '931234567V'],
  ['ishara.jayawardena@example.com', 'Jayawardena', 'Ishara Dilhani', '199475309876'],
];
const created = [];
for (const [i, [email, surname, given, nic]] of applicants.entries()) {
  const c = new Client(base);
  const reg = await c.post('/api/auth/register', {
    email, title: i % 2 ? 'Mr' : 'Dr', surname, name_with_initials: `${given.split(' ').map((n) => n[0]).join('.')}. ${surname}`, nic, mobile: `07712345${i}0`, password: DEMO_PASSWORD,
  });
  if (reg.status !== 201) throw new Error(JSON.stringify(reg.data));
  const vacancyId = i === 3 ? sl1Civil : lpCivil;
  const draft = await c.post('/api/applications', { vacancy_id: vacancyId });
  const payload = completeApplication(ctx, { surname, email, refEmails: [`referee${i}a@example.org`, `referee${i}b@example.org`] });
  payload.fields.title = i % 2 ? 'Mr' : 'Dr';
  payload.fields.name_in_full = `${given} ${surname}`;
  payload.fields.name_with_initials = reg.data.user.full_name.replace(/^(Dr|Mr)\. /, '');
  payload.fields.declaration_name = payload.fields.name_with_initials;
  payload.fields.nic = nic;
  payload.fields.mobile = `07712345${i}0`;
  const saved = await c.put(`/api/applications/${draft.data.id}`, payload);
  if (saved.status !== 200) throw new Error(JSON.stringify(saved.data));
  for (const [category, buf, name] of REQUIRED_UPLOADS) await c.upload(`/api/applications/${draft.data.id}/documents`, { category }, buf, name);
  const sub = await c.post(`/api/applications/${draft.data.id}/submit`, {});
  if (sub.status !== 200) throw new Error(JSON.stringify(sub.data));
  created.push({ id: draft.data.id, ref: sub.data.reference_no, email });
}

const decide = (id, decision, category, remarks) => registrar.post(`/api/review/applications/${id}/decision`, { decision, category, remarks });
await decide(created[0].id, 'SELECTED', 'CATEGORY_I', 'Excellent academic record');
await decide(created[1].id, 'SELECTED', 'CATEGORY_II');
await decide(created[2].id, 'REJECTED', null, 'Does not meet the minimum requirement');
await decide(created[3].id, 'PENDING', null, 'Awaiting service confirmation');
await registrar.post('/api/shortlist/share', { application_ids: [created[0].id], note: 'Please review before the interview board.' });

await flushMail(ctx);
server.close();
db.close();

console.log('\nDemo data loaded. All demo accounts use the password:', DEMO_PASSWORD);
console.log('  Administrator : admin@pdn.ac.lk (or AMS_ADMIN_EMAIL)');
console.log('  Registrar/SAR : registrar@pdn.ac.lk');
console.log('  HOD (Civil)   : hod.civil@pdn.ac.lk');
console.log('  Dean (Eng.)   : dean.eng@pdn.ac.lk');
for (const c of created) console.log(`  Applicant     : ${c.email}  (${c.ref})`);
