const path = require("path");

// Always load server/.env (works when cwd is repo root: npm --prefix server run ...)
require("dotenv").config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const createApp = require("./app");

const PORT = Number(process.env.PORT || 5000);

const main = async () => {
  await connectDB();

  const app = createApp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

main();
