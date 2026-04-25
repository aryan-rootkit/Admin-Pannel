const { Revenue } = require("../revenues/model");
const { Payout } = require("../payouts/model");
const { Project } = require("../projects/model");
const {
  revenueReceivedAmount,
  payoutProjectCostAmount,
  payoutExpenseAmount,
} = require("../lib/financeHelpers");
const { projectStatusBucket } = require("../lib/projectFinance");

/**
 * Company + project finance snapshot.
 *
 * @returns {Promise<{
 *   totalRevenue: number,
 *   totalProjectCost: number,
 *   totalExpenses: number,
 *   projectProfit: number,
 *   netProfit: number,
 *   pendingRevenue: number,
 *   projectBreakdown: Array<{
 *     projectId: string,
 *     projectName: string,
 *     totalValue: number,
 *     totalReceived: number,
 *     pending: number,
 *     cancelledBalance: number,
 *     projectCost: number,
 *     projectProfit: number
 *   }>
 * }>}
 */
async function computeFinanceAnalytics() {
  const [revenues, payouts, projects] = await Promise.all([
    Revenue.find()
      .select(
        "projectId amount totalAmount status paymentDate date receivedAt createdAt paymentType"
      )
      .lean(),
    Payout.find().select("amount projectId category type").lean(),
    Project.find().select("name totalValue budget status").lean(),
  ]);

  const totalRevenue = revenues.reduce((s, r) => s + revenueReceivedAmount(r), 0);

  const totalProjectCost = payouts.reduce((s, p) => s + payoutProjectCostAmount(p), 0);
  const totalExpenses = payouts.reduce((s, p) => s + payoutExpenseAmount(p), 0);

  const projectProfit = totalRevenue - totalProjectCost;
  const netProfit = projectProfit - totalExpenses;

  const receivedByProject = new Map();
  for (const r of revenues) {
    const add = revenueReceivedAmount(r);
    if (!add) continue;
    const pid = String(r.projectId);
    receivedByProject.set(pid, (receivedByProject.get(pid) || 0) + add);
  }

  const projectCostById = new Map();
  for (const p of payouts) {
    if (!p.projectId) continue;
    const amt = payoutProjectCostAmount(p);
    if (!amt) continue;
    const pid = String(p.projectId);
    projectCostById.set(pid, (projectCostById.get(pid) || 0) + amt);
  }

  let pendingRevenue = 0;
  const projectBreakdown = projects.map((proj) => {
    const id = String(proj._id);
    const totalValue = Number(proj.totalValue ?? proj.budget ?? 0) || 0;
    const totalReceived = receivedByProject.get(id) || 0;
    const rawGap = Math.max(0, totalValue - totalReceived);
    const bucket = projectStatusBucket(proj.status);
    const cancelledBalance = bucket === "cancelled" ? rawGap : 0;
    const pending = bucket === "cancelled" ? 0 : rawGap;
    pendingRevenue += pending;
    const projectCost = projectCostById.get(id) || 0;
    const rowProfit = totalReceived - projectCost;
    return {
      projectId: id,
      projectName: proj.name || "",
      totalValue,
      totalReceived,
      pending,
      cancelledBalance,
      projectCost,
      projectProfit: rowProfit,
    };
  });

  return {
    totalRevenue,
    totalProjectCost,
    totalExpenses,
    projectProfit,
    netProfit,
    pendingRevenue,
    projectBreakdown,
  };
}

module.exports = { computeFinanceAnalytics };
