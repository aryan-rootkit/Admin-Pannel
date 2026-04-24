const mongoose = require("mongoose");

const { Types } = mongoose.Schema;

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    clientId: { type: Types.ObjectId, ref: "Client", required: true, index: true },
    budget: { type: Number, min: 0 },
    assignedTeam: [{ type: Types.ObjectId, ref: "Person", index: true }],
    /** @deprecated prefer `assignedTeam` */
    peopleIds: [{ type: Types.ObjectId, ref: "Person", index: true }],
    /** @deprecated prefer `assignedTeam` */
    teamIds: [{ type: Types.ObjectId, ref: "Person", index: true }],
    status: { type: String, trim: true, default: "active" },
  },
  { timestamps: true, collection: "projects" }
);

const Project =
  mongoose.models.Project || mongoose.model("Project", ProjectSchema);

module.exports = { Project };
