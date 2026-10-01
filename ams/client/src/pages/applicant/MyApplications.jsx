import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, FileText, Mail, Pencil, Trash2 } from 'lucide-react';
import { get, del, post, download } from '../../lib/api';
import { fmtDate, fmtDateTime } from '../../lib/format';
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, Spinner, StatusBadge, useLoad, useToast } from '../../components/ui';

export function RefereeStatusList({ status }) {
  if (!status?.length) return <span className="text-xs text-slate-400">—</span>;
  return (
    <ul className="space-y-0.5">
      {status.map((r) => (
        <li key={r.referee_id} className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-600">{r.name}:</span>
          {r.status === 'SUBMITTED' ? <Badge tone="green">Report received</Badge> : <StatusBadge status={r.status} />}
        </li>
      ))}
    </ul>
  );
}

export function ApplicationActions({ a, onEmail }) {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Link to={`/applicant/applications/${a.id}`} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50">
        <Eye className="h-3.5 w-3.5" /> View
      </Link>
      <Button size="sm" variant="secondary" icon={Download} onClick={() => download(`/applications/${a.id}/pdf`).catch((e) => toast(e.message, 'error'))}>
        Download
      </Button>
      <Button size="sm" variant="secondary" icon={Mail} onClick={() => onEmail(a)}>
        Email
      </Button>
    </div>
  );
}

export function useEmailApplication() {
  const toast = useToast();
  return async (a) => {
    try {
      const r = await post(`/applications/${a.id}/email`);
      toast(`A copy of application ${a.reference_no} has been emailed to ${r.email}.`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };
}

export default function MyApplications() {
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(() => get('/me/applications'), []);
  const [confirm, setConfirm] = useState(null);
  const email = useEmailApplication();
  const apps = data?.applications || [];
  const submitted = apps.filter((a) => a.status !== 'DRAFT');
  const drafts = apps.filter((a) => a.status === 'DRAFT');

  const discard = async () => {
    try {
      await del(`/applications/${confirm.id}`);
      toast('Draft discarded.');
      setConfirm(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHeader title="My Applications" subtitle="Submitted applications, draft applications and referee report status." />
      <ErrorBox error={error} />
      {loading && <Spinner />}
      {!loading && !apps.length && (
        <Card>
          <EmptyState icon={FileText} title="No applications yet" action={<Link to="/applicant/vacancies" className="font-medium text-uop-700 hover:underline">Browse open vacancies</Link>}>
            When you start an application it will appear here.
          </EmptyState>
        </Card>
      )}

      {drafts.length > 0 && (
        <Card title="Draft applications" className="mb-6" bodyClass="p-0">
          <ul className="divide-y divide-slate-200">
            {drafts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-slate-900">{a.position_title}</p>
                  <p className="text-sm text-slate-600">
                    {a.department_name}, {a.faculty_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Closes {fmtDate(a.closing_date_local)} · Last saved {fmtDateTime(a.updated_at)}</p>
                  {a.outstanding > 0 ? (
                    <Alert type="warning" className="mt-2">
                      {a.outstanding} item(s) outstanding
                      {a.missing_documents.length > 0 && <> · Documents still required: {a.missing_documents.join(', ')}</>}
                    </Alert>
                  ) : (
                    <Alert type="success" className="mt-2">Ready to submit.</Alert>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link to={`/applicant/applications/${a.id}/edit`} className="inline-flex items-center gap-1.5 rounded-md bg-uop-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-uop-800">
                    <Pencil className="h-4 w-4" /> Continue
                  </Link>
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirm(a)}>
                    Discard
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {submitted.length > 0 && (
        <Card title="Submitted applications" bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th scope="col">Reference No.</th>
                  <th scope="col">Vacancy</th>
                  <th scope="col">Department</th>
                  <th scope="col">Status</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Referee reports</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submitted.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs font-semibold text-uop-800">{a.reference_no}</td>
                    <td>{a.position_title}</td>
                    <td>{a.department_name}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>{fmtDate(a.submitted_at)}</td>
                    <td>
                      <RefereeStatusList status={a.referee_status} />
                    </td>
                    <td>
                      <ApplicationActions a={a} onEmail={email} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {submitted.some((a) => a.hard_copy_instructions) && (
            <div className="space-y-2 border-t border-slate-200 p-4">
              {submitted
                .filter((a) => a.hard_copy_instructions)
                .map((a) => (
                  <Alert key={a.id} type="info" title={`Hard copy required – ${a.reference_no}`}>
                    {a.hard_copy_instructions}
                  </Alert>
                ))}
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog open={!!confirm} title="Discard draft?" confirmText="Discard draft" variant="danger" onCancel={() => setConfirm(null)} onConfirm={discard}>
        The draft application for {confirm?.position_title} and its uploaded documents will be deleted. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}

