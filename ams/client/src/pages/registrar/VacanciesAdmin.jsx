import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus } from 'lucide-react';
import { get, post } from '../../lib/api';
import { fmtDate, label } from '../../lib/format';
import { Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, Select, Spinner, StatusBadge, useLoad, useToast } from '../../components/ui';

const ACTIONS = {
  DRAFT: [['PUBLISHED', 'Publish'], ['ARCHIVED', 'Archive']],
  PUBLISHED: [['CLOSED', 'Close']],
  CLOSED: [['PUBLISHED', 'Re-open'], ['ARCHIVED', 'Archive']],
  ARCHIVED: [],
};

export default function VacanciesAdmin() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useLoad(() => get(`/vacancies${status ? `?status=${status}` : ''}`), [status]);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = async () => {
    setBusy(true);
    try {
      await post(`/vacancies/${confirm.v.id}/status`, { status: confirm.to });
      toast(`Vacancy ${label(confirm.to).toLowerCase()}.`);
      setConfirm(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Vacancies"
        subtitle="Create, publish, close and archive recruitment vacancies. The position determines the shortlist rules."
        actions={
          <Link to="/vacancies-admin/new" className="inline-flex items-center gap-2 rounded-md bg-uop-700 px-4 py-2 text-sm font-medium text-white hover:bg-uop-800">
            <Plus className="h-4 w-4" /> New vacancy
          </Link>
        }
      />
      <div className="mb-4 max-w-xs">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].map((s) => ({ value: s, label: label(s) }))} />
      </div>
      <ErrorBox error={error} />
      <Card bodyClass="p-0">
        {loading ? (
          <Spinner />
        ) : !data.vacancies.length ? (
          <EmptyState icon={Briefcase} title="No vacancies" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Department / Faculty</th>
                  <th>Advertised</th>
                  <th>Closes</th>
                  <th>Status</th>
                  <th className="text-right">Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.vacancies.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link to={`/vacancies-admin/${v.id}`} className="font-medium text-uop-800 hover:underline">
                        {v.position_title}
                      </Link>
                      {v.discipline && <p className="text-xs text-slate-500">{v.discipline}</p>}
                    </td>
                    <td>
                      {v.department_name}
                      <p className="text-xs text-slate-500">{v.faculty_name}</p>
                    </td>
                    <td>{fmtDate(v.advertised_on)}</td>
                    <td>
                      {fmtDate(v.closing_date_local)}
                      {v.late_exception_until && <p className="text-xs text-amber-700">Late exception to {fmtDate(v.late_exception_until_local)}</p>}
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                      {v.status === 'PUBLISHED' && !v.is_open && <p className="text-xs text-slate-500">past closing date</p>}
                    </td>
                    <td className="text-right">
                      {v.application_count}
                      {v.draft_count > 0 && <p className="text-xs text-slate-400">{v.draft_count} draft</p>}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex gap-1">
                        <Link to={`/vacancies-admin/${v.id}`} className="rounded px-2 py-1 text-xs font-medium text-uop-700 hover:bg-uop-50">
                          Edit
                        </Link>
                        {ACTIONS[v.status].map(([to, text]) => (
                          <Button key={to} size="sm" variant={to === 'PUBLISHED' ? 'success' : 'secondary'} onClick={() => setConfirm({ v, to, text })}>
                            {text}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <ConfirmDialog open={!!confirm} title={`${confirm?.text} vacancy?`} confirmText={confirm?.text} onCancel={() => setConfirm(null)} onConfirm={change} loading={busy}>
        {confirm && (
          <>
            {confirm.v.position_title} – {confirm.v.department_name}.
            {confirm.to === 'ARCHIVED' && <p className="mt-2 text-amber-800">Archiving closes processing for all its applications and cannot be undone.</p>}
            {confirm.to === 'PUBLISHED' && <p className="mt-2">Applicants will be able to apply until the closing date.</p>}
          </>
        )}
      </ConfirmDialog>
    </>
  );
}
