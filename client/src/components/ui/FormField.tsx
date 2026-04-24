"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, children, className = "" }: Props) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-sm font-medium text-[var(--purity-text)]">{label}</div>
      {children}
    </div>
  );
}
