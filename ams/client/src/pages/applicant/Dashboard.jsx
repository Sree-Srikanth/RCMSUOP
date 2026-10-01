import { Link } from 'react-router-dom';
import { Bell, Briefcase, FileText, Pencil } from 'lucide-react';
import { get } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate, fmtDateTime } from '../../lib/format';
import { Alert, Card, EmptyState, PageHeader, Spinner, StatusBadge, useLoad } from '../../components/ui';
import { VacancyCards } from '../public/PublicHome';
import { RefereeStatusList } from './MyApplications';

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const apps = useLoad(() => get('/me/applications'), []);
  const vacancies = useLoad(() => get('/vacancies'), []);
  const notes = useLoad(() => get('/me/notifications'), []);
  const list = apps.data?.applications || [];
  const appliedVacancyIds = new Set(list.map((a) => a.vacancy_id));
  const open = (vacancies.data?.vacancies || []).filter((v) => !appliedVacancyIds.has(v.id));

  return (
    <>
      <PageHeader title={`Welcome, ${user.full_name}`} subtitle="Track your applications, complete outstanding requirements and apply for open vacancies." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="My applications" actions={<Link to="/applicant/applications" className="text-sm text-uop-700 hover:underline">View all</Link>} bodyClass="p-0">
            {apps.loading ? (
              <Spinner />
            ) : !list.length ? (
              <EmptyState icon={FileText} title="You have not started any applications">
                Choose a vacancy below to begin.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-slate-200">
                {list.map((a) => (
                  <li key={a.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{a.position_title}</p>
                        <p className="text-sm text-slate-600">{a.department_name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {a.reference_no ? <span className="font-mono">{a.reference_no}</span> : 'Not yet submitted'}
                          {a.submitted_at && ` · submitted ${fmtDate(a.submitted_at)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.status} />
                        {a.status === 'DRAFT' ? (
                          <Link to={`/applicant/applications/${a.id}/edit`} className="inline-flex items-center gap-1 text-sm font-medium text-uop-700 hover:underline">
                            <Pencil className="h-4 w-4" /> Continue
                          </Link>
                        ) : (
                          <Link to={`/applicant/applications/${a.id}`} className="text-sm font-medium text-uop-700 hover:underline">
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                    {a.status === 'DRAFT' && a.outstanding > 0 && (
                      <Alert type="warning" className="mt-2">
                        {a.outstanding} outstanding item(s){a.missing_documents.length > 0 && ` – documents required: ${a.missing_documents.join(', ')}`}. Closes {fmtDate(a.closing_date_local)}.
                      </Alert>
                    )}
                    {a.status !== 'DRAFT' && (
                      <div className="mt-2">
                        <RefereeStatusList status={a.referee_status} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={<span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Open vacancies</span>}>
            {vacancies.loading ? <Spinner /> : <VacancyCards vacancies={open} linkTo={(v) => `/vacancies/${v.id}`} />}
          </Card>
        </div>
        <Card title={<span className="flex items-center gap-2"><Bell className="h-4 w-4" /> Recent notifications</span>} actions={<Link to="/notifications" className="text-sm text-uop-700 hover:underline">All</Link>}>
          {notes.loading ? (
            <Spinner />
          ) : !notes.data?.notifications.length ? (
            <p className="text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.data.notifications.slice(0, 6).map((n) => (
                <li key={n.id} className="text-sm">
                  <p className={n.is_read ? 'text-slate-700' : 'font-semibold text-slate-900'}>{n.subject}</p>
                  <p className="text-xs text-slate-500">{fmtDateTime(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
