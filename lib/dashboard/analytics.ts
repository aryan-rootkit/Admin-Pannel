/**
 * Pure helpers for the home dashboard: normalize Mongo revenue rows,
 * aggregate stats, chart series, and recent activity. Keeps page.tsx thin.
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface DashboardExpenseRow {
  category: string;
  amount: number;
  date: string;
  /** Present when expense was saved with developer payout metadata */
  developerPaid?: string;
  /** Optional UI/UX payout metadata carried through from revenue docs */
  uiuxDesignerPaid?: string;
  /** Optional marketing campaign name when expense relates to campaigns */
  campaignName?: string;
  /** Freeform notes attached to the original revenue/expense row */
  notes?: string;
}

/** Revenue row shape used by dashboard calculations (after Mongo normalization). */
export type DashboardRevenueRow = Record<string, any>;

export interface DashboardStats {
  totalRevenue: number;
  teamEarnings: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  totalProjects: number;
  totalClients: number;
  cashPosition: number;
  monthGrowth: number;
  overdueInvoices: number;
  utilizationRate: number;
  billableCount: number;
  topEarner: { name: string; amount: number };
  availableDevs: number;
}

/** Line chart on dashboard: last 6 months contract value totals */
export type MonthlyRevenuePoint = { name: string; revenue: number };

export interface ActivityItem {
  id: string;
  type: 'project_complete' | 'new_client' | 'payment' | 'project_created' | 'client_updated' | 'revenue_added';
  message: string;
  timestamp: Date;
  icon: string;
  color: string;
}

/**
 * Split raw `/api/revenue` documents into income rows (dashboard model) and expense rows.
 */
export function normalizeRevenueFromMongo(revenueAll: any[]): {
  revenueData: DashboardRevenueRow[];
  expensesData: DashboardExpenseRow[];
} {
  const normalized = Array.isArray(revenueAll) ? revenueAll : [];

  const revenueData = normalized
    .filter((r: any) => r.type === 'income' || r.type === 'invoice')
    .map((r: any) => {
      const paymentStatus =
        r.status === 'paid' ? 'Paid' : r.status === 'overdue' ? 'Overdue' : 'Pending';
      const paymentsReceived = paymentStatus === 'Paid' ? [{ amount: r.amount, date: r.date }] : [];

      return {
        ...r,
        totalContractValue: r.amount,
        advanceAmount: 0,
        paymentsReceived,
        paymentStatus,
        expectedPaymentDate: r.date,
      };
    });

  const expensesData = normalized
    .filter((r: any) => r.type === 'expense')
    .map((r: any) => ({
      category: r.description || 'Expense',
      amount: r.amount,
      date: r.date,
      developerPaid: r.developerPaid,
      uiuxDesignerPaid: r.uiuxDesignerPaid,
      campaignName: r.campaignName,
      notes: r.notes,
    }));

  return { revenueData, expensesData };
}

function monthKeyFromDate(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Last N calendar months as labels (oldest first). */
function rollingMonthKeys(months: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKeyFromDate(date));
  }
  return keys;
}

export function computeMonthlyRevenueSeries(revenueData: DashboardRevenueRow[]): MonthlyRevenuePoint[] {
  const monthKeys = rollingMonthKeys(6);
  const monthlyData: Record<string, number> = {};
  monthKeys.forEach((k) => {
    monthlyData[k] = 0;
  });
  revenueData.forEach((r: any) => {
    const date = r.createdAt ? new Date(r.createdAt) : new Date();
    const key = monthKeyFromDate(date);
    if (Object.prototype.hasOwnProperty.call(monthlyData, key)) {
      monthlyData[key] += r.totalContractValue || 0;
    }
  });
  return Object.entries(monthlyData).map(([name, revenue]) => ({ name, revenue }));
}

export function computeDashboardStats(
  revenueData: DashboardRevenueRow[],
  projectsData: any[],
  clientsData: any[],
  teamData: any[],
  expensesData: DashboardExpenseRow[]
): DashboardStats {
  const totalRevenue = revenueData.reduce((sum, r) => sum + (r.totalContractValue || 0), 0);
  const totalExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);

  const teamEarnings = expensesData
    .filter((e) => e.category === 'Developer Payout')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const receivedAmount = revenueData.reduce((sum, r) => {
    const advance = r.advanceAmount || 0;
    const payments = ((r.paymentsReceived as any[]) || []).reduce((pSum: number, p: any) => {
      const paymentDate = p.date ? new Date(p.date) : null;
      if (paymentDate && paymentDate <= todayMidnight) {
        return pSum + (p.amount || 0);
      }
      return pSum;
    }, 0);
    return sum + advance + payments;
  }, 0);
  const cashPosition = receivedAmount - totalExpenses;

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const thisMonthRevenue = revenueData
    .filter((r: any) => {
      const date = r.createdAt ? new Date(r.createdAt) : new Date();
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    })
    .reduce((sum: number, r: any) => sum + (r.totalContractValue || 0), 0);
  const lastMonthRevenue = revenueData
    .filter((r: any) => {
      const date = r.createdAt ? new Date(r.createdAt) : new Date();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    })
    .reduce((sum: number, r: any) => sum + (r.totalContractValue || 0), 0);
  const monthGrowth =
    lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

  const overdueCutoff = new Date();
  overdueCutoff.setHours(0, 0, 0, 0);
  const overdueInvoices = revenueData.filter((r: any) => {
    if (r.paymentStatus === 'Paid') return false;
    const dueDate = r.expectedPaymentDate ? new Date(r.expectedPaymentDate) : null;
    return dueDate && dueDate < overdueCutoff;
  }).length;

  const billableCount = teamData.filter(
    (t: any) => t.availability === 'Available' || t.availability === 'Busy'
  ).length;
  const totalTeamCount = teamData.length;
  const utilizationRate = totalTeamCount > 0 ? Math.round((billableCount / totalTeamCount) * 100) : 0;

  const earnerMap: Record<string, number> = {};
  expensesData
    .filter((e) => e.category === 'Developer Payout' && e.developerPaid)
    .forEach((e) => {
      const name = e.developerPaid as string;
      earnerMap[name] = (earnerMap[name] || 0) + (e.amount || 0);
    });
  const topEarnerEntry = Object.entries(earnerMap).sort((a, b) => b[1] - a[1])[0];
  const topEarner = topEarnerEntry
    ? { name: topEarnerEntry[0], amount: topEarnerEntry[1] as number }
    : { name: 'N/A', amount: 0 };

  const availableDevs = teamData.filter((t: any) => t.availability === 'Available').length;

  return {
    totalRevenue,
    teamEarnings,
    expenses: totalExpenses,
    profit,
    profitMargin,
    totalProjects: projectsData.length,
    totalClients: clientsData.length,
    cashPosition,
    monthGrowth,
    overdueInvoices,
    utilizationRate,
    billableCount,
    topEarner,
    availableDevs,
  };
}

export function computeRecentActivity(
  projectsData: any[],
  clientsData: any[],
  revenueData: DashboardRevenueRow[],
  formatINR: (n: number) => string
): ActivityItem[] {
  const activities: ActivityItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  projectsData
    .filter((p: any) => {
      if (p.status !== 'Completed') return false;
      const updatedAt = p.updatedAt ? new Date(p.updatedAt) : null;
      return updatedAt && updatedAt >= yesterday;
    })
    .forEach((p: any) => {
      activities.push({
        id: `project_${p._id}`,
        type: 'project_complete',
        message: `${p.name} marked complete`,
        timestamp: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        icon: '✅',
        color: 'text-green-600',
      });
    });

  clientsData
    .filter((c: any) => {
      const createdAt = c.createdAt ? new Date(c.createdAt) : null;
      return createdAt && createdAt >= yesterday;
    })
    .forEach((c: any) => {
      activities.push({
        id: `client_${c._id}`,
        type: 'new_client',
        message: `New client ${c.name} (${c.status || 'Lead'})`,
        timestamp: c.createdAt ? new Date(c.createdAt) : new Date(),
        icon: '➕',
        color: 'text-blue-600',
      });
    });

  revenueData.forEach((r: any) => {
    if (r.paymentsReceived && Array.isArray(r.paymentsReceived)) {
      r.paymentsReceived.forEach((payment: any) => {
        const paymentDate = payment.date ? new Date(payment.date) : null;
        if (paymentDate && paymentDate >= yesterday && paymentDate < new Date()) {
          activities.push({
            id: `payment_${r._id}_${payment.date}`,
            type: 'payment',
            message: `Paid ${formatINR(payment.amount)} for ${r.project}`,
            timestamp: paymentDate,
            icon: '💰',
            color: 'text-emerald-600',
          });
        }
      });
    }
  });

  projectsData
    .filter((p: any) => {
      const createdAt = p.createdAt ? new Date(p.createdAt) : null;
      return createdAt && createdAt >= yesterday;
    })
    .forEach((p: any) => {
      activities.push({
        id: `project_new_${p._id}`,
        type: 'project_created',
        message: `New project ${p.name} created`,
        timestamp: p.createdAt ? new Date(p.createdAt) : new Date(),
        icon: '📋',
        color: 'text-purple-600',
      });
    });

  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return activities.slice(0, 10);
}

/** One call from the page after fetch + normalize. */
export function buildDashboardPayload(
  revenueData: DashboardRevenueRow[],
  projectsData: any[],
  clientsData: any[],
  teamData: any[],
  expensesData: DashboardExpenseRow[],
  formatINR: (n: number) => string
): {
  stats: DashboardStats;
  monthlyRevenue: MonthlyRevenuePoint[];
  recentActivity: ActivityItem[];
} {
  const stats = computeDashboardStats(revenueData, projectsData, clientsData, teamData, expensesData);
  const monthlyRevenue = computeMonthlyRevenueSeries(revenueData);
  const recentActivity = computeRecentActivity(projectsData, clientsData, revenueData, formatINR);
  return { stats, monthlyRevenue, recentActivity };
}
