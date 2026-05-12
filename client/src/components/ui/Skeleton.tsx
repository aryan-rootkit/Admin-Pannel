import type { HTMLAttributes } from "react";

const pulse = "animate-pulse rounded-md bg-slate-200/80";

export function SkeletonBlock({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${pulse} ${className}`} aria-hidden {...props} />;
}
