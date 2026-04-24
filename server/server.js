require("dotenv").config();

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
