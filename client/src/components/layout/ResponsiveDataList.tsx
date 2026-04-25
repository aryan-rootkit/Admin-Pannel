import type { ReactNode } from "react";

/**
 * Standard pattern: **cards** below `lg` (1024px), **table/grid** at `lg+`.
 * Aligns with Tailwind `lg` = 1024px (“desktop”) and keeps tablets on card layouts for dense tables.
 */
type Props = {
  table: ReactNode;
  cards: ReactNode;
};

export function ResponsiveDataList({ table, cards }: Props) {
  return (
    <>
      <div className="hidden min-w-0 lg:block">{table}</div>
      <div className="space-y-3 lg:hidden">{cards}</div>
    </>
  );
}
