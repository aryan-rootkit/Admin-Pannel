const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema({}, { strict: false, collection: "settings" });

const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

module.exports = { Setting };
