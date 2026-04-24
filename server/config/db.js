const mongoose = require("mongoose");

const DB_NAME = "admin-pannel-rootkit";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: DB_NAME });
    console.log("✅ DB Connected:", mongoose.connection.name, `(explicit dbName: ${DB_NAME})`);
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    if (String(err.message).includes("querySrv") || String(err.message).includes("ECONNREFUSED")) {
      console.error(
        "   Hint: Check internet/VPN/firewall, Atlas cluster is running, and IP access allows your network (0.0.0.0/0 for dev)."
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB;
