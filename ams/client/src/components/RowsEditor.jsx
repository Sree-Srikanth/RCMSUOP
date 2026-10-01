import { Plus, Trash2 } from 'lucide-react';
import { useMaster } from '../lib/master';
import { label } from '../lib/format';
import { Button, Input, Select } from './ui';

/** Field input generated from the server-side section column spec. */
export function SpecInput({ name, spec, value, onChange, error }) {
  const common = { label: spec.label, required: spec.required, value: value ?? '', error };
  if (spec.type === 'enum') {
    return <Select {...common} onChange={(e) => onChange(e.target.value || null)} options={spec.values.map((v) => ({ value: v, label: label(v) }))} />;
  }
  if (spec.type === 'date') return <Input {...common} type="date" onChange={(e) => onChange(e.target.value || null)} />;
  if (spec.type === 'year') return <Input {...common} inputMode="numeric" maxLength={4} placeholder="YYYY" onChange={(e) => onChange(e.target.value.replace(/\D/g, '') || null)} />;
  return <Input {...common} type={spec.email ? 'email' : 'text'} maxLength={spec.max} name={name} onChange={(e) => onChange(e.target.value)} />;
}

/**
 * Editable list of rows for a repeatable form section (education,
 * publications, employment…), driven by the column spec from /api/master.
 */
export default function RowsEditor({ section, rows, onChange, issues = [], addLabel = 'Add entry', max, emptyText, wide = [] }) {
  const master = useMaster();
  const spec = master.sections[section];
  const cols = Object.entries(spec.cols);
  const blank = () => Object.fromEntries(cols.map(([k]) => [k, null]));
  const errorFor = (i, col) => issues.find((x) => x.field === `${section}.${i}.${col}`)?.message?.replace(/^.*?: /, '');

  const update = (i, col, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [col]: v } : r)));
  const remove = (i) => onChange(rows.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
      {rows.length === 0 && emptyText && <p className="rounded border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">{emptyText}</p>}
      {rows.map((row, i) => (
        <fieldset key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <legend className="sr-only">
            {spec.label} entry {i + 1}
          </legend>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              {spec.label} #{i + 1}
            </span>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(i)} aria-label={`Remove ${spec.label} entry ${i + 1}`}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cols.map(([col, s]) => (
              <div key={col} className={wide.includes(col) ? 'sm:col-span-2 lg:col-span-3' : ''}>
                <SpecInput name={col} spec={s} value={row[col]} onChange={(v) => update(i, col, v)} error={errorFor(i, col)} />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      {(!max || rows.length < max) && (
        <Button variant="secondary" icon={Plus} onClick={() => onChange([...rows, blank()])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}
