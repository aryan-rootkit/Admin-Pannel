"use client";

import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...props }: Props) {
  return (
    <select
      className={`w-full rounded-lg border border-[var(--purity-border)] bg-[var(--purity-card)] px-3 py-2 text-sm text-[var(--purity-text)] outline-none focus:ring-2 focus:ring-[var(--purity-accent)]/40 ${className}`}
      {...props}
    />
  );
}

