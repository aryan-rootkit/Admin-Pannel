const { Revenue } = require("../revenues/model");
const { Payout } = require("../payouts/model");
const { revenueDocumentTotal } = require("./profitService");

function toMonthKey(date) {
  if (!date) return null;
  const x = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(x.getTime())) return null;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
}

function effectiveRevenueDate(doc) {
  return doc.paymentDate || doc.receivedAt || doc.createdAt;
}

function effectivePayoutDate(doc) {
  return doc.paymentDate || doc.paidAt || doc.createdAt;
}

function lastNMonthKeys(n) {
  const keys = [];
  const now = new Date();
  for (let offset = n - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return keys;
}

function keyToLabel(key) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-IN", { month: "short", year: "numeric" });
}

/**
 * Monthly revenue (from revenue documents) and cost (from payout outflows).
 * Labour not recorded as payouts will not appear in monthly cost.
 *
 * @param {number} months 1–36, default 12
 * @returns {Promise<Array<{ month: string, monthKey: string, revenue: number, cost: number, profit: number }>>}
 */
async function computeMonthlyAnalytics(months = 12) {
  const span = Math.min(36, Math.max(1, Number(months) || 12));

  const [revenues, payouts] = await Promise.all([
    Revenue.find()
      .select("totalAmount amount paymentDate receivedAt createdAt")
      .lean(),
    Payout.find()
      .select("amount paymentDate paidAt createdAt")
      .lean(),
  ]);

  const bucket = new Map();
  for (const doc of revenues) {
    const k = toMonthKey(effectiveRevenueDate(doc));
    if (!k) continue;
    const row = bucket.get(k) || { revenue: 0, cost: 0 };
    row.revenue += revenueDocumentTotal(doc);
    bucket.set(k, row);
  }

  for (const doc of payouts) {
    const k = toMonthKey(effectivePayoutDate(doc));
    if (!k) continue;
    const row = bucket.get(k) || { revenue: 0, cost: 0 };
    row.cost += Number(doc.amount) || 0;
    bucket.set(k, row);
  }

  const keys = lastNMonthKeys(span);
  return keys.map((monthKey) => {
    const cell = bucket.get(monthKey) || { revenue: 0, cost: 0 };
    const revenue = cell.revenue;
    const cost = cell.cost;
    return {
      month: keyToLabel(monthKey),
      monthKey,
      revenue,
      cost,
      profit: revenue - cost,
    };
  });
}

module.exports = { computeMonthlyAnalytics };
