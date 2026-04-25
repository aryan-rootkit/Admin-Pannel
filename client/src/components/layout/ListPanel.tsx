import type { ReactNode } from "react";

export function ListPanel({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] shadow-sm">
      {children}
    </div>
  );
}

/** Purity-style table header row */
export function listHeadRowClass() {
  return "grid gap-2 border-b border-[var(--purity-border)] bg-[var(--purity-card)] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]";
}

export function listBodyRowClass() {
  return "grid gap-2 border-b border-[var(--purity-border)] px-5 py-3 text-sm text-[var(--purity-text)] last:border-b-0";
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-[var(--purity-muted)]">
      {message}
    </div>
  );
}
