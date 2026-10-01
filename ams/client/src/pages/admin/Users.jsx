import { useState } from 'react';
import { KeyRound, Plus, Users as UsersIcon } from 'lucide-react';
import { get, post, put } from '../../lib/api';
import { useMaster } from '../../lib/master';
import { fmtDateTime, label } from '../../lib/format';
import { Alert, Badge, Button, Card, Checkbox, ConfirmDialog, EmptyState, ErrorBox, Input, Modal, PageHeader, Select, Spinner, useLoad, useToast } from '../../components/ui';

const ROLES = ['REGISTRAR', 'HOD', 'DEAN', 'ADMIN', 'APPLICANT'];

function UserForm({ form, setForm, master, isNew }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const depts = master.departments.filter((d) => !form.faculty_id || String(d.faculty_id) === String(form.faculty_id));
  return (
    <div className="space-y-4">
      {isNew && <Input label="Email" type="email" required value={form.email} onChange={set('email')} />}
      <Input label="Full name" required value={form.full_name} onChange={set('full_name')} />
      <Select label="Role" required placeholder={false} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, department_id: '', faculty_id: '' })} options={ROLES.map((r) => ({ value: r, label: label(r) }))} />
      {['HOD', 'DEAN', 'REGISTRAR'].includes(form.role) && (
        <Select
          label={form.role === 'REGISTRAR' ? 'Faculty scope (optional – leave empty for all faculties)' : 'Faculty'}
          required={form.role === 'DEAN'}
          value={form.faculty_id || ''}
          placeholder={form.role === 'REGISTRAR' ? 'All faculties' : 'Select faculty…'}
          onChange={(e) => setForm({ ...form, faculty_id: e.target.value, department_id: '' })}
          options={master.faculties.map((f) => ({ value: f.id, label: f.name }))}
        />
      )}
      {form.role === 'HOD' && (
        <Select label="Department" required value={form.department_id || ''} onChange={set('department_id')} options={depts.map((d) => ({ value: d.id, label: d.name }))} />
      )}
      {!isNew && <Checkbox label="Account active" checked={!!form.is_active} onChange={(v) => setForm({ ...form, is_active: v ? 1 : 0 })} />}
    </div>
  );
}

export default function UsersAdmin() {
  const master = useMaster();
  const toast = useToast();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const query = new URLSearchParams(Object.entries({ role, q }).filter(([, v]) => v)).toString();
  const { data, loading, error, reload } = useLoad(() => get(`/admin/users${query ? `?${query}` : ''}`), [query]);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [temp, setTemp] = useState(null);
  const [reset, setReset] = useState(null);

  const save = async () => {
    setBusy(true);
    setFormError(null);
    try {
      if (form.id) {
        await put(`/admin/users/${form.id}`, form);
        toast('User updated.');
      } else {
        const r = await post('/admin/users', form);
        setTemp({ email: r.user.email, password: r.temporary_password });
      }
      setForm(null);
      reload();
    } catch (e) {
      setFormError(e);
    } finally {
      setBusy(false);
    }
  };
  const doReset = async () => {
    try {
      const r = await post(`/admin/users/${reset.id}/reset-password`);
      setTemp({ email: reset.email, password: r.temporary_password });
      setReset(null);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!master) return <Spinner />;
  return (
    <>
      <PageHeader title="Users & Roles" subtitle="Role-based access is enforced by the server on every request." actions={<Button icon={Plus} onClick={() => setForm({ email: '', full_name: '', role: 'REGISTRAR' })}>New user</Button>} />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Search" placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="All roles" options={ROLES.map((r) => ({ value: r, label: label(r) }))} />
        </div>
      </Card>
      <ErrorBox error={error} />
      <Card bodyClass="p-0">
        {loading ? (
          <Spinner />
        ) : !data.users.length ? (
          <EmptyState icon={UsersIcon} title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <Badge tone="maroon">{label(u.role)}</Badge>
                    </td>
                    <td className="text-xs">{u.department_name || u.faculty_name || (u.role === 'REGISTRAR' ? 'All faculties' : '—')}</td>
                    <td>
                      {u.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}
                      {u.must_change_password ? <Badge tone="amber" className="ml-1">Temp. password</Badge> : null}
                    </td>
                    <td className="text-xs">{fmtDateTime(u.last_login_at) || 'Never'}</td>
                    <td className="whitespace-nowrap">
                      <Button size="sm" variant="secondary" onClick={() => setForm({ ...u })}>
                        Edit
                      </Button>{' '}
                      <Button size="sm" variant="ghost" icon={KeyRound} onClick={() => setReset(u)}>
                        Reset password
                      </Button>
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
        title={form?.id ? `Edit ${form.email}` : 'New user'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy}>
              {form?.id ? 'Save changes' : 'Create user'}
            </Button>
          </>
        }
      >
        {form && (
          <>
            <UserForm form={form} setForm={setForm} master={master} isNew={!form.id} />
            {!form.id && <p className="mt-4 text-xs text-slate-500">A temporary password is generated and emailed. The user must change it at first login.</p>}
            <div className="mt-3">
              <ErrorBox error={formError} />
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog open={!!reset} title="Reset password?" confirmText="Reset password" onCancel={() => setReset(null)} onConfirm={doReset}>
        A new temporary password will be generated for {reset?.email}. Their current sessions will be ended and they must change the password at next login.
      </ConfirmDialog>

      <Modal open={!!temp} onClose={() => setTemp(null)} title="Temporary password" size="sm" footer={<Button onClick={() => setTemp(null)}>Done</Button>}>
        <Alert type="warning">This password is shown only once. It has also been emailed to {temp?.email}.</Alert>
        <p className="mt-4 select-all rounded-md bg-slate-100 px-3 py-2 text-center font-mono text-lg">{temp?.password}</p>
      </Modal>
    </>
  );
}
