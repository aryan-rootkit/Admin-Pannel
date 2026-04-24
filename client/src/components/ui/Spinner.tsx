export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--purity-border)] border-t-[var(--purity-accent)] ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
