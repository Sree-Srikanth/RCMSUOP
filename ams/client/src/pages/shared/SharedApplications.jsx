import { Link } from 'react-router-dom';
import { Download, FileSpreadsheet, Share2 } from 'lucide-react';
import { get, download } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate, fmtDateTime } from '../../lib/format';
import { Button, Card, DecisionBadge, EmptyState, ErrorBox, PageHeader, Spinner, useLoad, useToast } from '../../components/ui';

export default function SharedApplications() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error } = useLoad(() => get('/shared/applications'), []);
  const unit = user.role === 'HOD' ? user.department_name : user.faculty_name;

  return (
    <>
      <PageHeader
        title="Shared Applications"
        subtitle={`Selected candidates shared with you by the Registrar/SAR${unit ? ` – ${unit}` : ''}.`}
        actions={
          <>
            <Button variant="secondary" icon={FileSpreadsheet} onClick={() => download('/shared/export.csv').catch((e) => toast(e.message, 'error'))}>
              Shortlist CSV
            </Button>
            <Button variant="secondary" icon={Download} onClick={() => download('/shared/export.pdf').catch((e) => toast(e.message, 'error'))}>
              Shortlist PDF
            </Button>
          </>
        }
      />
      <ErrorBox error={error} />
      <Card bodyClass="p-0">
        {loading ? (
          <Spinner />
        ) : !data.applications.length ? (
          <EmptyState icon={Share2} title="No applications have been shared with you yet">
            When the Registrar/SAR shares selected candidates for your {user.role === 'HOD' ? 'department' : 'faculty'}, they will appear here.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Applicant</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Shortlist</th>
                  <th>Submitted</th>
                  <th>Shared</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.applications.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs font-semibold text-uop-800">{a.reference_no}</td>
                    <td className="font-medium">{a.applicant_name}</td>
                    <td>{a.position_title}</td>
                    <td>{a.department_name}</td>
                    <td>
                      <DecisionBadge decision={a.decision_code} category={a.category_code} />
                    </td>
                    <td>{fmtDate(a.submitted_at)}</td>
                    <td className="text-xs">{fmtDateTime(a.shared_at)}</td>
                    <td className="whitespace-nowrap">
                      <Link to={`/shared/applications/${a.id}`} className="mr-3 text-sm font-medium text-uop-700 hover:underline">
                        View
                      </Link>
                      <button type="button" className="text-sm text-uop-700 hover:underline" onClick={() => download(`/applications/${a.id}/pdf`).catch((e) => toast(e.message, 'error'))}>
                        PDF
                      </button>
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
