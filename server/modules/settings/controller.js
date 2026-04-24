const { Setting } = require("./model");

const getSettings = async (_req, res) => {
  try {
    const settings = await Setting.find().sort({ _id: -1 });
    console.log("[GET /api/settings] count:", settings.length);
    return res.json(settings);
  } catch (err) {
    console.error("[GET /api/settings] error:", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getSettings };
