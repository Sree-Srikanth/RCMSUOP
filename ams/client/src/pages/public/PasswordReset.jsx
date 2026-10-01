import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicShell from './PublicShell';
import { post } from '../../lib/api';
import { Alert, Button, Card, Input } from '../../components/ui';
import { PASSWORD_HINT } from './Register';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await post('/auth/forgot-password', { email });
      setMsg(r.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <PublicShell narrow>
      <Card title="Reset your password">
        <form onSubmit={submit} className="space-y-4">
          {msg && <Alert type="success">{msg}</Alert>}
          {error && <Alert type="error">{error}</Alert>}
          <Input label="Registered email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={busy} className="w-full">
            Send reset link
          </Button>
          <Link to="/login" className="block text-center text-sm text-uop-700 hover:underline">
            Back to login
          </Link>
        </form>
      </Card>
    </PublicShell>
  );
}

export function ResetPassword() {
  const navigate = useNavigate();
  // The token is carried in the URL fragment so it is never sent to servers or logs.
  const [token] = useState(() => window.location.hash.slice(1));
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return setError('The passwords do not match.');
    setBusy(true);
    setError(null);
    try {
      await post('/auth/reset-password', { token, new_password: pw.next });
      window.history.replaceState(null, '', '/reset-password');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <PublicShell narrow>
      <Card title="Choose a new password">
        <form onSubmit={submit} className="space-y-4">
          {!token && <Alert type="error">This reset link is incomplete. Please use the link from your email.</Alert>}
          {error && <Alert type="error">{error}</Alert>}
          <Input label="New password" type="password" required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} hint={PASSWORD_HINT} autoComplete="new-password" />
          <Input label="Confirm new password" type="password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
          <Button type="submit" loading={busy} disabled={!token} className="w-full">
            Set password
          </Button>
        </form>
      </Card>
    </PublicShell>
  );
}
