const { revenueLineAmount } = require("../lib/financeHelpers");
const { computeFinanceAnalytics } = require("./financeService");

/**
 * Legacy `/api/analytics/profit` shape — backed by {@link computeFinanceAnalytics}.
 */
async function computeProfitAnalytics() {
  const f = await computeFinanceAnalytics();
  return {
    totalRevenue: f.totalRevenue,
    totalCost: f.totalProjectCost + f.totalExpenses,
    totalPayoutCost: f.totalProjectCost + f.totalExpenses,
    totalLabourCost: 0,
    profit: f.netProfit,
    projectBreakdown: f.projectBreakdown.map((p) => ({
      projectId: p.projectId,
      projectName: p.projectName,
      labourCost: 0,
      payoutCost: p.projectCost,
      totalCost: p.projectCost,
    })),
  };
}

module.exports = {
  computeProfitAnalytics,
  /** @deprecated prefer `revenueReceivedAmount` for accounting revenue */
  revenueDocumentTotal: revenueLineAmount,
};
