import type { ReactNode } from "react";

const inputClass =
  "w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-neutral-600 disabled:opacity-50";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium tracking-wide text-neutral-400 uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} resize-y`}
    />
  );
}

export function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={inputClass}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-neutral-300"
      />
      <span className="space-y-0.5">
        <span className="block text-sm text-neutral-200">{label}</span>
        {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
      </span>
    </label>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "secondary",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-neutral-100 text-neutral-900 hover:bg-white",
    secondary:
      "border border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-neutral-100",
    danger: "border border-red-900/70 text-red-400 hover:bg-red-950/40",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300"
    >
      {children}
    </p>
  );
}

export function Badge({ tone, children }: { tone: "on" | "off"; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        tone === "on"
          ? "bg-emerald-950/60 text-emerald-400"
          : "bg-neutral-800 text-neutral-400"
      }`}
    >
      {children}
    </span>
  );
}
