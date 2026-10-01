import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PublicShell from './PublicShell';
import { useAuth } from '../../lib/auth';
import { post } from '../../lib/api';
import { useMaster } from '../../lib/master';
import { Alert, Button, Card, Input, Select } from '../../components/ui';

export const PASSWORD_HINT = 'At least 10 characters with upper- and lower-case letters, a digit and a symbol.';

export default function Register() {
  const { register } = useAuth();
  const master = useMaster();
  const navigate = useNavigate();
  const location = useLocation();
  const [f, setF] = useState({ title: '', surname: '', name_with_initials: '', nic: '', passport_no: '', date_of_birth: '', mobile: '', email: '', password: '', confirm: '' });
  const [noNic, setNoNic] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setError('The passwords do not match.');
    setBusy(true);
    setError(null);
    try {
      const { confirm, ...data } = f;
      if (noNic) data.nic = '';
      else data.passport_no = '';
      await register(data);
      const vacancyId = location.state?.vacancyId;
      if (vacancyId) {
        const r = await post('/applications', { vacancy_id: vacancyId });
        return navigate(`/applicant/applications/${r.id}/edit`, { replace: true });
      }
      navigate('/applicant', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl">
        <Card title="Create an applicant account">
          <form onSubmit={submit} className="space-y-4" noValidate>
            {error && <Alert type="error">{error}</Alert>}
            <div className="grid gap-4 sm:grid-cols-4">
              <Select label="Title" value={f.title} onChange={set('title')} options={(master?.options.titles || []).map((t) => ({ value: t, label: `${t}.` }))} />
              <Input className="sm:col-span-3" label="Surname" required value={f.surname} onChange={set('surname')} autoComplete="family-name" />
            </div>
            <Input label="Name with initials" required value={f.name_with_initials} onChange={set('name_with_initials')} hint="e.g. A.B.C. Perera" />
            <div className="grid gap-4 sm:grid-cols-2">
              {!noNic ? (
                <Input label="NIC number" required value={f.nic} onChange={set('nic')} hint="9 digits + V/X, or 12 digits" />
              ) : (
                <Input label="Passport number" required value={f.passport_no} onChange={set('passport_no')} />
              )}
              <Input label="Date of birth" type="date" value={f.date_of_birth} onChange={set('date_of_birth')} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={noNic} onChange={(e) => setNoNic(e.target.checked)} className="h-4 w-4 rounded" /> I do not have a Sri Lankan NIC (use passport)
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" required value={f.email} onChange={set('email')} autoComplete="email" hint="Used to log in and as your application email." />
              <Input label="Mobile number" required value={f.mobile} onChange={set('mobile')} autoComplete="tel" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Password" type="password" required value={f.password} onChange={set('password')} autoComplete="new-password" hint={PASSWORD_HINT} />
              <Input label="Confirm password" type="password" required value={f.confirm} onChange={set('confirm')} autoComplete="new-password" />
            </div>
            <Button type="submit" loading={busy} className="w-full">
              Create account
            </Button>
            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-uop-700 hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </PublicShell>
  );
}
