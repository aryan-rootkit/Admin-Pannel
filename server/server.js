const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const fs = require("fs");

const connectDB = require("./config/db");
const createApp = require("./app");

const PORT = Number(process.env.PORT || 5000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const main = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env["\uFEFFMONGO_URI"]; // handles UTF-8 BOM-saved .env files

  if (mongoUri && !process.env.MONGO_URI) process.env.MONGO_URI = mongoUri;

  if (!process.env.MONGO_URI) {
    try {
      const envPath = path.join(__dirname, ".env");
      const raw = fs.readFileSync(envPath, "utf8");
      const line = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find(
          (l) =>
            l &&
            !l.startsWith("#") &&
            (l.startsWith("MONGO_URI=") || l.startsWith("\uFEFFMONGO_URI="))
        );
      if (line)
        process.env.MONGO_URI = line
          .replace(/^\uFEFF?MONGO_URI=/, "")
          .trim();
    } catch {
      // ignore; error handled below
    }
  }

  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI in server/.env");
    process.exit(1);
  }

  await connectDB();

  const app = createApp({ corsOrigin: CORS_ORIGIN });
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};

main();

