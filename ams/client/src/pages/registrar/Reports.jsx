import { useState } from 'react';
import { FileSpreadsheet, FileText, ScrollText } from 'lucide-react';
import { download, qs } from '../../lib/api';
import { useMaster } from '../../lib/master';
import { Alert, Button, Card, PageHeader, Select, useToast } from '../../components/ui';
import { useStaffVacancies } from './ApplicationsList';

export default function Reports() {
  const master = useMaster();
  const toast = useToast();
  const vacancies = useStaffVacancies();
  const [by, setBy] = useState('vacancy');
  const [vacancyId, setVacancyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [scope, setScope] = useState('selected');
  const [busy, setBusy] = useState(null);

  const params = by === 'vacancy' ? { vacancy_id: vacancyId, scope } : { department_id: departmentId, scope };
  const ready = by === 'vacancy' ? !!vacancyId : !!departmentId;
  const run = async (kind, format) => {
    setBusy(`${kind}-${format}`);
    try {
      await download(`/reports/${kind}${qs({ ...params, format })}`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const vacancyDepartments = new Set((vacancies.data?.vacancies || []).map((v) => v.department_id));
  const departments = (master?.departments || []).filter((d) => vacancyDepartments.has(d.id));

  return (
    <>
      <PageHeader title="Reports & Official Schedule" subtitle="Generate vacancy or department reports as CSV (UTF-8) or landscape PDF, and the official University schedule." />
      <Card title="Report scope" className="mb-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Select label="Generate by" placeholder={false} value={by} onChange={(e) => setBy(e.target.value)} options={[{ value: 'vacancy', label: 'Vacancy' }, { value: 'department', label: 'Department' }]} />
          {by === 'vacancy' ? (
            <Select className="md:col-span-2" label="Vacancy" required value={vacancyId} onChange={(e) => setVacancyId(e.target.value)}
              options={(vacancies.data?.vacancies || []).map((v) => ({ value: String(v.id), label: `${v.position_title} – ${v.department_name} (closes ${v.closing_date_local})` }))} />
          ) : (
            <Select className="md:col-span-2" label="Department" required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
              options={departments.map((d) => ({ value: String(d.id), label: d.name }))} />
          )}
          <Select label="Candidates" placeholder={false} value={scope} onChange={(e) => setScope(e.target.value)}
            options={[{ value: 'selected', label: 'Shortlisted / selected only' }, { value: 'all', label: 'All submitted applicants' }]} />
        </div>
      </Card>

      {!ready && <Alert type="info" className="mb-6">Select a {by} to enable report generation.</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> Candidate report</span>}>
          <p className="mb-4 text-sm text-slate-600">
            Reference, applicant name, mobile, email, address, university education, postgraduate qualifications, previous employment, numbers of books / abstracts / journals
            and referees.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={FileSpreadsheet} disabled={!ready} loading={busy === 'candidates-csv'} onClick={() => run('candidates', 'csv')}>
              Download CSV
            </Button>
            <Button variant="secondary" icon={FileText} disabled={!ready} loading={busy === 'candidates-pdf'} onClick={() => run('candidates', 'pdf')}>
              Download PDF (landscape)
            </Button>
          </div>
        </Card>
        <Card title={<span className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> Official University schedule</span>}>
          <p className="mb-4 text-sm text-slate-600">
            Reproduces the University schedule format: post, department, advertised / closing dates, candidate details, qualifications, medals/prizes, scholarships &amp;
            publications, extra-curricular activities, experience, PC / RR / TR and remarks, with signature lines for the Deputy Registrar, HOD and Dean.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button icon={FileText} disabled={!ready} loading={busy === 'schedule-pdf'} onClick={() => run('schedule', 'pdf')}>
              Download schedule (PDF)
            </Button>
            <Button variant="secondary" icon={FileSpreadsheet} disabled={!ready} loading={busy === 'schedule-csv'} onClick={() => run('schedule', 'csv')}>
              Schedule CSV
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">PC, RR, TR and remarks are maintained from each application’s review page.</p>
        </Card>
      </div>
    </>
  );
}
