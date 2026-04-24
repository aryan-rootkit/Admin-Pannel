"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "text-white shadow-sm hover:opacity-95"
      : variant === "ghost"
        ? "text-[var(--purity-muted)] hover:bg-[var(--purity-page)] hover:text-[var(--purity-text)]"
        : variant === "danger"
          ? "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
          : "border border-[var(--purity-border)] bg-[var(--purity-card)] text-[var(--purity-text)] hover:bg-[var(--purity-page)]";

  return (
    <button
      className={`${base} ${styles} ${className}`}
      style={
        variant === "primary"
          ? { background: "var(--purity-accent)" }
          : undefined
      }
      {...props}
    />
  );
}

