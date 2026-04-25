"use client";

import type { SelectHTMLAttributes } from "react";

export type MultiSelectOption = { value: string; label: string };

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "multiple"> & {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
};

const baseClass =
  "min-h-[120px] w-full rounded-lg border border-[var(--purity-border)] bg-[var(--purity-card)] px-3 py-2 text-sm text-[var(--purity-text)] outline-none focus:ring-2 focus:ring-[var(--purity-accent)]/40";

export function MultiSelect({ options, value, onChange, className = "", ...rest }: Props) {
  return (
    <select
      {...rest}
      multiple
      className={`${baseClass} ${className}`}
      value={value}
      onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
