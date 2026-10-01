import { useState } from 'react';
import { BadgeCheck, Plus } from 'lucide-react';
import { get, post, put } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate, fmtDateTime } from '../../lib/format';
import { Alert, Badge, Button, Card, DecisionBadge, EmptyState, ErrorBox, Input, Modal, PageHeader, Select, Spinner, TextArea, useLoad, useToast } from '../../components/ui';

const STATUSES = ['RECOMMENDED', 'APPROVED', 'OFFERED', 'ACCEPTED', 'DECLINED', 'APPOINTED', 'WITHDRAWN'];
const title = (s) => s.charAt(0) + s.slice(1).toLowerCase();

export default function Appointments() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(() => get('/appointments'), []);
  const selected = useLoad(() => get('/shortlist'), []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  const save = async () => {
    setBusy(true);
    setFormError(null);
    try {
      if (form.id) await put(`/appointments/${form.id}`, form);
      else await post('/appointments', form);
      toast('Appointment record saved.');
      setForm(null);
      reload();
    } catch (e) {
      setFormError(e);
    } finally {
      setBusy(false);
    }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle="Post-selection appointment processing. These records are kept separately and never alter shortlist decisions."
        actions={user.role === 'REGISTRAR' && <Button icon={Plus} onClick={() => setForm({ application_id: '', status: 'RECOMMENDED' })}>New appointment record</Button>}
      />
      <ErrorBox error={error} />
      <Card bodyClass="p-0">
        {loading ? (
          <Spinner />
        ) : !data.appointments.length ? (
          <EmptyState icon={BadgeCheck} title="No appointment records" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Post</th>
                  <th>Shortlist</th>
                  <th>Appointment status</th>
                  <th>Council approval</th>
                  <th>Letter ref.</th>
                  <th>Effective</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.appointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p className="font-mono text-xs text-uop-800">{a.reference_no}</p>
                      {a.name_with_initials}
                    </td>
                    <td>
                      {a.position_title}
                      <p className="text-xs text-slate-500">{a.department_name}</p>
                    </td>
                    <td>
                      <DecisionBadge decision={a.decision_code} category={a.category_code} />
                    </td>
                    <td>
                      <Badge tone={a.status === 'APPOINTED' ? 'green' : ['DECLINED', 'WITHDRAWN'].includes(a.status) ? 'red' : 'blue'}>{title(a.status)}</Badge>
                    </td>
                    <td>{fmtDate(a.council_approval_date)}</td>
                    <td>{a.letter_reference}</td>
                    <td>{fmtDate(a.effective_date)}</td>
                    <td className="text-xs">{fmtDateTime(a.updated_at)}</td>
                    <td>
                      {user.role === 'REGISTRAR' && (
                        <Button size="sm" variant="secondary" onClick={() => setForm({ ...a })}>
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Update appointment record' : 'New appointment record'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy}>
              Save
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            {!form.id && (
              <Select
                label="Selected candidate"
                required
                value={form.application_id}
                onChange={set('application_id')}
                options={(selected.data?.applications || []).map((a) => ({ value: String(a.id), label: `${a.reference_no} – ${a.applicant_name} (${a.position_title})` }))}
              />
            )}
            <Select label="Status" required placeholder={false} value={form.status} onChange={set('status')} options={STATUSES.map((s) => ({ value: s, label: title(s) }))} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Council approval date" type="date" value={form.council_approval_date} onChange={set('council_approval_date')} />
              <Input label="Letter reference" value={form.letter_reference} onChange={set('letter_reference')} />
              <Input label="Effective date" type="date" value={form.effective_date} onChange={set('effective_date')} />
            </div>
            <TextArea label="Remarks" value={form.remarks} onChange={set('remarks')} />
            <Alert type="info">Only candidates with a current Selected decision can have appointment records.</Alert>
            <ErrorBox error={formError} />
          </div>
        )}
      </Modal>
    </>
  );
}
