import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock, FileText, Hourglass, Mail, XCircle, Briefcase } from 'lucide-react';
import { get } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate } from '../../lib/format';
import { Card, ErrorBox, PageHeader, Spinner, StatusBadge, useLoad } from '../../components/ui';

export function StatTile({ icon: Icon, label: text, value, to, tone = 'text-uop-700' }) {
  const body = (
    <div className="card flex items-center gap-4 p-4 transition hover:shadow-md">
      <span className={`rounded-lg bg-slate-50 p-2.5 ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value ?? '–'}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{text}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function RegistrarDashboard() {
  const { user } = useAuth();
  const stats = useLoad(() => get('/review/stats'), []);
  const vac = useLoad(() => get('/vacancies?status=PUBLISHED'), []);
  const s = stats.data || {};
  return (
    <>
      <PageHeader title="Recruitment Dashboard" subtitle={user.faculty_name ? `Scope: ${user.faculty_name}` : 'All faculties'} />
      <ErrorBox error={stats.error} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={FileText} label="Submitted applications" value={s.submitted} to="/registrar/applications" />
        <StatTile icon={Hourglass} label="Awaiting decision" value={s.undecided} to="/registrar/applications?decision=NONE" tone="text-amber-600" />
        <StatTile icon={CheckCircle2} label="Selected" value={s.selected} to="/registrar/shortlist" tone="text-emerald-600" />
        <StatTile icon={Clock} label="Pending" value={s.pending} to="/registrar/applications?decision=PENDING" tone="text-amber-600" />
        <StatTile icon={XCircle} label="Rejected" value={s.rejected} to="/registrar/applications?decision=REJECTED" tone="text-red-600" />
        <StatTile icon={Briefcase} label="Open vacancies" value={s.open_vacancies} to="/vacancies-admin" />
        <StatTile icon={CalendarClock} label="Upcoming interviews" value={s.upcoming_interviews} to="/registrar/interviews" />
        <StatTile icon={Mail} label="Referee reports outstanding" value={s.referee_reports_outstanding} />
      </div>
      <Card title="Published vacancies" className="mt-6" bodyClass="p-0">
        {vac.loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Closing date</th>
                  <th>Status</th>
                  <th className="text-right">Applications</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(vac.data?.vacancies || []).map((v) => (
                  <tr key={v.id}>
                    <td className="font-medium">{v.position_title}</td>
                    <td>{v.department_name}</td>
                    <td>{fmtDate(v.closing_date_local)}</td>
                    <td>
                      <StatusBadge status={v.status} /> {v.is_open ? <span className="text-xs text-emerald-700">accepting</span> : <span className="text-xs text-slate-500">closed for applications</span>}
                    </td>
                    <td className="text-right font-semibold">{v.application_count}</td>
                    <td className="text-right">
                      <Link to={`/registrar/applications?vacancy_id=${v.id}`} className="text-sm text-uop-700 hover:underline">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
