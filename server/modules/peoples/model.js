const mongoose = require("mongoose");

const { Types } = mongoose.Schema;

/**
 * Peoples module → existing Atlas collection `teams` (no collection rename = no data loss).
 */
const PersonSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    contact: { type: String, trim: true },
    assignedProjects: [{ type: Types.ObjectId, ref: "Project", index: true }],
    role: { type: String, trim: true },
    avatar: { type: String, trim: true },
    employmentType: { type: String, trim: true },
    hourlyRate: { type: Number },
    hoursWorkedThisWeek: { type: Number },
    skills: [{ type: String }],
  },
  { timestamps: true, collection: "teams", strict: false }
);

const Person =
  mongoose.models.Person || mongoose.model("Person", PersonSchema);

module.exports = { Person };
