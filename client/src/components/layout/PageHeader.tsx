/**
 * Canonical H1 styling for every app page (toolbar, dashboard, detail titles).
 * Use this class for any standalone `<h1>` so size, weight, and tracking stay aligned.
 */
export const PAGE_TITLE_CLASS =
  "text-2xl font-bold tracking-tight text-[var(--purity-text)] md:text-[1.75rem] md:leading-tight";

/** In-card section titles (not page H1). */
export const PAGE_SECTION_TITLE_CLASS =
  "text-lg font-bold tracking-tight text-[var(--purity-text)]";

/** Single-line page title (no stacked breadcrumb + subtitle). */
export function PageHeader({
  title,
  className = "mb-6",
}: {
  title: string;
  /** Wrapper spacing; use `mb-0` inside {@link PageToolbar}. */
  className?: string;
}) {
  return (
    <div className={className}>
      <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
    </div>
  );
}
