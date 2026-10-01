export const LABELS = {
  FIRST_CLASS: 'First Class',
  SECOND_UPPER: 'Second Class (Upper Division)',
  SECOND_LOWER: 'Second Class (Lower Division)',
  PASS: 'Pass',
  COURSEWORK: 'Coursework',
  RESEARCH: 'Research',
  READING_OTHER: 'Reading / Other',
  LEVEL_9: 'SLQF Level 9',
  LEVEL_10: 'SLQF Level 10',
  OTHER: 'Other',
  SCHOLARSHIP: 'Scholarship',
  MEDAL: 'Medal',
  PRIZE: 'Prize',
  DISTINCTION: 'Distinction',
  DESCENT: 'By descent',
  REGISTRATION: 'By registration',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  PENDING: 'Pending',
  CATEGORY_I: 'Category I',
  CATEGORY_II: 'Category II',
  CATEGORY_III: 'Category III',
  SINGLE: 'Single',
  MARRIED: 'Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CLOSED: 'Closed',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  IN_PERSON: 'In person',
  ONLINE: 'Online',
  HYBRID: 'Hybrid',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  POSTPONED: 'Postponed',
  APPLICANT: 'Applicant',
  REGISTRAR: 'Registrar / SAR',
  HOD: 'Head of Department',
  DEAN: 'Dean',
  ADMIN: 'Administrator',
  NOT_SENT: 'Not sent',
  SENT: 'Requested',
  EXPIRED: 'Link expired',
  REVOKED: 'Replaced',
  TICK: '✓',
  NO: '✗',
  PARTIAL: '1/2',
};

export const label = (code) => (code ? LABELS[code] || code : '');

export const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (s) => {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const fmtSize = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export const ageFrom = (dob, on) => {
  if (!dob) return null;
  const d = new Date(dob);
  const o = on ? new Date(on) : new Date();
  let a = o.getFullYear() - d.getFullYear();
  if (o.getMonth() < d.getMonth() || (o.getMonth() === d.getMonth() && o.getDate() < d.getDate())) a -= 1;
  return a;
};

export const decisionText = (decision, category) => (decision ? `${label(decision)}${category ? ` – ${label(category)}` : ''}` : 'Not decided');
