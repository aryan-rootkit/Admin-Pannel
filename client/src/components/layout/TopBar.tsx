"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  /** Opens the mobile navigation drawer (shown only when provided). */
  onMenuClick?: () => void;
};

export function TopBar({ onMenuClick }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--purity-border)] bg-[var(--purity-card)] px-4 py-3 sm:px-6 sm:py-4">
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
      <div className="flex flex-1 items-center justify-end gap-2">
        {isLoggedIn ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-3 text-xs font-semibold sm:min-h-10"
            onClick={() => setIsLoggedIn(false)}
          >
            Logout
          </Button>
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
    </header>
  );
}
