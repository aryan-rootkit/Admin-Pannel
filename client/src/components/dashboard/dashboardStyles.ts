/**
 * Dashboard surfaces — light theme cards (aligned with global ROOTKIT FINANCE UI)
 */

/** Primary elevated surface */
export const glassCard =
  "rounded-[20px] border border-slate-200/90 bg-white shadow-[var(--rk-shadow-card)]";

/** KPI strip cards — slightly stronger lift */
export const kpiCard =
  `${glassCard} flex h-full flex-col p-4 ring-1 ring-slate-200/40 shadow-[0_2px_10px_rgba(15,23,42,0.045)] md:p-5`;

/** Compact value well inside KPIs */
export const valueHero =
  "rounded-[14px] bg-gradient-to-b from-white to-slate-50 px-3 py-2.5 text-center shadow-inner ring-1 ring-slate-200/70";

/** Eyebrow labels — uppercase, wide tracking */
export const sectionLabel =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-purity-muted";

/** Section title under eyebrow */
export const sectionTitle = "text-base font-semibold tracking-tight text-purity-text";

/** Vertical rhythm between major dashboard blocks */
export const stackSections = "space-y-6 lg:space-y-8";

/** Grid gutter alignment with main 12-col system */
export const gridMain = "grid gap-6 lg:gap-8";

/** Standard inner padding for cards */
export const cardPadding = "p-5 md:p-6";
