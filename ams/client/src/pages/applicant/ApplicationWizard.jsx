import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Download, Eye, FileUp, Save, Send, Trash2 } from 'lucide-react';
import { get, put, post, upload, del, download, openInNewTab } from '../../lib/api';
import { useMaster } from '../../lib/master';
import { useAuth } from '../../lib/auth';
import { ageFrom, fmtDate, fmtSize, label } from '../../lib/format';
import ApplicationView from '../../components/ApplicationView';
import RowsEditor from '../../components/RowsEditor';
import {
  Alert, Badge, Button, Card, Checkbox, ConfirmDialog, ErrorBox, Input, PageHeader, Select, Spinner, TextArea, YesNo, cx, useToast,
} from '../../components/ui';

const STEPS = [
  { key: 'personal', title: 'Personal', fields: ['title', 'surname', 'name_in_full', 'former_name', 'name_with_initials', 'date_of_birth', 'civil_status', 'citizenship_type', 'citizenship_cert_no', 'citizenship_cert_date', 'nic', 'passport_no', 'email', 'mobile', 'phone_residence', 'phone_office'] },
  { key: 'address', title: 'Address', fields: ['cur_address_line1', 'cur_address_line2', 'cur_city', 'cur_province_id', 'cur_district_id', 'cur_postal_code', 'perm_same_as_current', 'perm_address_line1', 'perm_address_line2', 'perm_city', 'perm_province_id', 'perm_district_id', 'perm_postal_code'] },
  { key: 'education', title: 'University Education', sections: ['education'] },
  { key: 'postgraduate', title: 'Postgraduate', sections: ['postgraduate'], fields: ['board_certified', 'board_certification_date'] },
  { key: 'distinctions', title: 'Distinctions', sections: ['distinctions'] },
  { key: 'publications', title: 'Publications', sections: ['books', 'abstracts', 'journals'] },
  { key: 'employment', title: 'Employment', sections: ['current_employment', 'previous_employment'], fields: ['willing_to_resign'] },
  { key: 'other', title: 'Other Information', fields: ['lang_sinhala', 'lang_tamil', 'lang_english', 'commendations_punishments', 'vacation_of_post', 'vacation_of_post_details', 'bond_violator', 'bond_value', 'bond_institution', 'bond_details', 'extra_curricular', 'other_particulars'] },
  { key: 'referees', title: 'Referees', sections: ['referees'] },
  { key: 'documents', title: 'Documents' },
  { key: 'preview', title: 'Preview & Submit', fields: ['declaration_accepted', 'declaration_name'] },
];
const ALL_FIELDS = STEPS.flatMap((s) => s.fields || []);
const ALL_SECTIONS = STEPS.flatMap((s) => s.sections || []);
const stepOfIssue = (i) => (i.step === 'declaration' ? 'preview' : i.step);

function toForm(app) {
  return {
    fields: Object.fromEntries(ALL_FIELDS.map((k) => [k, app[k] ?? null])),
    sections: Object.fromEntries(ALL_SECTIONS.map((k) => [k, (app.sections[k] || []).map(({ id, application_id, sort_order, ...rest }) => rest)])),
  };
}

export default function ApplicationWizard() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const master = useMaster();
  const toast = useToast();
  const [state, setState] = useState(null);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(new Set());
  const [loadError, setLoadError] = useState(null);
  const step = STEPS.find((s) => s.key === params.get('step')) || STEPS[0];
  const stepIndex = STEPS.indexOf(step);
  const topRef = useRef(null);

  const apply = useCallback((r) => {
    setState(r);
    setForm(toForm(r.application));
    setDirty(false);
  }, []);

  useEffect(() => {
    get(`/applications/${id}`)
      .then((r) => {
        if (r.application.status !== 'DRAFT') return navigate(`/applicant/applications/${id}`, { replace: true });
        apply(r);
      })
      .catch(setLoadError);
  }, [id, apply, navigate]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const h = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const save = async (stepKey = step.key, { quiet } = {}) => {
    const s = STEPS.find((x) => x.key === stepKey);
    setTouched((t) => new Set(t).add(stepKey));
    if (!dirty || (!s.fields && !s.sections)) return true;
    setSaving(true);
    try {
      const body = {};
      if (s.fields) body.fields = Object.fromEntries(s.fields.map((k) => [k, form.fields[k]]));
      if (s.sections) body.sections = Object.fromEntries(s.sections.map((k) => [k, form.sections[k]]));
      const r = await put(`/applications/${id}`, body);
      setState((prev) => ({ ...prev, ...r }));
      setForm(toForm(r.application));
      setDirty(false);
      if (!quiet) toast('Saved.');
      return true;
    } catch (e) {
      toast(e.message, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const go = async (key) => {
    if (await save(step.key, { quiet: true })) {
      setParams({ step: key });
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const issuesByStep = useMemo(() => {
    const m = {};
    (state?.issues || []).forEach((i) => {
      const k = stepOfIssue(i);
      (m[k] ||= []).push(i);
    });
    return m;
  }, [state]);

  if (loadError) return <ErrorBox error={loadError} />;
  if (!state || !form || !master) return <Spinner />;
  const app = state.application;

  const setField = (k, v) => {
    setForm((f) => ({ ...f, fields: { ...f.fields, [k]: v } }));
    setDirty(true);
  };
  const setSection = (k, rows) => {
    setForm((f) => ({ ...f, sections: { ...f.sections, [k]: rows } }));
    setDirty(true);
  };
  const showErrors = touched.has(step.key) || step.key === 'preview';
  const err = (field) => (showErrors ? (state.issues || []).find((i) => i.field === field)?.message : undefined);
  const bind = (k, opts = {}) => ({
    value: form.fields[k] ?? '',
    onChange: (e) => setField(k, e.target.value === '' ? null : e.target.value),
    error: err(k),
    ...opts,
  });
  const stepIssues = showErrors ? issuesByStep[step.key] || [] : [];

  const ctx = { app, form, state, setField, setSection, bind, err, master, setState, apply, id, toast, go, issues: showErrors ? state.issues : [] };

  return (
    <div ref={topRef}>
      <PageHeader
        back={
          <Link to="/applicant/applications" className="mb-2 inline-flex items-center gap-1 text-sm text-uop-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> My applications
          </Link>
        }
        title={`Application – ${app.position_title}`}
        subtitle={`${app.department_name}, ${app.faculty_name}${app.discipline ? ` · ${app.discipline}` : ''} · Closes ${fmtDate(app.closing_date)}`}
        actions={
          <>
            <Badge tone="gray">Draft</Badge>
            <Button variant="secondary" icon={Save} onClick={() => save()} loading={saving} disabled={!dirty}>
              Save draft
            </Button>
          </>
        }
      />

      {!state.vacancy_open && (
        <Alert type="error" className="mb-4" title="This vacancy is closed">
          The closing date has passed, so this application can no longer be submitted.
        </Alert>
      )}

      {/* Step progress indicator */}
      <nav aria-label="Application steps" className="card mb-6 overflow-x-auto">
        <ol className="flex min-w-max">
          {STEPS.map((s, i) => {
            const n = (issuesByStep[s.key] || []).length;
            const done = n === 0 && (touched.has(s.key) || i < stepIndex);
            const current = s.key === step.key;
            return (
              <li key={s.key} className="flex-1">
                <button
                  type="button"
                  onClick={() => go(s.key)}
                  aria-current={current ? 'step' : undefined}
                  className={cx(
                    'flex w-full items-center gap-2 border-b-2 px-3 py-3 text-left text-xs font-medium transition',
                    current ? 'border-uop-700 bg-uop-50 text-uop-800' : 'border-transparent text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <span
                    className={cx(
                      'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold',
                      done ? 'bg-emerald-600 text-white' : current ? 'bg-uop-700 text-white' : n && touched.has(s.key) ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600',
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="whitespace-nowrap">{s.title}</span>
                  {n > 0 && touched.has(s.key) && <span className="sr-only">({n} issues)</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {stepIssues.length > 0 && step.key !== 'preview' && (
        <Alert type="warning" className="mb-4" title="Please complete the following before submission">
          <ul className="list-disc pl-5">
            {stepIssues.map((i) => (
              <li key={i.field + i.message}>{i.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="space-y-6">
        {step.key === 'personal' && <PersonalStep {...ctx} />}
        {step.key === 'address' && <AddressStep {...ctx} />}
        {step.key === 'education' && (
          <Card title="University Education" actions={<span className="text-xs text-slate-500">Degree, diploma etc. For Medical/Dental, include 2nd, 3rd and Final examinations.</span>}>
            <RowsEditor section="education" rows={form.sections.education} onChange={(r) => setSection('education', r)} issues={ctx.issues} addLabel="Add qualification" emptyText="Add at least one university qualification." />
          </Card>
        )}
        {step.key === 'postgraduate' && <PostgraduateStep {...ctx} />}
        {step.key === 'distinctions' && (
          <Card title="Academic Distinctions, Scholarships, Medals, Prizes etc.">
            <p className="mb-3 text-sm text-slate-600">Indicate the institution from which each award was obtained. Upload the certificates in the Documents step.</p>
            <RowsEditor section="distinctions" rows={form.sections.distinctions} onChange={(r) => setSection('distinctions', r)} issues={ctx.issues} addLabel="Add distinction / award" emptyText="No distinctions entered (optional)." />
          </Card>
        )}
        {step.key === 'publications' && <PublicationsStep {...ctx} />}
        {step.key === 'employment' && <EmploymentStep {...ctx} />}
        {step.key === 'other' && <OtherStep {...ctx} />}
        {step.key === 'referees' && <RefereesStep {...ctx} />}
        {step.key === 'documents' && <DocumentsStep {...ctx} />}
        {step.key === 'preview' && <PreviewStep {...ctx} save={save} dirty={dirty} />}
      </div>

      {/* Step navigation */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <Button variant="secondary" icon={ArrowLeft} disabled={stepIndex === 0} onClick={() => go(STEPS[stepIndex - 1].key)}>
          Previous
        </Button>
        <span className="text-sm text-slate-500">
          Step {stepIndex + 1} of {STEPS.length}
        </span>
        {stepIndex < STEPS.length - 1 ? (
          <Button onClick={() => go(STEPS[stepIndex + 1].key)} loading={saving}>
            Save &amp; continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

// ======================================================================= steps

function PersonalStep({ form, bind, setField, master, app }) {
  const f = form.fields;
  const age = ageFrom(f.date_of_birth, app.closing_date);
  return (
    <Card title="1. Personal Information">
      <div className="grid gap-4 sm:grid-cols-6">
        <Select className="sm:col-span-1" label="Title" required {...bind('title')} options={master.options.titles.map((t) => ({ value: t, label: `${t}.` }))} />
        <Input className="sm:col-span-5" label="Name in full" required {...bind('name_in_full')} hint="Your full name as on your NIC/passport, including your surname." />
        <Input className="sm:col-span-3" label="Surname" required {...bind('surname')} hint="Your surname will be underlined on the application." />
        <Input className="sm:col-span-3" label="Name with initials" required {...bind('name_with_initials')} hint="e.g. A.B.C. Perera" />
        <Input className="sm:col-span-6" label="Name registered under at a University (if different)" {...bind('former_name')} hint="If you registered as a student in a University under any other name, please give it." />
        <Input className="sm:col-span-2" label="Date of birth" type="date" required {...bind('date_of_birth')} hint={age != null ? `Age at closing date: ${age} years` : 'Attach your birth certificate in the Documents step.'} />
        <Select className="sm:col-span-2" label="Civil status" required {...bind('civil_status')} options={master.options.civil_statuses.map((c) => ({ value: c, label: label(c) }))} />
      </div>
      <hr className="my-5 border-slate-200" />
      <fieldset>
        <legend className="label">
          Citizenship of Sri Lanka <span className="text-red-600">*</span>
        </legend>
        <div className="flex flex-wrap gap-6">
          {['DESCENT', 'REGISTRATION'].map((c) => (
            <label key={c} className="inline-flex items-center gap-2 text-sm">
              <input type="radio" name="citizenship" checked={f.citizenship_type === c} onChange={() => setField('citizenship_type', c)} className="h-4 w-4" />
              {label(c)}
            </label>
          ))}
        </div>
        {bind('citizenship_type').error && <p className="mt-1 text-xs text-red-600">{bind('citizenship_type').error}</p>}
      </fieldset>
      {f.citizenship_type === 'REGISTRATION' && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Citizenship certificate reference number" required {...bind('citizenship_cert_no')} />
          <Input label="Date of certificate" type="date" required {...bind('citizenship_cert_date')} />
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input label="National Identity Card No." required={!f.passport_no} {...bind('nic')} hint="Compulsory where applicable (9 digits + V/X, or 12 digits)." />
        <Input label="Passport No." {...bind('passport_no')} hint="Required if you do not have an NIC." />
      </div>
      <hr className="my-5 border-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email address (applied email)" type="email" required {...bind('email')} hint="Defaults to your registered email." />
        <Input label="Mobile" required {...bind('mobile')} />
        <Input label="Residence telephone" {...bind('phone_residence')} />
        <Input label="Office telephone" {...bind('phone_office')} />
      </div>
    </Card>
  );
}

function AddressFields({ prefix, bind, form, setField, master, required }) {
  const province = form.fields[`${prefix}_province_id`];
  const districts = master.districts.filter((d) => String(d.province_id) === String(province));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input className="sm:col-span-2" label="Address line 1" required={required} {...bind(`${prefix}_address_line1`)} />
      <Input className="sm:col-span-2" label="Address line 2" {...bind(`${prefix}_address_line2`)} />
      <Input label="City / town" required={required} {...bind(`${prefix}_city`)} />
      <Input label="Postal code" {...bind(`${prefix}_postal_code`)} />
      <Select
        label="Province"
        required={required}
        {...bind(`${prefix}_province_id`)}
        onChange={(e) => {
          setField(`${prefix}_province_id`, e.target.value ? Number(e.target.value) : null);
          setField(`${prefix}_district_id`, null);
        }}
        options={master.provinces.map((p) => ({ value: p.id, label: p.name }))}
      />
      <Select
        label="District"
        required={required}
        {...bind(`${prefix}_district_id`)}
        onChange={(e) => setField(`${prefix}_district_id`, e.target.value ? Number(e.target.value) : null)}
        disabled={!province}
        placeholder={province ? 'Select district…' : 'Select the province first'}
        options={districts.map((d) => ({ value: d.id, label: d.name }))}
      />
    </div>
  );
}

function AddressStep(props) {
  const { form, setField } = props;
  const same = form.fields.perm_same_as_current !== 0;
  return (
    <>
      <Card title="2. Current / Postal Address" actions={<span className="text-xs text-slate-500">Any change should be communicated immediately.</span>}>
        <AddressFields prefix="cur" required {...props} />
      </Card>
      <Card title="Permanent Address">
        <Checkbox label="Same as current address" checked={same} onChange={(v) => setField('perm_same_as_current', v ? 1 : 0)} />
        {!same && (
          <div className="mt-4">
            <AddressFields prefix="perm" required {...props} />
          </div>
        )}
      </Card>
    </>
  );
}

function PostgraduateStep({ form, setSection, issues, state, setField, bind }) {
  return (
    <Card title="3. Postgraduate Qualifications">
      <p className="mb-3 text-sm text-slate-600">State whether by coursework or research, the SLQF level, duration and effective date. Upload certificates in the Documents step.</p>
      <RowsEditor section="postgraduate" rows={form.sections.postgraduate} onChange={(r) => setSection('postgraduate', r)} issues={issues} addLabel="Add postgraduate qualification" emptyText="No postgraduate qualifications entered (optional)." />
      {state.is_medical_dental ? (
        <div className="mt-5 grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
          <YesNo label="Board Certification (MBBS / BDS graduates only)" value={form.fields.board_certified} onChange={(v) => setField('board_certified', v)} error={bind('board_certified').error} />
          {form.fields.board_certified === 1 && <Input label="Date of board certification" type="date" required {...bind('board_certification_date')} />}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Board certification applies to MBBS/BDS graduates only and appears when such a degree is entered under University Education.</p>
      )}
    </Card>
  );
}

function PublicationsStep({ form, setSection, issues }) {
  return (
    <>
      <Alert type="info">First degree dissertations / postgraduate theses are not considered as publications.</Alert>
      <Card title="(I) Books">
        <RowsEditor section="books" rows={form.sections.books} onChange={(r) => setSection('books', r)} issues={issues} addLabel="Add book" emptyText="No books entered." wide={['title']} />
      </Card>
      <Card title="(II) Abstracts">
        <RowsEditor section="abstracts" rows={form.sections.abstracts} onChange={(r) => setSection('abstracts', r)} issues={issues} addLabel="Add abstract" emptyText="No abstracts entered." wide={['title']} />
      </Card>
      <Card title="(III) Journal Articles">
        <RowsEditor section="journals" rows={form.sections.journals} onChange={(r) => setSection('journals', r)} issues={issues} addLabel="Add journal article" emptyText="No journal articles entered." wide={['title']} />
      </Card>
    </>
  );
}

function EmploymentStep({ form, setSection, issues, setField }) {
  const hasCurrent = form.sections.current_employment.length > 0;
  return (
    <>
      <Card title="Current Occupation (optional)">
        <Checkbox
          label="I am currently employed"
          checked={hasCurrent}
          onChange={(v) => setSection('current_employment', v ? [{ designation: null, institution: null, date_from: null, salary: null }] : [])}
        />
        {hasCurrent && (
          <div className="mt-4">
            <RowsEditor section="current_employment" rows={form.sections.current_employment} onChange={(r) => setSection('current_employment', r)} issues={issues} max={1} />
            <div className="mt-4">
              <YesNo
                label="I hereby express my willingness to resign from the present position if I am not officially released to accept the post."
                value={form.fields.willing_to_resign}
                onChange={(v) => setField('willing_to_resign', v)}
              />
            </div>
          </div>
        )}
      </Card>
      <Card title="Previous Employment (optional)">
        <p className="mb-3 text-sm text-slate-600">In the case of Medical / Dental / Vet. Sci., include the date of commencement of formal practice as a professional.</p>
        <RowsEditor section="previous_employment" rows={form.sections.previous_employment} onChange={(r) => setSection('previous_employment', r)} issues={issues} addLabel="Add previous employment" emptyText="No previous employment entered." wide={['reason_for_leaving']} />
      </Card>
    </>
  );
}

function OtherStep({ form, bind, setField }) {
  const f = form.fields;
  return (
    <>
      <Card title="Proficiency in Languages – highest examination passed">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Sinhala" {...bind('lang_sinhala')} placeholder="e.g. G.C.E. (O/L) – A" />
          <Input label="Tamil" {...bind('lang_tamil')} />
          <Input label="English" {...bind('lang_english')} />
        </div>
      </Card>
      <Card title="Career Record">
        <div className="space-y-5">
          <TextArea label="Commendations / punishments, if any, during your career in a University / educational institution" {...bind('commendations_punishments')} />
          <div>
            <YesNo label="Have you ever been served with a Vacation of Post notice by any other University / Government Institution?" required value={f.vacation_of_post} onChange={(v) => setField('vacation_of_post', v)} error={bind('vacation_of_post').error} />
            {f.vacation_of_post === 1 && <TextArea className="mt-3" label="Please provide details" required {...bind('vacation_of_post_details')} />}
          </div>
          <div>
            <YesNo label="Have you ever been treated as a bond violator?" required value={f.bond_violator} onChange={(v) => setField('bond_violator', v)} error={bind('bond_violator').error} />
            {f.bond_violator === 1 && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input label="Bond value" required {...bind('bond_value')} />
                <Input label="University / Institute" required {...bind('bond_institution')} />
                <TextArea className="sm:col-span-2" label="Details" {...bind('bond_details')} />
              </div>
            )}
          </div>
        </div>
      </Card>
      <Card title="Extra-Curricular Activities and Other Particulars">
        <div className="space-y-4">
          <TextArea label="Extra-curricular activities (University, National & International level)" rows={4} {...bind('extra_curricular')} hint="If you enter activities here, supporting certificates are required in the Documents step." />
          <TextArea label="Any other relevant particulars (not included above)" rows={4} {...bind('other_particulars')} />
        </div>
      </Card>
    </>
  );
}

function RefereesStep({ form, setSection, issues }) {
  const rows = [0, 1].map((i) => form.sections.referees[i] || { name: null, designation: null, address: null, telephone: null, email: null });
  return (
    <Card title="Two Non-related Referees">
      <Alert type="info" className="mb-4">
        Two non-related referee reports are compulsory. After you submit, the University will email each referee a secure link to submit a confidential report. You can follow
        the status under My Applications.
      </Alert>
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r, i) => (
          <fieldset key={i} className="space-y-3 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-700">Referee 0{i + 1}</legend>
            {[
              ['name', 'Name', true],
              ['designation', 'Designation', false],
              ['address', 'Address', true],
              ['telephone', 'Telephone No.', true],
              ['email', 'Email', true],
            ].map(([k, l, req]) => (
              <Input
                key={k}
                label={l}
                required={req}
                type={k === 'email' ? 'email' : 'text'}
                value={r[k] ?? ''}
                error={issues.find((x) => x.field === `referees.${i}.${k}`)?.message?.replace(/^.*?: /, '')}
                onChange={(e) => {
                  const next = rows.map((x, j) => (j === i ? { ...x, [k]: e.target.value || null } : x));
                  setSection('referees', next);
                }}
              />
            ))}
          </fieldset>
        ))}
      </div>
    </Card>
  );
}

function DocumentsStep({ state, setState, id, toast, master }) {
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const docs = state.documents_required;
  const missing = docs.filter((d) => d.mandatory && !d.uploaded);

  const refresh = async () => {
    const r = await get(`/applications/${id}`);
    setState((s) => ({ ...s, ...r }));
  };
  const onFile = async (cat, file) => {
    if (!file) return;
    setBusy(cat.code);
    try {
      await upload(`/applications/${id}/documents`, { category: cat.code }, file);
      await refresh();
      toast(`${cat.label} uploaded.`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };
  const remove = async () => {
    const d = confirm;
    setConfirm(null);
    try {
      await del(`/applications/${id}/documents/${d.id}`);
      await refresh();
      toast('Document removed.');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <Card title="Supporting Documents">
      {missing.length > 0 ? (
        <Alert type="warning" className="mb-4" title={`${missing.length} required document(s) outstanding`}>
          <ul className="list-disc pl-5">
            {missing.map((d) => (
              <li key={d.code}>{d.required ? d.label : `${d.label} – required because you entered information in this section`}</li>
            ))}
          </ul>
        </Alert>
      ) : (
        <Alert type="success" className="mb-4">All required documents have been uploaded.</Alert>
      )}
      <p className="mb-4 text-sm text-slate-600">
        If you have more than one certificate for a category, combine them into a single PDF for that category. Uploading a new file replaces the previous file. Maximum size{' '}
        {master.limits.max_upload_mb} MB per file.
      </p>
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
        {docs.map((d) => {
          const file = d.files[0];
          return (
            <li key={d.code} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">
                  {d.label}{' '}
                  {d.required ? <Badge tone="maroon">Compulsory</Badge> : d.applicable ? <Badge tone="amber">Required for your entries</Badge> : <Badge>Where applicable</Badge>}
                </p>
                <p className="text-xs text-slate-500">
                  {d.types.map((t) => t.toUpperCase()).join(' / ')}
                  {d.hint ? ` · ${d.hint}` : ''}
                </p>
                {file && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-emerald-700">
                    <Check className="h-4 w-4" /> {file.original_name} <span className="text-slate-400">({fmtSize(file.size_bytes)}, {fmtDate(file.uploaded_at)})</span>
                  </p>
                )}
                {!file && d.mandatory && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> Not uploaded
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {file && (
                  <>
                    <Button size="sm" variant="ghost" icon={Eye} onClick={() => openInNewTab(`/applications/${id}/documents/${file.id}?inline=1`).catch((e) => toast(e.message, 'error'))}>
                      View
                    </Button>
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirm(file)} aria-label={`Remove ${d.label}`}>
                      Remove
                    </Button>
                  </>
                )}
                <label className={cx('inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50', busy === d.code && 'pointer-events-none opacity-60')}>
                  <FileUp className="h-4 w-4" aria-hidden />
                  {busy === d.code ? 'Uploading…' : file ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    className="sr-only"
                    accept={d.types.map((t) => (t === 'pdf' ? 'application/pdf' : t === 'png' ? 'image/png' : 'image/jpeg')).join(',')}
                    onChange={(e) => {
                      onFile(d, e.target.files[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog open={!!confirm} title="Remove document?" confirmText="Remove" variant="danger" onCancel={() => setConfirm(null)} onConfirm={remove}>
        {confirm?.original_name} will be removed from this application.
      </ConfirmDialog>
    </Card>
  );
}

function PreviewStep({ app, state, form, bind, setField, go, id, toast, save, dirty }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const issues = state.issues;

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (dirty && !(await save('preview', { quiet: true }))) return;
      const r = await post(`/applications/${id}/submit`);
      toast(`Application submitted. Your reference number is ${r.reference_no}.`);
      navigate(`/applicant/applications/${id}`, { replace: true, state: { justSubmitted: r.reference_no } });
    } catch (e) {
      setSubmitError(e);
      setConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card
        title="Review your application"
        actions={
          <Button variant="secondary" size="sm" icon={Download} onClick={() => download(`/applications/${id}/pdf`).catch((e) => toast(e.message, 'error'))}>
            Draft PDF
          </Button>
        }
      >
        <p className="text-sm text-slate-600">Check every section carefully. Use “Edit” on any section to return to it. After submission the application becomes read-only.</p>
      </Card>

      {issues.length > 0 && (
        <Alert type="warning" title={`${issues.length} item(s) must be completed before you can submit`}>
          <ul className="mt-1 space-y-1">
            {issues.map((i) => (
              <li key={i.field + i.message}>
                <button type="button" className="text-left underline decoration-dotted hover:text-amber-950" onClick={() => go(stepOfIssue(i))}>
                  {i.message}
                </button>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <ApplicationView app={{ ...app, ...form.fields }} onEdit={(stepKey) => go(stepKey)} />

      <Card title="Declaration">
        <div className="space-y-4">
          <p className="rounded-md bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
            I hereby certify that all the particulars submitted by me in this application are true and accurate. I am aware that if any of the information provided is found to be
            false or inaccurate, I am liable to be disqualified prior to selection or dismissed without compensation if the inaccuracy is discovered after appointment.
          </p>
          <Checkbox
            label="I accept the above declaration."
            checked={form.fields.declaration_accepted === 1}
            onChange={(v) => setField('declaration_accepted', v ? 1 : 0)}
          />
          {bind('declaration_accepted').error && <p className="text-xs text-red-600">{bind('declaration_accepted').error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Signature – type your name with initials" required {...bind('declaration_name')} />
            <Input label="Date" value="Recorded automatically on submission" disabled />
          </div>
          <p className="text-xs text-slate-500">
            Notes: All applicants must meet the required qualifications and experience by the closing date. Qualifications obtained after the closing date will not be considered.
            Applications without copies of the required certificates will be rejected. Candidates must arrange for academic transcripts to be sent by their universities.
          </p>
          {app.hard_copy_instructions && <Alert type="warning" title="Hard copy submission">{app.hard_copy_instructions}</Alert>}
          <ErrorBox error={submitError} />
          <div className="flex flex-wrap items-center justify-end gap-3">
            {dirty && (
              <Button variant="secondary" icon={Save} onClick={() => save('preview')}>
                Save declaration
              </Button>
            )}
            <Button size="lg" icon={Send} disabled={(issues.length > 0 && !dirty) || !state.vacancy_open} onClick={() => setConfirm(true)}>
              Submit application
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog open={confirm} title="Submit application?" confirmText="Submit now" onCancel={() => setConfirm(false)} onConfirm={submit} loading={submitting}>
        <p>
          You are about to submit your application for <strong>{app.position_title}</strong>, {app.department_name}.
        </p>
        <p className="mt-2">After submission you will not be able to change it. Your two referees will be emailed a request for a report, and a confirmation will be sent to {app.email || user.email}.</p>
      </ConfirmDialog>
    </>
  );
}
