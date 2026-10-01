import { Link } from 'react-router-dom';
import { Briefcase, Database, FileText, Mail, ScrollText, Settings, Users } from 'lucide-react';
import { get } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import { Card, PageHeader, Spinner, useLoad } from '../../components/ui';
import { StatTile } from '../registrar/Dashboard';

const LINKS = [
  ['/admin/users', Users, 'Users & roles', 'Create Registrar/SAR, HOD, Dean and Administrator accounts, reset passwords and deactivate users.'],
  ['/vacancies-admin', Briefcase, 'Vacancies', 'Create, publish, close and archive vacancies; grant late-application exceptions.'],
  ['/admin/master-data', Database, 'Master data', 'Faculties, departments, positions and the authoritative shortlist matrix.'],
  ['/admin/settings', Settings, 'System settings', 'Upload limits, referee link expiry, session duration and institutional details.'],
  ['/admin/audit', ScrollText, 'Audit log', 'Immutable history of decisions, sharing, downloads and administrative changes.'],
  ['/admin/outbox', Mail, 'Email outbox', 'All emails sent by the system and their delivery status.'],
];

export default function AdminDashboard() {
  const stats = useLoad(() => get('/review/stats'), []);
  const audit = useLoad(() => get('/admin/audit?page_size=8'), []);
  const s = stats.data || {};
  return (
    <>
      <PageHeader title="Administration" subtitle="System administration for the Application Management System." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Briefcase} label="Open vacancies" value={s.open_vacancies} to="/vacancies-admin" />
        <StatTile icon={FileText} label="Submitted applications" value={s.submitted} to="/registrar/applications" />
        <StatTile icon={FileText} label="Selected" value={s.selected} />
        <StatTile icon={Mail} label="Referee reports outstanding" value={s.referee_reports_outstanding} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {LINKS.map(([to, Icon, title, text]) => (
            <Link key={to} to={to} className="card p-5 transition hover:border-uop-300 hover:shadow-md">
              <Icon className="h-6 w-6 text-uop-700" aria-hidden />
              <p className="mt-2 font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </Link>
          ))}
        </div>
        <Card title="Recent activity" actions={<Link to="/admin/audit" className="text-sm text-uop-700 hover:underline">Audit log</Link>}>
          {audit.loading ? (
            <Spinner />
          ) : (
            <ul className="space-y-3 text-sm">
              {audit.data?.logs.map((l) => (
                <li key={l.id}>
                  <p className="font-medium text-slate-800">{l.action.replace(/_/g, ' ').toLowerCase()}</p>
                  <p className="text-xs text-slate-500">
                    {l.user_name || 'System / public'} · {fmtDateTime(l.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
