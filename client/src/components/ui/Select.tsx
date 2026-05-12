"use client";

import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...props }: Props) {
  return (
    <select
      className={`min-h-11 w-full min-w-0 rounded-xl border border-white/[0.1] bg-purity-bg px-3 py-2.5 text-sm text-purity-text outline-none transition focus:border-purity-accent/35 focus:ring-2 focus:ring-purity-accent/20 sm:min-h-10 sm:py-2 ${className}`}
      {...props}
    />
  );
}

