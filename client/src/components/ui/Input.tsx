"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={`min-h-11 w-full min-w-0 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/15 sm:min-h-10 sm:py-2 ${className}`}
      {...props}
    />
  );
}
