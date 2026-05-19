/** Personal Finance module — API types (aligns with `/api/personal-finance/*`). */

export type PfMomMeta = {
  pct: number | null;
  label: string;
};

export type PfCashflowMonth = {
  month: string;
  inflow: number;
  outflow: number;
};

export type PfCategorySlice = { name: string; amount: number };

export type PfLoanRow = {
  _id: string;
  loanKind: "borrowed_bank" | "borrowed_person" | "lent_to_person";
  partyName: string;
  principal: number;
  status: string;
  startDate?: string;
  dueDate?: string | null;
  notes?: string;
  repaid?: number;
  outstanding?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PfSubscriptionRow = {
  _id: string;
  name: string;
  amount: number;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  cycleDays?: number | null;
  nextDueDate?: string | null;
  autoRenew: boolean;
  category: string;
  notes?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PfRootkitBusiness = {
  revenueReceived: number;
  projectPayoutCost: number;
  projectPayoutLineCount: number;
  operatingExpenses: number;
  /** Revenue minus all project payouts (dev, design, marketing, etc.) */
  rootkitMargin: number;
  /** Margin minus company subscriptions / operating payouts */
  rootkitNet: number;
  ledgerRootkitIncome: number;
  personalSpend: number;
  /** rootkitNet − personalSpend — what you may keep after life + business ops */
  estimatedSavings: number;
  spendRatePct: number | null;
  momMargin: PfMomMeta;
  momNet: PfMomMeta;
};

export type PfSummaryResponse = {
  month: string;
  rootkitBusiness?: PfRootkitBusiness | null;
  kpis: {
    totalBalance: number;
    cashNet: number;
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    debtLoans: number;
    moneyToReceive: number;
    monthlyBurn: number;
    momIncome: PfMomMeta;
    momExpense: PfMomMeta;
    momBurn: PfMomMeta;
  };
  cashflowSeries: PfCashflowMonth[];
  categoryBreakdown: PfCategorySlice[];
  subscriptions: {
    active: PfSubscriptionRow[];
    upcoming: PfSubscriptionRow[];
    overdue: PfSubscriptionRow[];
    monthlyEquivalentEstimate: number;
  };
  loans: PfLoanRow[];
  insights: { id: string; text: string }[];
  pendingImportLines: number;
};

export type PfTransactionRow = {
  _id: string;
  flow: "in" | "out";
  category: string;
  amount: number;
  occurredAt: string;
  title?: string;
  notes?: string;
  source?: "manual" | "import";
  loanId?: string | null;
  subscriptionId?: string | null;
};

export type PfStatementImportRow = {
  _id: string;
  fileName?: string;
  status?: string;
  rowCount?: number;
  createdAt?: string;
};

export type PfStatementLineRow = {
  _id: string;
  importId: string;
  rowIndex: number;
  statementDate?: string | null;
  description?: string;
  amountSigned: number;
  raw?: string;
  status: "pending" | "approved" | "rejected";
  transactionId?: string | null;
};

export type PfActivityItem = {
  id: string;
  kind: string;
  at: string;
  title: string;
  detail: string;
  amount: number | null;
  flow: "in" | "out" | null;
};

export const PF_EXPENSE_CATEGORIES = [
  "food",
  "travel",
  "subscriptions",
  "recharge",
  "utilities",
  "personal_shopping",
  "business_expense",
  "rootkit_income",
  "personal_income",
  "loan_repayment",
  "transfer",
  "misc",
] as const;

export const PF_INCOME_CATEGORIES = ["personal_income", "rootkit_income", "salary", "interest", "refund", "misc"] as const;
