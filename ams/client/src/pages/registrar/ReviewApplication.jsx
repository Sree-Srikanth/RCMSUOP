import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, History, List, RefreshCw, Save, FileSearch } from 'lucide-react';
import { get, post, put, download } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { decisionText, fmtDate, fmtDateTime, label } from '../../lib/format';
import ApplicationView from '../../components/ApplicationView';
import {
  Alert, Badge, Button, Card, ConfirmDialog, DecisionBadge, ErrorBox, KeyValue, Modal, Select, Spinner, StatusBadge, TextArea, cx, useToast,
} from '../../components/ui';

function DecisionPanel({ data, onSaved }) {
  const toast = useToast();
  const app = data.application;
  const [decision, setDecision] = useState(app.decision_code || '');
  const [category, setCategory] = useState(app.category_code || '');
  const [remarks, setRemarks] = useState(app.decision_remarks || '');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDecision(app.decision_code || '');
    setCategory(app.category_code || '');
    setRemarks(app.decision_remarks || '');
    setError(null);
  }, [app.id, app.decision_code, app.category_code, app.decision_remarks]);

  const option = data.options.find((o) => o.decision === decision);
  const needsCategory = option?.category_required;
  const valid = decision && (!needsCategory || category);
  const changed = decision !== (app.decision_code || '') || (category || '') !== (app.category_code || '') || remarks !== (app.decision_remarks || '');

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await post(`/review/applications/${app.id}/decision`, { decision, category: needsCategory ? category : null, remarks: remarks || null });
      toast(`Decision saved: ${decisionText(decision, needsCategory ? category : null)}.`);
      setConfirm(false);
      onSaved();
    } catch (e) {
      setError(e);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  if (!data.can_decide) {
    return (
      <Card title="Shortlist decision">
        <DecisionBadge decision={app.decision_code} category={app.category_code} />
        {app.decision_remarks && <p className="mt-2 text-sm text-slate-600">{app.decision_remarks}</p>}
      </Card>
    );
  }

  return (
    <Card title="Shortlist decision">
      <fieldset>
        <legend className="label">Decision for {app.position_title}</legend>
        <div className="grid grid-cols-3 gap-2">
          {data.options.map((o) => (
            <label
              key={o.decision}
              className={cx(
                'flex cursor-pointer flex-col items-center rounded-md border px-2 py-2 text-sm font-medium transition',
                decision === o.decision
                  ? o.decision === 'SELECTED'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : o.decision === 'REJECTED'
                      ? 'border-red-500 bg-red-50 text-red-800'
                      : 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name="decision"
                checked={decision === o.decision}
                onChange={() => {
                  setDecision(o.decision);
                  if (!o.category_required) setCategory('');
                }}
              />
              {label(o.decision)}
            </label>
          ))}
        </div>
      </fieldset>
      {needsCategory && (
        <fieldset className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
          <legend className="px-1 text-sm font-medium text-emerald-900">
            Category <span className="text-red-600">*</span> <span className="font-normal text-emerald-800">(select exactly one)</span>
          </legend>
          <div className="flex flex-wrap gap-4">
            {option.categories.map((c) => (
              <label key={c} className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="category" checked={category === c} onChange={() => setCategory(c)} className="h-4 w-4" />
                {label(c)}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <TextArea className="mt-4" label="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
      <ErrorBox error={error} />
      <Button className="mt-3 w-full" icon={Save} disabled={!valid || !changed} onClick={() => setConfirm(true)}>
        Save decision
      </Button>
      {!valid && decision && needsCategory && <p className="mt-2 text-xs text-amber-700">Select a category to save a Selected decision for this position.</p>}

      <ConfirmDialog open={confirm} title="Confirm shortlist decision" confirmText="Save decision" onCancel={() => setConfirm(false)} onConfirm={save} loading={busy}>
        <p>
          Record <strong>{decisionText(decision, needsCategory ? category : null)}</strong> for <strong>{app.name_with_initials}</strong> ({app.reference_no})?
        </p>
        {app.decision_code && (
          <p className="mt-2 text-amber-800">
            This changes the current decision ({decisionText(app.decision_code, app.category_code)}). The change will be recorded in the decision history.
          </p>
        )}
      </ConfirmDialog>
    </Card>
  );
}

function HistoryPanel({ history }) {
  return (
    <Card title={<span className="flex items-center gap-2"><History className="h-4 w-4" /> Decision history</span>} bodyClass="p-0">
      {!history.length ? (
        <p className="px-5 py-4 text-sm text-slate-500">No decisions recorded yet.</p>
      ) : (
        <ol className="divide-y divide-slate-100">
          {history.map((h) => (
            <li key={h.id} className="px-5 py-3 text-sm">
              <div className="flex items-center justify-between">
                <DecisionBadge decision={h.decision_code} category={h.category_code} />
                <span className="text-xs text-slate-500">{fmtDateTime(h.decided_at)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                by {h.decided_by_name}
                {h.previous_decision_code && <> · previously {decisionText(h.previous_decision_code, h.previous_category_code)}</>}
              </p>
              {h.remarks && <p className="mt-1 text-slate-700">“{h.remarks}”</p>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

const SCHED_OPTIONS = [
  { value: 'TICK', label: '✓ Received / Yes' },
  { value: 'NO', label: '✗ No' },
  { value: 'PENDING', label: 'Pending' },
];

function SchedulePanel({ app, canEdit, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => setF({ sched_pc: app.sched_pc || '', sched_rr: app.sched_rr || '', sched_tr: app.sched_tr || '', sched_remarks: app.sched_remarks || '' }), [app]);
  const save = async () => {
    setBusy(true);
    try {
      await put(`/review/applications/${app.id}/schedule`, f);
      toast('Schedule details saved.');
      onSaved();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const rrAuto = app.rr_received >= 2 ? '✓ (2 e-reports received)' : `${app.rr_received}/2 e-reports received`;
  return (
    <Card title="Official schedule entries">
      <div className="space-y-3">
        <Select label="PC – Sent through proper channel" value={f.sched_pc} disabled={!canEdit} placeholder="— blank —" options={SCHED_OPTIONS} onChange={(e) => setF({ ...f, sched_pc: e.target.value })} />
        <Select label="RR – Referees report" value={f.sched_rr} disabled={!canEdit} placeholder={`Automatic: ${rrAuto}`} options={SCHED_OPTIONS} onChange={(e) => setF({ ...f, sched_rr: e.target.value })} hint="Leave automatic unless reports were received on paper." />
        <Select label="TR – Transcript" value={f.sched_tr} disabled={!canEdit} placeholder="— blank —" options={SCHED_OPTIONS} onChange={(e) => setF({ ...f, sched_tr: e.target.value })} />
        <TextArea label="Schedule remarks" value={f.sched_remarks} disabled={!canEdit} onChange={(e) => setF({ ...f, sched_remarks: e.target.value })} rows={2} />
        {canEdit && (
          <Button variant="secondary" className="w-full" icon={Save} loading={busy} onClick={save}>
            Save schedule entries
          </Button>
        )}
      </div>
    </Card>
  );
}

function RefereePanel({ app, canEdit, onSaved }) {
  const toast = useToast();
  const [reports, setReports] = useState(null);
  const resend = async (r) => {
    try {
      await post(`/review/applications/${app.id}/referees/${r.referee_id}/resend`);
      toast(`A new request was emailed to ${r.name}.`);
      onSaved();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const view = async () => {
    try {
      setReports((await get(`/review/applications/${app.id}/referee-reports`)).reports);
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return (
    <Card title="Referee reports" actions={app.rr_received > 0 && <Button size="sm" variant="secondary" icon={FileSearch} onClick={view}>View reports</Button>}>
      <ul className="space-y-3">
        {app.referee_status.map((r) => (
          <li key={r.referee_id} className="text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{r.name}</span>
              {r.status === 'SUBMITTED' ? <Badge tone="green">Received</Badge> : <StatusBadge status={r.status} />}
            </div>
            <p className="text-xs text-slate-500">
              {r.email}
              {r.sent_at && ` · requested ${fmtDate(r.sent_at)}`}
              {r.submitted_at && ` · received ${fmtDate(r.submitted_at)}`}
            </p>
            {canEdit && r.status !== 'SUBMITTED' && (
              <button type="button" onClick={() => resend(r)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-uop-700 hover:underline">
                <RefreshCw className="h-3 w-3" /> Resend request
              </button>
            )}
          </li>
        ))}
      </ul>
      <Modal open={!!reports} onClose={() => setReports(null)} title="Confidential referee reports" size="lg">
        {reports?.map((rp) => (
          <div key={rp.id} className="mb-6 rounded-lg border border-slate-200 p-4">
            <p className="font-semibold">
              {rp.referee_name}
              {rp.referee_designation && `, ${rp.referee_designation}`}
            </p>
            <p className="text-xs text-slate-500">Submitted {fmtDateTime(rp.submitted_at)}</p>
            <div className="mt-3">
              <KeyValue
                items={[
                  ['Capacity', rp.relationship],
                  ['Known since', rp.known_since],
                  ['Recommendation', label(rp.recommendation) || rp.recommendation.replace(/_/g, ' ').toLowerCase()],
                  ...Object.entries(rp.ratings).map(([k, v]) => [k.replace(/_/g, ' '), v.replace(/_/g, ' ').toLowerCase()]),
                  ['Strengths', rp.strengths],
                  ['Areas for development', rp.weaknesses],
                  ['Comments', rp.comments],
                ]}
              />
            </div>
          </div>
        ))}
      </Modal>
    </Card>
  );
}

export default function ReviewApplication() {
  const { id } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () =>
    get(`/review/applications/${id}${search}`)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch(setError);

  useEffect(() => {
    setData(null);
    load();
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, search]);

  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const app = data.application;
  const nav = data.nav;
  const goto = (appId) => navigate(`/registrar/applications/${appId}${search}`);
  const canEdit = user.role === 'REGISTRAR';

  const navBar = (
    <nav className="flex flex-wrap items-center justify-between gap-2" aria-label="Applicant navigation">
      <Button variant="secondary" icon={ChevronLeft} disabled={!nav.prev_id} onClick={() => goto(nav.prev_id)}>
        Previous Applicant
      </Button>
      <Link to={`/registrar/applications${search}`} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-uop-700 hover:bg-uop-50">
        <List className="h-4 w-4" /> Back to List {nav.index >= 0 && <span className="text-slate-500">({nav.index + 1} of {nav.total})</span>}
      </Link>
      <Button variant="secondary" disabled={!nav.next_id} onClick={() => goto(nav.next_id)}>
        Next Applicant <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={`/registrar/applications${search}`} className="mb-2 inline-flex items-center gap-1 text-sm text-uop-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Applications
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {app.title ? `${app.title}. ` : ''}
            {app.name_in_full}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-mono font-semibold text-uop-800">{app.reference_no}</span> · {app.position_title} · {app.department_name}, {app.faculty_name}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={app.status} />
            <DecisionBadge decision={app.decision_code} category={app.category_code} />
            <Badge>Submitted {fmtDate(app.submitted_at)}</Badge>
          </div>
        </div>
        <Button variant="secondary" icon={Download} onClick={() => download(`/applications/${app.id}/pdf`).catch((e) => toast(e.message, 'error'))}>
          Application PDF
        </Button>
      </div>

      {navBar}

      {data.documents_required.some((d) => d.mandatory && !d.uploaded) && (
        <Alert type="warning">Some required documents are missing from this application.</Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <ApplicationView app={app} />
        </div>
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <DecisionPanel data={data} onSaved={load} />
          <HistoryPanel history={data.history} />
          <SchedulePanel app={app} canEdit={canEdit} onSaved={load} />
          <RefereePanel app={app} canEdit={canEdit} onSaved={load} />
        </aside>
      </div>

      <div className="card p-4">{navBar}</div>
    </div>
  );
}
