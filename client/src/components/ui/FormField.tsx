"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
  /** Inline validation message under the control */
  error?: string | null;
};

export function FormField({ label, children, className = "", error }: Props) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-sm font-medium text-[var(--purity-text)]">{label}</div>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
