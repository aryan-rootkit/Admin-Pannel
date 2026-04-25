export const REVENUE_PAYMENT_TYPES = ["Advance", "Installment", "Final"] as const;

export const REVENUE_STATUS_OPTIONS = ["Received", "Pending", "Failed"] as const;

export type RevenuePaymentTypeOption = (typeof REVENUE_PAYMENT_TYPES)[number];

export const PROJECT_STATUS_OPTIONS = [
  "Pitched",
  "In Progress",
  "Delivered",
  "Cancelled",
  "Lost",
] as const;

export type ProjectStatusOption = (typeof PROJECT_STATUS_OPTIONS)[number];

export const PEOPLE_ROLE_OPTIONS = [
  "App Dev (Frontend)",
  "App Dev (Backend)",
  "Web Dev (Frontend)",
  "Web Dev (Backend)",
  "UI/UX Designer",
  "Marketing",
  "HR",
  "Management",
] as const;

export type PeopleRoleOption = (typeof PEOPLE_ROLE_OPTIONS)[number];

export const PAYOUT_KIND_OPTIONS = [
  { value: "dev_payout", label: "Dev Payout" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "design_payout", label: "Design Payout" },
  { value: "marketing_payout", label: "Marketing Payout" },
  { value: "company_expenses", label: "Company Expenses" },
  { value: "others", label: "Others" },
] as const;

export type PayoutKindValue = (typeof PAYOUT_KIND_OPTIONS)[number]["value"];

export function payoutKindIsSubscription(value: string): boolean {
  return value === "subscriptions";
}

export function labelForPayoutKind(value: string): string {
  return PAYOUT_KIND_OPTIONS.find((o) => o.value === value)?.label ?? "Dev Payout";
}
