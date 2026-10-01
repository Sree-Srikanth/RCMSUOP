// src/app/(other)/apply/ui.tsx
// Small shared building blocks so every step looks and behaves the same and
// is mobile-first (single column on phones, 2 columns from `sm`, 16px inputs
// so iOS does not zoom, large tap targets).

import React from "react";
import { Plus, Trash2, Info, AlertTriangle } from "lucide-react";
import { stepTitle, type StepId } from "./steps";

export const inputCls =
  "w-full min-h-[44px] px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent " +
  "disabled:bg-gray-100 disabled:text-gray-500";

export const StepHeader: React.FC<{
  step: StepId;
  icon: React.ReactNode;
  subtitle?: string;
  optional?: boolean;
  action?: React.ReactNode;
}> = ({ step, icon, subtitle, optional, action }) => (
  <div className="flex flex-col gap-3 pb-4 mb-6 border-b border-gray-200 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl text-[#800000]">
        <span className="shrink-0">{icon}</span>
        <span>{stepTitle(step)}</span>
        {optional && (
          <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            Optional
          </span>
        )}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const SubHeader: React.FC<{
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  optional?: boolean;
  action?: React.ReactNode;
}> = ({ title, icon, subtitle, optional, action }) => (
  <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-gray-800">
        {icon}
        {title}
        {optional && (
          <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            Optional
          </span>
        )}
      </h3>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  full?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, full, htmlFor, children }) => {
  // Link the label to its control (accessibility) when the child is one of our inputs.
  const autoId = React.useId();
  let control = children;
  let forId = htmlFor;
  if (
    React.isValidElement<{ id?: string }>(children) &&
    (children.type === TextInput || children.type === Select || children.type === TextArea)
  ) {
    forId = children.props.id || htmlFor || autoId;
    if (!children.props.id) control = React.cloneElement(children, { id: forId });
  }
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={forId} className="block mb-1 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {control}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
};

export const Grid: React.FC<{ children: React.ReactNode; cols?: 2 | 3 }> = ({
  children,
  cols = 2,
}) => (
  <div
    className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : ""}`}
  >
    {children}
  </div>
);

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string | number | undefined;
  onValue: (v: string) => void;
};

export const TextInput: React.FC<InputProps> = ({ value, onValue, className, ...rest }) => (
  <input
    {...rest}
    value={value ?? ""}
    onChange={(e) => onValue(e.target.value)}
    className={`${inputCls} ${className || ""}`}
  />
);

export const TextArea: React.FC<
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
    value: string | undefined;
    onValue: (v: string) => void;
  }
> = ({ value, onValue, className, rows = 3, ...rest }) => (
  <textarea
    {...rest}
    rows={rows}
    value={value ?? ""}
    onChange={(e) => onValue(e.target.value)}
    className={`${inputCls} ${className || ""}`}
  />
);

export const Select: React.FC<
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & {
    value: string | undefined;
    onValue: (v: string) => void;
    options: Array<string | { value: string; label: string }>;
    placeholder?: string;
  }
> = ({ value, onValue, options, placeholder = "Select", className, ...rest }) => (
  <select
    {...rest}
    value={value ?? ""}
    onChange={(e) => onValue(e.target.value)}
    className={`${inputCls} ${className || ""}`}
  >
    <option value="">{placeholder}</option>
    {options.map((o) => {
      const opt = typeof o === "string" ? { value: o, label: o } : o;
      return (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      );
    })}
  </select>
);

export const Checkbox: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  id?: string;
}> = ({ checked, onChange, label, id }) => (
  <label
    htmlFor={id}
    className="flex items-start gap-3 py-1 cursor-pointer select-none"
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-5 h-5 mt-0.5 shrink-0 rounded border-gray-300 accent-[#800000]"
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

export const YesNo: React.FC<{
  name: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ name, value, onChange }) => (
  <div className="flex gap-3">
    {[
      { v: true, l: "Yes" },
      { v: false, l: "No" },
    ].map((o) => (
      <label
        key={o.l}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer min-h-[44px] ${
          value === o.v ? "border-[#800000] bg-[#800000]/5 text-[#800000]" : "border-gray-300"
        }`}
      >
        <input
          type="radio"
          name={name}
          checked={value === o.v}
          onChange={() => onChange(o.v)}
          className="accent-[#800000]"
        />
        <span className="text-sm font-medium">{o.l}</span>
      </label>
    ))}
  </div>
);

export const AddButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  disabled?: boolean;
}> = ({ onClick, children, variant = "solid", disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium rounded-lg sm:w-auto min-h-[44px] transition disabled:opacity-50 ${
      variant === "solid"
        ? "bg-[#800000] text-white hover:bg-[#a01010]"
        : "border border-[#800000] text-[#800000] hover:bg-[#800000] hover:text-white"
    }`}
  >
    <Plus size={18} />
    {children}
  </button>
);

export const RepeatCard: React.FC<{
  index: number;
  label: string;
  onRemove?: () => void;
  highlight?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}> = ({ index, label, onRemove, highlight, badge, children }) => (
  <div
    className={`p-4 sm:p-5 border rounded-xl ${
      highlight ? "border-[#800000] bg-[#800000]/[0.03]" : "border-gray-200 bg-white"
    }`}
  >
    <div className="flex items-center justify-between gap-2 mb-4">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#800000]">
        <span className="inline-flex items-center justify-center w-6 h-6 text-xs text-white rounded-full bg-[#800000]">
          {index + 1}
        </span>
        {label}
        {badge}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} ${index + 1}`}
          className="inline-flex items-center gap-1 px-2 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Remove</span>
        </button>
      )}
    </div>
    {children}
  </div>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; text: string; sub?: string }> = ({
  icon,
  text,
  sub,
}) => (
  <div className="px-4 py-8 text-center text-gray-500 border-2 border-gray-200 border-dashed rounded-xl bg-gray-50">
    <div className="flex justify-center mb-2 text-gray-400">{icon}</div>
    <p className="text-sm font-medium">{text}</p>
    {sub && <p className="mt-1 text-xs">{sub}</p>}
  </div>
);

export const Notice: React.FC<{
  tone?: "info" | "warn";
  children: React.ReactNode;
}> = ({ tone = "info", children }) => (
  <div
    className={`flex gap-3 p-4 text-sm border rounded-lg ${
      tone === "warn"
        ? "bg-amber-50 border-amber-200 text-amber-900"
        : "bg-blue-50 border-blue-200 text-blue-900"
    }`}
  >
    {tone === "warn" ? (
      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
    ) : (
      <Info size={18} className="shrink-0 mt-0.5" />
    )}
    <div>{children}</div>
  </div>
);

/** Horizontally scrollable tabs (no wrapping on phones). */
export const Tabs: React.FC<{
  tabs: Array<{ id: string; label: string; count?: number; icon?: React.ReactNode }>;
  active: string;
  onChange: (id: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 mb-6 -mx-4 overflow-x-auto border-b border-gray-200 sm:mx-0 px-4 sm:px-0 [scrollbar-width:none]">
    {tabs.map((t) => (
      <button
        key={t.id}
        type="button"
        onClick={() => onChange(t.id)}
        className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
          active === t.id
            ? "border-[#800000] text-[#800000]"
            : "border-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        {t.icon}
        {t.label}
        {t.count !== undefined && (
          <span
            className={`px-1.5 py-0.5 text-xs rounded-full ${
              active === t.id ? "bg-[#800000] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

/** Immutable helpers for arrays of {id} items. */
export const listOps = <T extends { id: string }>(list: T[], onChange: (l: T[]) => void) => ({
  add: (item: T) => onChange([...list, item]),
  remove: (id: string) => onChange(list.filter((x) => x.id !== id)),
  update: <K extends keyof T>(id: string, field: K, value: T[K]) =>
    onChange(list.map((x) => (x.id === id ? { ...x, [field]: value } : x))),
});

export const YEARS = (() => {
  const now = new Date().getFullYear();
  return Array.from({ length: 60 }, (_, i) => String(now - i));
})();
