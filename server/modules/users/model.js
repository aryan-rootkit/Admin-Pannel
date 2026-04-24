const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({}, { strict: false, collection: "users" });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = { User };
