import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Save, UserPlus, Trash2 } from 'lucide-react';
import { get, post, put, del } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate, fmtDateTime, label } from '../../lib/format';
import {
  Badge, Button, Card, Checkbox, ConfirmDialog, DecisionBadge, EmptyState, ErrorBox, KeyValue, PageHeader, Select, Spinner, StatusBadge, useToast,
} from '../../components/ui';
import { InterviewFields } from './Interviews';

function CandidateRow({ c, interviewId, canEdit, onChange }) {
  const toast = useToast();
  const [f, setF] = useState({ slot_time: c.slot_time || '', attendance: c.attendance || '', result: c.result || '', remarks: c.remarks || '' });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const r = await put(`/interviews/${interviewId}/candidates/${c.id}`, f);
      onChange(r.candidates);
      toast('Saved.');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    try {
      const r = await del(`/interviews/${interviewId}/candidates/${c.id}`);
      onChange(r.candidates);
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return (
    <tr>
      <td>
        <p className="font-mono text-xs font-semibold text-uop-800">{c.reference_no}</p>
        <p className="font-medium">{c.name_with_initials}</p>
        <DecisionBadge decision={c.decision_code} category={c.category_code} />
      </td>
      <td>
        <input type="time" className="input w-28" aria-label="Slot time" value={f.slot_time} disabled={!canEdit} onChange={(e) => setF({ ...f, slot_time: e.target.value })} />
      </td>
      <td className="text-xs">{c.notified_at ? <Badge tone="green">Notified {fmtDateTime(c.notified_at)}</Badge> : <Badge>Not notified</Badge>}</td>
      <td>
        <select className="input w-32" aria-label="Attendance" value={f.attendance} disabled={!canEdit} onChange={(e) => setF({ ...f, attendance: e.target.value })}>
          <option value="">—</option>
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
        </select>
      </td>
      <td>
        <input className="input" aria-label="Result" value={f.result} disabled={!canEdit} onChange={(e) => setF({ ...f, result: e.target.value })} placeholder="e.g. Recommended" />
      </td>
      <td>
        <input className="input" aria-label="Remarks" value={f.remarks} disabled={!canEdit} onChange={(e) => setF({ ...f, remarks: e.target.value })} />
      </td>
      <td className="whitespace-nowrap">
        {canEdit && (
          <>
            <Button size="sm" variant="secondary" icon={Save} loading={busy} onClick={save} aria-label="Save candidate" />
            <Button size="sm" variant="ghost" icon={Trash2} onClick={remove} aria-label="Remove candidate" />
          </>
        )}
      </td>
    </tr>
  );
}

export default function InterviewDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(new Set());
  const [confirmNotify, setConfirmNotify] = useState(false);
  const [busy, setBusy] = useState(false);
  const canEdit = user.role === 'REGISTRAR';

  const load = () => get(`/interviews/${id}`).then(setData).catch(setError);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <ErrorBox error={error} />;
  if (!data) return <Spinner />;
  const i = data.interview;

  const saveDetails = async () => {
    setBusy(true);
    try {
      await put(`/interviews/${id}`, edit);
      toast('Interview updated.');
      setEdit(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const addCandidates = async () => {
    try {
      await post(`/interviews/${id}/candidates`, { application_ids: [...adding] });
      setAdding(new Set());
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const notify = async () => {
    setBusy(true);
    try {
      const r = await post(`/interviews/${id}/notify`);
      toast(`Interview notifications sent to ${r.notified} candidate(s).`);
      setConfirmNotify(false);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        back={
          <Link to="/registrar/interviews" className="mb-2 inline-flex items-center gap-1 text-sm text-uop-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Interviews
          </Link>
        }
        title={`Interview – ${i.position_title}`}
        subtitle={`${i.department_name}, ${i.faculty_name}`}
        actions={
          canEdit && (
            <Button icon={Send} disabled={!data.candidates.length || i.status === 'CANCELLED'} onClick={() => setConfirmNotify(true)}>
              Send interview notifications
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Interview details"
          className="lg:col-span-1"
          actions={canEdit && !edit && <Button size="sm" variant="secondary" onClick={() => setEdit({ ...i })}>Edit</Button>}
        >
          {edit ? (
            <div className="space-y-4">
              <InterviewFields f={edit} setF={setEdit} />
              <Select label="Status" placeholder={false} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}
                options={['SCHEDULED', 'POSTPONED', 'COMPLETED', 'CANCELLED'].map((s) => ({ value: s, label: label(s) }))} />
              <div className="flex gap-2">
                <Button onClick={saveDetails} loading={busy}>Save</Button>
                <Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <KeyValue
              cols={1}
              items={[
                ['Status', <StatusBadge key="s" status={i.status} />],
                ['Date & time', `${fmtDate(i.interview_date)} at ${i.interview_time}`],
                ['Mode', label(i.mode)],
                i.mode !== 'ONLINE' && ['Venue', i.venue],
                i.mode !== 'IN_PERSON' && ['Online details', i.online_details],
                ['Interview panel', i.panel_details],
                ['Candidate instructions', i.candidate_instructions],
              ]}
            />
          )}
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card title={`Candidates (${data.candidates.length})`} bodyClass="p-0">
            {!data.candidates.length ? (
              <EmptyState title="No candidates added">Add eligible (selected) candidates below.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Slot</th>
                      <th>Notification</th>
                      <th>Attendance</th>
                      <th>Result</th>
                      <th>Remarks</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.candidates.map((c) => (
                      <CandidateRow key={c.id + (c.notified_at || '')} c={c} interviewId={id} canEdit={canEdit} onChange={(cands) => setData({ ...data, candidates: cands })} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {canEdit && (
            <Card title="Eligible selected candidates" actions={<Button size="sm" icon={UserPlus} disabled={!adding.size} onClick={addCandidates}>Add to interview ({adding.size})</Button>}>
              {!data.eligible.length ? (
                <p className="text-sm text-slate-500">All selected candidates for this vacancy have been added. Only candidates with a current Selected decision are eligible.</p>
              ) : (
                <ul className="space-y-2">
                  {data.eligible.map((e) => (
                    <li key={e.id}>
                      <Checkbox
                        checked={adding.has(e.id)}
                        onChange={(v) => setAdding((s) => {
                          const n = new Set(s);
                          v ? n.add(e.id) : n.delete(e.id);
                          return n;
                        })}
                        label={
                          <span>
                            <span className="font-mono text-xs">{e.reference_no}</span> {e.name_with_initials} {e.category_code && <Badge tone="maroon">{label(e.category_code)}</Badge>}
                          </span>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
      <ConfirmDialog open={confirmNotify} title="Send interview notifications?" confirmText="Send emails" onCancel={() => setConfirmNotify(false)} onConfirm={notify} loading={busy}>
        An interview notification with the date, time, venue/online details and instructions will be emailed to {data.candidates.length} candidate(s).
      </ConfirmDialog>
    </>
  );
}
