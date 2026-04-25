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
      <h1 className="text-lg font-bold tracking-tight text-[var(--purity-text)] sm:text-xl">
        {title}
      </h1>
    </div>
  );
}
