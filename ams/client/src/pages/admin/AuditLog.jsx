import { Fragment, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { get, qs } from '../../lib/api';
import { fmtDateTime, label } from '../../lib/format';
import { Badge, Card, EmptyState, ErrorBox, Input, PageHeader, Pagination, Select, Spinner, useLoad } from '../../components/ui';

function Values({ json }) {
  if (!json) return null;
  let obj;
  try {
    obj = JSON.parse(json);
  } catch {
    return <span>{json}</span>;
  }
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-xs">
      {Object.entries(obj).map(([k, v]) => (
        <Fragment key={k}>
          <dt className="font-medium text-slate-500">{k}</dt>
          <dd className="break-all text-slate-800">{typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '—')}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

export default function AuditLog() {
  const [f, setF] = useState({ action: '', entity_type: '', entity_id: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const query = qs({ ...f, page, page_size: 50 });
  const { data, loading, error } = useLoad(() => get(`/admin/audit${query}`), [query]);
  const set = (k) => (e) => {
    setPage(1);
    setF({ ...f, [k]: e.target.value });
  };

  return (
    <>
      <PageHeader title="Audit Log" subtitle="Immutable record of submissions, shortlist decisions, sharing, document access, interviews and administrative changes." />
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-5">
          <Select label="Action" value={f.action} onChange={set('action')} placeholder="All actions" options={(data?.actions || []).map((a) => ({ value: a, label: a.replace(/_/g, ' ').toLowerCase() }))} />
          <Select label="Entity" value={f.entity_type} onChange={set('entity_type')} placeholder="Any entity"
            options={['application', 'vacancy', 'user', 'shortlist_share', 'interview', 'appointment', 'report', 'settings', 'faculty', 'department'].map((x) => ({ value: x, label: x }))} />
          <Input label="Entity ID" value={f.entity_id} onChange={set('entity_id')} />
          <Input label="From" type="date" value={f.from} onChange={set('from')} />
          <Input label="To" type="date" value={f.to} onChange={set('to')} />
        </div>
      </Card>
      <ErrorBox error={error} />
      <Card bodyClass="p-0">
        {loading && !data ? (
          <Spinner />
        ) : !data?.logs.length ? (
          <EmptyState icon={ScrollText} title="No audit entries match" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Previous values</th>
                    <th>New values</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((l) => (
                    <tr key={l.id}>
                      <td className="whitespace-nowrap text-xs">{fmtDateTime(l.created_at)}</td>
                      <td className="text-xs">
                        {l.user_name || <span className="text-slate-400">Public / system</span>}
                        {l.user_role && <p className="text-slate-500">{label(l.user_role)}</p>}
                      </td>
                      <td>
                        <Badge tone={/DECISION|SHARED/.test(l.action) ? 'maroon' : /FAILED|DELETED/.test(l.action) ? 'red' : 'gray'}>{l.action}</Badge>
                      </td>
                      <td className="text-xs">
                        {l.entity_type} {l.entity_id && <span className="font-mono">#{l.entity_id}</span>}
                      </td>
                      <td className="max-w-xs">
                        <Values json={l.old_values} />
                      </td>
                      <td className="max-w-xs">
                        <Values json={l.new_values} />
                      </td>
                      <td className="font-mono text-xs text-slate-500">{l.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
