export type Client = {
  _id: string;
  name: string;
  email?: string;
  contact?: string;
  phone?: string;
  notes?: string;
  address?: string;
  company?: string;
  status?: string;
};

export type PopulatedRef = { _id: string; name: string; email?: string; contact?: string };

export type Project = {
  _id: string;
  name: string;
  clientId: string | PopulatedRef;
  status?: string;
  budget?: number;
  totalValue?: number;
  assignedTeam?: Array<PopulatedRef | string>;
  peopleIds?: string[];
  teamIds?: string[];
};

export type AssignedProjectRef = { _id: string; name: string };

export type PersonRow = {
  _id: string;
  name?: string;
  role?: string;
  subRole?: string;
  email?: string;
  contact?: string;
  assignedProjects?: Array<AssignedProjectRef | string>;
};

export type RevenuePaymentType = "Advance" | "Installment" | "Final";

export type RevenueStatus = "Received" | "Pending" | "Failed";

export type RevenueRow = {
  _id: string;
  projectId: string | { _id: string; name: string; clientId?: unknown; totalValue?: number };
  totalAmount?: number;
  advanceAmount?: number;
  pendingAmount?: number;
  paymentDate?: string;
  date?: string;
  amount?: number;
  currency?: string;
  receivedAt?: string;
  description?: string;
  paymentType?: RevenuePaymentType;
  /** Same as paymentType in API responses */
  type?: RevenuePaymentType;
  status?: RevenueStatus;
};

export type ProfitAnalytics = {
  totalRevenue: number;
  totalCost: number;
  totalPayoutCost: number;
  totalLabourCost: number;
  profit: number;
  projectBreakdown: Array<{
    projectId: string;
    projectName: string;
    labourCost: number;
    payoutCost: number;
    totalCost: number;
  }>;
};

export type FinanceAnalytics = {
  totalRevenue: number;
  totalProjectCost: number;
  totalExpenses: number;
  projectProfit: number;
  netProfit: number;
  pendingRevenue: number;
  projectBreakdown: Array<{
    projectId: string;
    projectName: string;
    totalValue: number;
    totalReceived: number;
    pending: number;
    cancelledBalance?: number;
    projectCost: number;
    projectProfit: number;
  }>;
};

export type MonthlyAnalyticsRow = {
  month: string;
  monthKey: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type PayoutRow = {
  _id: string;
  type?: "subscription" | "payout";
  amount: number;
  currency?: string;
  paymentDate?: string;
  paidAt?: string;
  name?: string;
  status?: string;
  projectId?: string | { _id: string; name: string };
  peopleId?: string | { _id: string; name: string; role?: string; email?: string; contact?: string };
  personId?: string | { _id: string; name: string; role?: string };
  clientId?: string | { _id: string; name: string };
  category?: string;
  notes?: string;
};

