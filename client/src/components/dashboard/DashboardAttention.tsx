"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel, cardPadding } from "@/components/dashboard/dashboardStyles";
import type { Project } from "@/types/api";

type AttentionItem = {
  key: string;
  title: string;
  value: string;
  hint: string;
  tone: "critical" | "warning" | "info";
  href?: string;
};

type Props = {
  overdueCount: number;
  overdueAmount: number;
  highPendingLabel: string;
  cancelledProjects: number;
  stalled: Project[];
  /** Right-rail: single column, tighter cards */
  variant?: "default" | "sidebar";
};

function toneRing(tone: AttentionItem["tone"]) {
  if (tone === "critical") return "ring-rose-500/35 bg-rose-500/5";
  if (tone === "warning") return "ring-amber-400/35 bg-amber-400/5";
  return "ring-sky-400/25 bg-sky-400/5";
}

export function DashboardAttention({
  overdueCount,
  overdueAmount,
  highPendingLabel,
  cancelledProjects,
  stalled,
  variant = "default",
}: Props) {
  const sidebar = variant === "sidebar";
  const items: AttentionItem[] = [];

  if (overdueCount > 0) {
    items.push({
      key: "overdue",
      title: "Overdue pending payments",
      value: `${overdueCount} line${overdueCount === 1 ? "" : "s"}`,
      hint: `${formatMoney(overdueAmount, "INR")} exposure · schedule follow-ups`,
      tone: "critical",
      href: "/revenues",
    });
  }

  items.push({
    key: "pending",
    title: "Highest pending revenue",
    value: highPendingLabel || "—",
    hint: "Focus collections on the largest gaps first",
    tone: overdueCount > 0 ? "warning" : "info",
    href: "/revenues",
  });

  if (cancelledProjects > 0) {
    items.push({
      key: "cancelled",
      title: "Cancelled / lost projects",
      value: String(cancelledProjects),
      hint: "Review pipeline and contract terms",
      tone: "warning",
      href: "/projects",
    });
  }

  if (stalled.length > 0) {
    items.push({
      key: "stalled",
      title: "Stalled (no update 14+ days)",
      value: String(stalled.length),
      hint: stalled
        .slice(0, 2)
        .map((p) => p.name)
        .join(" · "),
      tone: "warning",
      href: "/projects",
    });
  }

  if (items.length === 0) {
    return (
      <section aria-label="Attention required">
        <h2 className={`${sectionLabel} mb-3`}>Attention required</h2>
        <div className={`${glassCard} ${sidebar ? "p-4" : cardPadding} text-sm text-purity-muted`}>
          Nothing urgent surfaced — data looks healthy.
        </div>
      </section>
    );
  }

  const gridClass = sidebar ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2";
  const cardPad = sidebar ? "p-4" : cardPadding;

  return (
    <section aria-label="Attention required">
      <div className={`mb-3 ${sidebar ? "mb-2" : ""}`}>
        <h2 className={sectionLabel}>Attention required</h2>
        {!sidebar ? (
          <p className="mt-1 text-sm text-purity-muted">What needs action before it becomes risk</p>
        ) : null}
      </div>
      <div className={gridClass}>
        {items.map((item) => {
          const inner = (
            <article
              className={`${glassCard} h-full ${cardPad} ring-1 ${toneRing(item.tone)} transition hover:border-blue-200/80`}
            >
              <p className={sectionLabel}>{item.title}</p>
              <p className={`mt-2 font-semibold text-purity-text ${sidebar ? "text-base" : "text-lg"}`}>{item.value}</p>
              <p className="mt-1 text-xs leading-snug text-purity-muted">{item.hint}</p>
            </article>
          );
          return item.href ? (
            <Link key={item.key} href={item.href} className="block min-w-0 rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50">
              {inner}
            </Link>
          ) : (
            <div key={item.key}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
