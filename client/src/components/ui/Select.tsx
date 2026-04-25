"use client";

import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...props }: Props) {
  return (
    <select
      className={`min-h-11 w-full min-w-0 rounded-lg border border-[var(--purity-border)] bg-[var(--purity-card)] px-3 py-2.5 text-sm text-[var(--purity-text)] outline-none focus:ring-2 focus:ring-[var(--purity-accent)]/40 sm:min-h-10 sm:py-2 ${className}`}
      {...props}
    />
  );
}

