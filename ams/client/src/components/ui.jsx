import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, X, XCircle, Inbox } from 'lucide-react';
import { label } from '../lib/format';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

// ------------------------------------------------------------------ buttons
const VARIANTS = {
  primary: 'bg-uop-700 text-white hover:bg-uop-800 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm',
  ghost: 'text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  gold: 'bg-gold-500 text-uop-900 hover:bg-gold-600 shadow-sm',
};

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, className, children, ...props }) {
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
      {children}
    </button>
  );
}

// ------------------------------------------------------------------- fields
export function Field({ label: text, required, error, hint, children, className, htmlFor }) {
  return (
    <div className={className}>
      {text && (
        <label className="label" htmlFor={htmlFor}>
          {text}
          {required && <span className="ml-0.5 text-red-600" aria-hidden>*</span>}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ label: text, required, error, hint, className, ...props }) {
  const id = useId();
  return (
    <Field label={text} required={required} error={error} hint={hint} className={className} htmlFor={id}>
      <input id={id} className={cx('input', error && 'input-error')} aria-invalid={!!error} aria-required={required} {...props} value={props.value ?? ''} />
    </Field>
  );
}

export function TextArea({ label: text, required, error, hint, className, rows = 3, ...props }) {
  const id = useId();
  return (
    <Field label={text} required={required} error={error} hint={hint} className={className} htmlFor={id}>
      <textarea id={id} rows={rows} className={cx('input', error && 'input-error')} aria-invalid={!!error} {...props} value={props.value ?? ''} />
    </Field>
  );
}

export function Select({ label: text, required, error, hint, className, options = [], placeholder = 'Select…', ...props }) {
  const id = useId();
  return (
    <Field label={text} required={required} error={error} hint={hint} className={className} htmlFor={id}>
      <select id={id} className={cx('input', error && 'input-error')} aria-invalid={!!error} {...props} value={props.value ?? ''}>
        {placeholder !== false && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function YesNo({ label: text, value, onChange, required, error, name }) {
  const id = useId();
  return (
    <fieldset>
      <legend className="label">
        {text}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </legend>
      <div className="flex gap-6">
        {[
          [1, 'Yes'],
          [0, 'No'],
        ].map(([v, l]) => (
          <label key={v} className="inline-flex items-center gap-2 text-sm">
            <input type="radio" name={name || id} checked={value === v} onChange={() => onChange(v)} className="h-4 w-4 text-uop-700" />
            {l}
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}

export function Checkbox({ label: text, checked, onChange, disabled, className }) {
  return (
    <label className={cx('inline-flex items-start gap-2 text-sm', disabled && 'opacity-60', className)}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-uop-700" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{text}</span>
    </label>
  );
}

// ------------------------------------------------------------------- layout
export function Card({ title, actions, children, className, bodyClass = 'p-5' }) {
  return (
    <section className={cx('card', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
          {title && <h2 className="text-base font-semibold text-slate-800">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        {back}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const BADGE_TONES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  maroon: 'bg-uop-50 text-uop-700 ring-uop-200',
};
export function Badge({ tone = 'gray', children, className }) {
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', BADGE_TONES[tone], className)}>{children}</span>;
}

const STATUS_TONES = {
  DRAFT: 'gray', SUBMITTED: 'blue', UNDER_REVIEW: 'amber', CLOSED: 'gray', PUBLISHED: 'green', ARCHIVED: 'gray',
  SELECTED: 'green', REJECTED: 'red', PENDING: 'amber', SCHEDULED: 'blue', COMPLETED: 'green', CANCELLED: 'red', POSTPONED: 'amber',
  SENT: 'amber', NOT_SENT: 'gray', EXPIRED: 'red', REVOKED: 'gray',
};
export function StatusBadge({ status, children }) {
  if (!status) return <Badge>Not decided</Badge>;
  const tone = status === 'SUBMITTED' && children === 'rr' ? 'green' : STATUS_TONES[status] || 'gray';
  return <Badge tone={tone}>{label(status)}</Badge>;
}

export function DecisionBadge({ decision, category }) {
  if (!decision) return <Badge>Not decided</Badge>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      <StatusBadge status={decision} />
      {category && <Badge tone="maroon">{label(category)}</Badge>}
    </span>
  );
}

const ALERT = {
  info: ['bg-sky-50 border-sky-200 text-sky-900', Info],
  success: ['bg-emerald-50 border-emerald-200 text-emerald-900', CheckCircle2],
  warning: ['bg-amber-50 border-amber-200 text-amber-900', AlertTriangle],
  error: ['bg-red-50 border-red-200 text-red-900', XCircle],
};
export function Alert({ type = 'info', title, children, className }) {
  const [cls, Icon] = ALERT[type];
  return (
    <div className={cx('flex gap-3 rounded-md border p-3 text-sm', cls, className)} role={type === 'error' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
      </div>
    </div>
  );
}

export function Spinner({ label: text = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-slate-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <Icon className="h-10 w-10 text-slate-300" aria-hidden />
      <p className="mt-3 font-medium text-slate-700">{title}</p>
      {children && <p className="mt-1 max-w-md text-sm text-slate-500">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBox({ error }) {
  if (!error) return null;
  const problems = error.details?.problems;
  return (
    <Alert type="error" title={error.message}>
      {problems && (
        <ul className="list-disc pl-5">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}

// -------------------------------------------------------------------- modal
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={cx('w-full rounded-lg bg-white shadow-xl outline-none', widths[size])}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, children, confirmText = 'Confirm', variant = 'primary', onConfirm, onCancel, loading }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-700">{children}</div>
    </Modal>
  );
}

// --------------------------------------------------------------- pagination
export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return <p className="px-4 py-3 text-xs text-slate-500">{total} record(s)</p>;
  return (
    <nav className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm" aria-label="Pagination">
      <span className="text-slate-600">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="secondary" icon={ChevronLeft} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <span className="px-2 text-slate-600">
          Page {page} of {pages}
        </span>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

// ------------------------------------------------------------------- toasts
const ToastContext = createContext(() => {});
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 7000 : 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Alert type={t.type} className="shadow-lg">
              {t.message}
            </Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

// ------------------------------------------------------------------- tables
export function SortHeader({ field, sort, dir, onSort, children }) {
  const active = sort === field;
  return (
    <th scope="col" aria-sort={active ? (dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
      <button type="button" className="inline-flex items-center gap-1 uppercase hover:text-uop-700" onClick={() => onSort(field, active && dir === 'asc' ? 'desc' : 'asc')}>
        {children}
        <span aria-hidden className={active ? 'text-uop-700' : 'text-slate-300'}>
          {active && dir === 'desc' ? '▼' : '▲'}
        </span>
      </button>
    </th>
  );
}

export function KeyValue({ items, cols = 2 }) {
  return (
    <dl className={cx('grid gap-x-6 gap-y-3 text-sm', cols === 3 ? 'sm:grid-cols-3' : cols === 1 ? '' : 'sm:grid-cols-2')}>
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
          <dd className="mt-0.5 whitespace-pre-line text-slate-900">{v === null || v === undefined || v === '' ? <span className="text-slate-400">—</span> : v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Hook for loading data with loading / error state and a reload function. */
export function useLoad(fn, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ loading: false, data, error: null });
      return data;
    } catch (error) {
      setState({ loading: false, data: null, error });
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    reload();
  }, [reload]);
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data: typeof data === 'function' ? data(s.data) : data })) };
}
