import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import PublicShell from './PublicShell';
import { get, post, download } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate, fmtSize } from '../../lib/format';
import { Alert, Button, Card, ErrorBox, KeyValue, Spinner, useLoad, useToast } from '../../components/ui';

export function VacancyInfo({ v }) {
  const toast = useToast();
  return (
    <div className="space-y-5">
      <KeyValue
        items={[
          ['Position', v.position_title],
          ['Faculty', v.faculty_name],
          ['Department', v.department_name],
          ['Discipline(s)', v.discipline],
          ['Advertised on', fmtDate(v.advertised_on)],
          ['Closing date', `${fmtDate(v.closing_date_local)} (11:59 p.m. Sri Lanka time)`],
          v.advert_reference && ['Advertisement reference', v.advert_reference],
        ]}
      />
      {v.requirements && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Requirements</h3>
          <p className="whitespace-pre-line text-sm text-slate-700">{v.requirements}</p>
        </div>
      )}
      {v.hard_copy_instructions && (
        <Alert type="warning" title="Hard copy submission">
          {v.hard_copy_instructions}
        </Alert>
      )}
      {v.documents?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Advertisement documents</h3>
          <ul className="space-y-1">
            {v.documents.map((d) => (
              <li key={d.id}>
                <button type="button" className="inline-flex items-center gap-2 text-sm text-uop-700 hover:underline" onClick={() => download(`/vacancies/${v.id}/documents/${d.id}`, d.original_name).catch((e) => toast(e.message, 'error'))}>
                  <FileText className="h-4 w-4" aria-hidden /> {d.original_name} <span className="text-slate-400">({fmtSize(d.size_bytes)})</span>
                  <Download className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function useApply() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const apply = async (vacancyId) => {
    if (!user) return navigate('/register', { state: { vacancyId } });
    setBusy(true);
    try {
      const r = await post('/applications', { vacancy_id: vacancyId });
      if (r.existing) toast('You already have an application for this vacancy – opening it.', 'info');
      navigate(`/applicant/applications/${r.id}/edit`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return { apply, busy };
}

export default function VacancyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error } = useLoad(() => get(`/vacancies/${id}`), [id]);
  const { apply, busy } = useApply();
  const v = data?.vacancy;

  return (
    <PublicShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-uop-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All vacancies
      </Link>
      <ErrorBox error={error} />
      {loading && <Spinner />}
      {v && (
        <Card
          title={`${v.position_title} – ${v.department_name}`}
          actions={
            v.is_open && (!user || user.role === 'APPLICANT') ? (
              <Button onClick={() => apply(v.id)} loading={busy}>
                {user ? 'Apply now' : 'Register to apply'}
              </Button>
            ) : null
          }
        >
          <VacancyInfo v={v} />
          {!v.is_open && <Alert type="info" className="mt-4">This vacancy is no longer accepting applications.</Alert>}
          {!user && v.is_open && (
            <p className="mt-4 text-sm text-slate-600">
              Already registered? <Link to="/login" state={{ from: `/vacancies/${v.id}` }} className="font-medium text-uop-700 hover:underline">Log in</Link> to apply.
            </p>
          )}
        </Card>
      )}
    </PublicShell>
  );
}
