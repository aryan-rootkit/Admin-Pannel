"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, title, onClose, children, footer }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[min(92dvh,100dvh)] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--purity-border)] bg-[var(--purity-card)] shadow-xl sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--purity-border)] px-5 py-4">
          <h2 className="text-base font-bold text-[var(--purity-text)]">{title}</h2>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-lg leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:min-h-10 sm:min-w-10"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--purity-border)] px-5 py-4 safe-area-pb sm:flex-row sm:flex-wrap sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
