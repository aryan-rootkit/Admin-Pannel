const { Holiday } = require("./model");

const getHolidays = async (_req, res) => {
  try {
    const holidays = await Holiday.find().sort({ _id: -1 });
    console.log("[GET /api/holidays] count:", holidays.length);
    return res.json(holidays);
  } catch (err) {
    console.error("[GET /api/holidays] error:", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getHolidays };
