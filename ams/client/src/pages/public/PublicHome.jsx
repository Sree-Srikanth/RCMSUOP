import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CalendarDays, Building2, Search } from 'lucide-react';
import PublicShell from './PublicShell';
import { get } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import { useMaster } from '../../lib/master';
import { Card, EmptyState, Select, Spinner, ErrorBox, useLoad } from '../../components/ui';

export function VacancyCards({ vacancies, linkTo = (v) => `/vacancies/${v.id}`, onSelect }) {
  if (!vacancies.length) {
    return (
      <EmptyState icon={Briefcase} title="No open vacancies">
        There are no vacancies accepting applications at the moment. Please check again later.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {vacancies.map((v) => (
        <li key={v.id}>
          <Link
            to={linkTo(v)}
            onClick={onSelect ? (e) => { e.preventDefault(); onSelect(v); } : undefined}
            className="card block h-full p-5 transition hover:border-uop-300 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">{v.faculty_name}</p>
            <h3 className="mt-1 text-lg font-semibold text-uop-800">{v.position_title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
              <Building2 className="h-4 w-4 text-slate-400" aria-hidden /> {v.department_name}
            </p>
            {v.discipline && <p className="mt-1 text-sm text-slate-600">Discipline: {v.discipline}</p>}
            <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden />
              Closes <span className="font-medium text-slate-800">{fmtDate(v.closing_date_local)}</span>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function VacancyBrowser({ linkTo, onSelect }) {
  const master = useMaster();
  const [faculty, setFaculty] = useState('');
  const [position, setPosition] = useState('');
  const { data, loading, error } = useLoad(() => get('/vacancies'), []);
  const list = useMemo(
    () => (data?.vacancies || []).filter((v) => (!faculty || String(v.faculty_id) === faculty) && (!position || String(v.position_id) === position)),
    [data, faculty, position],
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Faculty" value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="All faculties" options={(master?.faculties || []).map((f) => ({ value: String(f.id), label: f.name }))} />
        <Select label="Position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="All positions" options={(master?.positions || []).map((p) => ({ value: String(p.id), label: p.title }))} />
      </div>
      <ErrorBox error={error} />
      {loading ? <Spinner /> : <VacancyCards vacancies={list} linkTo={linkTo} onSelect={onSelect} />}
    </div>
  );
}

export default function PublicHome() {
  return (
    <PublicShell>
      <section className="mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-uop-700 to-uop-900 px-6 py-10 text-white shadow-lg sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-300">Academic Recruitment</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Join the University of Peradeniya</h1>
        <p className="mt-3 max-w-2xl text-uop-100">
          Apply online for academic and library positions. Create an account, complete the University application form, upload your supporting
          documents and track the progress of your application and referee reports.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/register" className="rounded-md bg-gold-500 px-4 py-2 font-semibold text-uop-900 hover:bg-gold-600">
            Create an applicant account
          </Link>
          <Link to="/login" className="rounded-md border border-white/40 px-4 py-2 font-semibold text-white hover:bg-white/10">
            Log in
          </Link>
        </div>
      </section>
      <Card title={<span className="flex items-center gap-2"><Search className="h-4 w-4" aria-hidden /> Open vacancies</span>}>
        <VacancyBrowser />
      </Card>
    </PublicShell>
  );
}
