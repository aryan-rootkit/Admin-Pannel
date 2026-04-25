const { Revenue } = require("../revenues/model");
const { Payout } = require("../payouts/model");
const { People } = require("../peoples/model");
const { Project } = require("../projects/model");
const { memberIdsFromProjectLean } = require("../lib/memberIndex");
const { weeklyCostForPerson } = require("../peoples/projectAssignment");

function revenueDocumentTotal(doc) {
  if (doc.totalAmount != null && doc.totalAmount !== "")
    return Number(doc.totalAmount) || 0;
  if (doc.amount != null) return Number(doc.amount) || 0;
  return 0;
}

/**
 * Total cost = all payout outflows + current weekly labour estimate (hourly × hours this week).
 *
 * @returns {Promise<{
 *   totalRevenue: number,
 *   totalCost: number,
 *   totalPayoutCost: number,
 *   totalLabourCost: number,
 *   profit: number,
 *   projectBreakdown: Array<{
 *     projectId: string,
 *     projectName: string,
 *     labourCost: number,
 *     payoutCost: number,
 *     totalCost: number
 *   }>
 * }>}
 */
async function computeProfitAnalytics() {
  const [revenueDocs, payouts, people, projects] = await Promise.all([
    Revenue.find().select("totalAmount amount").lean(),
    Payout.find().select("amount projectId").lean(),
    People.find().select("hourlyRate hoursWorkedThisWeek").lean(),
    Project.find().select("name assignedTeam peopleIds teamIds").lean(),
  ]);

  const totalRevenue = revenueDocs.reduce((sum, d) => sum + revenueDocumentTotal(d), 0);

  const totalPayoutCost = payouts.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  let totalLabourCost = 0;
  const costByPersonId = new Map();
  for (const p of people) {
    const c = weeklyCostForPerson(p);
    totalLabourCost += c;
    costByPersonId.set(String(p._id), c);
  }

  const totalCost = totalPayoutCost + totalLabourCost;

  const payoutByProjectId = new Map();
  for (const p of payouts) {
    if (!p.projectId) continue;
    const pid = String(p.projectId);
    payoutByProjectId.set(
      pid,
      (payoutByProjectId.get(pid) || 0) + (Number(p.amount) || 0)
    );
  }

  const projectBreakdown = projects.map((proj) => {
    const id = String(proj._id);
    const memberIds = memberIdsFromProjectLean(proj);
    let labourCost = 0;
    for (const mid of memberIds) {
      labourCost += costByPersonId.get(String(mid)) ?? 0;
    }
    const payoutCost = payoutByProjectId.get(id) || 0;
    return {
      projectId: id,
      projectName: proj.name || "",
      labourCost,
      payoutCost,
      totalCost: labourCost + payoutCost,
    };
  });

  const profit = totalRevenue - totalCost;

  return {
    totalRevenue,
    totalCost,
    totalPayoutCost,
    totalLabourCost,
    profit,
    projectBreakdown,
  };
}

module.exports = { computeProfitAnalytics, revenueDocumentTotal };
