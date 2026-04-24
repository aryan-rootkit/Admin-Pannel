const { User } = require("./model");

const getUsers = async (_req, res) => {
  try {
    const users = await User.find().sort({ _id: -1 });
    console.log("[GET /api/users] count:", users.length);
    return res.json(users);
  } catch (err) {
    console.error("[GET /api/users] error:", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getUsers };
