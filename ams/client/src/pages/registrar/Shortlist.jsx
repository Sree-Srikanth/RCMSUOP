import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, ListChecks, Share2, History } from 'lucide-react';
import { get, post, download, qs } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useMaster } from '../../lib/master';
import { fmtDateTime, label } from '../../lib/format';
import { Alert, Badge, Button, Card, DecisionBadge, EmptyState, ErrorBox, Modal, PageHeader, Select, Spinner, TextArea, cx, useLoad, useToast } from '../../components/ui';
import { useStaffVacancies } from './ApplicationsList';

function ShareHistory() {
  const { data, loading, error } = useLoad(() => get('/shortlist/shares'), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  if (!data.shares.length) return <EmptyState icon={History} title="Nothing has been shared yet" />;
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Date / time</th>
            <th>Recipient</th>
            <th>Unit</th>
            <th>Vacancy</th>
            <th>Shared by</th>
            <th>Candidates</th>
          </tr>
        </thead>
        <tbody>
          {data.shares.map((s) => (
            <tr key={s.id}>
              <td className="whitespace-nowrap">{fmtDateTime(s.shared_at)}</td>
              <td>
                <Badge tone={s.recipient_role === 'HOD' ? 'blue' : 'maroon'}>{s.recipient_role === 'HOD' ? 'HOD' : 'Dean'}</Badge>
              </td>
              <td>{s.recipient_unit}</td>
              <td>
                {s.position_title}
                <p className="text-xs text-slate-500">{s.department_name}</p>
              </td>
              <td>{s.shared_by_name}</td>
              <td>
                <ul className="text-xs">
                  {s.candidates.map((c) => (
                    <li key={c.id}>
                      <span className="font-mono">{c.reference_no}</span> {c.name_with_initials}
                    </li>
                  ))}
                </ul>
                {s.note && <p className="mt-1 text-xs italic text-slate-500">“{s.note}”</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Shortlist() {
  const master = useMaster();
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'list';
  const f = { vacancy_id: params.get('vacancy_id') || '', department_id: params.get('department_id') || '', category: params.get('category') || '', decision: params.get('decision') || 'SELECTED', shared: params.get('shared') || '' };
  const query = qs(f);
  const vacancies = useStaffVacancies();
  const { data, loading, error, reload } = useLoad(() => get(`/shortlist${query}`), [query]);
  const [selected, setSelected] = useState(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [shareError, setShareError] = useState(null);

  const rows = data?.applications || [];
  const shareable = rows.filter((r) => r.decision_code === 'SELECTED');
  const allChecked = shareable.length > 0 && shareable.every((r) => selected.has(r.id));
  const chosen = rows.filter((r) => selected.has(r.id));
  const recipients = useMemo(() => [...new Map(chosen.map((r) => [r.department_id, r])).values()], [chosen]);

  const setFilter = (k, v) => {
    const next = Object.fromEntries(Object.entries({ ...f, [k]: v }).filter(([, x]) => x));
    setParams(next);
    setSelected(new Set());
  };
  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const share = async () => {
    setBusy(true);
    setShareError(null);
    try {
      const r = await post('/shortlist/share', { application_ids: [...selected], note: note || null });
      toast(`Shared ${chosen.length} candidate(s) with ${r.shares.length} recipient unit(s).`);
      setShareOpen(false);
      setSelected(new Set());
      setNote('');
      reload();
    } catch (e) {
      setShareError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Shortlist"
        subtitle="Selected candidates. Share them with the relevant Head of Department and Dean – only shared, selected applications become visible to them."
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={() => download(`/shortlist/export.csv${query}`).catch((e) => toast(e.message, 'error'))}>
              Download list
            </Button>
            {user.role === 'REGISTRAR' && (
              <Button icon={Share2} disabled={!selected.size} onClick={() => setShareOpen(true)}>
                Share with HOD &amp; Dean ({selected.size})
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-slate-200" role="tablist">
        {[
          ['list', 'Candidates'],
          ['history', 'Sharing history'],
        ].map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            type="button"
            onClick={() => setParams(k === 'list' ? {} : { tab: k })}
            className={cx('-mb-px border-b-2 px-4 py-2 text-sm font-medium', tab === k ? 'border-uop-700 text-uop-800' : 'border-transparent text-slate-600 hover:text-slate-900')}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <Card bodyClass="p-0">
          <ShareHistory />
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <div className="grid gap-3 md:grid-cols-5">
              <Select label="Vacancy" value={f.vacancy_id} onChange={(e) => setFilter('vacancy_id', e.target.value)} placeholder="All vacancies"
                options={(vacancies.data?.vacancies || []).map((v) => ({ value: String(v.id), label: `${v.position_title} – ${v.department_name}` }))} />
              <Select label="Department" value={f.department_id} onChange={(e) => setFilter('department_id', e.target.value)} placeholder="All departments"
                options={(master?.departments || []).map((d) => ({ value: String(d.id), label: d.name }))} />
              <Select label="Decision" value={f.decision} placeholder={false} onChange={(e) => setFilter('decision', e.target.value === 'SELECTED' ? '' : e.target.value)}
                options={['SELECTED', 'PENDING', 'REJECTED'].map((d) => ({ value: d, label: label(d) }))} />
              <Select label="Category" value={f.category} onChange={(e) => setFilter('category', e.target.value)} placeholder="Any category"
                options={['CATEGORY_I', 'CATEGORY_II', 'CATEGORY_III'].map((c) => ({ value: c, label: label(c) }))} />
              <Select label="Sharing" value={f.shared} onChange={(e) => setFilter('shared', e.target.value)} placeholder="All"
                options={[{ value: 'no', label: 'Not yet shared' }, { value: 'yes', label: 'Shared' }]} />
            </div>
          </Card>
          {f.decision !== 'SELECTED' && (
            <Alert type="info" className="mb-4">
              {label(f.decision)} applications are shown for reference only. Only Selected candidates can be shared with the HOD and Dean.
            </Alert>
          )}
          <ErrorBox error={error} />
          <Card bodyClass="p-0">
            {loading && !data ? (
              <Spinner />
            ) : !rows.length ? (
              <EmptyState icon={ListChecks} title="No candidates match">
                Candidates appear here once the Registrar/SAR records a Selected decision.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th scope="col" className="w-10">
                        <input
                          type="checkbox"
                          aria-label="Select all selected candidates"
                          checked={allChecked}
                          disabled={!shareable.length || user.role !== 'REGISTRAR'}
                          onChange={(e) => setSelected(e.target.checked ? new Set(shareable.map((r) => r.id)) : new Set())}
                          className="h-4 w-4 rounded"
                        />
                      </th>
                      <th scope="col">Reference</th>
                      <th scope="col">Applicant</th>
                      <th scope="col">Position</th>
                      <th scope="col">Department</th>
                      <th scope="col">Decision</th>
                      <th scope="col">Shared with</th>
                      <th scope="col" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const can = r.decision_code === 'SELECTED' && user.role === 'REGISTRAR';
                      return (
                        <tr key={r.id} className={selected.has(r.id) ? 'bg-uop-50/60' : ''}>
                          <td>
                            <input type="checkbox" aria-label={`Select ${r.applicant_name}`} disabled={!can} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 rounded" />
                          </td>
                          <td className="font-mono text-xs font-semibold text-uop-800">{r.reference_no}</td>
                          <td>
                            <p className="font-medium">{r.applicant_name}</p>
                            <p className="text-xs text-slate-500">{r.email}</p>
                          </td>
                          <td>{r.position_title}</td>
                          <td>{r.department_name}</td>
                          <td>
                            <DecisionBadge decision={r.decision_code} category={r.category_code} />
                          </td>
                          <td className="text-xs">
                            {r.shared_with_hod_at ? <p>HOD · {fmtDateTime(r.shared_with_hod_at)}</p> : <p className="text-slate-400">HOD · not shared</p>}
                            {r.shared_with_dean_at ? <p>Dean · {fmtDateTime(r.shared_with_dean_at)}</p> : <p className="text-slate-400">Dean · not shared</p>}
                          </td>
                          <td>
                            <Link to={`/registrar/applications/${r.id}`} className="text-sm text-uop-700 hover:underline">
                              Open
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share selected candidates"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShareOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button icon={Share2} onClick={share} loading={busy}>
              Confirm and share
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <p>
            The following <strong>{chosen.length}</strong> selected candidate(s) will become visible to the Head of Department and the Dean of the relevant unit. Their shortlist
            decisions are not changed.
          </p>
          <ul className="max-h-48 overflow-y-auto rounded border border-slate-200">
            {chosen.map((r) => (
              <li key={r.id} className="flex justify-between border-b border-slate-100 px-3 py-1.5 last:border-0">
                <span>
                  <span className="font-mono text-xs">{r.reference_no}</span> {r.applicant_name}
                </span>
                {r.category_code && <Badge tone="maroon">{label(r.category_code)}</Badge>}
              </li>
            ))}
          </ul>
          <div>
            <p className="font-medium">Recipients</p>
            <ul className="mt-1 list-disc pl-5 text-slate-700">
              {recipients.map((r) => (
                <li key={r.department_id}>
                  Head of {r.department_name} and Dean, {r.faculty_name}
                </li>
              ))}
            </ul>
          </div>
          <TextArea label="Note to recipients (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <ErrorBox error={shareError} />
        </div>
      </Modal>
    </>
  );
}
