import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { get, put } from '../../lib/api';
import { Button, Card, ErrorBox, Input, PageHeader, Spinner, useToast } from '../../components/ui';

const FIELDS = [
  ['max_upload_mb', 'Maximum upload size per document (MB)', 'number'],
  ['referee_token_days', 'Referee link validity (days)', 'number'],
  ['session_hours', 'Session expiry (hours)', 'number'],
  ['institution_email', 'Institution email (application PDF footer)', 'email'],
  ['institution_phone', 'Institution telephone (application PDF footer)', 'text'],
  ['form_reference', 'Application form reference (PDF footer)', 'text'],
];

export default function SettingsAdmin() {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    get('/admin/settings').then((r) => setS(r.settings)).catch(setError);
  }, []);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await put('/admin/settings', s);
      toast('Settings saved.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  if (!s) return error ? <ErrorBox error={error} /> : <Spinner />;
  return (
    <>
      <PageHeader title="System Settings" subtitle="Changes are recorded in the audit log." />
      <form onSubmit={save}>
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(([k, l, type]) => (
              <Input key={k} label={l} type={type} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
            ))}
          </div>
          <div className="mt-4">
            <ErrorBox error={error} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" icon={Save} loading={busy}>
              Save settings
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
