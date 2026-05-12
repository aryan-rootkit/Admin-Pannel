"use client";

import Link from "next/link";

export type PeopleCardProps = {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  /** Formatted like "25,000" (no symbol), Indian grouping */
  revenueDisplay: string;
  projectCount: number;
  onEdit?: () => void;
};

export function PeopleCard({
  id,
  name,
  title,
  avatarUrl,
  revenueDisplay,
  projectCount,
  onEdit,
}: PeopleCardProps) {
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const projectsLabel = String(projectCount).padStart(2, "0");

  return (
    <article className="flex flex-col overflow-hidden rounded-[20px] border border-slate-200/90 bg-white shadow-[var(--rk-shadow-card)]">
      <div className="relative aspect-[4/3] bg-slate-100">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote avatar URLs from API
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold tracking-tight text-slate-300">
            {initials || "—"}
          </div>
        )}
        {onEdit ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/90 transition hover:bg-white"
          >
            Edit
          </button>
        ) : null}
      </div>

      <div className="px-5 pb-4 pt-4">
        <h2 className="text-lg font-bold leading-snug tracking-tight text-slate-900">{name || "—"}</h2>
        <p className="mt-1 text-sm text-slate-500">{title || "—"}</p>
      </div>

      <div className="mt-auto rounded-t-[16px] bg-[#0f172a] px-5 pb-5 pt-4 text-white">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Revenue</span>
          <span className="tabular-nums font-semibold tracking-tight">{revenueDisplay}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-400">Projects</span>
          <span className="tabular-nums font-semibold tracking-tight">{projectsLabel}</span>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-5">
          <Link
            href={`/peoples/${id}`}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            More Details
          </Link>
          <Link
            href={`/peoples/${id}`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm transition hover:bg-slate-100"
            aria-label={`More details for ${name}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
