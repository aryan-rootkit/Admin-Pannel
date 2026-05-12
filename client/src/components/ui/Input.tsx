"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={`min-h-11 w-full min-w-0 rounded-xl border border-white/[0.1] bg-purity-bg px-3 py-2.5 text-sm text-purity-text outline-none transition placeholder:text-purity-muted focus:border-purity-accent/35 focus:ring-2 focus:ring-purity-accent/20 sm:min-h-10 sm:py-2 ${className}`}
      {...props}
    />
  );
}
