"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainNav } from "@/config/mainNav";
import { TopBar } from "@/components/layout/TopBar";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-3 pb-6">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
        Main
      </p>
      {mainNav.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium leading-snug transition-colors md:min-h-0 ${
              active
                ? "bg-[var(--purity-sidebar-active)] text-[var(--purity-accent-hover)]"
                : "text-[var(--purity-muted)] hover:bg-[var(--purity-page)] hover:text-[var(--purity-text)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-6 py-6">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ background: "var(--purity-accent)" }}
      >
        R
      </div>
      <div className="min-w-0 text-xs font-bold uppercase tracking-wide text-[var(--purity-text)]">
        Rootkit UI
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--purity-border)] bg-[var(--purity-card)] md:flex">
        <Brand />
        <NavLinks />
      </aside>

      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileNavOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            mobileNavOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[min(20rem,calc(100vw-2rem))] max-w-[100vw] flex-col border-r border-[var(--purity-border)] bg-[var(--purity-card)] shadow-xl transition-transform duration-200 ease-out ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Brand />
          <NavLinks onNavigate={() => setMobileNavOpen(false)} />
        </aside>
      </div>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </>
  );
}
