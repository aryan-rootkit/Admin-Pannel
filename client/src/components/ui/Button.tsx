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
      ? "bg-purity-accent text-[#0b111b] shadow-md shadow-purity-accent/10 hover:brightness-105 active:brightness-95"
      : variant === "ghost"
        ? "text-purity-muted hover:bg-white/[0.06] hover:text-purity-text"
        : variant === "danger"
          ? "border border-rose-500/35 bg-rose-500/10 text-rose-100 hover:bg-rose-500/18 hover:border-rose-400/45"
          : "border border-white/[0.1] bg-purity-bg text-purity-text shadow-sm hover:border-white/[0.16] hover:bg-white/[0.05]";

  return (
    <button className={`${base} ${styles} ${className}`} {...props} />
  );
}
