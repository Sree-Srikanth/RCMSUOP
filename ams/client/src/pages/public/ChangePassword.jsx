import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import PublicShell from './PublicShell';
import { post } from '../../lib/api';
import { useAuth, HOME_BY_ROLE } from '../../lib/auth';
import { Alert, Button, Card, Input, useToast } from '../../components/ui';
import { PASSWORD_HINT } from './Register';

export default function ChangePassword() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const forced = user?.must_change_password;

  const submit = async (e) => {
    e.preventDefault();
    if (f.next !== f.confirm) return setError('The new passwords do not match.');
    setBusy(true);
    setError(null);
    try {
      const r = await post('/auth/change-password', { current_password: f.current, new_password: f.next });
      setUser(r.user);
      toast('Your password has been changed.');
      navigate(HOME_BY_ROLE[r.user.role], { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicShell narrow>
      <Card title={<span className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change password</span>}>
        <form onSubmit={submit} className="space-y-4">
          {forced && (
            <Alert type="warning" title="Password change required">
              You signed in with a temporary password. Please choose a new password to continue.
            </Alert>
          )}
          {error && <Alert type="error">{error}</Alert>}
          <Input label={forced ? 'Temporary password' : 'Current password'} type="password" required value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoComplete="current-password" />
          <Input label="New password" type="password" required value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} hint={PASSWORD_HINT} autoComplete="new-password" />
          <Input label="Confirm new password" type="password" required value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} autoComplete="new-password" />
          <div className="flex gap-2">
            <Button type="submit" loading={busy} className="flex-1">
              Change password
            </Button>
            {forced ? (
              <Button variant="secondary" onClick={logout}>
                Log out
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    </PublicShell>
  );
}
