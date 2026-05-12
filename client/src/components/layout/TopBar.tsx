"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Props = {
  onMenuClick?: () => void;
};

export function TopBar({ onMenuClick }: Props) {
  const pathname = usePathname();
  const peoplesLight = pathname.startsWith("/peoples");
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const headerSurface = peoplesLight
    ? "border-slate-200/90 bg-white/95 shadow-[0_1px_0_0_rgba(15,23,42,0.06)]"
    : "border-purity-border/90 bg-purity-card/80 shadow-[0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-xl";

  return (
    <header className={`sticky top-0 z-30 border-b ${headerSurface}`}>
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-10">
        <div className="flex min-w-0 items-center gap-2">
          {onMenuClick ? (
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-purity-bg text-purity-text shadow-sm transition hover:border-white/15 hover:bg-white/[0.04] md:hidden"
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
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-purity-muted md:hidden">
            Menu
          </span>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-3 md:flex">
          <div className="relative w-full max-w-[560px]">
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purity-muted"
              aria-hidden
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.2-4.2" strokeLinecap="round" />
              </svg>
            </span>
            <Input
              placeholder={peoplesLight ? "Search" : "Search projects, clients, people…"}
              className={
                peoplesLight
                  ? "h-11 rounded-full border border-slate-200/90 bg-white pl-11 pr-4 shadow-sm ring-0 placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/15"
                  : "h-11 rounded-full border-white/[0.08] bg-purity-bg/90 pl-11 pr-4 shadow-inner ring-0 placeholder:text-purity-muted/80 focus:border-purity-accent/35 focus:ring-2 focus:ring-purity-accent/25"
              }
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          {peoplesLight ? (
            <>
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 md:inline-flex"
                aria-label="Messages"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="m22 6-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 md:inline-flex"
                aria-label="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" aria-hidden />
              </button>
            </>
          ) : null}
          {isLoggedIn ? (
            <>
              {peoplesLight ? (
                <button
                  type="button"
                  className="hidden h-auto items-center gap-3 rounded-none border-0 bg-transparent px-1 py-1 text-left shadow-none hover:opacity-90 md:inline-flex"
                >
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f5d565] text-xs font-bold text-slate-900"
                    aria-hidden
                  >
                    A
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="max-w-[10rem] truncate text-sm font-semibold text-slate-900">Andrew</span>
                    <span className="text-[11px] text-slate-500">Admin account</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="hidden h-10 items-center gap-2.5 rounded-full border border-white/[0.08] bg-purity-bg/90 px-3 py-1.5 text-xs font-semibold text-purity-text shadow-sm transition hover:border-purity-accent/30 hover:bg-white/[0.04] md:inline-flex"
                >
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purity-accent/20 text-xs font-bold text-purity-accent"
                    aria-hidden
                  >
                    R
                  </span>
                  <span className="max-w-[9rem] truncate">Rootkit Admin</span>
                </button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 rounded-full px-4 text-xs font-semibold sm:min-h-10"
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
                className="min-h-11 rounded-full px-4 text-xs font-semibold sm:min-h-10"
                onClick={() => setIsLoggedIn(true)}
              >
                Login
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 rounded-full px-4 text-xs font-semibold sm:min-h-10"
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
