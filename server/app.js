const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const clientRoutes = require("./modules/clients/routes");
const projectRoutes = require("./modules/projects/routes");
const peopleRoutes = require("./modules/peoples/routes");
const revenuesRoutes = require("./modules/revenues/routes");
const payoutsRoutes = require("./modules/payouts/routes");
const eventsRoutes = require("./modules/events/routes");
const holidaysRoutes = require("./modules/holidays/routes");
const settingsRoutes = require("./modules/settings/routes");
const usersRoutes = require("./modules/users/routes");
const analyticsRoutes = require("./modules/analytics/routes");

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));
  // Permissive CORS for deploy (Railway, etc.); tighten with origin whitelist later via env.
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/clients", clientRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/people", peopleRoutes);
  app.use("/api/revenues", revenuesRoutes);
  app.use("/api/payouts", payoutsRoutes);
  app.use("/api/events", eventsRoutes);
  app.use("/api/holidays", holidaysRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/analytics", analyticsRoutes);

  return app;
};

module.exports = createApp;

