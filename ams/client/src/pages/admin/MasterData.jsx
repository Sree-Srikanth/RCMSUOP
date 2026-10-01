import { useState } from 'react';
import { Plus } from 'lucide-react';
import { get, post, put } from '../../lib/api';
import { useMaster } from '../../lib/master';
import { label } from '../../lib/format';
import { Alert, Badge, Button, Card, ErrorBox, Input, Modal, PageHeader, Select, Spinner, cx, useLoad, useToast } from '../../components/ui';

export default function MasterData() {
  const master = useMaster();
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(() => get('/admin/departments'), []);
  const [tab, setTab] = useState('units');
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState(null);

  const save = async () => {
    setFormError(null);
    try {
      const base = form.kind === 'faculty' ? '/admin/faculties' : '/admin/departments';
      if (form.id) await put(`${base}/${form.id}`, form);
      else await post(base, form);
      toast('Saved.');
      setForm(null);
      reload();
    } catch (e) {
      setFormError(e);
    }
  };
  const toggle = async (kind, row) => {
    await put(`/admin/${kind === 'faculty' ? 'faculties' : 'departments'}/${row.id}`, { is_active: !row.is_active });
    reload();
  };

  if (!master) return <Spinner />;
  const positions = master.positions;
  const matrix = master.shortlist_matrix;

  return (
    <>
      <PageHeader title="Master Data" subtitle="Organisational units, positions and the authoritative position-specific shortlist matrix." />
      <div className="mb-4 flex gap-1 border-b border-slate-200" role="tablist">
        {[
          ['units', 'Faculties & departments'],
          ['positions', 'Positions & shortlist rules'],
        ].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={cx('-mb-px border-b-2 px-4 py-2 text-sm font-medium', tab === k ? 'border-uop-700 text-uop-800' : 'border-transparent text-slate-600')}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'positions' ? (
        <Card title="Shortlist decision matrix (Requirements §15)">
          <Alert type="info" className="mb-4">
            The matrix is enforced by the API and by database constraints. Changes to positions or allowed decisions must be made as a controlled requirements/configuration change.
          </Alert>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Position</th>
                  <th>Selected</th>
                  <th>Rejected</th>
                  <th>Pending</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const rows = matrix.filter((m) => m.position_code === p.code);
                  const cats = rows.filter((r) => r.decision_code === 'SELECTED' && r.category_code).map((r) => label(r.category_code));
                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">{p.code}</td>
                      <td className="font-medium">{p.title}</td>
                      <td>{cats.length ? <span>Requires exactly one of: {cats.map((c) => <Badge key={c} tone="maroon" className="mr-1">{c}</Badge>)}</span> : <span>Allowed, no category</span>}</td>
                      <td>Allowed, no category</td>
                      <td>Allowed, no category</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : loading ? (
        <Spinner />
      ) : (
        <>
          <ErrorBox error={error} />
          <div className="mb-4 flex gap-2">
            <Button icon={Plus} variant="secondary" onClick={() => setForm({ kind: 'faculty', code: '', name: '' })}>
              Add faculty
            </Button>
            <Button icon={Plus} variant="secondary" onClick={() => setForm({ kind: 'department', faculty_id: '', code: '', name: '' })}>
              Add department
            </Button>
          </div>
          <div className="space-y-4">
            {data.faculties.map((f) => (
              <Card
                key={f.id}
                title={
                  <span className={f.is_active ? '' : 'text-slate-400 line-through'}>
                    <span className="font-mono text-xs text-slate-500">{f.code}</span> {f.name}
                  </span>
                }
                actions={
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setForm({ kind: 'faculty', ...f })}>Rename</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle('faculty', f)}>{f.is_active ? 'Deactivate' : 'Activate'}</Button>
                  </>
                }
                bodyClass="p-0"
              >
                <ul className="divide-y divide-slate-100">
                  {data.departments
                    .filter((d) => d.faculty_id === f.id)
                    .map((d) => (
                      <li key={d.id} className="flex items-center justify-between px-5 py-2 text-sm">
                        <span className={d.is_active ? '' : 'text-slate-400 line-through'}>
                          <span className="mr-2 font-mono text-xs text-slate-500">{d.code}</span>
                          {d.name}
                        </span>
                        <span>
                          <Button size="sm" variant="ghost" onClick={() => setForm({ kind: 'department', ...d })}>Rename</Button>
                          <Button size="sm" variant="ghost" onClick={() => toggle('department', d)}>{d.is_active ? 'Deactivate' : 'Activate'}</Button>
                        </span>
                      </li>
                    ))}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form ? `${form.id ? 'Edit' : 'Add'} ${form.kind}` : ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            {form.kind === 'department' && !form.id && (
              <Select label="Faculty" required value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} options={(data?.faculties || []).map((f) => ({ value: f.id, label: f.name }))} />
            )}
            {!form.id && <Input label="Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} hint="2–10 letters/digits; used in application reference numbers and cannot be changed later." />}
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <ErrorBox error={formError} />
          </div>
        )}
      </Modal>
    </>
  );
}
