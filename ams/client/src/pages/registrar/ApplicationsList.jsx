import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, FolderOpen, Search, X } from 'lucide-react';
import { get, download, qs } from '../../lib/api';
import { useMaster } from '../../lib/master';
import { fmtDate, label } from '../../lib/format';
import { Button, Card, DecisionBadge, EmptyState, ErrorBox, Input, PageHeader, Pagination, Select, SortHeader, Spinner, StatusBadge, useLoad, useToast } from '../../components/ui';

export const FILTER_KEYS = ['q', 'vacancy_id', 'faculty_id', 'department_id', 'position_id', 'status', 'decision', 'category', 'sort', 'dir'];
export const filtersFrom = (params) => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));

export function useStaffVacancies() {
  return useLoad(() => get('/vacancies'), []);
}

export default function ApplicationsList() {
  const master = useMaster();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const filters = filtersFrom(params);
  const page = Number(params.get('page') || 1);
  const [q, setQ] = useState(filters.q);
  const vacancies = useStaffVacancies();
  const query = qs({ ...filters, page, page_size: 25 });
  const { data, loading, error } = useLoad(() => get(`/review/applications${query}`), [query]);

  useEffect(() => setQ(filters.q), [filters.q]);

  const update = (patch) => {
    const next = { ...filters, page: 1, ...patch };
    setParams(Object.fromEntries(Object.entries(next).filter(([k, v]) => v !== '' && v != null && !(k === 'page' && Number(v) === 1))));
  };
  const onSort = (sort, dir) => update({ sort, dir });
  const departments = (master?.departments || []).filter((d) => !filters.faculty_id || String(d.faculty_id) === filters.faculty_id);
  const reviewQuery = qs(filters);
  const anyFilter = FILTER_KEYS.some((k) => !['sort', 'dir'].includes(k) && filters[k]);

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Open a complete application to review it and record the shortlist decision."
        actions={
          <Button variant="secondary" icon={Download} onClick={() => download(`/review/applications.csv${qs(filters)}`).catch((e) => toast(e.message, 'error'))}>
            Download CSV
          </Button>
        }
      />
      <Card className="mb-4">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q });
          }}
        >
          <div className="md:col-span-2">
            <label className="label" htmlFor="search">Search</label>
            <div className="flex gap-2">
              <input id="search" className="input" placeholder="Reference, name, NIC or email" value={q} onChange={(e) => setQ(e.target.value)} />
              <Button type="submit" icon={Search} aria-label="Search" />
            </div>
          </div>
          <Select label="Vacancy" value={filters.vacancy_id} onChange={(e) => update({ vacancy_id: e.target.value })} placeholder="All vacancies"
            options={(vacancies.data?.vacancies || []).map((v) => ({ value: String(v.id), label: `${v.position_title} – ${v.department_name}` }))} />
          <Select label="Position" value={filters.position_id} onChange={(e) => update({ position_id: e.target.value })} placeholder="All positions"
            options={(master?.positions || []).map((p) => ({ value: String(p.id), label: p.title }))} />
          <Select label="Faculty" value={filters.faculty_id} onChange={(e) => update({ faculty_id: e.target.value, department_id: '' })} placeholder="All faculties"
            options={(master?.faculties || []).map((f) => ({ value: String(f.id), label: f.name }))} />
          <Select label="Department" value={filters.department_id} onChange={(e) => update({ department_id: e.target.value })} placeholder="All departments"
            options={departments.map((d) => ({ value: String(d.id), label: d.name }))} />
          <Select label="Decision" value={filters.decision} onChange={(e) => update({ decision: e.target.value, category: e.target.value === 'SELECTED' ? filters.category : '' })} placeholder="Any decision"
            options={[{ value: 'NONE', label: 'Not decided' }, ...['SELECTED', 'REJECTED', 'PENDING'].map((d) => ({ value: d, label: label(d) }))]} />
          <Select label="Category" value={filters.category} onChange={(e) => update({ category: e.target.value })} placeholder="Any category"
            options={['CATEGORY_I', 'CATEGORY_II', 'CATEGORY_III'].map((c) => ({ value: c, label: label(c) }))} />
          <Select label="Application status" value={filters.status} onChange={(e) => update({ status: e.target.value })} placeholder="Any status"
            options={['SUBMITTED', 'UNDER_REVIEW', 'CLOSED'].map((s) => ({ value: s, label: label(s) }))} />
          {anyFilter && (
            <div className="flex items-end">
              <Button variant="ghost" icon={X} onClick={() => setParams({})}>
                Clear filters
              </Button>
            </div>
          )}
        </form>
      </Card>

      <ErrorBox error={error} />
      <Card bodyClass="p-0">
        {loading && !data ? (
          <Spinner />
        ) : !data?.applications.length ? (
          <EmptyState icon={FolderOpen} title="No applications found">
            {anyFilter ? 'Try changing or clearing the filters.' : 'Submitted applications will appear here.'}
          </EmptyState>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <SortHeader field="reference_no" {...filters} onSort={onSort}>Reference No.</SortHeader>
                    <SortHeader field="name" {...filters} onSort={onSort}>Applicant Name</SortHeader>
                    <SortHeader field="position" {...filters} onSort={onSort}>Position</SortHeader>
                    <SortHeader field="department" {...filters} onSort={onSort}>Department</SortHeader>
                    <SortHeader field="faculty" {...filters} onSort={onSort}>Faculty</SortHeader>
                    <SortHeader field="decision" {...filters} onSort={onSort}>Status / Decision</SortHeader>
                    <th scope="col">Category</th>
                    <SortHeader field="submitted_at" {...filters} onSort={onSort}>Submitted</SortHeader>
                    <th scope="col"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.applications.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap font-mono text-xs font-semibold text-uop-800">{a.reference_no}</td>
                      <td>
                        <p className="font-medium text-slate-900">{a.applicant_name}</p>
                        <p className="text-xs text-slate-500">{a.name_with_initials}</p>
                      </td>
                      <td>{a.position_title}</td>
                      <td>{a.department_name}</td>
                      <td>{a.faculty_name}</td>
                      <td>
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={a.status} />
                          <DecisionBadge decision={a.decision_code} />
                        </div>
                      </td>
                      <td>{a.category_code ? label(a.category_code) : <span className="text-slate-400">—</span>}</td>
                      <td className="whitespace-nowrap">{fmtDate(a.submitted_at)}</td>
                      <td>
                        <Link to={`/registrar/applications/${a.id}${reviewQuery}`} className="inline-flex items-center gap-1 rounded-md bg-uop-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-uop-800">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={(p) => update({ page: p })} />
          </>
        )}
      </Card>
    </>
  );
}
