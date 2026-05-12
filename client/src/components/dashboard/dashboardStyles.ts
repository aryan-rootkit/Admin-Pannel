/**
 * Rootkit UI — dashboard surfaces (aligned with Figma dark finance system)
 * Spacing rhythm: 6 / 8 / 12 / 16 / 24 (Tailwind 1.5–6 scale)
 */

/** Primary elevated surface: thin hairline + soft lift (no heavy borders) */
export const glassCard =
  "rounded-2xl border border-white/[0.08] bg-purity-card/90 shadow-[var(--rk-shadow-card)] backdrop-blur-xl";

/** Inline metric pill (dark navy gradient) */
export const valueHero =
  "rounded-xl bg-gradient-to-br from-[#0c1222] via-[#070b14] to-[#0c1222] px-4 py-3 text-center shadow-inner ring-1 ring-white/[0.08]";

/** Eyebrow labels — uppercase, wide tracking */
export const sectionLabel =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-purity-muted";

/** Section title under eyebrow */
export const sectionTitle = "text-base font-semibold tracking-tight text-purity-text";

/** Vertical rhythm between major dashboard blocks */
export const stackSections = "space-y-10 lg:space-y-12";

/** Grid gutter alignment with main 12-col system */
export const gridMain = "grid gap-6 lg:gap-8";

/** Standard inner padding for cards */
export const cardPadding = "p-5 md:p-6";
