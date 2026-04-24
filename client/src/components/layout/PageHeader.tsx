/** Single-line page title (no stacked breadcrumb + subtitle). */
export function PageHeader({ title }: { title: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-lg font-bold tracking-tight text-[var(--purity-text)]">{title}</h1>
    </div>
  );
}
