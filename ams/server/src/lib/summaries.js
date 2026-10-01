import { label } from './applications.js';

const d = (s) => (s ? String(s).slice(0, 10) : '');
const yr = (s) => (s ? String(s).slice(0, 4) : '');

export const addressText = (a, prefix = 'cur') =>
  [a[`${prefix}_address_line1`], a[`${prefix}_address_line2`], a[`${prefix}_city`], a[`${prefix}_postal_code`]].filter(Boolean).join(', ');

export const educationSummary = (s) =>
  s.education.map((e) => `${e.qualification} (${[label(e.result_class), e.gpa && `GPA ${e.gpa}`].filter(Boolean).join(', ')}) - ${e.university}, ${yr(e.final_exam_date)}`).join('; ');

export const postgraduateSummary = (s) =>
  s.postgraduate.map((p) => `${p.qualification} - ${p.institution} (${[label(p.pg_type), label(p.slqf_level)].filter(Boolean).join(', ')}${p.effective_date ? ', ' + yr(p.effective_date) : ''})`).join('; ');

export const currentEmploymentSummary = (s) =>
  s.current_employment.map((c) => `${c.designation}, ${c.institution} (from ${d(c.date_from)})`).join('; ');

export const previousEmploymentSummary = (s) =>
  s.previous_employment.map((p) => `${p.designation}, ${p.institution} (${d(p.date_from)} to ${d(p.date_to)})`).join('; ');

export const distinctionsOfType = (s, types) =>
  s.distinctions.filter((x) => types.includes(x.award_type)).map((x) => `${x.award} (${x.institution}${x.year ? ', ' + x.year : ''})`).join('; ');

export const refereesSummary = (s) => s.referees.map((r) => `${r.name} - ${r.telephone || ''} ${r.email || ''}`.trim()).join('; ');

export const otherQualifications = (a) =>
  [
    a.board_certified === 1 && `Board Certified (${d(a.board_certification_date)})`,
    a.lang_sinhala && `Sinhala: ${a.lang_sinhala}`,
    a.lang_tamil && `Tamil: ${a.lang_tamil}`,
    a.lang_english && `English: ${a.lang_english}`,
  ]
    .filter(Boolean)
    .join('; ');

/** RR (Referees Report) display: officer override, else derived from received e-reports. */
export function rrStatus(a) {
  if (a.sched_rr) return a.sched_rr;
  if (a.rr_received >= 2) return 'TICK';
  if (a.rr_received === 1) return 'PARTIAL';
  return null;
}

export const SCHED_SYMBOL = { TICK: '✓', NO: 'X', PENDING: 'Pending', PARTIAL: '1/2' };
export const schedText = (v) => (v ? SCHED_SYMBOL[v] || v : '');
