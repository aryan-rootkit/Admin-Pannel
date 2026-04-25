const { computeProfitAnalytics } = require("./profitService");

const getProfit = async (_req, res) => {
  try {
    const data = await computeProfitAnalytics();
    return res.json(data);
  } catch (err) {
    console.error("[GET /api/analytics/profit]", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getProfit };
