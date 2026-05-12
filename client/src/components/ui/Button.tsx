"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex min-h-11 min-w-[2.75rem] touch-manipulation items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:min-w-0 sm:py-2";
  const styles =
    variant === "primary"
      ? "bg-purity-accent text-white shadow-md shadow-blue-500/15 hover:brightness-105 active:brightness-95"
      : variant === "ghost"
        ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        : variant === "danger"
          ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-300"
          : "border border-slate-200/90 bg-white text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50";

  return (
    <button className={`${base} ${styles} ${className}`} {...props} />
  );
}
