"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function TopBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--purity-border)] bg-[var(--purity-card)] px-6 py-4">
      <div className="hidden sm:block" />
      <div className="flex flex-1 items-center justify-end gap-2">
        {isLoggedIn ? (
          <Button
            type="button"
            variant="ghost"
            className="px-3 py-1.5 text-xs font-semibold"
            onClick={() => setIsLoggedIn(false)}
          >
            Logout
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-1.5 text-xs font-semibold"
              onClick={() => setIsLoggedIn(true)}
            >
              Login
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-1.5 text-xs font-semibold"
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
