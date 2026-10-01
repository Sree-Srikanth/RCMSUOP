import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Plus } from 'lucide-react';
import { get, post } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate, label } from '../../lib/format';
import { Button, Card, EmptyState, ErrorBox, Input, Modal, PageHeader, Select, Spinner, StatusBadge, TextArea, useLoad, useToast } from '../../components/ui';
import { useStaffVacancies } from './ApplicationsList';

export const EMPTY_INTERVIEW = { interview_date: '', interview_time: '09:00', mode: 'IN_PERSON', venue: '', online_details: '', candidate_instructions: '', panel_details: '' };

export function InterviewFields({ f, setF }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Input label="Date" type="date" required value={f.interview_date} onChange={set('interview_date')} />
      <Input label="Time" type="time" required value={f.interview_time} onChange={set('interview_time')} />
      <Select label="Mode" placeholder={false} value={f.mode} onChange={set('mode')} options={['IN_PERSON', 'ONLINE', 'HYBRID'].map((m) => ({ value: m, label: label(m) }))} />
      {f.mode !== 'ONLINE' && <Input className="sm:col-span-3" label="Venue" required value={f.venue} onChange={set('venue')} />}
      {f.mode !== 'IN_PERSON' && <TextArea className="sm:col-span-3" label="Online meeting details" required value={f.online_details} onChange={set('online_details')} hint="Platform, link, meeting ID, passcode." />}
      <TextArea className="sm:col-span-3" label="Interview Panel / Panel Details" rows={4} value={f.panel_details} onChange={set('panel_details')} hint="Describe the panel as appropriate (e.g. Chair, Senate nominees, Council nominees, HOD, external experts)." />
      <TextArea className="sm:col-span-3" label="Instructions to candidates" rows={3} value={f.candidate_instructions} onChange={set('candidate_instructions')} hint="Included in the interview notification email." />
    </div>
  );
}

export default function Interviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error } = useLoad(() => get('/interviews'), []);
  const vacancies = useStaffVacancies();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ vacancy_id: '', ...EMPTY_INTERVIEW });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  const create = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const r = await post('/interviews', f);
      toast('Interview scheduled. Add the selected candidates next.');
      navigate(`/registrar/interviews/${r.id}`);
    } catch (e) {
      setFormError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Interviews"
        subtitle="Schedule interviews for selected candidates, record panel details and notify candidates."
        actions={user.role === 'REGISTRAR' && <Button icon={Plus} onClick={() => setOpen(true)}>Schedule interview</Button>}
      />
      <ErrorBox error={error} />
      <Card bodyClass="p-0">
        {loading ? (
          <Spinner />
        ) : !data.interviews.length ? (
          <EmptyState icon={CalendarClock} title="No interviews scheduled" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date &amp; time</th>
                  <th>Vacancy</th>
                  <th>Mode / venue</th>
                  <th>Candidates</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.interviews.map((i) => (
                  <tr key={i.id}>
                    <td className="whitespace-nowrap font-medium">
                      {fmtDate(i.interview_date)} · {i.interview_time}
                    </td>
                    <td>
                      {i.position_title}
                      <p className="text-xs text-slate-500">{i.department_name}</p>
                    </td>
                    <td>
                      {label(i.mode)}
                      <p className="text-xs text-slate-500">{i.venue}</p>
                    </td>
                    <td>{i.candidate_count}</td>
                    <td>
                      <StatusBadge status={i.status} />
                    </td>
                    <td>
                      <Link to={`/registrar/interviews/${i.id}`} className="text-sm text-uop-700 hover:underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule an interview"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} loading={busy} disabled={!f.vacancy_id}>
              Create interview
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Vacancy" required value={f.vacancy_id} onChange={(e) => setF({ ...f, vacancy_id: e.target.value })}
            options={(vacancies.data?.vacancies || []).filter((v) => v.status !== 'DRAFT').map((v) => ({ value: String(v.id), label: `${v.position_title} – ${v.department_name}` }))} />
          <InterviewFields f={f} setF={setF} />
          <ErrorBox error={formError} />
        </div>
      </Modal>
    </>
  );
}
