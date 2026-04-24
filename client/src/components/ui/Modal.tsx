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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--purity-border)] px-5 py-4">
          <h2 className="text-base font-bold text-[var(--purity-text)]">{title}</h2>
          <button
            type="button"
            className="rounded-md p-1 text-sm text-[var(--purity-muted)] hover:bg-[var(--purity-page)] hover:text-[var(--purity-text)]"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--purity-border)] px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
