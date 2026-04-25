const { Revenue } = require("../revenues/model");
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
 * @returns {Promise<{
 *   totalRevenue: number,
 *   totalCost: number,
 *   profit: number,
 *   projectBreakdown: Array<{ projectId: string, projectName: string, totalCost: number }>
 * }>}
 */
async function computeProfitAnalytics() {
  const [revenueDocs, people, projects] = await Promise.all([
    Revenue.find().select("totalAmount amount").lean(),
    People.find().select("hourlyRate hoursWorkedThisWeek").lean(),
    Project.find().select("name assignedTeam peopleIds teamIds").lean(),
  ]);

  const totalRevenue = revenueDocs.reduce((sum, d) => sum + revenueDocumentTotal(d), 0);

  let totalCost = 0;
  const costByPersonId = new Map();
  for (const p of people) {
    const c = weeklyCostForPerson(p);
    totalCost += c;
    costByPersonId.set(String(p._id), c);
  }

  const projectBreakdown = projects.map((proj) => {
    const memberIds = memberIdsFromProjectLean(proj);
    let projectTotal = 0;
    for (const mid of memberIds) {
      projectTotal += costByPersonId.get(String(mid)) ?? 0;
    }
    return {
      projectId: String(proj._id),
      projectName: proj.name || "",
      totalCost: projectTotal,
    };
  });

  const profit = totalRevenue - totalCost;

  return {
    totalRevenue,
    totalCost,
    profit,
    projectBreakdown,
  };
}

module.exports = { computeProfitAnalytics, revenueDocumentTotal };
