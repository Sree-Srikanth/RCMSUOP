import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import PublicShell from './PublicShell';
import { useAuth, HOME_BY_ROLE } from '../../lib/auth';
import { Alert, Button, Card, Input } from '../../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(form.email, form.password);
      if (user.must_change_password) return navigate('/change-password', { replace: true });
      const from = location.state?.from;
      navigate(from && from !== '/login' ? from : HOME_BY_ROLE[user.role], { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicShell narrow>
      <Card title="Log in">
        <form onSubmit={submit} className="space-y-4" noValidate>
          {location.state?.expired && <Alert type="info">Your session has ended. Please log in again.</Alert>}
          {error && <Alert type="error">{error}</Alert>}
          <Input label="Email" type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Button type="submit" className="w-full" loading={busy} icon={LogIn}>
            Log in
          </Button>
          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="text-uop-700 hover:underline">
              Forgot password?
            </Link>
            <Link to="/register" className="text-uop-700 hover:underline">
              Create an account
            </Link>
          </div>
        </form>
      </Card>
    </PublicShell>
  );
}
