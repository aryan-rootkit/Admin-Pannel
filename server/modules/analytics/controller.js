const { computeProfitAnalytics } = require("./profitService");
const { computeMonthlyAnalytics } = require("./monthlyService");

const getProfit = async (_req, res) => {
  try {
    const data = await computeProfitAnalytics();
    return res.json(data);
  } catch (err) {
    console.error("[GET /api/analytics/profit]", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const getMonthly = async (req, res) => {
  try {
    const raw = req.query.months;
    const parsed = Number.parseInt(String(raw), 10);
    const months =
      raw === undefined || raw === "" || Number.isNaN(parsed) ? 12 : parsed;
    const data = await computeMonthlyAnalytics(months);
    return res.json(data);
  } catch (err) {
    console.error("[GET /api/analytics/monthly]", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getProfit, getMonthly };
