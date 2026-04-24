const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({}, { strict: false, collection: "events" });

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

module.exports = { Event };
