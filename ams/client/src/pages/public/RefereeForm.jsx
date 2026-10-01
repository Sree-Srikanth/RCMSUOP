import { useEffect, useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import PublicShell from './PublicShell';
import { post } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import { Alert, Button, Card, Checkbox, Input, KeyValue, Select, Spinner, TextArea } from '../../components/ui';

const RATING_LABELS = { EXCELLENT: 'Excellent', VERY_GOOD: 'Very good', GOOD: 'Good', AVERAGE: 'Average', POOR: 'Poor', NOT_KNOWN: 'Unable to assess' };
const RECOMMENDATIONS = [
  ['HIGHLY_RECOMMENDED', 'Highly recommended'],
  ['RECOMMENDED', 'Recommended'],
  ['RECOMMENDED_WITH_RESERVATIONS', 'Recommended with reservations'],
  ['NOT_RECOMMENDED', 'Not recommended'],
];

/**
 * Confidential referee report. The detailed questions follow a generic
 * academic referee template until the University's official referee form
 * is supplied; the fields are stored as structured data so they can be
 * replaced without changing the workflow.
 */
export default function RefereeForm() {
  const [token] = useState(() => window.location.hash.slice(1));
  const [state, setState] = useState({ loading: true });
  const [f, setF] = useState({ referee_name: '', referee_designation: '', relationship: '', known_since: '', strengths: '', weaknesses: '', comments: '', recommendation: '', ratings: {}, non_related_confirmed: false });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Remove the token from the address bar / history once read.
    window.history.replaceState(null, '', '/referee');
    post('/referee/lookup', { token })
      .then((r) => {
        setState({ loading: false, ...r });
        setF((x) => ({ ...x, referee_name: r.context.referee_name || '', referee_designation: r.context.referee_designation || '' }));
      })
      .catch((e) => setState({ loading: false, error: e.message }));
  }, [token]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post('/referee/submit', { token, ...f });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl">
        {state.loading && <Spinner />}
        {state.error && <Alert type="error" title="Unable to open the referee form">{state.error}</Alert>}
        {done && (
          <Card>
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              <h1 className="mt-3 text-xl font-semibold">Thank you</h1>
              <p className="mt-1 text-slate-600">Your confidential referee report has been received by the University of Peradeniya.</p>
            </div>
          </Card>
        )}
        {state.context && !done && (
          <form onSubmit={submit} className="space-y-5">
            <Card title="Confidential Referee Report">
              <Alert type="info" className="mb-4">
                <span className="inline-flex items-center gap-1 font-medium"><Lock className="h-4 w-4" /> Confidential.</span> This report is seen only by the University's
                selection authorities and is not disclosed to the applicant. This link can be used once and expires on {fmtDate(state.context.expires_at)}.
              </Alert>
              <KeyValue
                items={[
                  ['Applicant', state.context.applicant_name],
                  ['Application reference', state.context.reference_no],
                  ['Post applied for', state.context.position_title],
                  ['Department / Faculty', `${state.context.department_name}, ${state.context.faculty_name}`],
                ]}
              />
            </Card>
            <Card title="About you">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Your full name" required value={f.referee_name} onChange={set('referee_name')} />
                <Input label="Designation / position" value={f.referee_designation} onChange={set('referee_designation')} />
                <Input label="In what capacity do you know the applicant?" required value={f.relationship} onChange={set('relationship')} hint="e.g. research supervisor, head of department" />
                <Input label="Known since (year)" value={f.known_since} onChange={set('known_since')} />
              </div>
            </Card>
            <Card title="Assessment">
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th scope="col">Attribute</th>
                      {state.rating_values.map((v) => (
                        <th key={v} scope="col" className="text-center">
                          {RATING_LABELS[v]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.rating_items.map(([key, text]) => (
                      <tr key={key}>
                        <td className="font-medium">{text}</td>
                        {state.rating_values.map((v) => (
                          <td key={v} className="text-center">
                            <input
                              type="radio"
                              name={key}
                              aria-label={`${text}: ${RATING_LABELS[v]}`}
                              checked={(f.ratings[key] || 'NOT_KNOWN') === v}
                              onChange={() => setF({ ...f, ratings: { ...f.ratings, [key]: v } })}
                              className="h-4 w-4"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid gap-4">
                <TextArea label="Strengths of the applicant" value={f.strengths} onChange={set('strengths')} />
                <TextArea label="Areas for development" value={f.weaknesses} onChange={set('weaknesses')} />
                <TextArea label="Further comments on suitability for the post" rows={5} value={f.comments} onChange={set('comments')} />
                <Select label="Overall recommendation" required value={f.recommendation} onChange={set('recommendation')} options={RECOMMENDATIONS.map(([value, l]) => ({ value, label: l }))} />
                <Checkbox checked={f.non_related_confirmed} onChange={(v) => setF({ ...f, non_related_confirmed: v })} label="I confirm that I am not related to the applicant." />
              </div>
            </Card>
            {error && <Alert type="error">{error}</Alert>}
            <div className="flex justify-end">
              <Button type="submit" loading={busy} size="lg">
                Submit report
              </Button>
            </div>
          </form>
        )}
      </div>
    </PublicShell>
  );
}
