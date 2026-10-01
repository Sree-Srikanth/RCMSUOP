# University of Peradeniya – Application Management System (AMS)

Recruitment & Selection module: vacancy publication → online application → document upload → submission and reference number → Registrar/SAR review and position-specific shortlisting → controlled sharing with HOD/Dean → interviews → reports and the official schedule → appointment records, with referee reports and a full audit trail.

```
ams/
├── server/   Node.js 22 + Express 5 REST API, SQLite (node:sqlite), PDFKit, Nodemailer
└── client/   React 18 + Vite + Tailwind CSS single-page app
```

## Quick start

Requires **Node.js 22.5 or later** (it uses the built-in `node:sqlite`).

```bash
# API
cd ams/server
npm install
npm run seed:demo        # optional: demo users, vacancies and applications
npm run dev              # http://localhost:4000

# Web client (second terminal)
cd ams/client
npm install
npm run dev              # http://localhost:5173 (proxies /api to :4000)
```

For production, run `npm run build` in `client/`, then `npm start` in `server/`. The API serves `client/dist` with an SPA fallback, so only one process is needed. Put it behind HTTPS with `NODE_ENV=production`, which turns on Secure cookies and HSTS.

### Accounts

On first start an administrator is created: `admin@pdn.ac.lk` / `ChangeMe@2026`. You can override these with `AMS_ADMIN_EMAIL` / `AMS_ADMIN_PASSWORD`. The administrator must change the password at first login.

After `npm run seed:demo`, every demo account uses `Demo@2026pdn`:

| Role | Email |
| --- | --- |
| Administrator | admin@pdn.ac.lk |
| Registrar / SAR | registrar@pdn.ac.lk |
| HOD Civil Engineering | hod.civil@pdn.ac.lk |
| Dean, Engineering | dean.eng@pdn.ac.lk |
| Applicants | nimali.perera@example.com, kasun.fernando@example.com, … |

### Configuration (environment variables)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 4000) |
| `AMS_STORAGE_DIR` | Database, uploads, outbox and backups (default `server/storage`, outside the web root) |
| `AMS_PUBLIC_URL` | Public URL used in email links (referee links, password reset) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `AMS_MAIL_FROM` | Outgoing mail. Without SMTP, emails are written to `storage/outbox/*.eml` and listed under **Admin → Email Outbox** |
| `AMS_TRUST_PROXY` | Set when behind a reverse proxy, so client IPs are logged correctly |

### Tests and backups

```bash
cd ams/server
npm test          # 32 end-to-end API tests covering the §34 acceptance criteria
npm run backup    # consistent SQLite backup + uploaded documents → storage/backups/<timestamp>
```

## How the requirements are implemented

| Requirement | Implementation |
| --- | --- |
| §5 Roles / RBAC | `requireRole` on every route plus object-level checks (`assertCanView`) against IDOR. A Registrar can optionally be scoped to one faculty (SAR). |
| §7 Vacancies | Draft → Published → Closed → Archived. Applications are blocked after 23:59 Sri Lanka time on the closing date unless an administrator grants a late-application exception. Changes are audited. |
| §8 Accounts | Self-registration, or admin-created accounts with a temporary password and forced change at first login. Passwords use scrypt. Lockout after 5 failed attempts. Rate limiting. |
| §9 Form | All sections of the University form. Surname is editable and underlined. NIC or passport. Citizenship by descent/registration. District list filtered by province. Class/grade options. SLQF levels. Board certification only for MBBS/BDS. Books/abstracts/journals. No “Responsibilities” field. Two referees. |
| §10 Documents | One file per category; a new upload replaces the old one. Type is checked by file content, not extension. Active-content PDFs and executables are rejected. Files are stored with random names outside the web root. Downloads require authorisation and are audited. “Where applicable” categories become mandatory once that section has entries. |
| §11–12 Submission | Server-side validation of all mandatory fields and documents. The submitted application becomes read-only. Reference number `FAC-DEPT-POS-NNNNNN` is unique and immutable, enforced by a DB trigger. |
| §13 PDF | University-format PDF with logo, structured tables, underlined surname, page numbers and reference number. |
| §14–17 Review & shortlist | One Applications menu (no Verification menu). Opening an application shows the complete application. Previous / Back to List / Next keep the filters and sort. The decision matrix is enforced in the API **and** by a SQLite trigger. Decisions are append-only with full history. |
| §19 | Application status and shortlist decision are stored separately. |
| §20–21 Sharing | Only currently-Selected candidates can be shared. HOD sees only their department and Dean only their faculty. If a decision changes away from Selected, the application disappears from their view. Sharing history is kept. |
| §22 Interviews | Free-text panel details. Only selected candidates of that vacancy are eligible. Email notifications. Attendance, result and remarks can be recorded. |
| §23–24 Reports | CSV (UTF-8 with BOM, formula-injection safe) and A4-landscape PDF candidate reports. Official schedule (A3 landscape) reproducing the supplied format, including PC/RR/TR and the Deputy Registrar/HOD/Dean signature line. |
| §25 Referees | A single-use, expiring token per referee, sent in the URL fragment so it never reaches server logs. RR is derived automatically and can be overridden for paper reports. Applicants cannot see report contents. |
| §31 Audit | `audit_logs` cannot be updated or deleted (DB triggers). Covers submissions, decisions, sharing, interviews, document access and admin changes. |

## Assumptions to confirm with the University

1. **Referee report questions.** The official referee form was not supplied, so the form uses a generic academic template (capacity, ratings, strengths, recommendation). The fields are stored as structured data and can be replaced.
2. **“Image” document category.** The spec says its purpose is to be clarified. It is currently labelled *Image (scanned signature)* in `server/src/lib/applications.js`.
3. **Reference number format.** It is `ENG-CIV-LP-000001`: faculty code, department code, position code, then a global sequence number.
4. **Age.** Age is calculated as at the vacancy closing date.
5. **Text in PDFs.** The PDFs use standard PDF fonts, so Sinhala and Tamil characters are not rendered in them. Embedding a Unicode font (e.g. Noto Sans Sinhala/Tamil) would add support. The web UI and CSV handle Unicode fully.
6. **Faculty and department master data.** The seeded list is indicative and can be edited under **Admin → Master Data**.
