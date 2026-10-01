import { Download, Eye, Pencil } from 'lucide-react';
import { download, openInNewTab } from '../lib/api';
import { fmtDate, fmtSize, label } from '../lib/format';
import { useMaster } from '../lib/master';
import { Badge, KeyValue, useToast } from './ui';

function Section({ n, title, onEdit, children }) {
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 bg-uop-50/60 px-5 py-2.5">
        <h3 className="text-sm font-semibold text-uop-800">
          {n && <span className="mr-1.5 text-uop-500">{n}.</span>}
          {title}
        </h3>
        {onEdit && (
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-xs font-medium text-uop-700 hover:underline">
            <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
          </button>
        )}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function DataTable({ columns, rows, empty = 'None entered' }) {
  if (!rows?.length) return <p className="text-sm italic text-slate-400">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="table-base">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key || c.title} scope="col">
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              {columns.map((c) => (
                <td key={c.key || c.title} className={c.className}>
                  {c.render ? c.render(r, i) : r[c.key] || <span className="text-slate-400">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const yn = (v) => (v === 1 ? 'Yes' : v === 0 ? 'No' : null);
const addr = (a, p) =>
  [a[`${p}_address_line1`], a[`${p}_address_line2`], a[`${p}_city`], a[`${p}_district`] && `${a[`${p}_district`]} District`, a[`${p}_province`] && `${a[`${p}_province`]} Province`, a[`${p}_postal_code`]]
    .filter(Boolean)
    .join(', ');

const roman = (n) => ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][n] || String(n + 1);

/**
 * Complete, structured view of an application (used for the applicant
 * preview, Registrar review and HOD/Dean views).
 */
export default function ApplicationView({ app, onEdit, showDocuments = true }) {
  const master = useMaster();
  const toast = useToast();
  const s = app.sections;
  const edit = (step) => (onEdit ? () => onEdit(step) : undefined);
  const docLabel = (code) => master?.document_categories.find((c) => c.code === code)?.label || code;

  const nameFull = `${app.title ? app.title + '. ' : ''}${app.name_in_full || ''}`;
  const surnameIdx = app.surname && nameFull.toLowerCase().indexOf(app.surname.toLowerCase());

  return (
    <div className="space-y-4">
      <Section n="1" title="Personal Information" onEdit={edit('personal')}>
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Name in full (surname underlined)</p>
          <p className="mt-0.5 text-base font-medium text-slate-900">
            {surnameIdx >= 0 ? (
              <>
                {nameFull.slice(0, surnameIdx)}
                <span className="underline decoration-2 underline-offset-2">{nameFull.slice(surnameIdx, surnameIdx + app.surname.length)}</span>
                {nameFull.slice(surnameIdx + app.surname.length)}
              </>
            ) : (
              nameFull || '—'
            )}
          </p>
        </div>
        <KeyValue
          cols={3}
          items={[
            ['Surname', app.surname],
            ['Name with initials', app.name_with_initials],
            ['Former / registered name', app.former_name],
            ['Date of birth', fmtDate(app.date_of_birth)],
            ['Age (at closing date)', app.age != null ? `${app.age} years` : null],
            ['Civil status', label(app.civil_status)],
            ['Citizenship', label(app.citizenship_type)],
            app.citizenship_type === 'REGISTRATION' && ['Citizenship certificate', `${app.citizenship_cert_no || '—'} (${fmtDate(app.citizenship_cert_date) || '—'})`],
            ['NIC No.', app.nic],
            ['Passport No.', app.passport_no],
            ['Email (applied)', app.email],
            ['Mobile', app.mobile],
            ['Phone (residence)', app.phone_residence],
            ['Phone (office)', app.phone_office],
          ]}
        />
      </Section>

      <Section n="2" title="Address" onEdit={edit('address')}>
        <KeyValue items={[['Current / postal address', addr(app, 'cur')], ['Permanent address', app.perm_same_as_current ? 'Same as current address' : addr(app, 'perm')]]} />
      </Section>

      <Section n="3" title="University Education" onEdit={edit('education')}>
        <DataTable
          rows={s.education}
          columns={[
            { title: 'Degree / Diploma', key: 'qualification' },
            { title: 'University', key: 'university' },
            { title: 'Period', render: (r) => `${fmtDate(r.period_from)} – ${fmtDate(r.period_to)}` },
            { title: 'Course followed', key: 'course_followed' },
            { title: 'Final exam', render: (r) => fmtDate(r.final_exam_date) },
            { title: 'Class / GPA', render: (r) => [label(r.result_class), r.gpa && `GPA ${r.gpa}`].filter(Boolean).join(' / ') },
          ]}
        />
      </Section>

      <Section n="4" title="Postgraduate Qualifications" onEdit={edit('postgraduate')}>
        <DataTable
          rows={s.postgraduate}
          columns={[
            { title: 'Qualification', key: 'qualification' },
            { title: 'Institution', key: 'institution' },
            { title: 'Type', render: (r) => label(r.pg_type) },
            { title: 'SLQF', render: (r) => label(r.slqf_level) },
            { title: 'Duration', key: 'duration' },
            { title: 'Effective date', render: (r) => fmtDate(r.effective_date) },
          ]}
        />
        {app.board_certified !== null && app.board_certified !== undefined && (
          <p className="mt-3 text-sm">
            <span className="font-medium">Board Certification (MBBS/BDS):</span> {app.board_certified ? `Yes – ${fmtDate(app.board_certification_date)}` : 'No'}
          </p>
        )}
      </Section>

      <Section n="5" title="Academic Distinctions, Scholarships, Medals & Prizes" onEdit={edit('distinctions')}>
        <DataTable
          rows={s.distinctions}
          columns={[
            { title: 'Type', render: (r) => label(r.award_type) },
            { title: 'Distinction / award', key: 'award' },
            { title: 'Institution', key: 'institution' },
            { title: 'Year', key: 'year' },
          ]}
        />
      </Section>

      <Section n="6" title="Research Publications" onEdit={edit('publications')}>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">(I) Books ({s.books.length})</h4>
            <DataTable
              rows={s.books}
              columns={[
                { title: 'No.', render: (r, i) => roman(i) },
                { title: 'Name of the book', key: 'title' },
                { title: 'Date of publication', render: (r) => fmtDate(r.publication_date) },
                { title: 'Author(s)', key: 'authors' },
                { title: 'ISBN No.', key: 'isbn' },
              ]}
            />
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">(II) Abstracts ({s.abstracts.length})</h4>
            <DataTable
              rows={s.abstracts}
              columns={[
                { title: 'No.', render: (r, i) => roman(i) },
                { title: 'Title of article', key: 'title' },
                { title: 'Author(s)', key: 'authors' },
                { title: 'Source', key: 'source' },
                { title: 'Date of publication', render: (r) => fmtDate(r.publication_date) },
              ]}
            />
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">(III) Journals ({s.journals.length})</h4>
            <DataTable
              rows={s.journals}
              columns={[
                { title: 'No.', render: (r, i) => roman(i) },
                { title: 'Title of article', key: 'title' },
                { title: 'Author(s)', key: 'authors' },
                { title: 'Source / DOI', key: 'source_doi' },
                { title: 'Year', key: 'year' },
              ]}
            />
          </div>
          <p className="text-xs italic text-slate-500">First degree dissertations / postgraduate theses are not considered as publications.</p>
        </div>
      </Section>

      <Section n="7" title="Employment" onEdit={edit('employment')}>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Current employment</h4>
        <DataTable
          rows={s.current_employment}
          empty="Not currently employed / not provided"
          columns={[
            { title: 'Designation', key: 'designation' },
            { title: 'Department / Institution', key: 'institution' },
            { title: 'From', render: (r) => fmtDate(r.date_from) },
            { title: 'Salary drawn', key: 'salary' },
          ]}
        />
        {s.current_employment.length > 0 && (
          <p className="mt-2 text-sm">
            <span className="font-medium">Willing to resign if not released:</span> {yn(app.willing_to_resign) || '—'}
          </p>
        )}
        <h4 className="mb-2 mt-4 text-sm font-semibold text-slate-700">Previous employment</h4>
        <DataTable
          rows={s.previous_employment}
          columns={[
            { title: 'Designation', key: 'designation' },
            { title: 'Department / Institution', key: 'institution' },
            { title: 'From', render: (r) => fmtDate(r.date_from) },
            { title: 'To', render: (r) => fmtDate(r.date_to) },
            { title: 'Reasons for leaving', key: 'reason_for_leaving' },
          ]}
        />
      </Section>

      <Section n="8" title="Other Information" onEdit={edit('other')}>
        <KeyValue
          items={[
            ['Proficiency – Sinhala', app.lang_sinhala],
            ['Proficiency – Tamil', app.lang_tamil],
            ['Proficiency – English', app.lang_english],
            ['Commendations / punishments', app.commendations_punishments],
            ['Served with vacation of post notice', yn(app.vacation_of_post)],
            app.vacation_of_post === 1 && ['Vacation of post details', app.vacation_of_post_details],
            ['Treated as a bond violator', yn(app.bond_violator)],
            app.bond_violator === 1 && ['Bond value', app.bond_value],
            app.bond_violator === 1 && ['Bond university / institute', app.bond_institution],
            app.bond_violator === 1 && ['Bond details', app.bond_details],
            ['Extra-curricular activities', app.extra_curricular],
            ['Other relevant particulars', app.other_particulars],
          ]}
        />
      </Section>

      <Section n="9" title="Non-related Referees" onEdit={edit('referees')}>
        <DataTable
          rows={s.referees}
          columns={[
            { title: 'No.', render: (r) => `0${r.seq}` },
            { title: 'Name', render: (r) => [r.name, r.designation].filter(Boolean).join(', ') },
            { title: 'Address', key: 'address' },
            { title: 'Telephone', key: 'telephone' },
            { title: 'Email', key: 'email' },
          ]}
        />
      </Section>

      {showDocuments && (
        <Section n="10" title="Supporting Documents" onEdit={edit('documents')}>
          <DataTable
            rows={app.documents}
            empty="No documents uploaded"
            columns={[
              { title: 'Category', render: (d) => docLabel(d.category) },
              { title: 'File', key: 'original_name' },
              { title: 'Size', render: (d) => fmtSize(d.size_bytes) },
              { title: 'Uploaded', render: (d) => fmtDate(d.uploaded_at) },
              {
                title: 'Actions',
                render: (d) => (
                  <span className="flex gap-2">
                    <button type="button" className="inline-flex items-center gap-1 text-uop-700 hover:underline" onClick={() => openInNewTab(`/applications/${app.id}/documents/${d.id}?inline=1`).catch((e) => toast(e.message, 'error'))}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 text-uop-700 hover:underline" onClick={() => download(`/applications/${app.id}/documents/${d.id}`, d.original_name).catch((e) => toast(e.message, 'error'))}>
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </span>
                ),
              },
            ]}
          />
        </Section>
      )}

      {app.status !== 'DRAFT' && (
        <Section title="Declaration">
          <KeyValue
            cols={3}
            items={[
              ['Declaration accepted', app.declaration_accepted ? <Badge tone="green">Accepted</Badge> : 'No'],
              ['Signature (name)', app.declaration_name],
              ['Declaration date', fmtDate(app.declaration_date)],
            ]}
          />
        </Section>
      )}
    </div>
  );
}
