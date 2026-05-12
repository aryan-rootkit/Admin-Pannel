"use client";

import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...props }: Props) {
  return (
    <select
      className={`min-h-11 w-full min-w-0 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/15 sm:min-h-10 sm:py-2 ${className}`}
      {...props}
    />
  );
}

