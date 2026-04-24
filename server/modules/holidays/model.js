const mongoose = require("mongoose");

const HolidaySchema = new mongoose.Schema({}, { strict: false, collection: "holidays" });

const Holiday = mongoose.models.Holiday || mongoose.model("Holiday", HolidaySchema);

module.exports = { Holiday };
