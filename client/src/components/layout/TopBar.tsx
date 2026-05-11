"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Props = {
  /** Opens the mobile navigation drawer (shown only when provided). */
  onMenuClick?: () => void;
};

export function TopBar({ onMenuClick }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--purity-border)] bg-[var(--purity-card)]/75 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
        {onMenuClick ? (
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--purity-border)] text-[var(--purity-text)] hover:bg-[var(--purity-page)] md:hidden"
            aria-label="Open menu"
            onClick={onMenuClick}
          >
            <span className="flex flex-col gap-1.5" aria-hidden>
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        ) : null}
        <span className="truncate text-xs font-bold uppercase tracking-wide text-[var(--purity-muted)] md:hidden">
          Admin
        </span>
        </div>

        <div className="hidden flex-1 items-center justify-center px-2 md:flex">
          <div className="relative w-full max-w-[560px]">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--purity-muted)]"
              aria-hidden
            >
              ⌕
            </span>
            <Input
              placeholder="Search projects, clients, people…"
              className="w-full rounded-xl border border-[var(--purity-border)] bg-[var(--purity-bg)] pl-9"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
        {isLoggedIn ? (
          <>
            <button
              type="button"
              className="hidden h-10 items-center gap-2 rounded-xl border border-[var(--purity-border)] bg-[var(--purity-bg)] px-3 text-xs font-semibold text-[var(--purity-text)] hover:border-[var(--purity-accent)]/40 md:flex"
            >
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--purity-accent)]/20 text-[var(--purity-accent)]"
                aria-hidden
              >
                R
              </span>
              Rootkit Admin
            </button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 px-3 text-xs font-semibold sm:min-h-10"
              onClick={() => setIsLoggedIn(false)}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 px-3 text-xs font-semibold sm:min-h-10"
              onClick={() => setIsLoggedIn(true)}
            >
              Login
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 px-3 text-xs font-semibold sm:min-h-10"
              onClick={() => setIsLoggedIn(true)}
            >
              Sign Up
            </Button>
          </>
        )}
        </div>
      </div>
    </header>
  );
}
