# Online Application Module — University of Peradeniya

A drop-in replacement for the `/apply` application wizard, with matching PHP endpoints.
It addresses the correction list:

| Request | What changed |
|---|---|
| **Reference No. detected automatically (series)** for a New Advertisement, searchable later | Server-generated series `UOP/REC/2026/0001…` (format configurable). Atomic counter, so two admins can't get the same number. When a series starts, it continues from the highest existing manual reference. Every application also gets its own number (`APP/2026/000001`). Search either kind with `ReferenceSearch`. |
| Vacancies → **Apply Online** → login; **only open vacancies; no direct URL** | `ApplyGuard` checks the vacancy is open, sends logged-out users to login and back, and refuses typed or bookmarked `/apply` URLs unless the user came from **Apply Online** or already has a draft. |
| **Section order missing / numbering wrong** | Order and numbering come from one config (`steps.ts`): 1 Personal, 2 Contact, 3 Education, 4 Prof. Quals, 5 Research, 6 Languages, 7 Experience, 8 Activities, 9 Referees, 10 Documents, 11 Declaration, 12 Review & Submit. The headings, progress bar, review page and PDF all use it. |
| Fields "not enabled", later enabled after clicking up/down | The collapsible (chevron) accordions are gone, so every field is always visible. "Same as permanent" now keeps the postal address in sync instead of greying it out with stale values. |
| **Postgraduate is optional** | Empty postgraduate cards are ignored and never block **Next**. Also fixed the duplicate `value="research"` that made "Coursework & Research" impossible to select. |
| **Hide "Academic Transcript(s) \*"** | No longer requested anywhere. |
| **Uploading documents in one step** | Step 10 builds the checklist from what was entered (one slot per degree, job, etc.) and uploads are real. Several old steps only *simulated* uploads with fake paths. |
| Declaration ticked but shows **"Agreed: No"** | Booleans are normalised on both client and server (`"1"`/`"true"` → `true`). The review and PDF read the real value. |
| **Education / referee details not saving** | Cause: after every save the old page reloaded server data over local edits, and education lived in separate state. Now there is one state object, saved whole as JSON, and a save never overwrites the form. |
| **Autosave + Save Draft on every step; edit until closing date** | Debounced autosave, serialised saves, a flush when the tab is hidden or closed, and a **Save Draft** button on every step. The draft resumes on the last step used. The server refuses edits after the closing date or after submission. |
| **Final review + submit → PDF to applicant** | Step 12 reviews everything, with **Edit** jumps. On submit the official A4 form is rendered to PDF, stored, and emailed to the applicant. |
| **Notify referees on submit** with applicant details + application | Each referee gets an email with the applicant's details and the PDF attached. Sends are logged in `application_referee_notifications`. |
| **Mobile responsive** | Single-column fields on phones, 16px inputs (no iOS zoom), 44px tap targets, scrollable stepper and tabs, a sticky bottom action bar, and a bottom-sheet confirm dialog. Verified with no horizontal scroll at 390px on every step. |

## Layout

```
frontend/src/
  app/(other)/apply/           ← replaces your current apply folder
    page.tsx                   wizard: state, autosave, navigation, submit
    ApplyGuard.tsx             entry rules (open vacancy, login, no direct URL)
    steps.ts                   step order/numbering + validation
    documents.ts               document checklist (no transcripts)
    normalize.ts               defaults, legacy-data migration, boolean fixes
    useDraftSaver.ts           autosave hook
    ApplicationPrintForm.tsx   official A4 form (PDF / print)
    pdf.ts, ui.tsx, ProgressStepper.tsx, PositionSelection.tsx, types.ts
    steps/Step1…Step12*.tsx
  services/applicationApi.ts   API client + startApplication() for "Apply Online"
  components/admin/ReferenceNoField.tsx, ReferenceSearch.tsx
backend/                       → copy to <backend root>/application-module/
  init.php, bootstrap.php, config.sample.php, composer.json
  lib/   reference, vacancies, applications, mailer, emails
  api/   vacancies/{status,next_reference,assign_reference}.php
         applications/{get,save,upload,submit}.php
         references/search.php
  sql/001_application_module.sql
  scripts/backfill_vacancy_references.php
```

## Install

### Backend (XAMPP)
1. Copy `backend/` to `C:\xampp\htdocs\application-management-system\backend\application-module\`.
2. `cp config.sample.php config.php`, then set:
   - the DB credentials;
   - your `vacancies` table/column names (`id`, `title`, `positions`, `closing_date`, `status`…);
   - `auth.mode` to match your login: `session` if your login PHP sets `$_SESSION['user_id']`, or `token` for a Bearer token in `users.api_token`;
   - `cors_origins`;
   - SMTP.
3. `composer install` in that folder (PHPMailer for SMTP).
4. Run `sql/001_application_module.sql`, then `php scripts/backfill_vacancy_references.php`.
5. php.ini: `upload_max_filesize` and `post_max_size` ≥ 20M (the application PDF is typically 0.5–2 MB).

### New Advertisement form (admin)
- Replace the manual Reference No. input with `<ReferenceNoField value={vacancy?.reference_no} />`. It previews the next number.
- After your existing create-advertisement INSERT, assign the real number. Either:
  ```php
  require_once __DIR__ . '/application-module/init.php';
  $ref = assign_vacancy_reference(db(), $newVacancyId);
  ```
  or call `POST api/vacancies/assign_reference.php {vacancy_id}` from the front end.
- Add `<ReferenceSearch onOpenVacancy={…} onOpenApplication={…} />` to the admin dashboard.

### Frontend
1. Replace `src/app/(other)/apply/` with the folder here, and add `services/applicationApi.ts` and `components/admin/*`.
2. `.env`:
   ```
   VITE_FILE_BASE_URL=http://localhost/application-management-system/backend/
   VITE_APPLICATION_API_BASE=http://localhost/application-management-system/backend/application-module/api
   VITE_VACANCIES_PATH=/other/vacancies
   VITE_LOGIN_PATH=/login
   ```
3. On the vacancies page, make the **Apply Online** button call:
   ```tsx
   import { startApplication } from "../../../services/applicationApi";
   <button onClick={() => startApplication(navigate, vacancy.vacancy_id)}>Apply Online</button>
   ```
4. In your login page, after a successful login:
   ```ts
   const to = localStorage.getItem("redirectAfterLogin");
   localStorage.removeItem("redirectAfterLogin");
   navigate(to || "/other/home", { replace: true });
   ```
5. The page no longer needs the `ProtectedRoute` wrapper: `ApplyGuard` handles login itself.
6. Put the university crest at `public/logo.png`; the PDF uses it.

Drafts saved by the old form load as long as they're stored as JSON in `job_applications.form_data`. `normalize.ts` migrates the old per-item `certificatePath` fields into the new documents map.

## Notes
- **Referees receive the full application PDF** (it includes NIC and date of birth), as requested. To send only the details email, set `mail.attach_pdf_to_referees => false`.
- The PDF is rendered in the browser (html2pdf, as before) and uploaded on submit. Admin screens should treat `form_data` as the record of truth, not the PDF.
- `auth.mode = 'header'` trusts the `X-User-Id` header. It exists for local testing only; never use it in production.
- One application per applicant per vacancy (unique `user_id, vacancy_id`).

## Verified
- TypeScript `strict`, and `vite build` passes.
- `php -l` passes on all files.
- API tests against MariaDB 10.11: reference series and seeding, admin/applicant authorisation, path sanitising, closed and submitted locks, upload type and content checks, CORS.
- Playwright end-to-end at 390×844 and 1280×900, 41 checks: direct-URL blocking, closed vacancy, every step, validation, optional postgraduate, reload-and-resume with education and referees intact, a one-step upload of 5 documents, declaration Yes, submit, a stored valid PDF, 3 emails (applicant + 2 referees) each with the PDF attached, read-only after submission, and a 409 from the server on later edits.
