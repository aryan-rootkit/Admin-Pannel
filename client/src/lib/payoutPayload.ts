import {
  PAYOUT_KIND_OPTIONS,
  labelForPayoutKind,
  payoutKindIsSubscription,
  type PayoutKindValue,
} from "@/lib/formOptions";

type BuildOpts = {
  kind: string;
  amount: number;
  paymentDate: string;
  currency: string;
  projectId: string;
  peopleId: string;
  subscriptionStatus?: string;
};

export function buildPayoutPayload(opts: BuildOpts) {
  const pd = opts.paymentDate
    ? new Date(opts.paymentDate).toISOString()
    : new Date().toISOString();
  const label = labelForPayoutKind(opts.kind);

  if (payoutKindIsSubscription(opts.kind)) {
    return {
      type: "subscription" as const,
      name: label,
      amount: opts.amount,
      paymentDate: pd,
      status: opts.subscriptionStatus?.trim() || "active",
      currency: opts.currency,
      category: label,
      projectId: null,
      peopleId: null,
    };
  }

  return {
    type: "payout" as const,
    projectId: opts.projectId,
    peopleId: opts.peopleId,
    amount: opts.amount,
    paymentDate: pd,
    currency: opts.currency,
    category: label,
  };
}

export function payoutRowToKind(row: {
  type?: string;
  category?: string;
}): PayoutKindValue {
  if (row.type === "subscription") return "subscriptions";
  const cat = (row.category || "").trim();
  const hit = PAYOUT_KIND_OPTIONS.find((o) => o.label === cat);
  return (hit?.value ?? "dev_payout") as PayoutKindValue;
}

/** Project-linked payout costs (dev, design, marketing, etc.) — excludes subscriptions. */
export function isProjectCostPayout(row: {
  type?: string;
  category?: string;
  projectId?: string | { _id: string } | null;
}): boolean {
  if (payoutKindIsSubscription(payoutRowToKind(row))) return false;
  if (row.type === "subscription") return false;
  const pid = row.projectId;
  if (pid == null) return false;
  if (typeof pid === "string") return pid.length > 0;
  return Boolean(pid._id);
}
