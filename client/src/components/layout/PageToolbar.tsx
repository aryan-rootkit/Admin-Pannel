import type { ReactNode } from "react";

/** Stacks title + actions on narrow screens; aligns horizontally from `sm` up. */
export function PageToolbar({
  title,
  actions,
}: {
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">{title}</div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
