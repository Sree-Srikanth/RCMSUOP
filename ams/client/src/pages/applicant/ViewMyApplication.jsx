import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Mail } from 'lucide-react';
import { get, download } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import ApplicationView from '../../components/ApplicationView';
import { Alert, Button, Card, ErrorBox, KeyValue, PageHeader, Spinner, StatusBadge, useLoad, useToast } from '../../components/ui';
import { RefereeStatusList, useEmailApplication } from './MyApplications';

export default function ViewMyApplication() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const email = useEmailApplication();
  const { data, loading, error } = useLoad(() => get(`/applications/${id}`), [id]);
  const a = data?.application;

  return (
    <>
      <PageHeader
        back={
          <Link to="/applicant/applications" className="mb-2 inline-flex items-center gap-1 text-sm text-uop-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> My applications
          </Link>
        }
        title={a ? `${a.position_title}` : 'Application'}
        subtitle={a ? `${a.department_name}, ${a.faculty_name}` : ''}
        actions={
          a &&
          a.status !== 'DRAFT' && (
            <>
              <Button variant="secondary" icon={Download} onClick={() => download(`/applications/${id}/pdf`).catch((e) => toast(e.message, 'error'))}>
                Download application
              </Button>
              <Button variant="secondary" icon={Mail} onClick={() => email(a)}>
                Email application
              </Button>
            </>
          )
        }
      />
      <ErrorBox error={error} />
      {loading && <Spinner />}
      {a && (
        <div className="space-y-4">
          {location.state?.justSubmitted && (
            <Alert type="success" title="Application submitted successfully">
              Your application reference number is <strong className="font-mono">{location.state.justSubmitted}</strong>. A confirmation email with a copy of your application has
              been sent, and your referees have been asked for their reports.
            </Alert>
          )}
          {a.status === 'DRAFT' && (
            <Alert type="info">
              This application has not been submitted. <Link className="font-medium underline" to={`/applicant/applications/${id}/edit`}>Continue editing</Link>.
            </Alert>
          )}
          <Card title="Application summary">
            <KeyValue
              cols={3}
              items={[
                ['Reference number', a.reference_no ? <span className="font-mono font-semibold text-uop-800">{a.reference_no}</span> : 'Assigned on submission'],
                ['Status', <StatusBadge key="s" status={a.status} />],
                ['Submitted on', fmtDate(a.submitted_at)],
                ['Advertised on', fmtDate(a.advertised_on)],
                ['Closing date', fmtDate(a.closing_date)],
                ['Referee reports', <RefereeStatusList key="r" status={a.referee_status} />],
              ]}
            />
            {a.hard_copy_instructions && a.status !== 'DRAFT' && (
              <Alert type="warning" className="mt-4" title="Hard copy submission">
                {a.hard_copy_instructions}
              </Alert>
            )}
          </Card>
          <ApplicationView app={a} />
        </div>
      )}
    </>
  );
}
