const mongoose = require("mongoose");

const { Types } = mongoose.Schema;

/**
 * People resource → MongoDB collection `people`.
 * Model name `People` matches refs in Project / Payout schemas.
 */
const PeopleSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    contact: { type: String, trim: true },
    assignedProjects: [{ type: Types.ObjectId, ref: "Project", index: true }],
    role: { type: String, trim: true },
    avatar: { type: String, trim: true, default: "" },
    employmentType: { type: String, trim: true, default: "Unknown" },
    hourlyRate: { type: Number, default: 0 },
    hoursWorkedThisWeek: { type: Number, default: 0 },
    skills: [{ type: String }],
    subRole: { type: String, default: "" },
  },
  { timestamps: true, strict: false }
);

const People =
  mongoose.models.People ||
  mongoose.model("People", PeopleSchema, "people");

module.exports = { People };
