import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, KeyRound } from 'lucide-react';
import { get, put } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useMaster } from '../../lib/master';
import { Alert, Button, Card, Input, PageHeader, Select, Spinner, useToast } from '../../components/ui';

export default function Profile() {
  const master = useMaster();
  const { refresh } = useAuth();
  const toast = useToast();
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get('/me/profile').then((r) => setP(r.profile)).catch(setError);
  }, []);

  if (!p || !master) return error ? <Alert type="error">{error.message}</Alert> : <Spinner />;
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value || null });
  const districts = master.districts.filter((d) => String(d.province_id) === String(p.province_id));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await put('/me/profile', p);
      setP(r.profile);
      await refresh();
      toast('Profile saved.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="These details pre-fill new applications. Submitted applications keep the details they were submitted with."
        actions={
          <Link to="/change-password" className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50">
            <KeyRound className="h-4 w-4" /> Change password
          </Link>
        }
      />
      <form onSubmit={save} className="space-y-6">
        {error && <Alert type="error">{error.message}</Alert>}
        <Card title="Identity">
          <div className="grid gap-4 sm:grid-cols-6">
            <Select className="sm:col-span-1" label="Title" value={p.title} onChange={set('title')} options={master.options.titles.map((t) => ({ value: t, label: `${t}.` }))} />
            <Input className="sm:col-span-5" label="Name in full" value={p.name_in_full} onChange={set('name_in_full')} />
            <Input className="sm:col-span-3" label="Surname" required value={p.surname} onChange={set('surname')} />
            <Input className="sm:col-span-3" label="Name with initials" required value={p.name_with_initials} onChange={set('name_with_initials')} />
            <Input className="sm:col-span-2" label="NIC No." value={p.nic} onChange={set('nic')} />
            <Input className="sm:col-span-2" label="Passport No." value={p.passport_no} onChange={set('passport_no')} />
            <Input className="sm:col-span-2" label="Date of birth" type="date" value={p.date_of_birth} onChange={set('date_of_birth')} />
          </div>
        </Card>
        <Card title="Contact">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Registered email" value={p.email} disabled hint="Contact the University to change your login email." />
            <Input label="Mobile" value={p.mobile} onChange={set('mobile')} />
            <Input label="Residence telephone" value={p.phone_residence} onChange={set('phone_residence')} />
            <Input label="Office telephone" value={p.phone_office} onChange={set('phone_office')} />
          </div>
        </Card>
        <Card title="Address">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input className="sm:col-span-2" label="Address line 1" value={p.address_line1} onChange={set('address_line1')} />
            <Input className="sm:col-span-2" label="Address line 2" value={p.address_line2} onChange={set('address_line2')} />
            <Input label="City / town" value={p.city} onChange={set('city')} />
            <Input label="Postal code" value={p.postal_code} onChange={set('postal_code')} />
            <Select label="Province" value={p.province_id} onChange={(e) => setP({ ...p, province_id: e.target.value ? Number(e.target.value) : null, district_id: null })} options={master.provinces.map((x) => ({ value: x.id, label: x.name }))} />
            <Select
              label="District"
              value={p.district_id}
              disabled={!p.province_id}
              placeholder={p.province_id ? 'Select district…' : 'Select the province first'}
              onChange={(e) => setP({ ...p, district_id: e.target.value ? Number(e.target.value) : null })}
              options={districts.map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" icon={Save} loading={busy}>
            Save profile
          </Button>
        </div>
      </form>
    </>
  );
}
