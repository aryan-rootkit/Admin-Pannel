const mongoose = require("mongoose");

const DB_NAME = "admin-pannel-rootkit";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: DB_NAME });
    console.log("✅ DB Connected:", mongoose.connection.name, `(explicit dbName: ${DB_NAME})`);
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

