"use client";

import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel, valueHero } from "@/components/dashboard/dashboardStyles";
import type { PfPersonalPosition } from "@/types/personalFinance";

type Props = {
  position: PfPersonalPosition | null | undefined;
  monthLabel: string;
};

export function PfPositionKpi({ position, monthLabel }: Props) {
  if (!position) return null;

  const positive = position.netPosition >= 0;

  return (
    <section
      aria-label="My money position"
      className={`${glassCard} overflow-hidden ring-2 ${positive ? "ring-emerald-300/70" : "ring-rose-300/70"}`}
    >
      <div
        className={`px-5 py-5 md:px-6 md:py-6 ${
          positive
            ? "bg-gradient-to-br from-emerald-50/95 via-white to-white"
            : "bg-gradient-to-br from-rose-50/95 via-white to-white"
        }`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={sectionLabel}>My money · {monthLabel}</p>
            <p className="mt-2 text-sm text-slate-600">
              Money in from Rootkit Consultancy (profit left after costs) minus what you still owe people, plus
              receivables.
            </p>
          </div>
          <div className="shrink-0 text-left lg:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Net position</p>
            <p
              className={`mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl ${
                positive ? "text-emerald-800" : "text-rose-800"
              }`}
            >
              {formatMoney(position.netPosition, "INR")}
            </p>
            <p className={`mt-1 text-xs font-semibold ${positive ? "text-emerald-700" : "text-rose-700"}`}>
              {positive ? "In the green" : "In the red"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={`${valueHero} px-4 py-3 text-left`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/80">Money in</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-900">
              {formatMoney(position.moneyIn, "INR")}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-slate-600">Rootkit profit · this month</p>
          </div>
          <div className={`${valueHero} bg-gradient-to-b px-4 py-3 text-left from-rose-50/80 to-white`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-rose-800/80">Money out</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-rose-900">
              {formatMoney(position.moneyOut, "INR")}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-slate-600">Still owe (borrowings)</p>
          </div>
          <div className={`${valueHero} px-4 py-3 text-left`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">To receive</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
              {formatMoney(position.moneyToReceive, "INR")}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-slate-600">Money others owe you</p>
          </div>
        </div>
      </div>
    </section>
  );
}
