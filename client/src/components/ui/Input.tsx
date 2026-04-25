"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={`min-h-11 w-full min-w-0 rounded-lg border border-[var(--purity-border)] bg-[var(--purity-card)] px-3 py-2.5 text-sm text-[var(--purity-text)] outline-none focus:ring-2 focus:ring-[var(--purity-accent)]/40 sm:min-h-10 sm:py-2 ${className}`}
      {...props}
    />
  );
}

