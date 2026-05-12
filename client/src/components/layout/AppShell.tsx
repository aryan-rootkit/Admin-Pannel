"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainNav } from "@/config/mainNav";
import { TopBar } from "@/components/layout/TopBar";

const navIconClass = "h-[18px] w-[18px] shrink-0 opacity-90";

function NavIcon({ href }: { href: string }) {
  switch (href) {
    case "/dashboard":
      return (
        <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
        </svg>
      );
    case "/clients":
      return (
        <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
      );
    case "/projects":
      return (
        <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinejoin="round" />
        </svg>
      );
    case "/peoples":
      return (
        <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "/revenues":
      return (
        <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "/payouts":
      return (
        <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    default:
      return null;
  }
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3 pb-8">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-purity-muted">Main</p>
      {mainNav.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`relative flex min-h-11 items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-sm font-medium leading-snug transition-colors md:min-h-0 ${
              active
                ? "bg-[#e8f0fe] font-semibold text-[#1a56db] shadow-none"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <NavIcon href={item.href} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-7 lg:px-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-900" aria-hidden>
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none" className="overflow-visible">
          <path
            d="M8 38 L18 12 L24 22 L30 8 L40 38"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 38 L22 18 L28 28 L34 38"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-slate-900">ROOTKIT FINANCE</div>
      </div>
    </div>
  );
}

const drawerAside =
  "flex h-full w-[min(20rem,calc(100vw-2rem))] max-w-[100vw] flex-col rounded-r-3xl border border-slate-200/90 bg-white shadow-[var(--rk-shadow-float)]";

const desktopAsideClass =
  "hidden w-64 shrink-0 flex-col rounded-r-3xl border border-slate-200/90 bg-white shadow-[var(--rk-shadow-card)] md:my-4 md:ml-3 md:flex md:h-[calc(100dvh-2rem)] md:self-start";

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
      <div className="flex min-h-dvh w-full min-w-0 flex-1 flex-col md:flex-row">
        <aside className={desktopAsideClass}>
          <Brand />
          <NavLinks />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
            <div className="mx-auto min-h-0 w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileNavOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-200 ${
            mobileNavOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 ${drawerAside} transition-transform duration-200 ease-out ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Brand />
          <NavLinks onNavigate={() => setMobileNavOpen(false)} />
        </aside>
      </div>
    </>
  );
}
