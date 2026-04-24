const { Event } = require("./model");

const getEvents = async (_req, res) => {
  try {
    const events = await Event.find().sort({ _id: -1 });
    console.log("[GET /api/events] count:", events.length);
    return res.json(events);
  } catch (err) {
    console.error("[GET /api/events] error:", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getEvents };
