import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileUp, Save, Trash2, Download } from 'lucide-react';
import { get, post, put, del, upload, download } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useMaster } from '../../lib/master';
import { fmtDate, fmtSize, label } from '../../lib/format';
import { Alert, Button, Card, ErrorBox, Input, PageHeader, Select, Spinner, StatusBadge, TextArea, useToast } from '../../components/ui';

const EMPTY = { position_id: '', faculty_id: '', department_id: '', discipline: '', advert_reference: '', advertised_on: '', closing_date: '', requirements: '', hard_copy_instructions: '' };

export default function VacancyForm() {
  const { id } = useParams();
  const isNew = !id;
  const master = useMaster();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [v, setV] = useState(isNew ? { ...EMPTY, faculty_id: user.faculty_id || '' } : null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [late, setLate] = useState({ until: '', reason: '' });

  const load = () =>
    get(`/vacancies/${id}`)
      .then((r) => {
        setSaved(r.vacancy);
        setV({ ...EMPTY, ...r.vacancy, closing_date: r.vacancy.closing_date_local });
        setLate({ until: r.vacancy.late_exception_until_local || '', reason: r.vacancy.late_exception_reason || '' });
      })
      .catch(setError);
  useEffect(() => {
    if (!isNew) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!master || (!v && !error)) return <Spinner />;
  if (!v) return <ErrorBox error={error} />;
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const departments = master.departments.filter((d) => String(d.faculty_id) === String(v.faculty_id));
  const position = master.positions.find((p) => String(p.id) === String(v.position_id));
  const matrix = position ? master.shortlist_matrix.filter((m) => m.position_code === position.code) : [];

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = isNew ? await post('/vacancies', v) : await put(`/vacancies/${id}`, v);
      toast('Vacancy saved.');
      if (isNew) navigate(`/vacancies-admin/${r.vacancy.id}`, { replace: true });
      else load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const saveLate = async () => {
    try {
      await post(`/vacancies/${id}/late-exception`, late);
      toast(late.until ? 'Late-application exception enabled.' : 'Late-application exception removed.');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const onFile = async (file) => {
    if (!file) return;
    try {
      await upload(`/vacancies/${id}/documents`, {}, file);
      toast('Document uploaded.');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        back={
          <Link to="/vacancies-admin" className="mb-2 inline-flex items-center gap-1 text-sm text-uop-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Vacancies
          </Link>
        }
        title={isNew ? 'New vacancy' : `${saved?.position_title} – ${saved?.department_name}`}
        actions={saved && <StatusBadge status={saved.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={save} className="space-y-6 lg:col-span-2">
          <Card title="Vacancy details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Position" required value={v.position_id} onChange={set('position_id')} options={master.positions.map((p) => ({ value: p.id, label: p.title }))} />
              <Input label="Advertisement reference" value={v.advert_reference} onChange={set('advert_reference')} />
              <Select label="Faculty" required value={v.faculty_id} onChange={(e) => setV({ ...v, faculty_id: e.target.value, department_id: '' })} options={master.faculties.map((f) => ({ value: f.id, label: f.name }))} disabled={user.role === 'REGISTRAR' && !!user.faculty_id} />
              <Select label="Department" required value={v.department_id} onChange={set('department_id')} disabled={!v.faculty_id} placeholder={v.faculty_id ? 'Select department…' : 'Select the faculty first'} options={departments.map((d) => ({ value: d.id, label: d.name }))} />
              <Input className="sm:col-span-2" label="Discipline(s)" value={v.discipline} onChange={set('discipline')} />
              <Input label="Advertised on" type="date" required value={v.advertised_on} onChange={set('advertised_on')} />
              <Input label="Closing date" type="date" required value={v.closing_date} onChange={set('closing_date')} hint="Applications close at 11:59 p.m. Sri Lanka time." />
              <TextArea className="sm:col-span-2" label="Vacancy-specific requirements" rows={6} value={v.requirements} onChange={set('requirements')} />
              <TextArea className="sm:col-span-2" label="Hard copy / proper channel instructions (if required)" rows={3} value={v.hard_copy_instructions} onChange={set('hard_copy_instructions')} />
            </div>
          </Card>
          <ErrorBox error={error} />
          <div className="flex justify-end">
            <Button type="submit" icon={Save} loading={busy} disabled={saved?.status === 'ARCHIVED'}>
              Save vacancy
            </Button>
          </div>
        </form>
        <div className="space-y-6">
          <Card title="Shortlist rules for this position">
            {!position ? (
              <p className="text-sm text-slate-500">Select a position to see its shortlist decisions.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {matrix.map((m) => (
                  <li key={m.decision_code + (m.category_code || '')}>
                    {label(m.decision_code)}
                    {m.category_code && ` – ${label(m.category_code)}`}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {!isNew && (
            <Card title="Advertisement documents">
              <ul className="mb-3 space-y-2">
                {(saved?.documents || []).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                    <button type="button" className="inline-flex items-center gap-1 truncate text-uop-700 hover:underline" onClick={() => download(`/vacancies/${id}/documents/${d.id}`, d.original_name)}>
                      <Download className="h-3.5 w-3.5" /> {d.original_name}
                    </button>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      {fmtSize(d.size_bytes)}
                      <button type="button" aria-label={`Delete ${d.original_name}`} onClick={() => del(`/vacancies/${id}/documents/${d.id}`).then(load)} className="rounded p-1 hover:bg-slate-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <FileUp className="h-4 w-4" /> Upload PDF / image
                <input type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg" onChange={(e) => onFile(e.target.files[0])} />
              </label>
            </Card>
          )}
          {!isNew && user.role === 'ADMIN' && (
            <Card title="Late-application exception">
              <p className="mb-3 text-sm text-slate-600">Applications are blocked after the closing date unless an administrator explicitly enables an exception.</p>
              <div className="space-y-3">
                <Input label="Accept applications until" type="date" value={late.until} onChange={(e) => setLate({ ...late, until: e.target.value })} />
                <TextArea label="Reason" value={late.reason} onChange={(e) => setLate({ ...late, reason: e.target.value })} rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveLate}>
                    Save exception
                  </Button>
                  {saved?.late_exception_until && (
                    <Button size="sm" variant="secondary" onClick={() => post(`/vacancies/${id}/late-exception`, { until: null }).then(load)}>
                      Remove
                    </Button>
                  )}
                </div>
                {saved?.late_exception_until && <Alert type="warning">Exception active until {fmtDate(saved.late_exception_until_local)}.</Alert>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
